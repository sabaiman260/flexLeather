'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import { useEffect } from 'react'
import { useCart } from '@/components/cart-context'

// 1. Asli Content ko alag component me daal diya taaki Suspense ispar kaam kare
function SuccessPageContent() {
  const { clearCart } = useCart()

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <>
      <Header />
      <main className="bg-background min-h-[70vh] flex items-center justify-center">
        <div className="max-w-md w-full mx-4 text-center p-8 border border-border">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-serif mb-4">Payment Successful!</h1>
          <p className="text-muted-foreground mb-8">
            Thank you for your order. We have received your payment and will begin processing your items shortly.
          </p>
          <div className="space-y-3">
            <Link href="/shop" className="block">
              <Button className="w-full">Continue Shopping</Button>
            </Link>
            <Link href="/admin/orders" className="block">
              <Button variant="outline" className="w-full">View My Orders</Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

// 2. Main Export Component ko Suspense ke andar wrap kar diya
export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <main className="bg-background min-h-[70vh] flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading order status...</div>
      </main>
    }>
      <SuccessPageContent />
    </Suspense>
  )
}