import { Suspense } from 'react'
import Header from '@/components/header'
import Footer from '@/components/footer'
import ShopClient from '@/components/ShopClient'
import { serverApiFetch, BackendProduct } from '@/lib/api'

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

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>
}) {
  const sp = searchParams instanceof Promise ? await searchParams : (searchParams || {})
  const page = typeof sp.page === 'string' ? sp.page : '1'
  const category = typeof sp.category === 'string' ? sp.category : ''
  const subcategory = typeof sp.subcategory === 'string' ? sp.subcategory : ''
  const minPrice = typeof sp.minPrice === 'string' ? sp.minPrice : ''
  const maxPrice = typeof sp.maxPrice === 'string' ? sp.maxPrice : ''
  const q = typeof sp.q === 'string' ? sp.q : (typeof sp.search === 'string' ? sp.search : '')

  const params = new URLSearchParams()
  params.set('page', page)
  params.set('limit', '12')
  if (category) params.set('category', category)
  if (subcategory) params.set('subcategory', subcategory)
  if (minPrice) params.set('minPrice', minPrice)
  if (maxPrice) params.set('maxPrice', maxPrice)
  if (q) params.set('q', q)

  // Fetch initial products on server-side with pagination (12 products) matching active category/filters
  const res = await serverApiFetch(`/api/v1/products/getAll?${params.toString()}`)
  const list: BackendProduct[] = res?.data?.products || []
  const pagination = res?.data?.pagination || { page: Number(page) || 1, totalPages: 1, totalProducts: list.length, hasMore: false }

  const initialProducts: UIProduct[] = list.map(p => {
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

  return (
    <>
      <Header />
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="w-10 h-10 border-4 border-muted border-t-foreground rounded-full animate-spin" />
        </div>
      }>
        <ShopClient initialProducts={initialProducts} initialPagination={pagination} />
      </Suspense>
      <Footer />
    </>
  )
}
