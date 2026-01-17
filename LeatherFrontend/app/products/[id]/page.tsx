'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/cart-context'
import { Heart, ShoppingCart, Minus, Plus, Star } from 'lucide-react'
import { apiFetch, API_BASE_URL } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

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
  const [quantity, setQuantity] = useState(1)
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const { addToCart } = useCart()
  const router = useRouter()

  // Review form state
  const [reviewRating, setReviewRating] = useState<number>(5)
  const [reviewComment, setReviewComment] = useState<string>('')
  const [reviewImages, setReviewImages] = useState<FileList | null>(null)
  const [eligibleOrders, setEligibleOrders] = useState<any[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string>('')

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
        const res2 = await apiFetch(`/api/v1/reviews/product/${productId}`)
        setReviews(res2?.data || [])
      } catch {}

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
      image: product.images[0] ?? '/placeholder.jpg',
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
              <div className="relative overflow-hidden bg-muted aspect-square mb-4">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                  loading="eager"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(0,4).map((img, i) => (
                  <div key={i} className="relative overflow-hidden bg-muted aspect-square cursor-pointer hover:opacity-75">
                    <Image
                      src={img}
                      alt={`${product.name} view ${i+1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
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
                <p className="text-2xl font-serif">${product.price.toFixed(2)}</p>
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

                <Button
                  onClick={() => setIsFavorite(!isFavorite)}
                  variant="outline"
                  className="w-full"
                >
                  <Heart className={`w-5 h-5 mr-2 ${isFavorite ? 'fill-current text-accent' : ''}`} />
                  {isFavorite ? 'Saved' : 'Save to Favorites'}
                </Button>
              </div>

              {/* Reviews */}
              <div className="mt-12 border-t border-border pt-8">
                <h3 className="text-lg font-serif mb-4">Customer Reviews</h3>
                {reviews.length === 0 && (
                  <p className="text-sm opacity-70">No reviews yet.</p>
                )}
                <div className="space-y-6">
                  {reviews.map(r => (
                    <div key={r._id} className="border border-border p-4">
                      <p className="text-sm font-medium">{r.user?.userName || 'Anonymous'}</p>
                      <div className="flex items-center gap-1 text-yellow-500 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={14} fill={i < r.rating ? "currentColor" : "none"} className={i < r.rating ? "" : "text-gray-300"} />
                        ))}
                      </div>
                      {r.comment && <p className="text-sm opacity-80 mt-2">{r.comment}</p>}
                      {r.imageUrls && r.imageUrls.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mt-3">
                          {r.imageUrls.map((u, i) => (
                            <div key={i} className="relative aspect-square">
                              <Image src={u} alt={`review image ${i+1}`} fill className="object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <h4 className="text-md font-serif mt-8 mb-2">Write a review</h4>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()

                    if (!selectedOrderId) {
                      toast.error('Please select an order to review')
                      return
                    }

                    if (reviewComment.length < 5) {
                      toast.error('Comment must be at least 5 characters long')
                      return
                    }

                    const fd = new FormData()
                    fd.append('product', productId)
                    fd.append('orderId', selectedOrderId)
                    fd.append('rating', String(reviewRating))
                    fd.append('comment', reviewComment)

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
                      // Reset file input
                      const fileInput = document.getElementById('review-images') as HTMLInputElement
                      if (fileInput) fileInput.value = ''
                    } catch (err: any) {
                      toast.error(err.message || 'Failed to submit review')
                    }
                  }}
                  className="space-y-3"
                >
                  {eligibleOrders.length > 0 && (
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

                  {eligibleOrders.length === 0 && (
                    <div className="text-sm text-muted-foreground p-3 bg-muted rounded">
                      No eligible orders found. You can only review products from orders that are paid and delivered.
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

              {/* Trust Badges */}
              <div className="mt-12 space-y-3 text-xs opacity-75 border-t border-border pt-8">
                <p>✓ Genuine leather, handcrafted quality</p>
                <p>✓ Free shipping on orders over PKR 25,000</p>
                <p>✓ 30-day money-back guarantee</p>
                <p>✓ Secure checkout</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
