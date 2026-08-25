'use client'

import { useMemo, useState, useEffect } from 'react'
import Image from 'next/image'
import { cloudinaryOptimize } from '@/lib/cloudinary'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/cart-context'
import { ShoppingCart } from 'lucide-react'
import { apiFetch, BackendProduct } from '@/lib/api'

type UIProduct = {
  id: string
  slug?: string
  name: string
  price: number
  image: string
  discount?: number
  categorySlug?: string
  colors?: string[]
  sizes?: string[]
  stock?: number
  madeToOrder?: boolean
}

type ShopClientProps = {
  initialProducts: UIProduct[]
  initialPagination: {
    page: number
    totalPages: number
    totalProducts: number
    hasMore: boolean
  }
}

export default function ShopClient({ initialProducts, initialPagination }: ShopClientProps) {
  const searchParams = useSearchParams()
  const categorySlug = searchParams?.get('category')
  const queryParam = searchParams?.get('q')
  const router = useRouter()

  const [products, setProducts] = useState<UIProduct[]>(initialProducts)
  const [pagination, setPagination] = useState(initialPagination)
  const [loading, setLoading] = useState(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const { addToCart } = useCart()

  const categories = [
    { label: 'Women', slug: 'women' },
    { label: 'Men', slug: 'men' },
    { label: 'Kids', slug: 'kids' },
    { label: 'Office', slug: 'office' },
    { label: 'Gift Ideas', slug: 'gift-ideas' },
  ]

  useEffect(() => {
    if (categorySlug) setActiveCategory(categorySlug)
  }, [categorySlug])

  // Fetch more products when page changes
  const fetchProducts = async (page: number) => {
    try {
      setLoading(true)
      const res = await apiFetch(`/api/v1/products/getAll?page=${page}&limit=12`)
      const list: BackendProduct[] = res?.data?.products || []
      const paginationData = res?.data?.pagination || {}

      const mapped: UIProduct[] = list.map(p => ({
        id: p._id,
        slug: p.slug || undefined,
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
        sizes: p.sizes || [],
        stock: typeof p.stock === 'number' ? p.stock : 0,
        madeToOrder: Boolean(p.madeToOrder),
      }))

      setProducts(mapped)
      setPagination(paginationData)
    } catch (err) {
      console.error('Failed to load products', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchProducts(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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

  useEffect(() => {
    if (activeCategory) {
      setPriceRange([0, sliderMax])
    }
  }, [activeCategory, sliderMax])

  const filteredProducts = useMemo(() => {
    return baseProducts.filter(p => {
      const q = queryParam?.toLowerCase() || ''
      const priceMatch =
        p.price >= priceRange[0] && p.price <= priceRange[1]
      const searchMatch = !q || p.name.toLowerCase().includes(q)

      return priceMatch && searchMatch
    })
  }, [baseProducts, priceRange, queryParam])

  return (
    <main className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">

        <h1 className="text-4xl font-serif mb-10 capitalize">
          {activeCategory
            ? activeCategory.replace('-', ' ')
            : 'All Products'}
        </h1>

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

            <h3 className="text-sm font-light tracking-wide mb-4 uppercase opacity-75">
              Price
            </h3>

            <input
              type="range"
              min={0}
              max={sliderMax}
              value={priceRange[1]}
              onChange={e => {
                setPriceRange([0, Number(e.target.value)])
                setActiveCategory('')
              }}
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
              Showing {filteredProducts.length} of {pagination.totalProducts} product{pagination.totalProducts !== 1 ? 's' : ''}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
              {filteredProducts.map((p, idx) => (
                <Link
                  key={p.id}
                  href={`/products/${p.slug || p.id}`}
                  className="group flex flex-col h-full"
                >
                  <div className="relative overflow-hidden bg-muted aspect-square mb-4 p-0 flex items-center justify-center">
                    <Image
                      src={cloudinaryOptimize(p.image, 400) || p.image}
                      alt={p.name}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      priority={idx < 6}
                      loading={idx < 6 ? 'eager' : 'lazy'}
                    />
                    {p.discount && p.discount > 0 && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {p.discount}% OFF
                      </div>
                    )}
                    {(!p.discount || p.discount <= 0) && (!p.stock || p.stock <= 0) && (
                      <div className="absolute inset-0 bg-black/30 flex items-start justify-end p-2">
                        <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">SOLD OUT</div>
                      </div>
                    )}
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

                      if ((p.colors && p.colors.length > 0) || (p.sizes && p.sizes.length > 0)) {
                        window.location.href = `/products/${p.slug || p.id}`
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

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                
                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages || loading}
                >
                  Next
                </Button>
              </div>
            )}
            </>
            )}
          </section>

        </div>
      </div>
    </main>
  )
}
