'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'

type OrderItem = {
  product: string
  variant?: string
  quantity: number
  price: number
}

type Order = {
  _id: string
  buyer?: { userName?: string; userEmail?: string }
  guestDetails?: { fullName?: string; email?: string }
  items: OrderItem[]
  totalAmount: number
  finalAmount?: number
  shippingCost?: number
  paymentMethod: 'cod' | 'jazzcash' | 'easypaisa' | 'card' | 'payfast'
  paymentStatus: 'pending' | 'paid' | 'failed'
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: string
}

function OrdersContent() {
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  
  // Initialize from URL params
  const [methodFilter, setMethodFilter] = useState<string>(searchParams.get('payment') || 'all')
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all')

  const loadOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/v1/orders')
      setOrders(res?.data || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const mOk = methodFilter === 'all' || o.paymentMethod === methodFilter
      const sOk = statusFilter === 'all' || o.orderStatus === statusFilter
      const q = search.trim().toLowerCase()
      const name = (o.buyer?.userName || o.guestDetails?.fullName || '').toLowerCase()
      const id = o._id.toLowerCase()
      return mOk && sOk && (!q || id.includes(q) || name.includes(q))
    })
  }, [orders, methodFilter, statusFilter, search])

  const markAsPaid = async (order: Order) => {
    if (order.paymentMethod !== 'cod' || order.paymentStatus !== 'pending') return
    if (!window.confirm('Mark this COD order as paid?')) return
    try {
      await apiFetch(`/api/v1/orders/${order._id}/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' })
      })
      await loadOrders()
    } catch (e: any) {
      alert(e?.message || 'Failed to update payment')
    }
  }

  return (
    <>
      <h1 className="text-2xl font-serif font-light tracking-wide mb-4">Orders</h1>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          className="border border-border px-3 py-2 text-sm rounded w-64"
          placeholder="Search by Order ID or Customer"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border border-border px-3 py-2 text-sm rounded"
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
        >
          <option value="all">All Methods</option>
          <option value="cod">COD</option>
          <option value="jazzcash">JazzCash</option>
          <option value="easypaisa">EasyPaisa</option>
          <option value="card">Card</option>
        </select>

        <select
          className="border border-border px-3 py-2 text-sm rounded"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <Button variant="outline" onClick={loadOrders}>Refresh</Button>
      </div>

      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-muted border-b">
              <tr>
                <th className="p-3 font-medium">Order ID</th>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Items</th>
                <th className="p-3 font-medium">Total</th>
                <th className="p-3 font-medium">Method</th>
                <th className="p-3 font-medium">Pay Status</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(order => (
                <tr key={order._id} className="hover:bg-muted/50">
                  <td className="p-3 font-mono text-xs">{order._id.slice(-6)}</td>
                  <td className="p-3">
                    <div>
                      <div className="font-medium">{order.buyer?.userName || order.guestDetails?.fullName || 'Guest'}</div>
                      <div className="text-xs text-muted-foreground">{order.buyer?.userEmail || order.guestDetails?.email || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="p-3 max-w-xs truncate">
                    {order.items.length} item(s)
                  </td>
                  <td className="p-3">PKR {(order.finalAmount ?? order.totalAmount).toLocaleString()}</td>
                  <td className="p-3 uppercase text-xs font-bold text-muted-foreground">{order.paymentMethod}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 
                      order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.paymentStatus.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {order.orderStatus.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/orders/${order._id}`}>
                        <Button size="sm" variant="outline" className="h-8 px-3" title="View Details">
                          View Details
                        </Button>
                      </Link>
                      
                      {order.paymentMethod === 'cod' && order.paymentStatus === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsPaid(order)}
                          className="h-8 text-xs"
                          title="Mark as Paid"
                        >
                          Paid
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div>Loading orders...</div>}>
      <OrdersContent />
    </Suspense>
  )
}
