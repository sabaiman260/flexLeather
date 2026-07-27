"use client"

import React, { useEffect } from 'react'

type Props = {
  error: Error & { digest?: string }
}

export default function GlobalError({ error }: Props) {
  // Send the error details to a server route so they appear in server logs
  useEffect(() => {
    try {
      void fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error?.message,
          stack: error?.stack,
          digest: (error as any)?.digest || null,
          url: typeof window !== 'undefined' ? window.location.href : null,
        }),
      })
    } catch (e) {
      // ignore
    }
  }, [error])

  return (
    <div style={{ padding: 40, fontFamily: 'Inter, Arial, sans-serif' }}>
      <h1>Something went wrong</h1>
      <p>{error?.message || 'An unexpected error occurred.'}</p>
      <details style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>
        <summary>Show technical details</summary>
        <pre>{error?.stack}</pre>
        { (error as any)?.digest && (
          <pre>digest: {(error as any).digest}</pre>
        ) }
      </details>
    </div>
  )
}
