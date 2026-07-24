'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'

export default function AdminSettingsPage() {
  const [shippingCost, setShippingCost] = useState<number>(200)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [announcementText, setAnnouncementText] = useState<string>('')
  const [announcementEnabled, setAnnouncementEnabled] = useState<boolean>(false)

  useEffect(() => {
    apiFetch('/api/v1/settings')
      .then(res => {
        setShippingCost(res?.data?.shippingCost ?? 200)
        setAnnouncementText(res?.data?.announcementText ?? '')
        setAnnouncementEnabled(Boolean(res?.data?.announcementEnabled))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const onSave = async () => {
    setSaving(true)
    try {
      await apiFetch('/api/v1/settings', {
        method: 'PUT',
        body: JSON.stringify({
          shippingCost: Number(shippingCost),
          announcementText,
          announcementEnabled,
        }),
      })
      alert('Settings saved')
    } catch (e: any) {
      alert(e?.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-serif font-light mb-6">Settings</h2>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="border border-border rounded-lg p-6 bg-card space-y-5">
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Shipping</h3>
          <div>
            <label className="block text-sm mb-1.5">Shipping Cost (PKR)</label>
            <input
              type="number"
              min="0"
              value={shippingCost}
              onChange={e => setShippingCost(Number(e.target.value))}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">Applied to every order at checkout</p>
          </div>
          <div>
            <label className="block text-sm mb-1.5">Announcement Text</label>
            <textarea
              rows={3}
              value={announcementText}
              onChange={e => setAnnouncementText(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-foreground"
              placeholder="Enter homepage announcement text"
            />
            <p className="text-xs text-muted-foreground mt-1">This message appears in the homepage announcement bar when enabled.</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={announcementEnabled}
              onChange={e => setAnnouncementEnabled(e.target.checked)}
              id="announcement-enabled"
              className="h-4 w-4 rounded border-border text-brand-brown focus:ring-brand-brown"
            />
            <label htmlFor="announcement-enabled" className="text-sm">Enable announcement bar</label>
          </div>
          <Button onClick={onSave} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      )}
    </div>
  )
}
