'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/cart-context'
import { ShoppingCart } from 'lucide-react'
import { apiFetch, BackendProduct } from '@/lib/api'

type UIProduct = { id: string; name: string; price: number; discount?: number; image: string; category?: string };

type FeaturedProductsProps = {
  category?: string
  currentProductId?: string
  currentProductName?: string
  title?: string
}

// Extract meaningful keywords from a product name (ignores generic words)
function extractKeywords(name: string): string[] {
  const stopWords = new Set(['leather', 'premium', 'genuine', 'classic', 'luxury', 'the', 'a', 'an', 'and', 'or', 'for', 'of', 'with', 'in'])
  return name.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w))
}

export default function FeaturedProducts({ category, currentProductId, currentProductName, title }: FeaturedProductsProps) {
  const [products, setProducts] = useState<UIProduct[]>([])
  const { addToCart } = useCart()

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/api/v1/products/getAll')
        const list: BackendProduct[] = res?.data || []
        const mapped: UIProduct[] = list.map(p => ({
          id: p._id,
          name: p.name,
          price: p.price,
          discount: p.discount,
          image: (p.imageUrls && p.imageUrls[0]) || '/placeholder.jpg',
          category: (typeof p.category === 'object' && p.category?.name) || undefined,
        }))

        const others = mapped.filter(p => p.id !== currentProductId)

        if (currentProductName) {
          const keywords = extractKeywords(currentProductName)
          // Filter purely by name keyword match — belt → belts, wallet → wallets
          const keywordMatch = others.filter(p =>
            keywords.some(kw => p.name.toLowerCase().includes(kw))
          )
          if (keywordMatch.length > 0) {
            setProducts(keywordMatch.slice(0, 8))
            return
          }
        }

        // Fallback: same category if no keyword matches
        const filtered = category
          ? others.filter(p => p.category === category)
          : others
        setProducts(filtered.slice(0, 8))
      } catch {}
    })()
  }, [category, currentProductId, currentProductName])

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <h2 className="text-center text-3xl md:text-4xl font-serif font-light tracking-wide mb-12">
          {title || (category ? 'Related Products' : 'Featured Collection')}
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {products.map((product) => {
            const hasDiscount = product.discount && product.discount > 0
            const discountedPrice = hasDiscount
              ? Math.round(product.price * (1 - product.discount! / 100))
              : product.price
            return (
            <Link key={product.id} href={`/products/${product.id}`} className="group flex flex-col h-full">
              <div className="relative overflow-hidden bg-muted aspect-square mb-4 p-0 flex items-center justify-center">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                {hasDiscount && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {product.discount}% OFF
                  </div>
                )}
              </div>
              <div className="flex flex-col flex-grow">
                <h3 className="text-sm font-light tracking-wide group-hover:text-accent transition">
                  {product.name}
                </h3>
                {product.category && (
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
                    window.location.href = `/products/${product.id}`
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-auto"
                  size="sm"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </Link>
            )
          })}
        </div>

        {/* View All Products Button */}
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
