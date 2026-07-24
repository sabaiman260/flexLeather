'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/cart-context'
import { ShoppingCart } from 'lucide-react'
import { apiFetch, BackendProduct } from '@/lib/api'
import { pushGtmEcommerceEvent } from '@/lib/gtm'

type UIProduct = {
  id: string
  name: string
  price: number
  image: string
  discount?: number
  categorySlug?: string
  colors?: string[]
  sizes?: string[]
  stock?: number
}

export default function ShopPage() {
  const searchParams = useSearchParams()
  const categorySlug = searchParams.get('category')
  const queryParam = searchParams.get('q')

  const [products, setProducts] = useState<UIProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  const { addToCart } = useCart()
  const router = useRouter()

  const categories = [
    { label: 'Women', slug: 'women' },
    { label: 'Men', slug: 'men' },
    { label: 'Kids', slug: 'kids' },
    { label: 'Office', slug: 'office' },
    { label: 'Gift Ideas', slug: 'gift-ideas' },
  ]

  /* ---------------- FETCH PRODUCTS ---------------- */
  useEffect(() => {
    fetchProducts()
  }, [])

  // Extracted fetch function so we can call it when admin updates products
  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await apiFetch('/api/v1/products/getAll')
      const list: BackendProduct[] = res?.data || []

      const mapped: UIProduct[] = list.map(p => ({
        id: p._id,
        name: p.name,
        price: p.price,
        discount: p.discount || 0,
        image:
          Array.isArray(p.imageUrls) && p.imageUrls.length > 0
            ? p.imageUrls[0]
            : '/placeholder.jpg',
         categorySlug:
          typeof p.category === 'object' && p.category?.slug
            ? p.category.slug
            : typeof p.category === 'object' && p.category?.name
            ? p.category.name.toLowerCase().replace(/\s+/g, '-')
            : undefined,
        colors: p.colors || [],
        sizes: p.sizes || []
        ,
        stock: typeof p.stock === 'number' ? p.stock : 0
      }))

      setProducts(mapped)
    } catch (err) {
      console.error('Failed to load products', err)
    } finally {
      setLoading(false)
    }
  }

  // Listen for admin changes (storage event) and refetch products when flagged
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'products_last_updated') {
        fetchProducts()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    if (categorySlug) setActiveCategory(categorySlug)
  }, [categorySlug])

  const baseProducts = useMemo(
    () =>
      activeCategory
        ? products.filter(p => p.categorySlug === activeCategory)
        : products,
    [products, activeCategory]
  )

  const maxPrice = useMemo(
    () => baseProducts.reduce((m, p) => Math.max(m, p.price || 0), 0),
    [baseProducts]
  )

  const sliderMax = Math.max(500, Math.ceil(maxPrice))

  useEffect(() => {
    if (priceRange[1] === 500 && sliderMax > 500) {
      setPriceRange([0, sliderMax])
    }
  }, [sliderMax])

  /* ---------------- FINAL FILTER ---------------- */
  const filteredProducts = useMemo(() => {
    return baseProducts.filter(p => {
      const q = queryParam?.toLowerCase() || ''
      const priceMatch =
        p.price >= priceRange[0] && p.price <= priceRange[1]
      const searchMatch = !q || p.name.toLowerCase().includes(q)

      return priceMatch && searchMatch
    })
  }, [baseProducts, priceRange, queryParam])

  // Push view_item_list (shop listing) whenever filtered products change
  useEffect(() => {
    if (!filteredProducts || filteredProducts.length === 0) return
    try {
      pushGtmEcommerceEvent('view_item_list', {
        actionField: {
          id: `list_${Date.now()}`,
          value: filteredProducts.reduce((s, p) => s + (p.price || 0), 0),
          revenue: filteredProducts.reduce((s, p) => s + (p.price || 0), 0),
          source: typeof window !== 'undefined' ? window.location.pathname : null
        },
        items: filteredProducts.map(p => ({
          item_id: p.id,
          item_name: p.name,
          price: p.price
        }))
      })
    } catch (err) {
      // ignore
    }
  }, [filteredProducts])

  return (
    <>
      <Header />

      <main className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-12">

          <h1 className="text-4xl font-serif mb-10 capitalize">
            {activeCategory
              ? activeCategory.replace('-', ' ')
              : 'All Products'}
          </h1>

          <Suspense>
            {/* Mobile filter toggle */}
            <div className="md:hidden mb-4">
              <button
                onClick={() => setShowFilters(v => !v)}
                className="flex items-center gap-2 text-sm border border-border px-4 py-2 rounded"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M11 12h2" /></svg>
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

              {/* FILTER SIDEBAR */}
              <aside className={`md:col-span-1 ${showFilters ? 'block' : 'hidden'} md:block`}>

                {/* CATEGORY LIST */}
                <h3 className="text-sm font-light tracking-wide mb-4 uppercase opacity-75">
                  Category
                </h3>

                <div className="space-y-2 mb-10">
                  <button
                    type="button"
                    onClick={() => { setActiveCategory(''); setShowFilters(false) }}
                    className={`block text-sm font-light transition ${
                      activeCategory === ''
                        ? 'text-accent font-semibold'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    All
                  </button>

                  {categories.map(cat => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => { setActiveCategory(cat.slug); setShowFilters(false) }}
                      className={`block text-sm font-light transition ${
                        activeCategory === cat.slug
                          ? 'text-accent font-semibold'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* PRICE FILTER */}
                <h3 className="text-sm font-light tracking-wide mb-4 uppercase opacity-75">
                  Price
                </h3>

                <input
                  type="range"
                  min={0}
                  max={sliderMax}
                  value={priceRange[1]}
                  onChange={e =>
                    setPriceRange([0, Number(e.target.value)])
                  }
                  className="w-full"
                />

                <p className="text-xs opacity-60 mt-2">
                  PKR 0 – PKR {priceRange[1].toLocaleString()}
                </p>

              </aside>

              {/* PRODUCTS GRID */}
              <section className="md:col-span-3">
                {loading ? (
                  <div className="flex justify-center items-center py-24">
                    <div className="w-10 h-10 border-4 border-muted border-t-foreground rounded-full animate-spin" />
                  </div>
                ) : (
                <>
                <p className="mb-6 text-sm opacity-60">
                  Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                  {filteredProducts.map(p => (
                    <Link
                      key={p.id}
                      href={`/products/${p.id}`}
                      className="group flex flex-col h-full"
                    >
                      <div className="relative overflow-hidden bg-muted aspect-square mb-4 p-0 flex items-center justify-center">
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                        {p.discount && p.discount > 0 ? (
                          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {p.discount}% OFF
                          </div>
                        ) : (!p.stock || p.stock <= 0) ? (
                          <div className="absolute inset-0 bg-black/30 flex items-start justify-end p-2">
                            <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">SOLD OUT</div>
                          </div>
                        ) : null}
                      </div>

                      <h3 className="text-sm font-light tracking-wide group-hover:text-accent transition">
                        {p.name}
                      </h3>

                      <div className="text-sm mt-2">
                        {p.discount && p.discount > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground line-through">PKR {p.price.toLocaleString()}</span>
                            <span className="font-serif text-lg text-red-600">PKR {Math.round(p.price * (1 - (p.discount || 0) / 100)).toLocaleString()}</span>
                          </div>
                        ) : (
                          <p className="font-serif text-lg">PKR {p.price.toLocaleString()}</p>
                        )}
                      </div>

                      <Button
                        size="sm"
                        className={`w-full mt-auto bg-primary hover:bg-primary/90 text-primary-foreground`}
                        onClick={e => {
                          e.preventDefault()
                          if (!p.stock || p.stock <= 0) return

                          // If product has options, redirect to product page
                          if ((p.colors && p.colors.length > 0) || (p.sizes && p.sizes.length > 0)) {
                            window.location.href = `/products/${p.id}`
                            return
                          }

                          addToCart({
                            id: p.id,
                            name: p.name,
                            price: p.price,
                            image: p.image,
                          })
                          router.push('/cart')
                        }}
                        disabled={!p.stock || p.stock <= 0}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {(!p.stock || p.stock <= 0) ? 'Sold Out' : 'Add to Cart'}
                      </Button>
                    </Link>
                  ))}
                </div>
                </>
                )}
              </section>

            </div>
          </Suspense>
        </div>
      </main>

      <Footer />
    </>
  )
}
