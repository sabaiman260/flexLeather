'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useCart } from '@/components/cart-context'
import { useAuth } from '@/components/auth-provider'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCart()
  const { user, isLoading } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [zip, setZip] = useState('')
  type PaymentMethod = 'cod' | 'jazzcash' | 'easypaisa' | 'payfast'

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')
  const [coupon, setCoupon] = useState('')
  const [discount, setDiscount] = useState(0)
  const SHIPPING_COST = 200

  // ✅ Autofill once user is loaded
  useEffect(() => {
    if (!isLoading && user) {
      setName(user.userName || '')
      setEmail(user.userEmail || '')
      setPhone(user.phoneNumber || '')
      setAddress(user.userAddress || '')
    }
  }, [isLoading, user])

  const applyCoupon = () => {
    if (coupon.toUpperCase() === 'SAVE10') {
      setDiscount(totalPrice * 0.1)
    } else if (coupon.toUpperCase() === 'FLAT500') {
      setDiscount(500)
    } else {
      alert('Invalid coupon code')
      setDiscount(0)
    }
  }

  const finalTotal = Math.max(0, totalPrice + SHIPPING_COST - discount)

  const placeOrder = async () => {
    // Validate that all items have required selections
    const hasMissingOptions = items.some(i => 
      (i.availableColors && i.availableColors.length > 0 && !i.selectedColor) ||
      (i.availableSizes && i.availableSizes.length > 0 && !i.selectedSize)
    )

    if (hasMissingOptions) {
      alert('Some items in your cart are missing size or color options. Please return to cart and select them.')
      router.push('/cart')
      return
    }

    if (!name || !email || !address || !city || !zip) {
      alert('Please fill all shipping fields')
      return
    }
    if (paymentMethod !== 'cod' && (!email || !phone)) {
      alert('Email and phone are required for online payment')
      return
    }

    const guestDetails = { fullName: name, email, phone, address: `${address}, ${city}, ${zip}` }
    const orderItems = items.map(i => ({ 
      productId: i.id, 
      quantity: i.quantity, 
      price: i.price,
      selectedColor: i.selectedColor,
      selectedSize: i.selectedSize 
    }))

    try {
      const res = await apiFetch('/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify({ items: orderItems, totalAmount: finalTotal, paymentMethod, guestDetails })
      })

      const order = res?.data
      let paymentRes;

      if (paymentMethod !== 'cod') {
        const payRes = await apiFetch('/api/v1/payments', {
          method: 'POST',
          body: JSON.stringify({ orderId: order?._id, method: paymentMethod, amount: finalTotal })
        })
        paymentRes = payRes?.data
      } else {
         // COD
         paymentRes = { type: 'cod' }
      }

      localStorage.setItem('flexleather_order', JSON.stringify({
        id: order?._id || `AL-${Date.now()}`,
        date: new Date().toISOString(),
        items,
        total: finalTotal,
        paymentMethod,
        customer: { name, email, address, city, zip }
      }))

      clearCart()

      // Handle Payment Redirection Logic
      if (paymentRes?.type === 'redirect' && paymentRes.url && paymentRes.data) {
          // Dynamic Form Submission
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = paymentRes.url;
          form.style.display = 'none';

          Object.keys(paymentRes.data).forEach(key => {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = key;
              input.value = paymentRes.data[key];
              form.appendChild(input);
          });

          document.body.appendChild(form);
          form.submit();
      } else if (paymentRes?.type === 'api') {
          // Show instructions (EasyPaisa)
          alert(`Payment Initiated! ${paymentRes.message}\nTransaction ID: ${paymentRes.transactionId}`);
          router.push('/order-confirmation');
      } else {
          // COD or Success
          router.push('/order-confirmation');
      }

    } catch (e: any) {
      console.error('Place order error:', e)
      const friendly = e?.message || 'Failed to place order'
      const details = e?.details ? `\nDetails: ${JSON.stringify(e.details)}` : e?.body ? `\nBody: ${JSON.stringify(e.body)}` : ''
      alert(friendly + details)
    }
  }

  if (isLoading) return <p className="text-center py-20">Loading user info...</p>

  return (
    <>
      <Header />
      <main className="bg-background min-h-screen">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
          <h1 className="text-3xl md:text-4xl font-serif font-light tracking-wide mb-12">Checkout</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Checkout Form */}
            <div className="space-y-8">
              <div className="border-b border-border pb-8">
                <h2 className="text-lg font-light tracking-wide mb-6">Shipping Address</h2>
                <form className="space-y-4">
                  {[
                    { label: 'Full Name', value: name, setter: setName },
                    { label: 'Email', value: email, setter: setEmail },
                    { label: 'Phone', value: phone, setter: setPhone },
                    { label: 'Address', value: address, setter: setAddress },
                    { label: 'City', value: city, setter: setCity },
                    { label: 'ZIP Code', value: zip, setter: setZip }
                  ].map(({ label, value, setter }) => (
                    <div key={label}>
                      <label className="block text-sm font-light mb-2">{label}</label>
                      <input
                        type="text"
                        className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-accent transition"
                        value={value}
                        onChange={e => setter(e.target.value)}
                      />
                    </div>
                  ))}
                </form>
              </div>

              <div>
                <h2 className="text-lg font-light tracking-wide mb-6">Payment Method</h2>
                <div className="border border-accent p-6 mb-4">
                  <fieldset className="space-y-2">
                    {(['cod', 'jazzcash', 'easypaisa', 'payfast'] as PaymentMethod[]).map(method => (
                      <label key={method} className="flex items-center gap-3">
                        <input type="radio" name="payment" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} />
                        <span>{method === 'payfast' ? 'PayFast (Card/Bank)' : method.toUpperCase()}</span>
                      </label>
                    ))}
                  </fieldset>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="border border-border p-8 sticky top-24">
                <h2 className="text-lg font-light tracking-wide mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-4 border-b border-border pb-4 last:border-0">
                      <div className="relative w-16 h-16 bg-muted shrink-0">
                        {item.image && (
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="text-sm">PKR {item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mb-6">
                  <input 
                    value={coupon} 
                    onChange={e => setCoupon(e.target.value)} 
                    placeholder="Coupon Code" 
                    className="border border-border px-3 py-2 text-sm flex-1 outline-none focus:border-accent"
                  />
                  <Button onClick={applyCoupon} variant="outline" size="sm">Apply</Button>
                </div>

                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex justify-between">0
                    <span>Subtotal</span>
                    <span>PKR {totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>PKR {SHIPPING_COST}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-PKR {discount.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-lg font-serif mb-8 border-t border-border pt-4">
                  <span>Total</span>
                  <span>PKR {finalTotal.toLocaleString()}</span>
                </div>
                <Button onClick={placeOrder} className="w-full" disabled={items.length === 0}>Place Order</Button>
                <Link href="/shop"><Button variant="outline" className="w-full mt-3">Continue Shopping</Button></Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
