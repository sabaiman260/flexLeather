'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const router = useRouter()
  const { login } = useAuth()
  const googleLoadedRef = useRef(false)
  const googleInitializedRef = useRef(false)
  const promptShownRef = useRef(false)

  // ================= GOOGLE OAUTH DISABLED (COMMENTED OUT) =================
  // Google auto-initialization and script loading are disabled to prevent FedCM errors.
  // To re-enable Google OAuth in the future, uncomment this entire useEffect block.
  /*
  // Initialize Google OAuth once on mount
  useEffect(() => {
    const initializeGoogle = async () => {
      if (googleInitializedRef.current) return

      let clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
      if (!clientId) {
        try {
          const res = await apiFetch('/api/v1/auth/google-client-id')
          clientId = res?.data?.clientId || ''
        } catch (e) {
          console.error('[Google] Failed to fetch client ID:', e)
          return
        }
      }

      if (!clientId) {
        console.error('[Google] Client ID not available')
        return
      }

      // Load Google script if not already loaded
      if (!googleLoadedRef.current) {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = () => {
          googleLoadedRef.current = true
          setupGoogleAuth(clientId)
        }
        script.onerror = () => {
          console.error('[Google] Failed to load GSI script')
          setGoogleReady(true) // Still show button as fallback
        }
        document.head.appendChild(script)
      } else {
        setupGoogleAuth(clientId)
      }
    }

    const setupGoogleAuth = (clientId: string) => {
      try {
        const google = (window as any).google
        if (!google?.accounts?.id) {
          console.warn('[Google] GSI not available yet')
          setTimeout(() => setupGoogleAuth(clientId), 500)
          return
        }

        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCallback,
          error_callback: () => {
            console.warn('[Google] FedCM error - showing fallback button')
            setGoogleReady(true)
          },
          itp_support: false, // Disable ITP workaround to reduce concurrent requests
        })

        googleInitializedRef.current = true
        setGoogleReady(true)

        // Show One-Tap only once, with safer checks to reduce FedCM AbortError logs
        if (!promptShownRef.current) {
          promptShownRef.current = true

          // Delay prompt slightly to avoid racing other credential requests and ensure
          // page is visible. Also avoid one-tap on very small screens where it tends
          // to be unreliable.
          const tryPrompt = () => {
            if (document.visibilityState !== 'visible' || window.innerWidth < 720) {
              // make fallback button available instead of prompting
              setGoogleReady(true)
              return
            }

            try {
              google.accounts.id.prompt((notification: any) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                  console.log('[Google] One-Tap unavailable, falling back to button')
                  setGoogleReady(true)
                }
              })
            } catch (e) {
              console.warn('[Google] Prompt error (non-critical):', e)
              setGoogleReady(true)
            }
          }

          // Wait a bit longer to reduce chance of concurrent calls (800ms)
          setTimeout(tryPrompt, 800)
        }
      } catch (err) {
        console.error('[Google] Setup error:', err)
        setGoogleReady(true)
      }
    }

    initializeGoogle()
  }, [])
  */
  // ================= END GOOGLE OAUTH DISABLED =================

  // ================= GOOGLE OAUTH HELPERS DISABLED (COMMENTED OUT) =================
  // These handler functions are disabled. To re-enable, uncomment below.
  /*
  const handleGoogleCallback = async (response: any) => {
    if (!response.credential) {
      setError('Google authentication failed')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch('/api/v1/auth/google-login', {
        method: 'POST',
        body: JSON.stringify({ idToken: response.credential }),
      })

      const accessToken = res?.data?.tokens?.accessToken
      const user = res?.data?.user

      if (accessToken && user) {
        login(accessToken, user)
        if (user.userRole === 'admin') {
          router.push('/admin')
        } else {
          router.push('/')
        }
      } else {
        setError('Google login failed - no tokens returned')
      }
    } catch (err: any) {
      console.error('[Google] Login error:', err)
      setError(err?.message || 'Google login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRenderGoogleButton = () => {
    try {
      const google = (window as any).google
      if (!google?.accounts?.id) {
        setError('Google Sign-In not available')
        return
      }

      const container = document.getElementById('google-signin-button')
      if (!container) return

      google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        locale: 'en',
      })
    } catch (err) {
      console.error('[Google] Button render error:', err)
      setError('Failed to render Google button')
    }
  }

  // Render Google button when ready
  useEffect(() => {
    if (googleReady) {
      handleRenderGoogleButton()
    }
  }, [googleReady])
  */
  // ================= END GOOGLE OAUTH HELPERS DISABLED =================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ userEmail: email, userPassword: password }),
      })

      const accessToken = res?.data?.tokens?.accessToken
      const user = res?.data?.user

      if (accessToken && user) {
        login(accessToken, user)
        if (user.userRole === 'admin') router.push('/admin')
        else router.push('/')
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className="bg-background min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <div className="border border-border p-8">
            <h1 className="text-3xl font-serif font-light tracking-wide mb-8 text-center">
              Sign In
            </h1>

            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-light mb-2">Email Address</label>
                <input
                  type="email"
                  className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-accent transition"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-light mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-accent transition pr-20"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            {/* ================= GOOGLE LOGIN BUTTON (COMMENTED OUT) =================
            <div className="mt-4">
              {googleReady ? (
                <div id="google-signin-button" className="w-full flex justify-center"></div>
              ) : (
                <div className="w-full h-10 bg-muted rounded animate-pulse"></div>
              )}
            </div>
            ================= END GOOGLE LOGIN BUTTON ================= */}

            <div className="text-center text-sm mt-6">
              <p className="opacity-60">
                Don't have an account?{' '}
                <Link href="/register" className="text-accent hover:opacity-75">
                  Create Account
                </Link>
              </p>
            </div>

            <div className="mt-6 text-center">
              <Link href="/forgot-password" className="text-sm text-accent hover:opacity-75">
                Forgot Password?
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
