'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Demo: show toast, log message; replace with real API call if desired
    console.log('Contact form submitted', { name, email, message })

    toast({ title: 'Message sent', description: 'Thanks — we will reply within 1–2 business days.' })

    setName('')
    setEmail('')
    setMessage('')
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-sm block mb-1">Your name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
      </div>

      <div>
        <label className="text-sm block mb-1">Email</label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" type="email" />
      </div>

      <div>
        <label className="text-sm block mb-1">Message</label>
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" />
      </div>

      <div>
        <Button type="submit" className="bg-primary text-primary-foreground">Send Message</Button>
      </div>
    </form>
  )
}
