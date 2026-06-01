'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/cart-context'
import { ShoppingCart } from 'lucide-react'
import { apiFetch, BackendProduct } from '@/lib/api'

type UIProduct = { id: string; name: string; price: number; image: string; category?: string };

type FeaturedProductsProps = {
  category?: string
  currentProductId?: string
  title?: string
}

export default function FeaturedProducts({ category, currentProductId, title }: FeaturedProductsProps) {
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
          image: (p.imageUrls && p.imageUrls[0]) || '/placeholder.jpg',
          category: (typeof p.category === 'object' && p.category?.name) || undefined,
        }))
        const filtered = category
          ? mapped.filter((p) => p.category === category && p.id !== currentProductId)
          : mapped.filter((p) => p.id !== currentProductId)

        setProducts(filtered.slice(0, 8))
      } catch {}
    })()
  }, [category, currentProductId])

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <h2 className="text-center text-3xl md:text-4xl font-serif font-light tracking-wide mb-12">
          {title || (category ? 'Related Products' : 'Featured Collection')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`} className="group">
              <div className="relative overflow-hidden bg-muted aspect-square mb-4 p-0 flex items-center justify-center">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <h3 className="text-sm font-light tracking-wide group-hover:text-accent transition">
                {product.name}
              </h3>
              {product.category && (
                <p className="text-xs text-muted-foreground mb-3">{product.category}</p>
              )}
              <p className="font-serif text-lg mb-4">PKR {product.price.toLocaleString()}</p>
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  // Redirect to product page for selection instead of direct add
                  window.location.href = `/products/${product.id}`
                }}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="sm"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
