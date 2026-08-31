'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { cloudinaryOptimize } from '@/lib/cloudinary'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/cart-context'
import { ShoppingCart, ChevronDown } from 'lucide-react'
import { apiFetch, BackendProduct, CategoryItem } from '@/lib/api'

type UIProduct = {
  id: string
  slug?: string
  name: string
  price: number
  image: string
  discount?: number
  categorySlug?: string
  parentCategorySlug?: string
  colors?: string[]
  sizes?: string[]
  stock?: number
  madeToOrder?: boolean
}

type SubcategoryItem = {
  _id: string
  label: string
  slug: string
}

type CategoryGroup = {
  _id: string
  label: string
  slug: string
  subcategories: SubcategoryItem[]
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

const DEFAULT_CATEGORY_GROUPS: CategoryGroup[] = [
  {
    _id: 'default-women',
    label: 'Women',
    slug: 'women',
    subcategories: [
      { _id: 'default-w-1', label: 'Handbags', slug: 'handbags' },
      { _id: 'default-w-2', label: 'Wallets', slug: 'wallets' },
      { _id: 'default-w-3', label: 'Accessories', slug: 'accessories' },
      { _id: 'default-w-4', label: 'Tote Bags', slug: 'tote-bags' },
      { _id: 'default-w-5', label: 'Jackets', slug: 'jackets' },
    ]
  },
  {
    _id: 'default-men',
    label: 'Men',
    slug: 'men',
    subcategories: [
      { _id: 'default-m-1', label: 'Wallets', slug: 'wallets' },
      { _id: 'default-m-2', label: 'Belts', slug: 'belts' },
      { _id: 'default-m-3', label: 'Jackets', slug: 'jackets' },
      { _id: 'default-m-4', label: 'Messenger Bags', slug: 'messenger-bags' },
      { _id: 'default-m-5', label: 'Briefcases', slug: 'briefcases' },
    ]
  },
  {
    _id: 'default-gifts',
    label: 'Gift Ideas',
    slug: 'gift-ideas',
    subcategories: [
      { _id: 'default-g-1', label: 'For Him', slug: 'for-him' },
      { _id: 'default-g-2', label: 'For Her', slug: 'for-her' },
      { _id: 'default-g-3', label: 'Personalized', slug: 'personalized' },
      { _id: 'default-g-4', label: 'Keychains', slug: 'keychains' },
    ]
  },
  {
    _id: 'default-travel',
    label: 'Travel',
    slug: 'travel',
    subcategories: [
      { _id: 'default-t-1', label: 'Duffel Bags', slug: 'duffel-bags' },
      { _id: 'default-t-2', label: 'Passport Covers', slug: 'passport-covers' },
      { _id: 'default-t-3', label: 'Luggage Tags', slug: 'luggage-tags' },
      { _id: 'default-t-4', label: 'Toiletry Bags', slug: 'toiletry-bags' },
    ]
  },
  {
    _id: 'default-office',
    label: 'Office',
    slug: 'office',
    subcategories: [
      { _id: 'default-o-1', label: 'Laptop Bags', slug: 'laptop-bags' },
      { _id: 'default-o-2', label: 'Organizers', slug: 'organizers' },
      { _id: 'default-o-3', label: 'Desk Mats', slug: 'desk-mats' },
      { _id: 'default-o-4', label: 'Card Holders', slug: 'card-holders' },
    ]
  }
]

export default function ShopClient({ initialProducts, initialPagination }: ShopClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const categoryParam = searchParams?.get('category') || ''
  const subcategoryParam = searchParams?.get('subcategory') || ''
  const minPriceParam = searchParams?.get('minPrice')
  const maxPriceParam = searchParams?.get('maxPrice')
  const queryParam = searchParams?.get('q') || ''

  const [products, setProducts] = useState<UIProduct[]>(initialProducts)
  const [pagination, setPagination] = useState(initialPagination)
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>(DEFAULT_CATEGORY_GROUPS)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  const { addToCart } = useCart()

  // Fetch categories from backend and build hierarchical category tree
  useEffect(() => {
    apiFetch('/api/v1/categories')
      .then(res => {
        const allCats: CategoryItem[] = res?.data || []
        if (allCats.length > 0) {
          const mainCats = allCats.filter(c => !c.parentCategory && c.isActive !== false)
          const subCats = allCats.filter(c => Boolean(c.parentCategory) && c.isActive !== false)

          if (mainCats.length > 0) {
            const formatted: CategoryGroup[] = mainCats.map(main => {
              const mainSlug = (main.slug || main.name).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
              let subs = subCats
                .filter(sub => {
                  const parentId = typeof sub.parentCategory === 'object' ? sub.parentCategory?._id : sub.parentCategory
                  return String(parentId) === String(main._id)
                })
                .map(sub => {
                  const rawSlug = (sub.slug || sub.name).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
                  // Extract clean subcategory slug (e.g., 'women-bags' -> 'bags')
                  const cleanSubSlug = rawSlug.startsWith(`${mainSlug}-`)
                    ? rawSlug.substring(mainSlug.length + 1)
                    : rawSlug

                  return {
                    _id: sub._id,
                    label: sub.name,
                    slug: cleanSubSlug
                  }
                })

              // Fallback to default subcategories if none in DB
              if (subs.length === 0) {
                const defaultMatch = DEFAULT_CATEGORY_GROUPS.find(
                  d => d.label.toUpperCase() === main.name.toUpperCase() || d.slug === mainSlug
                )
                if (defaultMatch) {
                  subs = defaultMatch.subcategories
                }
              }

              return {
                _id: main._id,
                label: main.name,
                slug: mainSlug,
                subcategories: subs
              }
            })

            setCategoryGroups(formatted)
          }
        }
      })
      .catch(() => {})
  }, [])

  // Auto-expand matching category based on category or subcategory in URL
  useEffect(() => {
    if (categoryParam) {
      setExpandedCategories(prev => ({ ...prev, [categoryParam.toLowerCase()]: true }))
    } else if (subcategoryParam) {
      const parent = categoryGroups.find(g =>
        g.subcategories.some(s => s.slug.toLowerCase() === subcategoryParam.toLowerCase())
      )
      if (parent) {
        setExpandedCategories(prev => ({ ...prev, [parent.slug.toLowerCase()]: true }))
      }
    }
  }, [categoryParam, subcategoryParam, categoryGroups])

  const maxProductPrice = useMemo(
    () => products.reduce((m, p) => Math.max(m, p.price || 0), 0),
    [products]
  )

  const sliderMax = Math.max(3000, Math.ceil(maxProductPrice))

  const initialMin = minPriceParam ? Math.max(0, Number(minPriceParam)) : 0
  const initialMax = maxPriceParam ? Number(maxPriceParam) : sliderMax
  const [priceRange, setPriceRange] = useState<[number, number]>([initialMin, initialMax])

  useEffect(() => {
    const urlMin = minPriceParam ? Math.max(0, Number(minPriceParam)) : 0
    const urlMax = maxPriceParam ? Number(maxPriceParam) : sliderMax
    setPriceRange([urlMin, urlMax])
  }, [minPriceParam, maxPriceParam, sliderMax])

  // Fetch more products when page changes or filters change
  const fetchProducts = useCallback(async (
    page: number,
    overrideFilters?: {
      category?: string | null
      subcategory?: string | null
      minPrice?: number | null
      maxPrice?: number | null
      q?: string | null
    }
  ) => {
    try {
      setLoading(true)
      const cat = overrideFilters?.category !== undefined ? (overrideFilters.category || '') : categoryParam
      const sub = overrideFilters?.subcategory !== undefined ? (overrideFilters.subcategory || '') : subcategoryParam
      const minP = overrideFilters?.minPrice !== undefined ? overrideFilters.minPrice : (minPriceParam ? Number(minPriceParam) : undefined)
      const maxP = overrideFilters?.maxPrice !== undefined ? overrideFilters.maxPrice : (maxPriceParam ? Number(maxPriceParam) : undefined)
      const q = overrideFilters?.q !== undefined ? (overrideFilters.q || '') : queryParam

      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '12')
      if (cat) params.set('category', cat)
      if (sub) params.set('subcategory', sub)
      if (typeof minP === 'number' && minP > 0) params.set('minPrice', String(minP))
      if (typeof maxP === 'number' && maxP < sliderMax) params.set('maxPrice', String(maxP))
      if (q) params.set('q', q)

      const res = await apiFetch(`/api/v1/products/getAll?${params.toString()}`)
      const list: BackendProduct[] = res?.data?.products || []
      const paginationData = res?.data?.pagination || {
        page,
        limit: 12,
        totalProducts: list.length,
        totalPages: Math.ceil(list.length / 12) || 1,
        hasMore: false,
      }

      const mapped: UIProduct[] = list.map(p => {
        const catObj = typeof p.category === 'object' ? p.category : null
        const parentObj = catObj && typeof catObj.parentCategory === 'object' ? catObj.parentCategory : null

        return {
          id: p._id,
          slug: p.slug || undefined,
          name: p.name,
          price: p.price,
          discount: p.discount || 0,
          image:
            Array.isArray(p.imageUrls) && p.imageUrls.length > 0
              ? p.imageUrls[0]
              : '/placeholder.jpg',
          categorySlug: catObj?.slug
            ? catObj.slug
            : catObj?.name
            ? catObj.name.toLowerCase().replace(/\s+/g, '-')
            : undefined,
          parentCategorySlug: parentObj?.slug
            ? parentObj.slug
            : parentObj?.name
            ? parentObj.name.toLowerCase().replace(/\s+/g, '-')
            : undefined,
          colors: p.colors || [],
          sizes: p.sizes || [],
          stock: typeof p.stock === 'number' ? p.stock : 0,
          madeToOrder: Boolean(p.madeToOrder),
        }
      })

      setProducts(mapped)
      setPagination(paginationData)
    } catch (err) {
      console.error('Failed to load products', err)
    } finally {
      setLoading(false)
    }
  }, [categoryParam, subcategoryParam, minPriceParam, maxPriceParam, queryParam, sliderMax])

  // When filters in URL change, reset to page 1 and fetch corresponding products from backend
  useEffect(() => {
    setCurrentPage(1)
    fetchProducts(1)
  }, [categoryParam, subcategoryParam, minPriceParam, maxPriceParam, queryParam])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchProducts(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Update URL search parameters without full page reload
  const updateUrlFilters = useCallback(
    (updates: {
      category?: string | null
      subcategory?: string | null
      minPrice?: number | null
      maxPrice?: number | null
    }) => {
      const params = new URLSearchParams(searchParams?.toString() || '')

      if (updates.category !== undefined) {
        if (updates.category) {
          params.set('category', updates.category)
        } else {
          params.delete('category')
        }
      }

      if (updates.subcategory !== undefined) {
        if (updates.subcategory) {
          params.set('subcategory', updates.subcategory)
        } else {
          params.delete('subcategory')
        }
      }

      if (updates.minPrice !== undefined) {
        if (updates.minPrice !== null && updates.minPrice > 0) {
          params.set('minPrice', String(updates.minPrice))
        } else {
          params.delete('minPrice')
        }
      }

      if (updates.maxPrice !== undefined) {
        if (updates.maxPrice !== null && updates.maxPrice < sliderMax) {
          params.set('maxPrice', String(updates.maxPrice))
        } else {
          params.delete('maxPrice')
        }
      }

      const queryStr = params.toString()
      const newPath = queryStr ? `/shop?${queryStr}` : '/shop'
      router.replace(newPath, { scroll: false })
    },
    [searchParams, router, sliderMax]
  )

  const handleSelectAll = () => {
    updateUrlFilters({ category: null, subcategory: null })
    setShowFilters(false)
  }

  const handleSelectCategory = (catSlug: string) => {
    updateUrlFilters({ category: catSlug, subcategory: null })
    setExpandedCategories(prev => ({ ...prev, [catSlug.toLowerCase()]: true }))
    setShowFilters(false)
  }

  const handleSelectSubcategory = (catSlug: string, subSlug: string) => {
    updateUrlFilters({ category: catSlug, subcategory: subSlug })
    setExpandedCategories(prev => ({ ...prev, [catSlug.toLowerCase()]: true }))
    setShowFilters(false)
  }

  const toggleExpand = (e: React.MouseEvent, catSlug: string) => {
    e.stopPropagation()
    setExpandedCategories(prev => ({
      ...prev,
      [catSlug.toLowerCase()]: !prev[catSlug.toLowerCase()]
    }))
  }

  const handlePriceChange = (newMax: number) => {
    setPriceRange([priceRange[0], newMax])
    updateUrlFilters({ minPrice: priceRange[0], maxPrice: newMax })
  }

  // Filter products (backend handles category/subcategory filtering)
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const price = p.price || 0
      if (price < priceRange[0] || price > priceRange[1]) {
        return false
      }

      const q = (queryParam || '').toLowerCase().trim()
      if (q && !p.name.toLowerCase().includes(q)) {
        return false
      }

      return true
    })
  }, [products, priceRange, queryParam])

  const pageTitle = useMemo(() => {
    if (categoryParam && subcategoryParam) {
      return `${categoryParam.replace(/-/g, ' ')} — ${subcategoryParam.replace(/-/g, ' ')}`
    }
    if (categoryParam) {
      return categoryParam.replace(/-/g, ' ')
    }
    if (subcategoryParam) {
      return subcategoryParam.replace(/-/g, ' ')
    }
    return 'All Products'
  }, [categoryParam, subcategoryParam])

  return (
    <main className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">

        <h1 className="text-4xl font-serif mb-10 capitalize">
          {pageTitle}
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
                onClick={handleSelectAll}
                className={`block text-sm font-light transition ${
                  !categoryParam && !subcategoryParam
                    ? 'text-accent font-semibold'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                All Products
              </button>

              {categoryGroups.map(cat => {
                const isCatActive =
                  categoryParam.toLowerCase() === cat.slug.toLowerCase() && !subcategoryParam
                const isExpanded = Boolean(expandedCategories[cat.slug.toLowerCase()])

                return (
                  <div key={cat.slug} className="space-y-1">
                    <div className="flex items-center justify-between group">
                      <button
                        type="button"
                        onClick={() => handleSelectCategory(cat.slug)}
                        className={`text-sm font-light text-left transition flex-1 py-0.5 ${
                          isCatActive
                            ? 'text-accent font-semibold'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        {cat.label}
                      </button>
                      {cat.subcategories.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => toggleExpand(e, cat.slug)}
                          className="p-1 opacity-60 hover:opacity-100 transition"
                          aria-label={`Toggle ${cat.label} subcategories`}
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Subcategories list when expanded */}
                    {cat.subcategories.length > 0 && isExpanded && (
                      <div className="pl-3 border-l border-border/40 space-y-1 py-1">
                        <button
                          type="button"
                          onClick={() => handleSelectCategory(cat.slug)}
                          className={`block text-xs font-light text-left transition py-0.5 ${
                            isCatActive
                              ? 'text-accent font-semibold'
                              : 'opacity-50 hover:opacity-100'
                          }`}
                        >
                          All {cat.label}
                        </button>
                        {cat.subcategories.map(sub => {
                          const isSubActive =
                            (categoryParam.toLowerCase() === cat.slug.toLowerCase() || !categoryParam) &&
                            subcategoryParam.toLowerCase() === sub.slug.toLowerCase()

                          return (
                            <button
                              key={sub.slug}
                              type="button"
                              onClick={() => handleSelectSubcategory(cat.slug, sub.slug)}
                              className={`block text-xs font-light text-left transition py-0.5 ${
                                isSubActive
                                  ? 'text-accent font-semibold'
                                  : 'opacity-50 hover:opacity-100'
                              }`}
                            >
                              {sub.label}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <h3 className="text-sm font-light tracking-wide mb-4 uppercase opacity-75">
              Price
            </h3>

            <input
              type="range"
              min={0}
              max={sliderMax}
              value={priceRange[1]}
              onChange={e => handlePriceChange(Number(e.target.value))}
              className="w-full"
            />

            <p className="text-xs opacity-60 mt-2">
              PKR {priceRange[0].toLocaleString()} – PKR {priceRange[1].toLocaleString()}
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
