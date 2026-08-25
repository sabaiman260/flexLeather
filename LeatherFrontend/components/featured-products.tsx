'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cloudinaryOptimize } from '@/lib/cloudinary'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/cart-context'
import { ShoppingCart } from 'lucide-react'
import { apiFetch, BackendProduct } from '@/lib/api'

type UIProduct = { id: string; slug?: string; name: string; price: number; discount?: number; image: string; category?: string; stock?: number; madeToOrder?: boolean };

type FeaturedProductsProps = {
  category?: string
  currentProductId?: string
  currentProductName?: string
  title?: string
  showCategory?: boolean
}

function extractKeywords(name: string): string[] {
  const stopWords = new Set(['leather', 'premium', 'genuine', 'classic', 'luxury', 'the', 'a', 'an', 'and', 'or', 'for', 'of', 'with', 'in'])
  return name.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w))
}

export default function FeaturedProducts({ category, currentProductId, currentProductName, title, showCategory = false }: FeaturedProductsProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [products, setProducts] = useState<UIProduct[]>([])
  const { addToCart } = useCart()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    ;(async () => {
      try {
        // Fetch only 8 products for featured section with pagination
        const res = await apiFetch('/api/v1/products/getAll?page=1&limit=8')
        // Handle new response format with pagination wrapper
        const list: BackendProduct[] = res?.data?.products || res?.data || []
        const mapped: UIProduct[] = list.map(p => ({
          id: p._id,
          slug: p.slug || undefined,
          name: p.name,
          price: p.price,
          discount: p.discount,
          image: (p.imageUrls && p.imageUrls[0]) || '/placeholder.jpg',
          stock: typeof p.stock === 'number' ? p.stock : 0,
          category: (typeof p.category === 'object' && p.category?.name) || undefined,
          madeToOrder: Boolean(p.madeToOrder),
        }))

        const others = mapped.filter(p => p.id !== currentProductId)

        if (currentProductName) {
          const keywords = extractKeywords(currentProductName)
          const keywordMatch = others.filter(p =>
            keywords.some(kw => p.name.toLowerCase().includes(kw))
          )
          if (keywordMatch.length > 0) {
            setProducts(keywordMatch.slice(0, 8))
            return
          }
        }

        const filtered = category
          ? others.filter(p => p.category === category)
          : others
        setProducts(filtered.slice(0, 8))
      } catch {}
    })()
  }, [isMounted, category, currentProductId, currentProductName])

  if (!isMounted) {
    return (
      <section className="bg-background py-16 md:py-24">
        <div className="w-full max-w-7xl mx-auto px-4 overflow-hidden block">
          <div className="h-10 w-48 bg-muted rounded mx-auto mb-12 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="aspect-square w-full bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                <div className="h-9 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="w-full max-w-7xl mx-auto px-4 overflow-hidden block">
        <h2 className="text-center text-3xl md:text-4xl font-serif font-light tracking-wide mb-12">
          {title || (category ? 'Related Products' : 'Featured Collection')}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
          {products.map((product, idx) => {
            const hasDiscount = product.discount && product.discount > 0
            const discountedPrice = hasDiscount
              ? Math.round(product.price * (1 - product.discount! / 100))
              : product.price
            const isSoldOut = typeof product.stock === 'number' && product.stock <= 0
            return (
              <Link key={product.id} href={`/products/${product.slug || product.id}`} className="group flex flex-col h-full">
                <div className="relative overflow-hidden bg-muted aspect-square mb-4 flex items-center justify-center">
                  <Image
                    src={cloudinaryOptimize(product.image, 800) || product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    priority={idx < 4}
                    loading={idx < 4 ? 'eager' : 'lazy'}
                  />
                  {hasDiscount && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {product.discount}% OFF
                    </div>
                  )}
                  {!hasDiscount && isSoldOut && (
                    <div className="absolute inset-0 bg-black/30 flex items-start justify-end p-2">
                      <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">SOLD OUT</div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col flex-grow">
                  <h3 className="text-sm font-light tracking-wide group-hover:text-accent transition">
                    {product.name}
                  </h3>
                  {product.category && showCategory && (
                    <p className="text-xs text-muted-foreground mb-2">{product.category}</p>
                  )}
                  <div className="mb-4">
                    {hasDiscount ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground line-through">PKR {product.price.toLocaleString()}</span>
                        <span className="font-serif text-lg text-red-600">PKR {discountedPrice.toLocaleString()}</span>
                      </div>
                    ) : (
                      <p className="font-serif text-lg">PKR {product.price.toLocaleString()}</p>
                    )}
                  </div>
                  <Button
                    onClick={(e) => {
                      e.preventDefault()
                      if (isSoldOut) return
                      window.location.href = `/products/${product.slug || product.id}`
                    }}
                    className={'w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-auto'}
                    size="sm"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {isSoldOut ? 'Sold Out' : 'Add to Cart'}
                  </Button>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="flex justify-center mt-12">
          <Link href="/shop">
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base"
              size="lg"
            >
              View All Products
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
