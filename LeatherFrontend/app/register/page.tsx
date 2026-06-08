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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const phoneRegex = /^[0-9]{11}$/
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address')
      }
      if (!phoneRegex.test(phone)) {
        throw new Error('Phone number must be 11 digits')
      }
      if (!address.trim()) {
        throw new Error('Address is required')
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }
      if (password !== confirm) {
        throw new Error('Passwords do not match')
      }

      const fd = new FormData()
      fd.append('userName', name)
      fd.append('userEmail', email)
      fd.append('userPassword', password)
      fd.append('phoneNumber', phone)
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
        const msg = 'This email is already registered but not verified. A new verification email has been sent. Please check your email.'
        toast.info(msg)
        setTimeout(() => window.location.href = '/login', 2000)
        return
      }

      // Success case - new user registration
      toast.success('Registered successfully! Check your email to verify your account.')
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
        toast.error(err?.message || 'Registration failed. Please try again.')
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
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-light mb-2">Full Name</label>
                <input
                  type="text"
                  className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-gray-300 transition"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-light mb-2">Email Address</label>
                <input
                  type="email"
                  className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-gray-300 transition"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-light mb-2">Phone Number</label>
                <input
                  type="tel"
                  className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-gray-300 transition"
                  placeholder="03xxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-light mb-2">Address</label>
                <input
                  type="text"
                  className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-gray-300 transition"
                  placeholder="Street, City, ZIP"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
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
                    onChange={(e) => setPassword(e.target.value)}
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
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                  />
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

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
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
