"use client"

import { useState } from 'react'

type LogoKey = 'visa' | 'jazzcash' | 'paypak'

const logos: { key: LogoKey; src: string; alt: string }[] = [
  { key: 'visa', src: '/payments/visa.png', alt: 'VISA' },
  { key: 'jazzcash', src: '/payments/jazzcash.png', alt: 'JazzCash' },
  { key: 'paypak', src: '/payments/Paypak-logo.png', alt: 'PayPak' },
]

export default function PaymentBadges() {
  const [failed, setFailed] = useState<Record<string, boolean>>({})

  return (
    <div className="flex flex-col items-start gap-4">
      {logos.map((l) => (
        <div key={l.key} className="flex items-center">
          {!failed[l.key] ? (
            // regular img tag so we can handle onError in a client component
            <img
              src={l.src}
              alt={l.alt}
              className="h-7 object-contain"
              onError={(e) => {
                setFailed((s) => ({ ...s, [l.key]: true }))
              }}
            />
          ) : (
            <span className="h-7 px-2 rounded bg-white/5 text-white/90 text-xs flex items-center justify-center">{l.alt}</span>
          )}
        </div>
      ))}
    </div>
  )
}
