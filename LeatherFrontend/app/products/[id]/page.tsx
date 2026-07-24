'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Button } from '@/components/ui/button'
import FeaturedProducts from '@/components/featured-products'
import { useCart } from '@/components/cart-context'
import { Heart, ShoppingCart, Minus, Plus, Star } from 'lucide-react'
import { apiFetch, API_BASE_URL } from '@/lib/api'
import { pushGtmEcommerceEvent } from '@/lib/gtm'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Dialog, DialogOverlay, DialogContent } from '@/components/ui/dialog'

type Product = {
  id: string
  name: string
  price: number
  stock?: number
  discount?: number
  category?: string
  description?: string
  specs?: string[]
  images: string[]
  colors?: string[]
  sizes?: string[]
}

type Review = {
  _id: string
  rating: number
  title?: string
  comment?: string
  user?: { userName: string }
  guestDetails?: { fullName?: string; email?: string }
  isGuest?: boolean
  order?: string
  imageUrls?: string[]
  createdAt?: string
}

export default function ProductDetail() {
  const params = useParams()
  const productId = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loadingProduct, setLoadingProduct] = useState<boolean>(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const [page, setPage] = useState<number>(1)
  const [limit] = useState<number>(3)
  const [totalReviews, setTotalReviews] = useState<number>(0)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [reviewTab, setReviewTab] = useState<'reviews' | 'submit'>('reviews')
  const { addToCart } = useCart()
  const router = useRouter()

  // Review form state
  const [reviewRating, setReviewRating] = useState<number>(5)
  const [reviewComment, setReviewComment] = useState<string>('')
  const [reviewImages, setReviewImages] = useState<FileList | null>(null)
  const [eligibleOrders, setEligibleOrders] = useState<any[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string>('')
  const [guestFullName, setGuestFullName] = useState<string>('')
  const [guestEmail, setGuestEmail] = useState<string>('')

  const [mainImage, setMainImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(`/api/v1/products/get/${productId}`)
        const p = res?.data?.product
        const urls: string[] = res?.data?.imageUrls || []
        const mapped: Product = {
          id: p._id,
          name: p.name,
          price: p.price,
          discount: p.discount,
          category: p.category?.name || p.category?.type,
          description: p.description,
          specs: p.specs || [],
          images: urls.length ? urls : ['/placeholder.jpg'],
          colors: p.colors || [],
          sizes: p.sizes || [],
          // add stock to product state (optional) - extend Product type dynamically
          ...(typeof p.stock === 'number' ? { stock: p.stock } : {})
        }
        setProduct(mapped)
      } catch {
      } finally {
        setLoadingProduct(false)
      }
      try {
        setLoadingInitial(true)
        const resp = await fetch(`${API_BASE_URL}/api/v1/reviews/product/${productId}?page=1&limit=${limit}`, {
          method: 'GET',
          credentials: 'include'
        })
        if (resp.ok) {
          const data = await resp.json().catch(() => ({}))
          const payload = data?.data || {}
          setReviews(payload.reviews || [])
          setTotalReviews(payload.total || 0)
          setPage(1)
        }
      } catch (err) {
        // silently ignore
      } finally {
        setLoadingInitial(false)
      }

      // Fetch eligible orders for review - ONLY for logged-in users
      const token = localStorage.getItem('accessToken')
      if (token) {
        try {
          const res3 = await apiFetch(`/api/v1/orders/eligible-for-review/${productId}`)
          setEligibleOrders(res3?.data || [])
        } catch {
          // Silently fail for protected API calls
        }
      }
    })()
  }, [productId])

  // Refetch product when admin updates products elsewhere (storage flag)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'products_last_updated') {
        ;(async () => {
          try {
            const res = await apiFetch(`/api/v1/products/get/${productId}`)
            const p = res?.data?.product
            const urls: string[] = res?.data?.imageUrls || []
            if (p) {
              const mapped: Product = {
                id: p._id,
                name: p.name,
                price: p.price,
                discount: p.discount,
                category: p.category?.name || p.category?.type,
                description: p.description,
                specs: p.specs || [],
                images: urls.length ? urls : ['/placeholder.jpg'],
                colors: p.colors || [],
                sizes: p.sizes || []
              }
              setProduct(mapped)
            }
          } catch {
            // ignore
          }
        })()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [productId])

  // Fire view_item GTM event when product details are available
  useEffect(() => {
    if (!product) return
    try {
      pushGtmEcommerceEvent('view_item', {
        actionField: {
          id: product.id,
          value: product.price,
          revenue: product.price,
          shipping: null,
          coupon: null,
          source: typeof window !== 'undefined' ? window.location.pathname : null
        },
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            price: product.price,
            discount: product.discount || 0,
            category: product.category || null
          }
        ]
      })
    } catch (err) {
      // swallow
    }
  }, [product])

  useEffect(() => {
    if (product && product.images && product.images.length > 0) {
      const first = product.images[0] || null
      setMainImage(first)
    } else {
      setMainImage(null)
    }
  }, [product]);

  const handleThumbnailClick = (image: string | undefined | null) => {
    if (!image) return
    setMainImage(image)
  };

  const handleImageClick = () => {
    if (mainImage) setIsModalOpen(true); // Open the modal only when image exists
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3)); // Increase zoom level up to 3x
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 1)); // Decrease zoom level down to 1x
  };

  const closeModal = () => {
    setIsModalOpen(false); // Close the modal
    setZoomLevel(1); // Reset zoom level
  };

  const handleAddToCart = () => {
    if (!product) return

    // Prevent adding sold-out products
    if (product['stock'] !== undefined && product['stock'] <= 0) {
      setError('This product is currently sold out.')
      return
    }

    if (product.colors && product.colors.length > 0 && !selectedColor) {
      setError('Please select a color')
      return
    }
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      setError('Please select a size')
      return
    }

    setError(null)
    const effectivePrice = product.discount && product.discount > 0
      ? Math.round(product.price * (1 - product.discount / 100))
      : product.price
    addToCart({
      id: product.id,
      name: product.name,
      price: effectivePrice,
      originalPrice: product.discount && product.discount > 0 ? product.price : undefined,
      discount: product.discount && product.discount > 0 ? product.discount : undefined,
      image: product.images[0] || '/placeholder.jpg',
      selectedColor: selectedColor,
      selectedSize: selectedSize,
      availableColors: product.colors,
      availableSizes: product.sizes
    }, quantity)
    router.push('/cart')
  }

  if (loadingProduct) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-muted border-t-foreground rounded-full animate-spin" />
        </div>
        <Footer />
      </>
    )
  }

  if (!product) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <p>Product not found</p>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          {/* Breadcrumb removed per request */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Product Images */}
            <div>
              <div 
                className="relative overflow-hidden bg-white border border-border mb-4 flex items-center justify-center cursor-pointer aspect-square"
                onClick={handleImageClick}
              >
                {mainImage ? (
                  <Image
                    src={mainImage}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">No image</div>
                )}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((img, i) => (
                  img ? (
                    <div
                      key={i}
                      className="relative overflow-hidden bg-muted aspect-square cursor-pointer hover:opacity-75 flex items-center justify-center"
                      onClick={() => handleThumbnailClick(img)}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} view ${i + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : null
                ))}
              </div>
            </div>

            {/* Product Details */}
            <div>
              <div className="mb-6">
                <h1 className="text-3xl md:text-4xl font-serif font-light tracking-wide mb-4">
                  {product.name}
                </h1>
                {product.discount && product.discount > 0 ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-2xl font-serif text-red-600">
                      PKR {Math.round(product.price * (1 - product.discount / 100)).toLocaleString()}
                    </span>
                    <span className="text-lg font-serif text-muted-foreground line-through">
                      PKR {product.price.toLocaleString()}
                    </span>
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {product.discount}% OFF
                    </span>
                    {product['stock'] !== undefined && product['stock'] <= 0 && (
                      <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">SOLD OUT</span>
                    )}
                  </div>
                ) : (
                      <p className="text-2xl font-serif">PKR {product.price.toLocaleString()}</p>
                    )}
                  {product['stock'] !== undefined && product['stock'] <= 0 && (
                    <p className="text-sm text-red-600 font-medium mt-2">This product is currently sold out.</p>
                  )}
              
              </div>

              <p className="text-sm leading-relaxed mb-8 opacity-80">
                {product.description}
              </p>

              {/* Specifications */}
              <div className="mb-8">
                <h3 className="text-sm font-light tracking-wide mb-4 uppercase opacity-75">Specifications</h3>
                <ul className="space-y-2 text-sm opacity-80">
                  {(product.specs || []).map((spec, i) => (
                    <li key={i} className="flex items-center">
                      <span className="w-1 h-1 bg-accent rounded-full mr-2"></span>
                      {spec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Selection */}
              <div className="space-y-6 mb-8">
                {product.colors && product.colors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">Color</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map(color => (
                        <button
                          key={color}
                          onClick={() => { setSelectedColor(color); setError(null) }}
                          className={`px-4 py-2 text-sm border transition-all ${
                            selectedColor === color 
                              ? 'border-black bg-black text-white' 
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">Size</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map(size => (
                        <button
                          key={size}
                          onClick={() => { setSelectedSize(size); setError(null) }}
                          className={`px-4 py-2 text-sm border transition-all ${
                            selectedSize === size 
                              ? 'border-black bg-black text-white' 
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {error && (
                  <p className="text-red-500 text-sm font-medium">{error}</p>
                )}
              </div>

              {/* Quantity and Actions */}
              <div className="space-y-4">
                <div className="flex items-center border border-border">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                    title="Decrease quantity"
                    className="px-4 py-3 hover:bg-muted transition"
                  >
                    <Minus aria-hidden="true" className="w-4 h-4" />
                  </button>
                  <input
                    id="product-quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    aria-label="Quantity"
                    title="Quantity"
                    className="flex-1 text-center outline-none bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="Increase quantity"
                    title="Increase quantity"
                    className="px-4 py-3 hover:bg-muted transition"
                  >
                    <Plus aria-hidden="true" className="w-4 h-4" />
                  </button>
                </div>

                <Button
                  onClick={handleAddToCart}
                  className={`w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6`}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {product['stock'] !== undefined && product['stock'] <= 0 ? 'Sold Out' : 'Add to Cart'}
                </Button>
              </div>
            </div>
          </div>

          {/* Reviews - Full Width */}
          <div className="mt-12 border-t border-border pt-8 w-full">

            {/* Tab bar */}
            <div className="mb-8">
              <div className="flex items-center justify-center gap-12 border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setReviewTab('reviews')}
                  className={`pb-3 text-base font-serif tracking-wide transition border-b-2 -mb-px ${
                    reviewTab === 'reviews'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Reviews {totalReviews > 0 && <span className="text-xs ml-1">({totalReviews})</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setReviewTab('submit')}
                  className={`pb-3 text-base font-serif tracking-wide transition border-b-2 -mb-px ${
                    reviewTab === 'submit'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Submit Review
                </button>
              </div>
            </div>

            {/* Reviews Tab */}
            {reviewTab === 'reviews' && (
              <div className="max-w-3xl mx-auto">
                {loadingInitial ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Loading reviews...</p>
                ) : reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No reviews yet. Be the first to review!</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {reviews.map(r => {
                      const displayName = r.user?.userName || r['guestDetails']?.fullName || 'Anonymous'
                      const initial = displayName.charAt(0).toUpperCase()
                      const isVerified = !r.isGuest && !!r.order
                      const dateStr = r.createdAt
                        ? new Date(r.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                        : ''
                      return (
                        <div key={r._id} className="py-6 first:pt-0">
                          {/* Row 1: Avatar + stars + date */}
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-gray-600">
                              {initial}
                            </div>
                            <div className="flex-1 min-w-0">
                              {/* Stars + date on same line */}
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      size={14}
                                      fill={i < r.rating ? '#FBBF24' : 'none'}
                                      stroke={i < r.rating ? '#FBBF24' : '#D1D5DB'}
                                      strokeWidth={1.5}
                                    />
                                  ))}
                                </div>
                                {dateStr && (
                                  <span className="text-xs text-gray-400 flex-shrink-0">{dateStr}</span>
                                )}
                              </div>
                              {/* Name + verified badge */}
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-semibold text-gray-800">{displayName}</span>
                                {isVerified && (
                                  <span className="inline-flex items-center gap-1 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8 15.414l-4.707-4.707a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Verified
                                  </span>
                                )}
                              </div>
                              {/* Title */}
                              {r.title && (
                                <p className="text-sm font-semibold text-gray-900 mb-1">{r.title}</p>
                              )}
                              {/* Comment */}
                              {r.comment && (
                                <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
                              )}
                              {/* Review photos */}
                              {r.imageUrls && r.imageUrls.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {r.imageUrls.map((u, i) => (
                                    <div key={i} className="w-20 h-20 relative rounded overflow-hidden border border-gray-100 flex-shrink-0">
                                      <Image src={u} alt={`review photo ${i + 1}`} fill className="object-cover" />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Pagination */}
                {!loadingInitial && reviews.length > 0 && (
                  <div className="mt-6 flex items-center justify-center gap-3">
                    {page > 1 && (
                      <button
                        onClick={async () => {
                          const prevPage = page - 1
                          setLoadingMore(true)
                          try {
                            const resp = await fetch(`${API_BASE_URL}/api/v1/reviews/product/${productId}?page=${prevPage}&limit=${limit}`, { credentials: 'include' })
                            if (resp.ok) {
                              const data = await resp.json().catch(() => ({}))
                              setReviews(data?.data?.reviews || [])
                              setPage(prevPage)
                            }
                          } catch {} finally { setLoadingMore(false) }
                        }}
                        className="px-4 py-1.5 border border-gray-200 rounded text-sm hover:bg-gray-50 transition"
                      >← Prev</button>
                    )}
                    <span className="text-sm text-muted-foreground">Page {page}</span>
                    {reviews.length >= limit && page * limit < totalReviews && (
                      <button
                        onClick={async () => {
                          const nextPage = page + 1
                          setLoadingMore(true)
                          try {
                            const resp = await fetch(`${API_BASE_URL}/api/v1/reviews/product/${productId}?page=${nextPage}&limit=${limit}`, { credentials: 'include' })
                            if (resp.ok) {
                              const data = await resp.json().catch(() => ({}))
                              setReviews(data?.data?.reviews || [])
                              setPage(nextPage)
                            }
                          } catch {} finally { setLoadingMore(false) }
                        }}
                        disabled={loadingMore}
                        className="px-4 py-1.5 border border-gray-200 rounded text-sm hover:bg-gray-50 transition disabled:opacity-50"
                      >Next →</button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Submit Review Tab */}
            {reviewTab === 'submit' && (
              <div className="max-w-xl mx-auto">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    const token = localStorage.getItem('accessToken')
                    if (token && !selectedOrderId) {
                      toast.error('Please select an order to review')
                      return
                    }
                    if (reviewComment.length < 5) {
                      toast.error('Comment must be at least 5 characters long')
                      return
                    }
                    const fd = new FormData()
                    fd.append('product', productId)
                    fd.append('orderId', token ? selectedOrderId : 'guest')
                    fd.append('rating', String(reviewRating))
                    if (reviewComment) fd.append('comment', reviewComment)
                    if (!token) {
                      if (guestFullName) fd.append('fullName', guestFullName)
                      if (guestEmail) fd.append('email', guestEmail)
                    }
                    if (reviewImages) {
                      for (let i = 0; i < reviewImages.length; i++) fd.append('images', reviewImages[i])
                    }
                    try {
                      const res = await fetch(`${API_BASE_URL}/api/v1/reviews/`, { method: 'POST', credentials: 'include', body: fd })
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}))
                        throw new Error(data.message || 'Failed to submit review')
                      }
                      toast.success('Review submitted and awaiting approval')
                      setReviewComment('')
                      setReviewRating(5)
                      setReviewImages(null)
                      setSelectedOrderId('')
                      setGuestFullName('')
                      setGuestEmail('')
                      const fi = document.getElementById('review-images') as HTMLInputElement
                      if (fi) fi.value = ''
                      setReviewTab('reviews')
                    } catch (err: any) {
                      try {
                        const formatApiError = (await import('@/lib/formatApiError')).default
                        toast.error(formatApiError(err))
                      } catch {
                        toast.error(err.message || 'Failed to submit review')
                      }
                    }
                  }}
                  className="space-y-4"
                >
                  {/* Eligible order selector (logged-in) */}
                  {typeof window !== 'undefined' && localStorage.getItem('accessToken') && eligibleOrders.length > 0 && (
                    <div>
                      <label className="block text-sm mb-1.5 text-gray-700">Select Order</label>
                      <select
                        value={selectedOrderId}
                        onChange={(e) => setSelectedOrderId(e.target.value)}
                        className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition"
                        required
                      >
                        <option value="">Choose an order...</option>
                        {eligibleOrders.map(order => (
                          <option key={order._id} value={order._id}>
                            Order #{order._id.slice(-6)} — {new Date(order.createdAt).toLocaleDateString()} — PKR {order.totalAmount?.toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {typeof window !== 'undefined' && localStorage.getItem('accessToken') && eligibleOrders.length === 0 && (
                    <div className="text-sm text-muted-foreground p-3 bg-muted rounded">
                      No eligible orders. You can only review products from paid and delivered orders.
                    </div>
                  )}
                  {/* Guest name/email */}
                  {typeof window !== 'undefined' && !localStorage.getItem('accessToken') && (
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder="Your name (optional)" value={guestFullName} onChange={(e) => setGuestFullName(e.target.value)} className="focus:border-gray-400 focus:ring-0" />
                      <Input placeholder="Your email (optional)" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className="focus:border-gray-400 focus:ring-0" />
                    </div>
                  )}
                  {/* Rating + file upload */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm mb-1.5 text-gray-700">Rating</label>
                      <select
                        className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition"
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                      >
                        {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1.5 text-gray-700">Photos (optional)</label>
                      <Input id="review-images" type="file" multiple onChange={(e) => setReviewImages(e.target.files)} className="focus:border-gray-400 focus:ring-0 text-xs" />
                    </div>
                  </div>
                  {/* Comment */}
                  <div>
                    <label className="block text-sm mb-1.5 text-gray-700">Share your experience</label>
                    <Textarea
                      placeholder="Share your experience"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="min-h-[120px] border-gray-200 focus:border-gray-400 focus:ring-0 focus-visible:ring-0 focus-visible:border-gray-400 resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" className="bg-primary text-primary-foreground px-8">Submit Review</Button>
                    <Button type="button" variant="outline" onClick={() => setReviewTab('reviews')}>Cancel</Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      <FeaturedProducts category={product.category} currentProductId={product.id} currentProductName={product.name} title="Related Products" />

      {/* Image Modal with Hover Zoom Effect */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300" onMouseLeave={closeModal}>
          <div 
            className="absolute inset-0 bg-black opacity-85 cursor-zoom-out"
            onClick={closeModal}
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          />
          
          <div 
            className="relative w-full h-full flex items-center justify-center bg-black"
            style={{
              animation: 'zoomIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <style>{`
              @keyframes zoomIn {
                from {
                  transform: scale(0.85);
                  opacity: 0;
                }
                to {
                  transform: scale(1);
                  opacity: 1;
                }
              }
              .zoom-image-container {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
              }
              .zoom-image {
                transition: transform 0.3s ease-out;
                max-width: 90vw;
                max-height: 90vh;
                cursor: zoom-in;
              }
              .zoom-image.zoomed {
                cursor: zoom-out;
              }
            `}</style>

            {/* Close Button */}
            <button 
              onClick={closeModal} 
              className="absolute top-6 right-6 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition shadow-md z-10"
              aria-label="Close"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image Container */}
            <div className="zoom-image-container">
              {mainImage ? (
                <div
                  className={`zoom-image ${zoomLevel > 1 ? 'zoomed' : ''}`}
                  onClick={() => setZoomLevel(zoomLevel > 1 ? 1 : 2)}
                  onMouseMove={(e) => {
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const xPercent = (x / rect.width) * 100;
                    const yPercent = (y / rect.height) * 100;
                    (e.currentTarget as HTMLDivElement).style.transformOrigin = `${xPercent}% ${yPercent}%`;
                  }}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image
                    src={mainImage}
                    alt={product.name}
                    fill
                    className="object-contain"
                    style={{
                      transform: `scale(${zoomLevel})`,
                    }}
                    priority
                    loading="eager"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center text-muted-foreground">No image available</div>
              )}
            </div>

            {/* Zoom Hint */}
            {zoomLevel === 1 && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
                Click to zoom in
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          * {
            --animate-in: fade-in;
          }
        }
      `}</style>

      <Footer />
    </>
  )
}
