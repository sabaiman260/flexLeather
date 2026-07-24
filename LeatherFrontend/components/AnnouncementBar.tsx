'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

export default function AnnouncementBar() {
  const [announcementText, setAnnouncementText] = useState('')
  const [announcementEnabled, setAnnouncementEnabled] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    apiFetch('/api/v1/settings')
      .then(res => {
        const data = res?.data
        if (data) {
          setAnnouncementText(data.announcementText ?? '')
          setAnnouncementEnabled(Boolean(data.announcementEnabled && data.announcementText?.trim()))
        }
      })
      .catch(() => {
        setAnnouncementEnabled(false)
      })
      .finally(() => setLoaded(true))
  }, [])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const height = announcementEnabled && announcementText.trim() ? '3rem' : '0px'
      document.documentElement.style.setProperty('--announcement-height', height)
    }
  }, [announcementEnabled, announcementText])

  if (!loaded || !announcementEnabled || !announcementText.trim()) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 z-60 w-full bg-accent text-accent-foreground border-b border-accent">
      <div className="container-max mx-auto overflow-hidden py-3">
        <div className="inline-flex min-w-full animate-marquee whitespace-nowrap text-sm uppercase tracking-[0.18em]">
          <span className="mr-8">{announcementText}</span>
          <span className="mr-8">{announcementText}</span>
        </div>
      </div>
    </div>
  )
}
