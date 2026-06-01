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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Dialog, DialogOverlay, DialogContent } from '@/components/ui/dialog'

type Product = {
  id: string
  name: string
  price: number
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
  comment?: string
  user?: { userName: string }
  imageUrls?: string[]
}

export default function ProductDetail() {
  const params = useParams()
  const productId = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [page, setPage] = useState<number>(1)
  const [limit] = useState<number>(5)
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
          category: p.category?.name || p.category?.type,
          description: p.description,
          specs: p.specs || [],
          images: urls.length ? urls : ['/placeholder.jpg'],
          colors: p.colors || [],
          sizes: p.sizes || []
        }
        setProduct(mapped)
      } catch {}
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

    if (product.colors && product.colors.length > 0 && !selectedColor) {
      setError('Please select a color')
      return
    }
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      setError('Please select a size')
      return
    }

    setError(null)
    addToCart({ 
      id: product.id, 
      name: product.name, 
      price: product.price, 
      image: product.images[0] || '/placeholder.jpg',
      selectedColor: selectedColor,
      selectedSize: selectedSize,
      availableColors: product.colors,
      availableSizes: product.sizes
    }, quantity)
    router.push('/cart')
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
          {/* Breadcrumb */}
          <div className="flex gap-2 text-sm mb-8 opacity-60">
            <Link href="/" className="hover:opacity-100">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:opacity-100">Shop</Link>
            <span>/</span>
            <span>{product.category}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Product Images */}
            <div>
              <div 
                className="relative overflow-hidden bg-white border border-border rounded-3xl mb-4 flex items-center justify-center cursor-pointer aspect-square"
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
                <p className="text-xs opacity-60 mb-2">{product.category}</p>
                <h1 className="text-3xl md:text-4xl font-serif font-light tracking-wide mb-4">
                  {product.name}
                </h1>
                <p className="text-2xl font-serif">PKR {product.price.toLocaleString()}</p>
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
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
              </div>

              {/* Reviews */}
              <div className="mt-12 border-t border-border pt-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div className="flex rounded-full bg-muted border border-border p-1">
                    <button
                      type="button"
                      onClick={() => setReviewTab('reviews')}
                      className={`px-4 py-2 rounded-full transition ${reviewTab === 'reviews' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                      Reviews
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewTab('submit')}
                      className={`px-4 py-2 rounded-full transition ${reviewTab === 'submit' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                      Submit Review
                    </button>
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{reviewTab === 'reviews' ? 'Read customer feedback' : 'Share your experience'}</p>
                </div>

                {reviewTab === 'reviews' ? (
                  <>
                    {loadingInitial ? (
                      <p className="text-sm opacity-70">Loading reviews...</p>
                    ) : reviews.length === 0 ? (
                      <p className="text-sm opacity-70">No reviews yet.</p>
                    ) : (
                      <div className="space-y-6">
                        {reviews.map(r => (
                          <div key={r._id} className="border border-border p-4">
                            <p className="text-sm font-medium">{r.user?.userName || 'Anonymous'}</p>
                            <div className="flex items-center gap-1 text-yellow-500 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} size={14} fill={i < r.rating ? 'currentColor' : 'none'} className={i < r.rating ? '' : 'text-gray-300'} />
                              ))}
                            </div>
                            {r.comment && <p className="text-sm opacity-80 mt-2">{r.comment}</p>}
                            {r.imageUrls && r.imageUrls.length > 0 && (
                              <div className="grid grid-cols-4 gap-2 mt-3">
                                {r.imageUrls.map((u, i) => (
                                  <div key={i} className="relative aspect-square">
                                    <Image src={u} alt={`review image ${i + 1}`} fill className="object-cover" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {(!loadingInitial && reviews.length > 0 && reviews.length < totalReviews) && (
                      <div className="mt-4 flex justify-center">
                        <button
                          onClick={async () => {
                            const nextPage = page + 1
                            setLoadingMore(true)
                            try {
                              const resp = await fetch(`${API_BASE_URL}/api/v1/reviews/product/${productId}?page=${nextPage}&limit=${limit}`, {
                                method: 'GET',
                                credentials: 'include'
                              })
                              if (resp.ok) {
                                const data = await resp.json().catch(() => ({}))
                                const payload = data?.data || {}
                                const more: Review[] = payload.reviews || []
                                setReviews(prev => [...prev, ...more])
                                setPage(nextPage)
                                setTotalReviews(payload.total || totalReviews)
                              }
                            } catch (err) {
                              console.error('Failed to load more reviews', err)
                            } finally {
                              setLoadingMore(false)
                            }
                          }}
                          className="px-4 py-2 border border-border rounded"
                          aria-label="Load more reviews"
                        >
                          {loadingMore ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                              Loading...
                            </span>
                          ) : (
                            'Load More'
                          )}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-6">
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault()

                        const token = localStorage.getItem('accessToken')

                        if (token) {
                          if (!selectedOrderId) {
                            toast.error('Please select an order to review')
                            return
                          }
                        }

                        if (reviewComment.length < 5) {
                          toast.error('Comment must be at least 5 characters long')
                          return
                        }

                        const fd = new FormData()
                        fd.append('product', productId)
                        if (token) {
                          if (selectedOrderId) fd.append('orderId', selectedOrderId)
                        } else {
                          fd.append('orderId', 'guest')
                        }
                        fd.append('rating', String(reviewRating))
                        fd.append('comment', reviewComment)

                        if (!token) {
                          if (guestFullName) fd.append('fullName', guestFullName)
                          if (guestEmail) fd.append('email', guestEmail)
                        }

                        if (reviewImages) {
                          for (let i = 0; i < reviewImages.length; i++) {
                            fd.append('images', reviewImages[i])
                          }
                        }

                        try {
                          const res = await fetch(`${API_BASE_URL}/api/v1/reviews/`, {
                            method: 'POST',
                            credentials: 'include',
                            body: fd,
                          })

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
                          const fileInput = document.getElementById('review-images') as HTMLInputElement
                          if (fileInput) fileInput.value = ''
                        } catch (err: any) {
                          toast.error(err.message || 'Failed to submit review')
                        }
                      }}
                      className="space-y-4"
                    >
                      {localStorage.getItem('accessToken') && eligibleOrders.length > 0 && (
                        <div>
                          <label className="block text-sm mb-2">Select Order to Review</label>
                          <select
                            value={selectedOrderId}
                            onChange={(e) => setSelectedOrderId(e.target.value)}
                            className="w-full border border-border px-3 py-2"
                            required
                          >
                            <option value="">Choose an order...</option>
                            {eligibleOrders.map(order => (
                              <option key={order._id} value={order._id}>
                                Order #{order._id.slice(-6)} - {new Date(order.createdAt).toLocaleDateString()} - PKR {order.totalAmount.toLocaleString()}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {localStorage.getItem('accessToken') && eligibleOrders.length === 0 && (
                        <div className="text-sm text-muted-foreground p-3 bg-muted rounded">
                          No eligible orders found. You can only review products from orders that are paid and delivered.
                        </div>
                      )}

                      {!localStorage.getItem('accessToken') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            placeholder="Your name (optional)"
                            value={guestFullName}
                            onChange={(e) => setGuestFullName(e.target.value)}
                          />
                          <Input
                            placeholder="Your email (optional)"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select
                          name="rating"
                          className="border border-border px-3 py-2"
                          value={reviewRating}
                          onChange={(e) => setReviewRating(Number(e.target.value))}
                        >
                          {[1,2,3,4,5].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <Input
                          id="review-images"
                          name="images"
                          type="file"
                          multiple
                          onChange={(e) => setReviewImages(e.target.files)}
                        />
                      </div>
                      <Textarea
                        name="comment"
                        placeholder="Share your experience"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                      />
                      <Button type="submit" className="bg-primary text-primary-foreground">Submit Review</Button>
                    </form>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>

      <FeaturedProducts category={product.category} currentProductId={product.id} title="Related Products" />

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
