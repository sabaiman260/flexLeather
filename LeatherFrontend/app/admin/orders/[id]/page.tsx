'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, X } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'

type OrderItem = {
  _id: string
  product: {
    _id: string
    name: string
    images: string[]
    imageUrls?: string[]
    category: string
  }
  variant?: {
    name: string
    options: any
  }
  quantity: number
  price: number
  selectedColor?: string
  selectedSize?: string
}

type Order = {
  _id: string
  buyer?: {
    userName: string
    userEmail: string
    phoneNumber?: string
    userAddress?: string
  }
  guestDetails?: {
    fullName: string
    email: string
    phone: string
    address: string
  }
  shippingAddress: string
  items: OrderItem[]
  totalAmount: number
  paymentMethod: string
  paymentStatus: string
  orderStatus: string
  createdAt: string
}

function OrderDetailsContent() {
  const { id } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadOrder = async () => {
    try {
      const res = await apiFetch(`/api/v1/orders/${id}`)
      setOrder(res?.data)
    } catch (e: any) {
      setError(e?.message || 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadOrder()
  }, [id])

  const updateStatus = async (status: string) => {
    if (!window.confirm(`Update order status to ${status}?`)) return
    try {
      await apiFetch(`/api/v1/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      loadOrder()
    } catch (e: any) {
      alert(e?.message || 'Failed to update status')
    }
  }

  const updatePaymentStatus = async (status: string) => {
    if (!window.confirm(`Update payment status to ${status}?`)) return
    try {
      await apiFetch(`/api/v1/orders/${id}/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      loadOrder()
    } catch (e: any) {
      alert(e?.message || 'Failed to update payment')
    }
  }

  if (loading) return <div className="p-8">Loading order details...</div>
  if (error) return <div className="p-8 text-red-600">{error}</div>
  if (!order) return <div className="p-8">Order not found</div>

  const customerName = order.buyer?.userName || order.guestDetails?.fullName || 'Guest'
  // Safely extract email from buyer or guest details, showing actual email instead of N/A
  const customerEmail = order.buyer?.userEmail || order.guestDetails?.email || 'N/A'
  const customerPhone = order.buyer?.phoneNumber || order.guestDetails?.phone || 'N/A'
  
  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
          </Button>
        </Link>
        <h1 className="text-2xl font-serif">Order #{order._id.slice(-6)}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Items */}
          <div className="border border-border rounded-lg p-6 bg-card">
            <h2 className="text-lg font-medium mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-start border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="w-16 h-16 bg-muted rounded overflow-hidden relative">
                    {item.product?.imageUrls?.[0] ? (
                      <img
                        src={item.product.imageUrls[0]}
                        alt={item.product.name}
                        className="object-cover w-full h-full"
                      />
                    ) : item.product?.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="object-cover w-full h-full"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product?.name || 'Unknown Product'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.selectedSize && `Size: ${item.selectedSize}`} 
                      {item.selectedColor && ` | Color: ${item.selectedColor}`}
                    </p>
                    <div className="mt-1 flex justify-between items-center">
                      <span className="text-sm">Qty: {item.quantity}</span>
                      <span className="font-medium">PKR {item.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
              <span className="font-medium">Total Amount</span>
              <span className="text-xl font-serif">PKR {order.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="border border-border rounded-lg p-6 bg-card">
            <h2 className="text-lg font-medium mb-4">Shipping Address</h2>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {order.shippingAddress || 'No shipping address provided'}
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Customer Details */}
          <div className="border border-border rounded-lg p-6 bg-card">
            <h2 className="text-lg font-medium mb-4">Customer Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="block text-muted-foreground">Name</span>
                <span className="font-medium">{customerName}</span>
              </div>
              <div>
                <span className="block text-muted-foreground">Email</span>
                <span className="font-medium">{customerEmail}</span>
              </div>
              <div>
                <span className="block text-muted-foreground">Phone</span>
                <span className="font-medium">{customerPhone}</span>
              </div>
            </div>
          </div>

          {/* Order Status */}
          <div className="border border-border rounded-lg p-6 bg-card">
            <h2 className="text-lg font-medium mb-4">Order Status</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Fulfillment Status</label>
                <select 
                  className="w-full border border-border rounded px-3 py-2 bg-background"
                  value={order.orderStatus}
                  onChange={(e) => updateStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Payment Status</label>
                <select 
                  className="w-full border border-border rounded px-3 py-2 bg-background"
                  value={order.paymentStatus}
                  onChange={(e) => updatePaymentStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-1">Payment Method</p>
                <p className="font-medium uppercase">{order.paymentMethod}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function AdminOrderDetailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderDetailsContent />
    </Suspense>
  )
}
