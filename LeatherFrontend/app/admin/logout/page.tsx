'use client'

import { useEffect } from 'react'
import { apiFetch } from '@/lib/api'

export default function AdminLogoutPage() {
  useEffect(() => {
    (async () => {
      try { await apiFetch('/api/v1/auth/logout', { method: 'POST' }) } catch {}
      window.location.href = '/'
    })()
  }, [])
  return <p>Logging out…</p>
}

