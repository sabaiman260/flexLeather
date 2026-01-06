'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

export default function ReturnRequestForm() {
  const [order, setOrder] = useState('')
  const [email, setEmail] = useState('')
  const [item, setItem] = useState('')
  const [reason, setReason] = useState('')

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    console.log('Return request submitted', { order, email, item, reason })

    toast({ title: 'Return request sent', description: 'We received your request — our team will respond with next steps.' })

    setOrder('')
    setEmail('')
    setItem('')
    setReason('')
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input placeholder="Order number" value={order} onChange={(e) => setOrder(e.target.value)} />
      <Input placeholder="Email used on order" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input placeholder="Item name or SKU" value={item} onChange={(e) => setItem(e.target.value)} />
      <Input placeholder="Brief reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      <div className="pt-3">
        <Button type="submit" className="bg-primary text-primary-foreground">Submit Return Request</Button>
      </div>
    </form>
  )
}
