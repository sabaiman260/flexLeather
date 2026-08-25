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
  colors?: string[]
  sizes?: string[]
  stock?: number
  madeToOrder?: boolean
}

export default async function ShopPage() {
  // Fetch initial products on server-side with pagination (12 products)
  const res = await serverApiFetch('/api/v1/products/getAll?page=1&limit=12')
  const list: BackendProduct[] = res?.data?.products || []
  const pagination = res?.data?.pagination || { page: 1, totalPages: 1, totalProducts: 0, hasMore: false }

  const initialProducts: UIProduct[] = list.map(p => ({
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
