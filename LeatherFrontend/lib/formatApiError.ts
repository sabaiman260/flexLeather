export default function formatApiError(err: any): string {
  if (!err) return 'Something went wrong. Please try again.'

  // If a plain string was thrown
  if (typeof err === 'string') return err

  // If the error is an Error object with a user-friendly message
  if (err.message && typeof err.message === 'string') {
    // Some backends embed JSON in message; try to parse
    const msg = err.message
    try {
      const parsed = JSON.parse(msg)
      // If parsed is an array of validation errors
      if (Array.isArray(parsed)) {
        const list = parsed.map((p: any) => (p.message ? p.message : String(p))).join('; ')
        if (list) return list
      }
      if (parsed && typeof parsed === 'object') {
        if (parsed.message) return String(parsed.message)
      }
    } catch {}
    // Fallback to the original message (but make it user-friendly for common cases)
    const lower = msg.toLowerCase()
    if (lower.includes('timeout') || lower.includes('backend server')) {
      return 'Unable to reach the server. Please check your connection and try again.'
    }
    return msg
  }

  // Check for structured backend payloads attached by apiFetch
  const body = err.body || err.response?.data || null
  if (body) {
    if (typeof body === 'string') return body
    // Joi / validation style: { errors: [ { message, path } ] }
    if (Array.isArray(body)) {
      return body.map((b: any) => (b.message ? b.message : String(b))).join('; ')
    }
    if (body.errors && Array.isArray(body.errors) && body.errors.length) {
      return body.errors.map((e: any) => (e.message ? e.message : String(e))).join('; ')
    }
    if (body.message && typeof body.message === 'string') return body.message
    // Some APIs return { data: { errors: [...] } }
    if (body.data && body.data.errors && Array.isArray(body.data.errors)) {
      return body.data.errors.map((e: any) => (e.message ? e.message : String(e))).join('; ')
    }
  }

  // Check for details array attached by apiFetch
  if (err.details && Array.isArray(err.details)) {
    return err.details.map((d: any) => (d.message ? d.message : String(d))).join('; ')
  }

  // Fallback generic message
  return 'Something went wrong. Please check your input and try again.'
}
