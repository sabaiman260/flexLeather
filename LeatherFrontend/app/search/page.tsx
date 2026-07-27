"use client"
import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '@/components/header'
import Footer from '@/components/footer'
import Image from 'next/image'
import { apiFetch } from '@/lib/api'
import { searchProducts, getPopularTerms, SearchProduct } from '@/lib/search'
import { cloudinaryOptimize } from '@/lib/cloudinary'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/components/cart-context'

type UIProduct = {
  id: string
  name: string
  price: number
  image: string
  category?: string
  brand?: string
  tags?: string[]
  stock?: number
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams?.get('q') || ''
  const [products, setProducts] = useState<UIProduct[]>([])
  const [results, setResults] = useState<Array<{ product: UIProduct; score: number }>>([])
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()

  useEffect(() => {
    let mounted = true
    setLoading(true)
    apiFetch('/api/v1/products/getAll')
      .then((res) => {
        const items = (res?.data || []).map((p: any) => ({
          id: p._id,
          name: p.name,
          price: p.price,
          image: Array.isArray(p.imageUrls) && p.imageUrls.length ? p.imageUrls[0] : (p.images && p.images[0]) || '/placeholder.jpg',
          category: p.category?.name || (typeof p.category === 'string' ? p.category : ''),
          brand: p.brand || '',
          tags: p.tags || [],
          stock: typeof p.stock === 'number' ? p.stock : 0,
        }))
        if (mounted) setProducts(items)
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!q) {
      setResults([])
      return
    }
    const r = searchProducts(products as any, q, 200)
    // map to UIProduct typed results
    setResults(r.map(rr => ({ product: rr.product as UIProduct, score: rr.score })))
  }, [q, products])

  return (
    <>
      <Header />

      <main className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-serif mb-6">Search Results for "{q}"</h1>

          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="w-10 h-10 border-4 border-muted border-t-foreground rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm opacity-60">Showing {results.length} product{results.length !== 1 ? 's' : ''}</p>

              {results.length === 0 && (
                <div className="mt-6">
                  <p className="text-lg">No results found.</p>
                  <p className="text-sm text-slate-600 mt-2">Try different keywords, check spelling, or browse popular categories.</p>
                  <div className="mt-4 flex gap-2">
                    {getPopularTerms(products as any, 6).map(t => (
                      <button key={t} onClick={() => router.push(`/shop?q=${encodeURIComponent(t)}`)} className="px-3 py-1 bg-slate-100 rounded">{t}</button>
                    ))}
                  </div>
                </div>
              )}

              {results.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                  {results.map(r => (
                    <Link key={r.product.id} href={`/products/${r.product.id}`} className="group flex flex-col h-full border rounded overflow-hidden">
                      <div className="relative overflow-hidden bg-muted aspect-square mb-4 p-0 flex items-center justify-center">
                        <Image src={cloudinaryOptimize(r.product.image, 400) || r.product.image} alt={r.product.name} fill className="object-cover transition duration-500 group-hover:scale-105" />
                      </div>

                      <h3 className="text-sm font-light tracking-wide group-hover:text-accent transition">{r.product.name}</h3>

                      <div className="text-sm mt-2">
                        <p className="font-serif text-lg">PKR {r.product.price?.toLocaleString()}</p>
                      </div>

                      <Button
                        size="sm"
                        className={`w-full mt-auto bg-primary hover:bg-primary/90 text-primary-foreground`}
                        onClick={e => {
                          e.preventDefault()
                          if (!r.product.stock || r.product.stock <= 0) return
                          addToCart({ id: r.product.id, name: r.product.name, price: r.product.price, image: r.product.image })
                          router.push('/cart')
                        }}
                        disabled={!r.product.stock || r.product.stock <= 0}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {(!r.product.stock || r.product.stock <= 0) ? 'Sold Out' : 'Add to Cart'}
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
