'use client'

import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'
import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const googleLoaded = useRef(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
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

      await apiFetch('/api/v1/auth/register', {
        method: 'POST',
        body: fd
      })

      alert('Registered! Check your email to verify.')
      window.location.href = '/login'
    } catch (err: any) {
      // Log full error for debugging (includes backend validation details)
      console.error('Register error:', err)
      console.error('Error details:', err?.details || err?.body)
      setError(err?.message || 'Registration failed')
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
      <main className="bg-background min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <div className="border border-border p-8">
            <h1 className="text-3xl font-serif font-light tracking-wide mb-8 text-center">
              Create Account
            </h1>
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-light mb-2">Full Name</label>
                <input
                  type="text"
                  className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-accent transition"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

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
                <label className="block text-sm font-light mb-2">Phone Number</label>
                <input
                  type="tel"
                  className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-accent transition"
                  placeholder="03xxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-light mb-2">Address</label>
                <input
                  type="text"
                  className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-accent transition"
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
                    className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-accent transition pr-20"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                    className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-accent transition pr-20"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
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
