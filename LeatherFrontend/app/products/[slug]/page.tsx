'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { cloudinaryOptimize } from '@/lib/cloudinary'
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
  // Frontend product URLs use slug only
  const slug = (Array.isArray((params as any)?.slug)
    ? (params as any).slug[0]
    : (params as any)?.slug || '') as string
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

  const [mainImage, setMainImage] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)

  useEffect(() => {
    if (!slug) {
      setLoadingProduct(false)
      setLoadingInitial(false)
      return
    }
    ;(async () => {
      try {
        // Fetch product by slug; response product._id is used for all relations
        const res = await apiFetch(`/api/v1/products/get/${encodeURIComponent(slug)}`)
        const p = res?.data?.product
        const urls: string[] = res?.data?.imageUrls || []
        if (!p?._id) {
          setProduct(null)
          return
        }
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
          ...(typeof p.stock === 'number' ? { stock: p.stock } : {})
        }
        setProduct(mapped)

        // Reviews / orders must use MongoDB _id, not slug
        const productId = p._id as string
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
        } catch {
          // silently ignore
        } finally {
          setLoadingInitial(false)
        }

        const token = localStorage.getItem('accessToken')
        if (token) {
          try {
            const res3 = await apiFetch(`/api/v1/orders/eligible-for-review/${productId}`)
            setEligibleOrders(res3?.data || [])
          } catch {
            // Silently fail for protected API calls
          }
        }
      } catch {
        setProduct(null)
      } finally {
        setLoadingProduct(false)
      }
    })()
  }, [slug, limit])

  // Refetch product when admin updates products elsewhere (storage flag)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'products_last_updated' && slug) {
        ;(async () => {
          try {
            const res = await apiFetch(`/api/v1/products/get/${encodeURIComponent(slug)}`)
            const p = res?.data?.product
            const urls: string[] = res?.data?.imageUrls || []
            if (p?._id) {
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
  }, [slug])

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
  }, [product])

  const handleThumbnailClick = (image: string | undefined | null) => {
    if (!image) return
    setMainImage(image)
  }

  const handleImageClick = () => {
    if (mainImage) setIsModalOpen(true)
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 1))
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setZoomLevel(1)
  }

  const handleAddToCart = () => {
    if (!product) return

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

  const WHATSAPP_NUMBER = '923717014449'

  const handleBuyNow = () => {
    if (!product) return

    if (product['stock'] !== undefined && product['stock'] <= 0) {
      setError('This product is currently sold out.')
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

    router.push('/checkout')
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Product Images */}
            <div>
              <div 
                className="relative overflow-hidden bg-white border border-border mb-4 flex items-center justify-center cursor-pointer aspect-square"
                onClick={handleImageClick}
              >
                {mainImage ? (
                  <Image
                    src={cloudinaryOptimize(mainImage, 1200) || mainImage}
                    alt={product.name}
                    fill
                    sizes="100vw"
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
                        src={cloudinaryOptimize(img, 400) || img}
                        alt={`${product.name} view ${i + 1}`}
                        fill
                        sizes="100vw"
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
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
                  className={`w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 flex items-center justify-center`}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {product['stock'] !== undefined && product['stock'] <= 0 ? 'Sold Out' : 'Add to Cart'}
                </Button>
                
                {/* Secondary actions: Buy Now, WhatsApp order, stock and COD badge */}
                <div className="mt-2 space-y-2">
                  <Button
                    onClick={handleBuyNow}
                    className="w-full bg-accent text-accent-foreground h-10 flex items-center justify-center"
                  >
                    Buy it now
                  </Button>

                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello, I would like to order: ' + product.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center text-white h-10 flex items-center justify-center rounded border-0"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    Order on WhatsApp
                  </a>

                  <div className="flex items-center gap-3">
                    {product['stock'] !== undefined && product['stock'] > 0 && (
                      <span className="text-sm text-emerald-600">✓ {product['stock']} items in stock</span>
                    )}

                    <span className="inline-flex items-center gap-2 text-sm border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                      <span className="text-xs">💵</span>
                      <span>Cash on Delivery Available</span>
                    </span>
                  </div>
                </div>
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
                                      <Image src={cloudinaryOptimize(u, 200) || u} alt={`review photo ${i + 1}`} fill sizes="100vw" className="object-cover" />
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
                            const resp = await fetch(`${API_BASE_URL}/api/v1/reviews/product/${product.id}?page=${prevPage}&limit=${limit}`, { credentials: 'include' })
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
                            const resp = await fetch(`${API_BASE_URL}/api/v1/reviews/product/${product.id}?page=${nextPage}&limit=${limit}`, { credentials: 'include' })
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
                  onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                    e.preventDefault()
                    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
                    if (token && !selectedOrderId) {
                      toast.error('Please select an order to review')
                      return
                    }
                    if (reviewComment.length < 5) {
                      toast.error('Comment must be at least 5 characters long')
                      return
                    }
                    const fd = new FormData()
                    fd.append('product', product.id)
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
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedOrderId(e.target.value)}
                        className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition"
                      >
                        <option value="">-- Select an eligible order --</option>
                        {eligibleOrders.map((ord: any) => (
                          <option key={ord._id} value={ord._id}>
                            Order #{ord._id.slice(-6)} ({new Date(ord.createdAt).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Guest inputs (if not logged in) */}
                  {typeof window !== 'undefined' && !localStorage.getItem('accessToken') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1.5 text-gray-700">Full Name</label>
                        <Input
                          type="text"
                          value={guestFullName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGuestFullName(e.target.value)}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1.5 text-gray-700">Email Address</label>
                        <Input
                          type="email"
                          value={guestEmail}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGuestEmail(e.target.value)}
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Rating Selector */}
                  <div>
                    <label className="block text-sm mb-1.5 text-gray-700">Rating</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 focus:outline-none"
                        >
                          <Star
                            size={20}
                            fill={star <= reviewRating ? '#FBBF24' : 'none'}
                            stroke={star <= reviewRating ? '#FBBF24' : '#D1D5DB'}
                            strokeWidth={1.5}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-sm mb-1.5 text-gray-700">Review</label>
                    <Textarea
                      rows={4}
                      value={reviewComment}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewComment(e.target.value)}
                      placeholder="Write your experience with this product..."
                      required
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm mb-1.5 text-gray-700">Attach Photos (Optional)</label>
                    <input
                      id="review-images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReviewImages(e.target.files)}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Submit Review
                  </Button>
                </form>
              </div>
            )}
          </div>

          {/* Featured/Related Products */}
          <div className="mt-16">
            <FeaturedProducts />
          </div>
        </div>

        {/* Image Zoom Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
          <DialogContent className="max-w-4xl w-full p-4 bg-transparent border-none shadow-none flex flex-col items-center justify-center">
            <div className="relative w-full h-[70vh] overflow-hidden flex items-center justify-center">
              {mainImage && (
                <div
                  className="relative w-full h-full transition-transform duration-200 ease-out flex items-center justify-center"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <Image
                    src={cloudinaryOptimize(mainImage, 1600) || mainImage}
                    alt={product.name}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
            </div>

            {/* Modal Controls */}
            <div className="flex items-center gap-4 mt-4 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="text-white hover:text-gray-300 disabled:opacity-40 p-1"
                aria-label="Zoom Out"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-white text-xs font-mono">{Math.round(zoomLevel * 100)}%</span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="text-white hover:text-gray-300 disabled:opacity-40 p-1"
                aria-label="Zoom In"
              >
                <Plus className="w-5 h-5" />
              </button>
              <div className="w-px h-4 bg-white/20 mx-1" />
              <button
                type="button"
                onClick={closeModal}
                className="text-white text-xs hover:underline"
              >
                Close
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </>
  )
}