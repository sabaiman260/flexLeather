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
  const router = useRouter()
  const { login } = useAuth()
  const googleLoaded = useRef(false)

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
    const ensureScript = () =>
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

    try {
      await ensureScript()
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

            <div className="mt-4">
              <Button type="button" variant="outline" className="w-full" onClick={handleGoogleLogin}>
                Continue with Google
              </Button>
            </div>

            <div className="text-center text-sm mt-6">
              <p className="opacity-60">
                Don't have an account?{' '}
                <Link href="/register" className="text-accent hover:opacity-75">
                  Create Account
                </Link>
              </p>
            </div>

            <div className="mt-6 text-center">
              <Link href="#" className="text-sm text-accent hover:opacity-75">
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
