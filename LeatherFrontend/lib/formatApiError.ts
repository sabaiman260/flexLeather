export default function formatApiError(err: any): string {
  if (!err) return 'Something went wrong. Please try again.'

  const pickFriendly = (msg: string): string => {
    const lower = msg.toLowerCase()
    if (lower.includes('invalid email or password') || lower.includes('invalid password') || lower.includes('user not found')) {
      return 'Invalid email or password'
    }
    if (lower.includes('timeout') || lower.includes('backend server') || lower.includes('failed to fetch')) {
      return 'Unable to reach the server. Please check your connection and try again.'
    }
    // Strip "Validation failed - [...]" dumps
    if (lower.startsWith('validation failed')) {
      // Try to pull human messages from embedded JSON array
      const bracket = msg.indexOf('[')
      if (bracket !== -1) {
        try {
          const parsed = JSON.parse(msg.slice(bracket))
          if (Array.isArray(parsed)) {
            const list = parsed
              .map((p: any) => p?.message)
              .filter(Boolean)
              .join('; ')
            if (list) return list
          }
        } catch {}
      }
      return 'Please check your input and try again.'
    }
    return msg
  }

  // If a plain string was thrown
  if (typeof err === 'string') return pickFriendly(err)

  // If the error is an Error object with a user-friendly message
  if (err.message && typeof err.message === 'string') {
    const msg = err.message
    try {
      const parsed = JSON.parse(msg)
      if (Array.isArray(parsed)) {
        const list = parsed.map((p: any) => (p.message ? p.message : String(p))).join('; ')
        if (list) return pickFriendly(list)
      }
      if (parsed && typeof parsed === 'object') {
        if (parsed.message) return pickFriendly(String(parsed.message))
      }
    } catch {}
    return pickFriendly(msg)
  }

  // Check for structured backend payloads attached by apiFetch
  const body = err.body || err.response?.data || null
  if (body) {
    if (typeof body === 'string') return pickFriendly(body)
    if (Array.isArray(body)) {
      return pickFriendly(body.map((b: any) => (b.message ? b.message : String(b))).join('; '))
    }
    if (body.errors && Array.isArray(body.errors) && body.errors.length) {
      const list = body.errors.map((e: any) => (e.message ? e.message : String(e))).join('; ')
      if (String(body.message || '').toLowerCase().includes('validation failed') && !list) {
        return 'Please check your input and try again.'
      }
      // Prefer clean top-level auth messages over validation dumps
      if (body.message && !String(body.message).toLowerCase().includes('validation failed')) {
        return pickFriendly(String(body.message))
      }
      return pickFriendly(list || String(body.message || 'Please check your input and try again.'))
    }
    if (body.message && typeof body.message === 'string') return pickFriendly(body.message)
    if (body.data && body.data.errors && Array.isArray(body.data.errors)) {
      return pickFriendly(body.data.errors.map((e: any) => (e.message ? e.message : String(e))).join('; '))
    }
  }

  if (err.details && Array.isArray(err.details)) {
    return pickFriendly(err.details.map((d: any) => (d.message ? d.message : String(d))).join('; '))
  }

  return 'Something went wrong. Please check your input and try again.'
}
