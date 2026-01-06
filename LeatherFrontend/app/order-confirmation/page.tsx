"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

export default function OrderConfirmationPage() {
  const [order, setOrder] = useState<any | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('flexleather_order')
      if (raw) setOrder(JSON.parse(raw))
    } catch (e) {
      setOrder(null)
    }
  }, [])
  return (
    <>
      <Header />
      <main className="bg-background min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full px-4 text-center">
          <CheckCircle className="w-16 h-16 text-accent mx-auto mb-6" />

          <h1 className="text-3xl font-serif font-light tracking-wide mb-4">
            Order Confirmed
          </h1>

          <p className="text-lg opacity-75 mb-8">
            Thank you for your purchase! Your order has been received.
          </p>

          <div className="border border-border p-6 mb-8 bg-muted">
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="opacity-60">Order ID:</span>
                <span className="font-semibold">{order?.id ?? '#AL-XXXX-XXXX'}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Order Date:</span>
                <span>{order ? new Date(order.date).toLocaleDateString() : new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Payment Method:</span>
                <span className="font-semibold">
                  {order?.paymentMethod === 'cod'
                    ? 'Cash on Delivery'
                    : order?.paymentMethod === 'jazzcash'
                    ? 'JazzCash'
                    : order?.paymentMethod === 'easypaisa'
                    ? 'EasyPaisa'
                    : 'Card'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Total:</span>
                <span className="font-serif">PKR {order?.total?.toLocaleString() ?? '0'}</span>
              </div>
            </div>
          </div>

          <p className="text-sm opacity-75 mb-8">
            A confirmation email has been sent to your email address. You can track your order from your account dashboard.
          </p>

          <div className="space-y-3">
            <Link href="/shop">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Continue Shopping
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
