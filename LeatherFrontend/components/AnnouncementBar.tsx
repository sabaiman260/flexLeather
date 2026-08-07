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
      const height = announcementEnabled && announcementText.trim() ? '2rem' : '0px'
      document.documentElement.style.setProperty('--announcement-height', height)
    }
  }, [announcementEnabled, announcementText])

  if (!loaded || !announcementEnabled || !announcementText.trim()) {
    return null
  }
  // Split comma-separated sentences (from dashboard) and trim empty parts.
  const sentences = announcementText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  // If no sentences after split, hide the bar
  if (sentences.length === 0) return null

  return (
    <div className="fixed top-0 left-0 z-60 w-full bg-accent text-accent-foreground border-b border-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-hidden py-1 sm:py-2">
        <div className="inline-flex min-w-full animate-marquee whitespace-nowrap text-xs sm:text-sm tracking-[0.14em]">
          {sentences.map((s, i) => (
            <span key={`s-${i}`} className="mr-15">
              {s}
            </span>
          ))}
          {/* repeat for continuous marquee */}
          {sentences.map((s, i) => (
            <span key={`r-${i}`} className="mr-15">
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
