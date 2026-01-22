'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/cart-context'
import { Heart, ShoppingCart } from 'lucide-react'
import { apiFetch, BackendProduct } from '@/lib/api'

type UIProduct = {
  id: string
  name: string
  price: number
  image: string
  categorySlug?: string
  colors?: string[]
  sizes?: string[]
}

export default function ShopPage() {
  const searchParams = useSearchParams()
  const categorySlug = searchParams.get('category')
  const queryParam = searchParams.get('q')

  const [products, setProducts] = useState<UIProduct[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [activeCategory, setActiveCategory] = useState<string>('')

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
    ;(async () => {
      try {
        const res = await apiFetch('/api/v1/products/getAll')
        const list: BackendProduct[] = res?.data || []

        const mapped: UIProduct[] = list.map(p => ({
          id: p._id,
          name: p.name,
          price: p.price,
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
        }))

        setProducts(mapped)
      } catch (err) {
        console.error('Failed to load products', err)
      }
    })()
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

  const toggleFavorite = (id: string) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

              {/* FILTER SIDEBAR */}
              <aside className="md:col-span-1">

                {/* CATEGORY LIST */}
                <h3 className="text-sm font-light tracking-wide mb-4 uppercase opacity-75">
                  Category
                </h3>

                <div className="space-y-2 mb-10">
                  <button
                    type="button"
                    onClick={() => setActiveCategory('')}
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
                      onClick={() => setActiveCategory(cat.slug)}
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
                <p className="mb-6 text-sm opacity-60">
                  Showing {filteredProducts.length} products
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {filteredProducts.map(p => (
                    <Link
                      key={p.id}
                      href={`/products/${p.id}`}
                      className="group"
                    >
                      <div className="relative aspect-square bg-muted overflow-hidden mb-4 p-0 flex items-center justify-center">
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />

                        <button
                          onClick={e => {
                            e.preventDefault()
                            toggleFavorite(p.id)
                          }}
                          className="absolute top-4 right-4 bg-white p-2 rounded-full"
                        >
                          <Heart
                            className={`w-5 h-5 ${
                              favorites.includes(p.id)
                                ? 'fill-accent text-accent'
                                : ''
                            }`}
                          />
                        </button>
                      </div>

                      <h3 className="text-sm font-light tracking-wide group-hover:text-accent transition">
                        {p.name}
                      </h3>

                      <p className="text-sm font-serif mt-2">
                        PKR {p.price.toLocaleString()}
                      </p>

                      <Button
                        size="sm"
                        className="w-full mt-4"
                        onClick={e => {
                          e.preventDefault()
                          
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
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {(p.colors && p.colors.length > 0) || (p.sizes && p.sizes.length > 0) 
                          ? 'Select Options' 
                          : 'Add to Cart'}
                      </Button>
                    </Link>
                  ))}
                </div>
              </section>

            </div>
          </Suspense>
        </div>
      </main>

      <Footer />
    </>
  )
}
