'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import { toast } from 'sonner'
import {
  ShoppingBag,
  Users,
  CreditCard,
  MessageSquare,
  Package,
  DollarSign,
  Activity,
  Truck
} from 'lucide-react'

export default function AdminHome() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalPendingReviews: 0,
    pendingPayments: 0
  })
  const [shippingCost, setShippingCost] = useState<number>(200)
  const [shippingInput, setShippingInput] = useState<string>('200')
  const [savingShipping, setSavingShipping] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiFetch('/api/v1/admin/dashboard/stats')
        if (res?.data) setStats(res.data)
      } catch (e) {
        console.error('Failed to load stats', e)
      }
    }
    const fetchShipping = async () => {
      try {
        const res = await apiFetch('/api/v1/settings')
        const cost = res?.data?.shippingCost ?? 200
        setShippingCost(cost)
        setShippingInput(String(cost))
      } catch {}
    }
    fetchStats()
    fetchShipping()
  }, [])

  const saveShipping = async () => {
    const val = Number(shippingInput)
    if (isNaN(val) || val < 0) {
      toast.error('Please enter a valid shipping cost (0 or more).')
      return
    }
    setSavingShipping(true)
    try {
      await apiFetch('/api/v1/settings', {
        method: 'PUT',
        body: JSON.stringify({ shippingCost: val }),
      })
      setShippingCost(val)
      toast.success(`Shipping cost updated to PKR ${val.toLocaleString()}`)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update shipping cost')
    } finally {
      setSavingShipping(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back, {user?.userName}</p>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard 
          title="Total Revenue" 
          value={`PKR ${stats.totalRevenue.toLocaleString()}`} 
          icon={<DollarSign className="w-5 h-5 text-green-600" />} 
        />
        <StatsCard 
          title="Total Orders" 
          value={stats.totalOrders} 
          icon={<ShoppingBag className="w-5 h-5 text-blue-600" />} 
        />
        <StatsCard 
          title="Pending Orders" 
          value={stats.pendingOrders} 
          icon={<Activity className="w-5 h-5 text-orange-600" />} 
        />
        <StatsCard 
          title="Total Products" 
          value={stats.totalProducts} 
          icon={<Package className="w-5 h-5 text-purple-600" />} 
        />
        <StatsCard 
          title="Pending Reviews" 
          value={stats.totalPendingReviews} 
          icon={<MessageSquare className="w-5 h-5 text-yellow-600" />} 
        />
        <StatsCard 
          title="Pending Payments" 
          value={stats.pendingPayments} 
          icon={<CreditCard className="w-5 h-5 text-red-600" />} 
        />
      </div>

      {/* Shipping Cost */}
      <div className="border border-border rounded-lg p-6 bg-card shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-medium">Shipping Cost</h2>
          <span className="ml-auto text-sm text-muted-foreground">Currently: <strong>PKR {shippingCost.toLocaleString()}</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-border rounded overflow-hidden flex-1 max-w-xs">
            <span className="px-3 py-2 bg-muted text-sm text-muted-foreground border-r border-border">PKR</span>
            <input
              type="number"
              min="0"
              value={shippingInput}
              onChange={e => setShippingInput(e.target.value)}
              className="px-3 py-2 text-sm flex-1 outline-none bg-transparent"
              placeholder="e.g. 200"
            />
          </div>
          <button
            onClick={saveShipping}
            disabled={savingShipping}
            className="px-5 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-60 transition"
          >
            {savingShipping ? 'Saving…' : 'Save'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">This amount is applied to every order at checkout across the entire store.</p>
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-xl font-serif mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.pendingOrders > 0 && (
            <Link prefetch={false} href="/admin/orders?status=pending" className="group block border border-border p-6 hover:bg-muted transition-colors rounded-lg">
              <h3 className="font-medium text-lg mb-2 group-hover:text-accent flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" /> Pending Orders
              </h3>
              <p className="text-sm text-muted-foreground">Manage {stats.pendingOrders} orders waiting for fulfillment.</p>
            </Link>
          )}
          
          {stats.pendingPayments > 0 && (
            <Link prefetch={false} href="/admin/orders?payment=cod&status=pending" className="group block border border-border p-6 hover:bg-muted transition-colors rounded-lg">
              <h3 className="font-medium text-lg mb-2 group-hover:text-accent flex items-center gap-2">
                <DollarSign className="w-5 h-5" /> COD Payments
              </h3>
              <p className="text-sm text-muted-foreground">Review {stats.pendingPayments} COD payments.</p>
            </Link>
          )}

          {stats.totalPendingReviews > 0 && (
            <Link prefetch={false} href="/admin/reviews" className="group block border border-border p-6 hover:bg-muted transition-colors rounded-lg">
              <h3 className="font-medium text-lg mb-2 group-hover:text-accent flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> Review Approvals
              </h3>
              <p className="text-sm text-muted-foreground">Approve {stats.totalPendingReviews} reviews.</p>
            </Link>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link prefetch={false} href="/admin/products" className="group block border border-border p-6 hover:bg-muted transition-colors rounded-lg">
          <h3 className="font-medium text-lg mb-2 group-hover:text-accent flex items-center gap-2">
            <Package className="w-5 h-5" /> Manage Products
          </h3>
          <p className="text-sm text-muted-foreground">Add, edit, or remove products from the store.</p>
        </Link>
        
        <Link prefetch={false} href="/admin/categories" className="group block border border-border p-6 hover:bg-muted transition-colors rounded-lg">
          <h3 className="font-medium text-lg mb-2 group-hover:text-accent flex items-center gap-2">
            <Users className="w-5 h-5" /> Manage Categories
          </h3>
          <p className="text-sm text-muted-foreground">Organize products into categories.</p>
        </Link>
      </div>
    </div>
  )
}

function StatsCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="border border-border p-6 rounded-lg bg-card text-card-foreground shadow-sm">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-sm font-medium">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}
