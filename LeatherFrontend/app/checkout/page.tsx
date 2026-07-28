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
import { pushGtmEcommerceEvent } from '@/lib/gtm'
import { toast } from 'sonner'

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
  // Validation error messages (inline)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [zipError, setZipError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [transactionError, setTransactionError] = useState<string | null>(null)

  type PaymentMethod = 'cod' | 'jazzcash' | 'easypaisa' | 'payfast'

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')
  const [transactionId, setTransactionId] = useState('')
  const [coupon, setCoupon] = useState('')
  const [discount, setDiscount] = useState(0)
  const [authLoadingTimeout, setAuthLoadingTimeout] = useState(false)
  const [hasAutoFilled, setHasAutoFilled] = useState(false)
  const [shippingCost, setShippingCost] = useState(200)

  useEffect(() => {
    apiFetch('/api/v1/settings')
      .then(res => setShippingCost(res?.data?.shippingCost ?? 200))
      .catch(() => {})
  }, [])

  // Helper: normalize phone by removing spaces, hyphens and parentheses
  const normalizePhone = (raw: string) => raw.replace(/[\s\-()]/g, '')

  // Timeout for auth loading to prevent infinite loading screen
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        setAuthLoadingTimeout(true)
      }, 8000) // 8 second timeout
      return () => clearTimeout(timeout)
    }
  }, [isLoading])

  // ✅ Autofill once when user data becomes available (only once to prevent overwriting user input)
  useEffect(() => {
    if (!isLoading && user && !hasAutoFilled) {
      setName(prev => prev || user.userName || '')
      setEmail(prev => prev || user.userEmail || '')
      setPhone(prev => prev || user.phoneNumber || '')
      setAddress(prev => prev || user.userAddress || '')
      setHasAutoFilled(true)
    }
  }, [isLoading, user, hasAutoFilled])

  // Fallback: fetch profile if token exists but user context is empty (ensures address shows)
  useEffect(() => {
    const ensureProfile = async () => {
      if (isLoading || user || hasAutoFilled) return

      // Only attempt to fetch profile if we have a token (logged-in user)
      const token = localStorage.getItem('accessToken')
      if (!token) return

      try {
        const res = await apiFetch('/api/v1/auth/me')
        const me = res?.data?.user
        if (me) {
          setName(prev => prev || me.userName || '')
          setEmail(prev => prev || me.userEmail || '')
          setPhone(prev => prev || me.phoneNumber || '')
          setAddress(prev => prev || me.userAddress || '')
          setHasAutoFilled(true)
        }
      } catch {
        // Silently fail - likely guest checkout or auth issue
      }
    }
    ensureProfile()
  }, [isLoading, user, hasAutoFilled])

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

  const finalTotal = Math.max(0, totalPrice + shippingCost - discount)

  const placeOrder = async () => {
    // Validate that all items have required selections
    const hasMissingOptions = items.some(i =>
      (i.availableColors && i.availableColors.length > 0 && !i.selectedColor) ||
      (i.availableSizes && i.availableSizes.length > 0 && !i.selectedSize)
    )

    if (hasMissingOptions) {
      toast.error('Some items are missing size or color selection. Please go back to cart and select them.')
      router.push('/cart')
      return
    }

    if (!name.trim()) { toast.error('Please enter your full name.'); return }
    if (!email.trim()) { setEmailError('Please enter your email address.'); return }
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) { setEmailError('Please enter a valid email address.'); return }
    setEmailError(null)
    if (!address.trim()) { toast.error('Please enter your shipping address.'); return }
    if (!city.trim()) { toast.error('Please enter your city.'); return }
    if (!zip.trim()) { setZipError('Please enter your ZIP / postal code.'); return }
    // ZIP / postal code: require 5 digits
    const zipRegex = /^[0-9]{5}$/
    if (!zipRegex.test(zip.trim())) { setZipError('ZIP / postal code must be 5 digits.'); return }
    setZipError(null)

    if (!phone.trim()) { setPhoneError('Please enter your phone number.'); return }
    // Normalize phone by removing spaces, hyphens and parentheses before validation
    const normalizedPhone = normalizePhone(phone.trim())
    // E.164 international phone format: requires leading + and country code, max 15 digits
    const phoneE164 = /^\+[1-9][0-9]{1,14}$/
    if (!phoneE164.test(normalizedPhone)) {
      setPhoneError('Phone number must be in E.164 format (e.g. +923001234567).')
      return
    }
    setPhoneError(null)

    if (paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') {
      // If provided, validate transaction id format according to provider
      if (transactionId && transactionId.trim()) {
        const tx = transactionId.trim()
        if (paymentMethod === 'easypaisa') {
          const easypaisaRegex = /^[0-9]{11,12}$/
          if (!easypaisaRegex.test(tx)) {
            setTransactionError('EasyPaisa Transaction ID must be 11 or 12 digits.')
            return
          }
        }
        if (paymentMethod === 'jazzcash') {
          const jazzRegex = /^[0-9]{12}$/
          if (!jazzRegex.test(tx)) {
            setTransactionError('JazzCash Transaction ID must be exactly 12 digits.')
            return
          }
        }
        setTransactionError(null)
      } else {
        // empty ID is allowed (optional), but clear any prior error
        setTransactionError(null)
      }
    }

    const orderItems = items.map(i => ({
      productId: i.id,
      quantity: i.quantity,
      price: i.price,
      selectedColor: i.selectedColor,
      selectedSize: i.selectedSize
    }))

    // Prepare request body - conditionally include guestDetails
    const requestBody: any = {
      items: orderItems,
      totalAmount: finalTotal,
      paymentMethod
    }

    // For logged-in users: only send guestDetails if they modified address from profile
    // For guests: always send guestDetails
    if (!user) {
      // Guest checkout - always send guestDetails
      requestBody.guestDetails = {
        fullName: name,
        email,
        phone: normalizedPhone,
        address: `${address}, ${city}, ${zip}`
      }
    } else {
      // Logged-in user - send guestDetails only if address differs from profile
      const profileAddress = user.userAddress || ''
      const currentAddress = `${address}, ${city}, ${zip}`

      if (currentAddress !== profileAddress && currentAddress.trim() !== ', , ') {
        requestBody.guestDetails = {
          fullName: name,
          email,
          phone: normalizedPhone,
          address: currentAddress
        }
      }
    }

    try {
      // Fire InitiateCheckout event (non-blocking)
      try {
        pushGtmEcommerceEvent('InitiateCheckout', {
          actionField: {
            id: `chk_${Date.now()}`,
            value: finalTotal,
            revenue: finalTotal,
            shipping: shippingCost || null,
            coupon: coupon || null,
            source: typeof window !== 'undefined' ? window.location.pathname : null
          },
          items: items.map(i => ({
            item_id: i.id,
            item_name: i.name,
            price: i.price,
            quantity: i.quantity
          }))
        })
      } catch (err) {
        // ignore analytics errors
      }
      const res = await apiFetch('/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const order = res?.data
      let paymentRes;

        if (paymentMethod !== 'cod') {
          // If user provided a transaction ID for manual payment, submit it immediately
          if ((paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') && transactionId.trim()) {
            const manualRes = await apiFetch('/api/v1/payments/manual', {
              method: 'POST',
              body: JSON.stringify({ orderId: order?._id, method: paymentMethod, transactionId: transactionId.trim() })
            })
            paymentRes = manualRes?.data
          } else {
            // Initiate payment (will return manual instructions for JazzCash/EasyPaisa)
            const payRes = await apiFetch('/api/v1/payments', {
              method: 'POST',
              body: JSON.stringify({ orderId: order?._id, method: paymentMethod, amount: finalTotal })
            })
            paymentRes = payRes?.data
          }
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
        customer: { name, email, address, city, zip, phone: normalizedPhone }
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
          toast.success('Payment initiated successfully!')
          router.push('/order-confirmation');
      } else if (paymentRes?.type === 'manual') {
          toast.success('Order placed! Please complete your payment to confirm.')
          router.push('/order-confirmation');
      } else {
          // COD or Success
          router.push('/order-confirmation');
      }

    } catch (e: any) {
      console.error('Place order error:', e)
      try {
        const formatApiError = (await import('@/lib/formatApiError')).default
        toast.error(formatApiError(e))
      } catch {
        toast.error('Failed to place order. Please check your information and try again.')
      }
    }
  }

  // Live validation effects for inline errors
  useEffect(() => {
    // Phone E.164 - accept user-friendly formats by normalizing before validation
    if (!phone) {
      setPhoneError(null)
    } else {
      const normalized = normalizePhone(phone.trim())
      const phoneE164 = /^\+[1-9][0-9]{1,14}$/
      setPhoneError(normalized && !phoneE164.test(normalized) ? 'Phone number must be in E.164 format (e.g. +923001234567).' : null)
    }
  }, [phone])

  useEffect(() => {
    // Live email validation (inline)
    if (!email) {
      setEmailError(null)
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      setEmailError(email && !emailRegex.test(email.trim()) ? 'Please enter a valid email address.' : null)
    }
  }, [email])

  useEffect(() => {
    if (!zip) {
      setZipError(null)
    } else {
      const zipRegex = /^[0-9]{5}$/
      setZipError(zip && !zipRegex.test(zip.trim()) ? 'ZIP / postal code must be 5 digits.' : null)
    }
  }, [zip])

  useEffect(() => {
    // Validate transactionId only when payment method requires it
    if (!transactionId) {
      setTransactionError(null)
      return
    }
    const tx = transactionId.trim()
    if (paymentMethod === 'easypaisa') {
      const easypaisaRegex = /^[0-9]{11,12}$/
      setTransactionError(!easypaisaRegex.test(tx) ? 'EasyPaisa Transaction ID must be 11 or 12 digits.' : null)
    } else if (paymentMethod === 'jazzcash') {
      const jazzRegex = /^[0-9]{12}$/
      setTransactionError(!jazzRegex.test(tx) ? 'JazzCash Transaction ID must be exactly 12 digits.' : null)
    } else {
      setTransactionError(null)
    }
  }, [transactionId, paymentMethod])

  // Avoid returning early here because returning a different root
  // structure than the normal render can cause hydration mismatches
  // (server may render the loading paragraph while the client
  // renders the full page including the Header). Always render
  // the `Header` and show the loading state below it to keep the
  // server and client HTML consistent.

  return (
    <>
      <Header />
      {isLoading && !authLoadingTimeout ? (
        <p className="text-center py-20">Loading user info...</p>
      ) : (
        <main className="bg-background min-h-screen">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
          <h1 className="text-3xl md:text-4xl font-serif font-light tracking-wide mb-12">Checkout</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Checkout Form */}
            <div className="space-y-8">
              <div className="border-b border-border pb-8">
                <h2 className="text-lg font-light tracking-wide mb-6">Shipping Address</h2>
                <div className="space-y-4">
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
                        name={label.toLowerCase().replace(' ', '-')}
                        placeholder={`Enter ${label.toLowerCase()}`}
                        className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-gray-300 transition"
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        autoComplete={label === 'Full Name' ? 'name' : label === 'Email' ? 'email' : label === 'Phone' ? 'tel' : 'address-level1'}
                        required
                      />
                      {/* Inline validation messages */}
                      {label === 'Email' && emailError && (
                        <p className="text-xs text-red-600 mt-1">{emailError}</p>
                      )}
                      {label === 'Phone' && phoneError && (
                        <p className="text-xs text-red-600 mt-1">{phoneError}</p>
                      )}
                      {label === 'ZIP Code' && zipError && (
                        <p className="text-xs text-red-600 mt-1">{zipError}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-light tracking-wide mb-6">Payment Method</h2>
                <div className="border border-accent p-6 mb-4">
                  <fieldset className="space-y-2">
                    {(['cod', 'jazzcash', 'easypaisa'] as PaymentMethod[]).map(method => (
                      <label key={method} className="flex items-center gap-3">
                        <input type="radio" name="payment" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} />
                        <span>{method.toUpperCase()}</span>
                      </label>
                    ))}
                  </fieldset>
                </div>

                {/* Display payment instructions for JazzCash and EasyPaisa */}
                {paymentMethod === 'jazzcash' && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm font-light"><strong>JazzCash Contact:</strong> Ehsan Ali</p>
                    <p className="text-sm font-light"><strong>Send payment to:</strong> 0300-3395535</p>
                  </div>
                )}
                {paymentMethod === 'easypaisa' && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm font-light"><strong>EasyPaisa Contact:</strong> Ehsan Ali</p>
                    <p className="text-sm font-light"><strong>Send payment to:</strong> 0300-3395535</p>
                  </div>
                )}

                {/* Manual payment transaction input */}
                {(paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') && (
                  <div className="mb-4">
                    <label className="block text-sm font-light mb-2">Transaction / Reference ID (optional)</label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={e => setTransactionId(e.target.value)}
                      placeholder="Enter transaction or reference ID after payment"
                      className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-gray-300 transition"
                    />
                      <p className="text-xs opacity-70 mt-2">If you already completed payment via your mobile app, enter the transaction/reference ID here to speed verification.</p>
                      {transactionError && (
                        <p className="text-xs text-red-600 mt-1">{transactionError}</p>
                      )}
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="border border-border p-8 sticky top-24">
                <h2 className="text-lg font-light tracking-wide mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-4 border-b border-border pb-4 last:border-0">
                        <div className="relative w-16 h-16 bg-muted shrink-0 p-1 flex items-center justify-center">
                          {item.image && (
                            <Image src={item.image} alt={item.name} fill sizes="100vw" className="object-contain" />
                          )}
                        </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        {item.discount && item.discount > 0 && item.originalPrice ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{item.discount}% OFF</span>
                            <span className="text-xs text-muted-foreground line-through">PKR {item.originalPrice.toLocaleString()}</span>
                            <span className="text-sm text-red-600 font-medium">PKR {item.price.toLocaleString()}</span>
                          </div>
                        ) : (
                          <p className="text-sm">PKR {item.price.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mb-6">
                  <input 
                    value={coupon} 
                    onChange={e => setCoupon(e.target.value)} 
                    placeholder="Coupon Code" 
                    className="border border-border px-3 py-2 text-sm flex-1 outline-none focus:border-gray-300"
                  />
                  <Button onClick={applyCoupon} variant="outline" size="sm">Apply</Button>
                </div>

                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>PKR {totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>PKR {shippingCost.toLocaleString()}</span>
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
                {/* Disable place order if there are validation errors or required fields missing */}
                {(() => {
                  const requiredMissing = !name.trim() || !email.trim() || !address.trim() || !city.trim() || !zip.trim() || !phone.trim()
                  const hasValidationErrors = !!phoneError || !!zipError || !!transactionError
                  const disable = items.length === 0 || requiredMissing || hasValidationErrors
                  return (
                    <Button onClick={placeOrder} className="w-full" disabled={disable}>Place Order</Button>
                  )
                })()}
                <Link href="/shop"><Button variant="outline" className="w-full mt-3">Continue Shopping</Button></Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      )}
      <Footer />
    </>
  )
}
