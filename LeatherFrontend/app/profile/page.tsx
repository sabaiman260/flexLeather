'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/header'
import Image from 'next/image'
import Footer from '@/components/footer'
import { useAuth } from '@/components/auth-provider'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'

type OrderItem = {
  product: { _id: string; name: string; imageUrl?: string } | null
  quantity: number
  price: number
  selectedColor?: string
  selectedSize?: string
}

type Order = {
  _id: string
  items: OrderItem[]
  totalAmount: number
  finalAmount?: number
  shippingCost?: number
  paymentMethod: string
  paymentStatus: string
  orderStatus: string
  shippingAddress: string
  createdAt: string
  buyer?: {
    userName: string
    userEmail: string
    phoneNumber?: string
  }
}

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery',
  jazzcash: 'JazzCash',
  easypaisa: 'EasyPaisa',
  card: 'Card',
  payfast: 'PayFast',
}

function canCancelOrder(order: Order): boolean {
  if (['shipped', 'delivered', 'cancelled'].includes(order.orderStatus)) return false
  const hoursSince = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60)
  return hoursSince <= 24
}

function hoursLeft(order: Order): number {
  return Math.max(0, 24 - (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60))
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const [form, setForm] = useState({
    userName: '',
    userEmail: '',
    phoneNumber: '',
    userAddress: '',
  })
  const [saving, setSaving] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile')

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await apiFetch('/api/v1/auth/me')
        const me = res?.data?.user
        if (me) {
          setForm({
            userName: me.userName || '',
            userEmail: me.userEmail || '',
            phoneNumber: me.phoneNumber || '',
            userAddress: me.userAddress || '',
          })
        }
      } catch {}
    }
    loadMe()
  }, [])

  useEffect(() => {
    const loadOrders = async () => {
      setOrdersLoading(true)
      try {
        const res = await apiFetch('/api/v1/orders/my-orders')
        setOrders(res?.data || [])
      } catch {
        setOrders([])
      } finally {
        setOrdersLoading(false)
      }
    }
    loadOrders()
  }, [])

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const onSave = async () => {
    setSaving(true)
    try {
      await apiFetch('/api/v1/auth/me', {
        method: 'PUT',
        body: JSON.stringify(form),
      })
      alert('Profile updated')
    } catch (e: any) {
      alert(e?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const onCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return
    setCancellingId(orderId)
    try {
      await apiFetch(`/api/v1/orders/${orderId}/cancel`, { method: 'PATCH' })
      setOrders(prev =>
        prev.map(o => o._id === orderId ? { ...o, orderStatus: 'cancelled' } : o)
      )
    } catch (e: any) {
      alert(e?.message || 'Failed to cancel order')
    } finally {
      setCancellingId(null)
    }
  }

  if (isLoading) return <div className="py-16 text-center">Loading...</div>

  return (
    <>
      <Header />
      <main className="bg-background min-h-screen">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-12">
          <h1 className="text-3xl font-serif mb-8">My Profile</h1>

          {/* Tabs */}
          <div className="flex border-b border-border mb-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'profile'
                  ? 'border-[#8B6914] text-[#8B6914]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'border-[#8B6914] text-[#8B6914]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Order History
              {orders.length > 0 && (
                <span className="bg-[#8B6914] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {orders.length}
                </span>
              )}
            </button>
          </div>

          {/* ── Profile Tab ── */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-border p-6 rounded-lg bg-card">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-muted border border-border mb-4 overflow-hidden">
                    {user?.profileImage ? (
                      <Image src={user.profileImage} alt="Avatar" width={96} height={96} className="w-full h-full object-cover rounded-full" />
                    ) : null}
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-lg font-medium">{form.userName || 'Your Name'}</div>
                    <div className="text-xs text-muted-foreground">{form.userEmail || 'email@example.com'}</div>
                    <div className="text-xs text-muted-foreground">{form.phoneNumber || ''}</div>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 border border-border p-6 rounded-lg space-y-4 bg-card">
                <div>
                  <label className="block text-sm mb-2">Name</label>
                  <input name="userName" value={form.userName} onChange={onChange} className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-gray-300 transition rounded-md" />
                </div>
                <div>
                  <label className="block text-sm mb-2">Email</label>
                  <input name="userEmail" value={form.userEmail} onChange={onChange} className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-gray-300 transition rounded-md" />
                </div>
                <div>
                  <label className="block text-sm mb-2">Phone</label>
                  <input name="phoneNumber" value={form.phoneNumber} onChange={onChange} className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-gray-300 transition rounded-md" />
                </div>
                <div>
                  <label className="block text-sm mb-2">Address</label>
                  <textarea name="userAddress" value={form.userAddress} onChange={onChange} placeholder="Enter your address" className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-gray-300 transition rounded-md min-h-24" />
                </div>
                <div className="pt-2 flex gap-3">
                  <Button onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
                  <Button variant="outline" onClick={() => window.location.reload()}>Cancel</Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Orders Tab ── */}
          {activeTab === 'orders' && (
            <div>
              {ordersLoading ? (
                <div className="py-16 text-center text-muted-foreground text-sm">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="py-16 text-center border border-border rounded-lg bg-card">
                  <div className="text-4xl mb-4">📦</div>
                  <p className="text-muted-foreground text-sm">You haven't placed any orders yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map(order => {
                    const cancellable = canCancelOrder(order)
                    const left = hoursLeft(order)
                    const isCancelling = cancellingId === order._id
                    const total = order.finalAmount || order.totalAmount
                    const subtotal = total - (order.shippingCost || 0)
                    const isCancelled = order.orderStatus === 'cancelled'

                    return (
                      <div
                        key={order._id}
                        className={`border rounded-lg bg-card overflow-hidden ${isCancelled ? 'border-red-200 opacity-75' : 'border-border'}`}
                      >
                        {/* ── Top bar: Order meta + cancel ── */}
                        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-border bg-muted/30">
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span>
                              <span className="font-medium text-foreground">Order</span>{' '}
                              #{order._id.slice(-6).toUpperCase()}
                            </span>
                            <span>
                              {new Date(order.createdAt).toLocaleDateString('en-PK', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })}
                            </span>
                            <span className="font-medium text-foreground">
                              {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isCancelled && (
                              <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                                Cancelled
                              </span>
                            )}
                            {cancellable && (
                              <button
                                onClick={() => onCancelOrder(order._id)}
                                disabled={isCancelling}
                                className="text-xs px-4 py-1.5 rounded border border-red-300 text-red-600 hover:bg-red-50 transition font-medium disabled:opacity-50"
                              >
                                {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Countdown warning */}
                        {cancellable && (
                          <div className="px-5 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-700">
                            ⏳ Cancel within{' '}
                            {left < 1
                              ? `${Math.round(left * 60)} minutes`
                              : `${Math.floor(left)} hr ${Math.round((left % 1) * 60)} min`}
                          </div>
                        )}

                        {/* ── Main content: 2-column on md+ ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">

                          {/* Left: Order Items + Shipping */}
                          <div className="divide-y divide-border">
                            {/* Order Items */}
                            <div className="p-5">
                              <h3 className="text-sm font-semibold mb-4">Order Items</h3>
                              <div className="space-y-4">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex gap-3 items-start">
                                    {/* Product image */}
                                    <div className="w-16 h-16 rounded border border-border bg-muted overflow-hidden flex-shrink-0">
                                      {item.product?.imageUrl ? (
                                        <img
                                          src={item.product.imageUrl}
                                          alt={item.product.name || ''}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                          No img
                                        </div>
                                      )}
                                    </div>

                                    {/* Product info */}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium leading-tight">
                                        {item.product?.name || 'Product'}
                                      </p>
                                      <div className="text-xs text-muted-foreground mt-0.5 space-x-1">
                                        {item.selectedColor && <span>| Color: {item.selectedColor}</span>}
                                        {item.selectedSize && <span>| Size: {item.selectedSize}</span>}
                                      </div>
                                      <p className="text-xs text-[#8B6914] mt-1">Qty: {item.quantity}</p>
                                    </div>

                                    <p className="text-sm font-medium flex-shrink-0">
                                      PKR {(item.price * item.quantity).toLocaleString()}
                                    </p>
                                  </div>
                                ))}
                              </div>

                              {/* Totals */}
                              <div className="mt-4 pt-4 border-t border-border space-y-1.5">
                                {(order.shippingCost ?? 0) > 0 && (
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>PKR {subtotal.toLocaleString()}</span>
                                  </div>
                                )}
                                {(order.shippingCost ?? 0) > 0 && (
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Shipping</span>
                                    <span>PKR {(order.shippingCost || 0).toLocaleString()}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-sm font-semibold">
                                  <span>Total Amount</span>
                                  <span className="font-serif text-base">PKR {total.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="p-5">
                              <h3 className="text-sm font-semibold mb-2">Shipping Address</h3>
                              <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
                            </div>
                          </div>

                          {/* Right: Customer Details */}
                          <div className="p-5">
                            <h3 className="text-sm font-semibold mb-4">Customer Details</h3>
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs text-[#8B6914] mb-0.5">Name</p>
                                <p className="text-sm">{order.buyer?.userName || form.userName || '—'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-[#8B6914] mb-0.5">Email</p>
                                <p className="text-sm">{order.buyer?.userEmail || form.userEmail || '—'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-[#8B6914] mb-0.5">Phone</p>
                                <p className="text-sm">{order.buyer?.phoneNumber || form.phoneNumber || '—'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
