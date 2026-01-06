'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { useAuth } from '@/components/auth-provider'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const [form, setForm] = useState({
    userName: '',
    userEmail: '',
    phoneNumber: '',
    userAddress: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await apiFetch('/api/v1/auth/me')
        const me = res?.data?.user
        if (me) {
          setForm({
            userName: me.userName || '',
            userEmail: me.userEmail || '',
            phoneNumber: me.phoneNumber || '',
            userAddress: me.userAddress || '',
          })
        }
      } catch {}
    }
    loadMe()
  }, [])

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const onSave = async () => {
    setSaving(true)
    try {
      await apiFetch('/api/v1/auth/me', {
        method: 'PUT',
        body: JSON.stringify(form),
      })
      alert('Profile updated')
    } catch (e: any) {
      alert(e?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <div className="py-16 text-center">Loading...</div>

  return (
    <>
      <Header />
      <main className="bg-background min-h-screen">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-12">
          <h1 className="text-3xl font-serif mb-8">My Profile</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-border p-6 rounded-lg bg-card">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-muted border border-border mb-4 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {user?.profileImage ? <img src={user.profileImage} alt="Avatar" className="w-full h-full object-cover" /> : null}
                </div>
                <div className="text-center space-y-1">
                  <div className="text-lg font-medium">{form.userName || 'Your Name'}</div>
                  <div className="text-xs text-muted-foreground">{form.userEmail || 'email@example.com'}</div>
                  <div className="text-xs text-muted-foreground">{form.phoneNumber || ''}</div>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 border border-border p-6 rounded-lg space-y-4 bg-card">
              <div>
                <label className="block text-sm mb-2">Name</label>
                <input name="userName" value={form.userName} onChange={onChange} className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-accent transition rounded-md" />
              </div>
              <div>
                <label className="block text-sm mb-2">Email</label>
                <input name="userEmail" value={form.userEmail} onChange={onChange} className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-accent transition rounded-md" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Phone</label>
                  <input name="phoneNumber" value={form.phoneNumber} onChange={onChange} className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-accent transition rounded-md" />
                </div>
                <div>
                  <label className="block text-sm mb-2">Address</label>
                  <textarea name="userAddress" value={form.userAddress} onChange={onChange} className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-accent transition rounded-md" />
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <Button onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
                <Button variant="outline" onClick={() => window.location.reload()}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
