'use client'

import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [addressError, setAddressError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  // Validation helpers
  const validateName = (v: string) => {
    if (!v || !v.trim()) return 'Full name is required.'
    return null
  }

  const validateEmail = (v: string) => {
    if (!v || !v.trim()) return 'Email is required.'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(v.trim()) ? null : 'Please enter a valid email address.'
  }

  const validatePhone = (v: string) => {
    // Remove spaces, hyphens, parentheses
    const raw = (v || '').replace(/[\s\-()]/g, '')
    if (!raw) return 'Phone number is required.'

    // Local Pakistan format: must start with '03' and be exactly 11 digits (e.g. 03001234567)
    if (/^03[0-9]*$/.test(raw)) {
      const localExact = /^03[0-9]{9}$/
      return localExact.test(raw) ? null : 'Local phone numbers must be 11 digits and start with 03 (e.g. 03001234567).'
    }

    // International format: must start with +92 and have 12 digits total (92 + 10 more digits)
    if (/^\+92[0-9]*$/.test(raw)) {
      const intlExact = /^\+92[0-9]{10}$/
      return intlExact.test(raw) ? null : 'International format must be +92 followed by 10 digits (e.g. +923001234567).'
    }

    // If it doesn't match either expected starting pattern, show generic guidance
    return 'Enter a Pakistan mobile number starting with 03 (11 digits) or +92 (12 digits).'
  }

  const validateAddress = (v: string) => {
    if (!v || !v.trim()) return 'Address is required.'
    return null
  }

  const validatePassword = (v: string) => {
    if (!v) return 'Password is required.'
    if (v.length < 6) return 'Password must be at least 6 characters.'
    const hasUpper = /[A-Z]/.test(v)
    const hasLower = /[a-z]/.test(v)
    const hasDigit = /[0-9]/.test(v)
    const hasSpecial = /[^A-Za-z0-9]/.test(v)
    if (!(hasUpper && hasLower && hasDigit && hasSpecial)) {
      return 'Password must include uppercase, lowercase, number and special character.'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Run validators and set inline errors
      const nameErr = validateName(name)
      const emailErr = validateEmail(email)
      const phoneErr = validatePhone(phone)
      const addressErr = validateAddress(address)
      const passErr = validatePassword(password)

      setNameError(nameErr)
      setEmailError(emailErr)
      setPhoneError(phoneErr)
      setAddressError(addressErr)
      setPasswordError(passErr || (password !== confirm ? 'Passwords do not match.' : null))

      // If any validation failed, stop
      if (nameErr || emailErr || phoneErr || addressErr || passErr || password !== confirm) {
        setLoading(false)
        return
      }

      const normalizePhone = (raw: string) => raw.replace(/[\s\-()]/g, '')
      const normalizedPhoneRaw = normalizePhone(phone.trim())

      // Convert to backend-expected E.164 format: +92XXXXXXXXXX
      // If user entered +92... -> keep as-is
      // If user entered 03xxxxxxxxx or 0xxxxxxxxxx -> convert to +92xxxxxxxxxx
      // If user entered 92xxxxxxxxxx (no +) -> prefix +
      let backendPhone = ''
      if (normalizedPhoneRaw.startsWith('+')) {
        backendPhone = normalizedPhoneRaw
      } else if (normalizedPhoneRaw.startsWith('03')) {
        backendPhone = '+92' + normalizedPhoneRaw.slice(1)
      } else if (normalizedPhoneRaw.startsWith('0') && normalizedPhoneRaw.length === 11) {
        backendPhone = '+92' + normalizedPhoneRaw.slice(1)
      } else if (/^92[0-9]{10}$/.test(normalizedPhoneRaw)) {
        backendPhone = '+' + normalizedPhoneRaw
      } else {
        // fallback: send the raw normalized value (will likely be rejected by server)
        backendPhone = normalizedPhoneRaw
      }

      const fd = new FormData()
      fd.append('userName', name)
      fd.append('userEmail', email.trim())
      fd.append('userPassword', password)
      fd.append('phoneNumber', backendPhone)
      fd.append('userAddress', address)
      if (profileFile) fd.append('profileImage', profileFile)

      const response = await apiFetch('/api/v1/auth/register', {
        method: 'POST',
        body: fd
      })

      // Handle different registration outcomes gracefully
      if (response?.data?.code === 'USER_ALREADY_EXISTS') {
        toast.error('An account with this email already exists. Please try logging in instead.')
        return
      }

      if (response?.data?.code === 'VERIFICATION_RESENT') {
        const emailSent = !!response?.data?.emailSent
        const emailQueued = !!response?.data?.emailQueued
        if (emailSent) {
          const msg = 'This email is already registered but not verified. A new verification email has been sent. Please check your email.'
          toast.info(msg)
        } else if (emailQueued) {
          toast.error('Verification email could not be delivered right now. It has been queued and will be retried. If you do not receive it, contact support.')
        } else {
          toast.error('Verification email could not be sent. Please contact support if you do not receive an email.')
        }
        setTimeout(() => window.location.href = '/login', 2000)
        return
      }

      // Success case - new user registration
      toast.success('Registered successfully! Check your email to verify your account.')
      // If backend indicates email not sent, show an additional warning
      if (response?.data && response.data.emailSent === false) {
        if (response.data.emailQueued) {
          toast.error('Verification email delivery failed and has been queued. It will be retried automatically.')
        } else {
          toast.error('Verification email delivery failed. Please contact support if you do not receive an email.')
        }
      }
      setTimeout(() => window.location.href = '/login', 2000)
    } catch (err: any) {
      // Only console.error for real failures (500, network, DB errors)
      // Expected cases (USER_ALREADY_EXISTS, VERIFICATION_RESENT) are handled above
      const isExpectedCase = err?.status === 409 || (err?.body?.code === 'USER_ALREADY_EXISTS') || (err?.body?.code === 'VERIFICATION_RESENT')

      if (!isExpectedCase) {
        console.error('Registration failed:', err)
        console.error('Error details:', err?.details || err?.body)
      }

      if (err?.status === 409) {
        toast.error('An account with this email already exists. Please try logging in instead.')
        return
      }

      if (!isExpectedCase) {
        // Map backend validation errors (several possible shapes) to inline fields
        // 1) Sometimes backend returns an array at top-level (e.g. AJV): [{ path: ['phoneNumber'], message: '...' }]
        // 2) Or { errors: [...] }
        // 3) Or { details: [...] }
        const setFieldFromEntry = (entry: any) => {
          const msg = entry?.message || entry?.msg || JSON.stringify(entry)
          const path = entry?.path || entry?.instancePath || entry?.dataPath || entry?.param || entry?.path
          const pathArr = Array.isArray(path) ? path : (typeof path === 'string' && path ? [path] : null)

          if (pathArr) {
            const p = (pathArr[0] || '').toString().toLowerCase()
            if (p.includes('phone')) {
              setPhoneError(msg)
              return true
            }
            if (p.includes('email')) {
              setEmailError(msg)
              return true
            }
            if (p.includes('address')) {
              setAddressError(msg)
              return true
            }
            if (p.includes('password')) {
              setPasswordError(msg)
              return true
            }
          }
          return false
        }

        let handled = false

        if (Array.isArray(err?.body) && err.body.length) {
          for (const e of err.body) {
            if (setFieldFromEntry(e)) handled = true
          }
        }

        if (!handled && Array.isArray(err?.body?.errors) && err.body.errors.length) {
          for (const e of err.body.errors) {
            if (setFieldFromEntry(e)) handled = true
          }
        }

        if (!handled && Array.isArray(err?.details) && err.details.length) {
          for (const e of err.details) {
            if (setFieldFromEntry(e)) handled = true
          }
        }

        if (!handled && Array.isArray(err?.body?.details) && err.body.details.length) {
          for (const e of err.body.details) {
            if (setFieldFromEntry(e)) handled = true
          }
        }

        if (handled) {
          // At least one field-level error was applied inline — no generic toast
          return
        }

        // Fallback: format any arrays into a friendly message
        if (Array.isArray(err?.details) && err.details.length) {
          const msgs = err.details.map((d: any) => d.message || JSON.stringify(d)).join('; ')
          toast.error(msgs)
        } else if (err?.body && Array.isArray(err.body?.errors) && err.body.errors.length) {
          const msgs = err.body.errors.map((d: any) => (d.message ? `${d.path ? `${d.path.join('.')} ` : ''}${d.message}` : JSON.stringify(d))).join('; ')
          toast.error(msgs)
        } else {
          toast.error(err?.message || 'Registration failed. Please try again.')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // ================= GOOGLE OAUTH FUNCTIONS DISABLED (COMMENTED OUT) =================
  // Google script loading and login initialization are disabled to prevent FedCM errors.
  // To re-enable Google OAuth in the future, uncomment this entire section.
  /*
  const ensureGoogleScript = () =>
    new Promise<void>((resolve, reject) => {
      if (googleLoaded.current || (window as any).google?.accounts?.id) {
        googleLoaded.current = true
        resolve()
        return
      }
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        googleLoaded.current = true
        resolve()
      }
      script.onerror = () => reject(new Error('Failed to load Google script'))
      document.head.appendChild(script)
    })

  const handleGoogleLogin = async () => {
    let clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
    if (!clientId) {
      try {
        const res = await apiFetch('/api/v1/auth/google-client-id')
        clientId = res?.data?.clientId || ''
      } catch {}
    }
    if (!clientId) {
      setError('Google login is not configured')
      return
    }
    try {
      await ensureGoogleScript()
      const google = (window as any).google
      if (!google?.accounts?.id) throw new Error('Google Identity not available')
      let handled = false
      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          if (handled) return
          handled = true
          try {
            const res = await apiFetch('/api/v1/auth/google-login', {
              method: 'POST',
              body: JSON.stringify({ idToken: response.credential }),
            })
            const accessToken = res?.data?.tokens?.accessToken
            const user = res?.data?.user
            if (accessToken && user) {
              login(accessToken, user)
              if (user.userRole === 'admin') router.push('/admin')
              else router.push('/')
            } else {
              throw new Error('Google login failed')
            }
          } catch (err: any) {
            setError(err?.message || 'Google login failed')
          }
        },
      })
      google.accounts.id.prompt()
    } catch (err: any) {
      setError(err?.message || 'Google login failed')
    }
  }
  */
  // ================= END GOOGLE OAUTH FUNCTIONS DISABLED =================

  // Form validity derived from validators (prevents submit until all pass)
  const isFormValid = !validateName(name) && !validateEmail(email) && !validatePhone(phone) && !validateAddress(address) && !validatePassword(password) && password === confirm

  return (
    <>
      <Header />
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-webkit-password-reveal-button {
          display: none;
        }
      `}</style>
      <main className="bg-background min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <div className="border border-border p-8">
            <h1 className="text-3xl font-serif font-light tracking-wide mb-8 text-center">
              Create Account
            </h1>
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              <div>
                <label className="block text-sm font-light mb-2">Full Name</label>
                <input
                  type="text"
                  className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-gray-300 transition"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameError(null) }}
                  onBlur={() => setNameError(validateName(name))}
                />
                {nameError && <p className="text-xs text-red-600 mt-1">{nameError}</p>}
              </div>

              <div>
                <label className="block text-sm font-light mb-2">Email Address</label>
                <input
                  type="email"
                  className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-gray-300 transition"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(null) }}
                  onBlur={() => setEmailError(validateEmail(email))}
                />
                {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
              </div>

              <div>
                <label className="block text-sm font-light mb-2">Phone Number</label>
                <input
                  type="tel"
                  className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-gray-300 transition"
                  placeholder="e.g. 03001234567 or +923001234567"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setPhoneError(null) }}
                  onBlur={() => setPhoneError(validatePhone(phone))}
                />
                {phoneError && <p className="text-xs text-red-600 mt-1">{phoneError}</p>}
              </div>

              <div>
                <label className="block text-sm font-light mb-2">Address</label>
                <input
                  type="text"
                  className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-gray-300 transition"
                  placeholder="Street, City, ZIP"
                  value={address}
                  onChange={(e) => { setAddress(e.target.value); setAddressError(null) }}
                  onBlur={() => setAddressError(validateAddress(address))}
                />
                {addressError && <p className="text-xs text-red-600 mt-1">{addressError}</p>}
              </div>

              <div>
                <label className="block text-sm font-light mb-2">Profile Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-sm"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setProfileFile(file)
                  }}
                />
                {profileFile && (
                  <div className="mt-3 w-24 h-24 rounded overflow-hidden border border-border">
                    <img
                      src={URL.createObjectURL(profileFile)}
                      alt="Selected profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-light mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-gray-300 transition pr-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordError(null) }}
                    onBlur={() => setPasswordError(validatePassword(password))}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-light mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-gray-300 transition pr-10"
                    placeholder="••••••••"
                    value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); setPasswordError(null) }}
                      onBlur={() => setPasswordError(password !== confirm ? 'Passwords do not match.' : validatePassword(password))}
                      autoComplete="new-password"
                  />
                  {passwordError && <p className="text-xs text-red-600 mt-1">{passwordError}</p>}
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading || !isFormValid}>
                {loading ? 'Creating...' : 'Create Account'}
              </Button>
            </form>

            {/* ================= GOOGLE LOGIN BUTTON (COMMENTED OUT) =================
            <div className="mt-4">
              <Button type="button" variant="outline" className="w-full" onClick={handleGoogleLogin}>
                Continue with Google
              </Button>
            </div>
            ================= END GOOGLE LOGIN BUTTON ================= */}

            <div className="text-center text-sm mt-6">
              <p className="opacity-60">
                Already have an account?{' '}
                <Link href="/login" className="text-accent hover:opacity-75">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
