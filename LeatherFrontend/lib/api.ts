// Determine API base URL with multiple fallbacks
function getApiBaseUrl() {
  const possibleUrls = [
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.NEXT_PUBLIC_VERCEL_URL,
  ].filter(Boolean);

  // Use first available environment variable
  if (possibleUrls.length > 0) {
    let url = possibleUrls[0];

    // Ensure protocol for production
    if (process.env.NODE_ENV === 'production') {
      if (!url.startsWith('http')) {
        url = `https://${url}`;
      }
    } else {
      // Development: ensure localhost uses http
      if (url.includes('localhost') && !url.startsWith('http')) {
        url = `http://${url}`;
      }
    }

    return url.replace(/\/+$/, '');
  }

  // Default development fallback
  return "http://localhost:4000";
}

export const API_BASE_URL = getApiBaseUrl();

let isRefreshing = false
let refreshQueue: (() => void)[] = []

export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    return response.ok
  } catch {
    return false
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const getLocalToken = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null

  let token = getLocalToken()
  const isFormData = typeof (options as any).body !== 'undefined' && (options as any).body instanceof FormData
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`

  let res: Response
  try {
    // Optional timeout to fail fast on unreachable backend
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers,
      signal: controller.signal,
    })
    clearTimeout(timeout)
  } catch (err: any) {
    const error: any = new Error(
      err.name === 'AbortError'
        ? `Request timeout - Backend server not responding at ${url}`
        : `Connection failed - Backend server not available at ${url}. Please ensure the backend server is running.`
    )
    error.cause = err
    error.status = 0
    error.url = url
    throw error
  }

  // Handle 401 Unauthorized - Token Refresh (only if we have a token)
  const hasToken = typeof window !== 'undefined' && localStorage.getItem('accessToken')
  if (res.status === 401 && hasToken && !path.includes('/auth/refresh-token') && !path.includes('/auth/login') && !path.includes('/auth/register')) {
    // Queue requests while refreshing
    await new Promise<void>((resolve) => {
      refreshQueue.push(resolve)

      if (!isRefreshing) {
        isRefreshing = true

        fetch(`${API_BASE_URL}/api/v1/auth/refresh-token`, {
          method: 'POST',
          credentials: 'include',
        })
          .then(async (refreshRes) => {
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json()
              const newAccessToken = refreshData?.data?.accessToken
              if (newAccessToken) {
                localStorage.setItem('accessToken', newAccessToken)
              } else {
                localStorage.removeItem('accessToken')
              }
            } else {
              localStorage.removeItem('accessToken')
            }
          })
          .catch(() => {
            localStorage.removeItem('accessToken')
          })
          .finally(() => {
            isRefreshing = false
            refreshQueue.forEach((cb) => cb())
            refreshQueue = []
          })
      }
    })

    // Retry original request with new token
    token = getLocalToken()
    const newHeaders = {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
    res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: newHeaders,
    })
  }

  let body: any = null
  try {
    body = await res.json()
  } catch {}

  if (!res.ok) {
    // Build a more informative error message when backend provides validation errors
    let message = body?.message || body?.error || (res.status === 401 ? 'Unauthorized' : res.status === 403 ? 'Forbidden' : 'Something went wrong')

    // Special handling for connection issues
    if (res.status === 0 || !res.status) {
      message = `Backend server connection failed. Please ensure the backend server is running on ${API_BASE_URL}`
    }

    if (body?.errors && Array.isArray(body.errors) && body.errors.length) {
      try {
        const details = body.errors.map((e: any) => (e.field ? `${e.field}: ${e.message}` : e.message)).join('; ')
        message = `${message} - ${details}`
      } catch {
        // ignore and keep original message
      }
    }

    const error: any = new Error(message)
    error.status = res.status
    error.url = url
    // Attach backend error payload for better debugging in the frontend
    error.details = body?.errors || body?.data?.errors || null
    error.body = body || null
    error.backendUrl = API_BASE_URL

    // Only log unexpected errors to console
    // Silent for: 401/400 on auth endpoints, expected auth failures
    const isAuthEndpoint = path.includes('/auth/')
    const isProtectedEndpoint = path.includes('/orders/') || path.includes('/admin/')
    const isExpectedError = (
      (res.status === 401 || res.status === 400) &&
      (isAuthEndpoint || (!hasToken && isProtectedEndpoint))
    )

    if (!isExpectedError) {
      console.error(`API Error [${res.status}] ${path}:`, message)
    }

    throw error
  }

  return body
}

// Development utility for debugging connection issues
export function getConnectionStatus() {
  return {
    backendUrl: API_BASE_URL,
    environment: process.env.NODE_ENV,
    isDevelopment: process.env.NODE_ENV === 'development'
  }
}

export type BackendProduct = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  discount?: number;
  stock?: number;
  sizes?: string[];
  colors?: string[];
  specs?: string[];
  category?: { _id: string; name?: string; type?: string; slug?: string } | string;
  imageUrls?: string[];
  // `images` may contain raw keys or URLs depending on the endpoint — include for admin UI
  images?: string[];
};
