"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const res = await apiFetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ userEmail: email }),
      })

      setMessage(res?.message || 'If the email exists, a reset link was sent.')
      // Optionally redirect back to login after short delay
      setTimeout(() => router.push('/login'), 2500)
    } catch (err: any) {
      setError(err?.message || 'Failed to request password reset')
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
            <h1 className="text-2xl font-serif font-light tracking-wide mb-6 text-center">Forgot Password</h1>

            {message && <p className="text-green-600 text-sm mb-2">{message}</p>}
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-light mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-accent transition"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Requesting...' : 'Send Reset Link'}
              </Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
