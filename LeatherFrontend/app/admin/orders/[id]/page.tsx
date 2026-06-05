'use client'

import { useEffect, useState, Suspense } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
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
  variant?: { name: string; options: any }
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
  finalAmount?: number
  shippingCost?: number
  paymentMethod: string
  paymentStatus: string
  orderStatus: string
  paymentTransactionId?: string | null
  createdAt: string
}

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'CASH ON DELIVERY (COD)',
  jazzcash: 'JAZZCASH',
  easypaisa: 'EASYPAISA',
  card: 'CARD PAYMENT',
  payfast: 'PAYFAST',
}

function buildReceiptHTML(order: Order): string {
  const customerName = order.buyer?.userName || order.guestDetails?.fullName || 'Guest'
  const customerPhone = order.buyer?.phoneNumber || order.guestDetails?.phone || '—'
  const customerEmail = order.buyer?.userEmail || order.guestDetails?.email || '—'
  const customerAddress = order.shippingAddress || order.guestDetails?.address || '—'
  const paymentLabel = PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod.toUpperCase()
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-PK', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const total = order.finalAmount ?? order.totalAmount
  const shipping = order.shippingCost ?? 0
  const subtotal = shipping > 0 ? total - shipping : total

  const itemRows = order.items.map(item => `
    <tr>
      <td style="padding:10px 12px;font-weight:600;font-size:13px;">${item.product?.name || 'Product'}</td>
      <td style="padding:10px 12px;font-size:13px;color:#555;">${item.selectedColor || '—'}</td>
      <td style="padding:10px 12px;text-align:center;font-size:13px;">${item.quantity}</td>
      <td style="padding:10px 12px;text-align:right;font-size:13px;">PKR ${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Order #${order._id.slice(-6).toUpperCase()} - Flex Leather</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #222; background: #fff; font-size: 13px; }
    .page { max-width: 750px; margin: 0 auto; padding: 0; }

    /* Header */
    .header {
      background: #2c1a0e;
      color: #fff;
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header-left h1 { font-size: 26px; font-weight: 900; letter-spacing: 1px; margin-bottom: 6px; }
    .header-left p { font-size: 12px; opacity: 0.85; }
    .header-right {
      text-align: right;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.5px;
      padding-top: 4px;
    }

    /* Address boxes */
    .address-row {
      display: flex;
      gap: 0;
      border: 1px solid #ddd;
      margin: 20px 0 0;
    }
    .address-box {
      flex: 1;
      padding: 14px 16px;
      border-right: 1px solid #ddd;
    }
    .address-box:last-child { border-right: none; }
    .address-box h3 {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #eee;
    }
    .address-box p { font-size: 12.5px; line-height: 1.9; }
    .address-box strong { font-weight: 700; }

    /* Order content */
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 22px 0 0;
    }
    .section-title .bar {
      width: 4px;
      height: 20px;
      background: #2c1a0e;
      border-radius: 2px;
    }
    .section-title h2 {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    thead tr {
      background: #2c2c2c;
      color: #fff;
    }
    thead th {
      padding: 10px 12px;
      font-size: 12px;
      font-weight: 600;
      text-align: left;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    thead th:last-child { text-align: right; }
    thead th:nth-child(3) { text-align: center; }
    tbody tr { border-bottom: 1px solid #eee; }
    tbody tr:last-child { border-bottom: none; }

    /* Totals */
    .totals {
      margin-top: 0;
      padding: 10px 12px;
      text-align: right;
      border: 1px solid #eee;
      border-top: none;
    }
    .totals-row {
      display: flex;
      justify-content: flex-end;
      gap: 80px;
      padding: 5px 0;
      font-size: 13px;
      color: #555;
    }
    .totals-row.final {
      border-top: 2px solid #c0392b;
      padding-top: 8px;
      margin-top: 4px;
      font-weight: 700;
      font-size: 14px;
      color: #c0392b;
    }
    .totals-row span:last-child { min-width: 100px; text-align: right; }

    /* Instructions */
    .instructions {
      margin-top: 22px;
      padding: 14px 16px;
      border: 1px solid #ddd;
      background: #fafafa;
    }
    .instructions h4 {
      font-size: 12.5px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .instructions ul { padding-left: 18px; }
    .instructions li {
      font-size: 12px;
      line-height: 1.8;
      color: #444;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <h1>FLEX LEATHER</h1>
        <p>Order: #${order._id.slice(-6)} &nbsp;|&nbsp; Date: ${orderDate}</p>
      </div>
      <div class="header-right">${paymentLabel}</div>
    </div>

    <!-- Address Row -->
    <div class="address-row">
      <div class="address-box">
        <h3>Ship To (Customer)</h3>
        <p><strong>Name:</strong> ${customerName}</p>
        <p><strong>Phone:</strong> ${customerPhone}</p>
        <p><strong>Address:</strong> ${customerAddress}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
      </div>
      <div class="address-box">
        <h3>Ship From (Sender)</h3>
        <p><strong>Company:</strong> Flex Leather</p>
        <p><strong>Contact:</strong> +92 318 4642266</p>
        <p><strong>Address:</strong> Maverick Engineers G-13, Innovista Rachna DHA, Gujranwala, Pakistan</p>
        <p><strong>Website:</strong> theflexleather.com</p>
      </div>
    </div>

    <!-- Order Content -->
    <div class="section-title">
      <div class="bar"></div>
      <h2>Order Content</h2>
    </div>
    <table>
      <thead>
        <tr>
          <th>Item Description</th>
          <th>Color</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      ${shipping > 0 ? `
      <div class="totals-row">
        <span>Subtotal:</span>
        <span>PKR ${subtotal.toLocaleString()}</span>
      </div>
      <div class="totals-row">
        <span>Shipping Charges:</span>
        <span>PKR ${shipping.toLocaleString()}</span>
      </div>` : ''}
      <div class="totals-row final">
        <span>${order.paymentMethod === 'cod' ? 'Amount to Collect:' : 'Total Amount:'}</span>
        <span>PKR ${total.toLocaleString()}</span>
      </div>
    </div>

    <!-- Instructions -->
    ${order.paymentMethod === 'cod' ? `
    <div class="instructions">
      <h4>Important Instructions for Courier Rider / Staff:</h4>
      <ul>
        <li>This is a <strong>Cash on Delivery (COD)</strong> order. Please collect the exact amount mentioned above before handing over the parcel.</li>
        <li>Do not open the parcel box before collecting the payment.</li>
      </ul>
    </div>` : `
    <div class="instructions">
      <h4>Delivery Instructions:</h4>
      <ul>
        <li>Payment has been made via <strong>${PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</strong>. No cash collection required.</li>
        <li>Handle with care. Deliver only to the recipient at the address above.</li>
      </ul>
    </div>`}

  </div>
  <script>window.onload = function(){ window.print(); }</script>
</body>
</html>`
}

function OrderDetailsContent() {
  const { id } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

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
        body: JSON.stringify({ status }),
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
        body: JSON.stringify({ status }),
      })
      loadOrder()
    } catch (e: any) {
      alert(e?.message || 'Failed to update payment')
    }
  }

  const handlePrint = () => {
    if (!order) return
    const html = buildReceiptHTML(order)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)

    // Hidden iframe — bypasses popup blockers completely
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:none;opacity:0;pointer-events:none;'
    document.body.appendChild(iframe)
    iframe.src = url

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch {}
      setTimeout(() => {
        document.body.removeChild(iframe)
        URL.revokeObjectURL(url)
      }, 2000)
    }
  }

  const handleDownload = () => {
    if (!order) return
    const html = buildReceiptHTML(order)
    // Remove the auto-print script for download — user opens and saves as PDF manually
    const htmlForDownload = html.replace('<script>window.onload = function(){ window.print(); }</script>', '')
    const blob = new Blob([htmlForDownload], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `order-${order._id.slice(-6).toUpperCase()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this order permanently? This cannot be undone.')) return
    setDeleting(true)
    try {
      await apiFetch(`/api/v1/orders/${id}`, { method: 'DELETE' })
      router.push('/admin/orders')
    } catch (e: any) {
      alert(e?.message || 'Failed to delete order')
      setDeleting(false)
    }
  }

  if (loading) return <div className="p-8">Loading order details...</div>
  if (error) return <div className="p-8 text-red-600">{error}</div>
  if (!order) return <div className="p-8">Order not found</div>

  const customerName = order.buyer?.userName || order.guestDetails?.fullName || 'Guest'
  const customerEmail = order.buyer?.userEmail || order.guestDetails?.email || 'N/A'
  const customerPhone = order.buyer?.phoneNumber || order.guestDetails?.phone || 'N/A'

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
            </Button>
          </Link>
          <h1 className="text-2xl font-serif">Order #{order._id.slice(-6)}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {deleting ? 'Deleting...' : 'Delete Order'}
          </Button>
        </div>
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
                  <div className="w-16 h-16 bg-muted rounded overflow-hidden relative p-1 flex items-center justify-center flex-shrink-0">
                    {item.product?.imageUrls?.[0] ? (
                      <Image src={item.product.imageUrls[0]} alt={item.product.name} fill className="object-contain" />
                    ) : item.product?.images?.[0] ? (
                      <Image src={item.product.images[0]} alt={item.product.name} fill className="object-contain" />
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
                      <span className="font-medium">PKR {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-border space-y-1.5">
              {(order.shippingCost ?? 0) > 0 && (
                <>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>PKR {((order.finalAmount ?? order.totalAmount) - (order.shippingCost ?? 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Shipping</span>
                    <span>PKR {(order.shippingCost ?? 0).toLocaleString()}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount</span>
                <span className="text-xl font-serif">PKR {(order.finalAmount ?? order.totalAmount).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="border border-border rounded-lg p-6 bg-card">
            <h2 className="text-lg font-medium mb-4">Shipping Address</h2>
            <p className="whitespace-pre-wrap text-muted-foreground">{order.shippingAddress || 'No address provided'}</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Customer */}
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
              {(order.paymentMethod === 'jazzcash' || order.paymentMethod === 'easypaisa') && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-1">Transaction / Reference ID</p>
                  <p className="font-medium">{order.paymentTransactionId || 'Not provided'}</p>
                </div>
              )}
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
