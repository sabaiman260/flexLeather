import Header from '@/components/header'
import { Suspense } from 'react'
import Footer from '@/components/footer'
import Categories from '@/components/categories'
import FeaturedProducts from '@/components/featured-products'

export const metadata = {
  title: 'Collections — FlexLeather',
  description: 'Shop curated collections from FlexLeather — seasonal highlights and specially curated items.',
}

export default function CollectionsPage() {
  return (
    <>
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      <main className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <h1 className="text-3xl md:text-4xl font-serif font-light tracking-wide mb-6">Collections</h1>
          <p className="text-sm opacity-80 mb-8">Explore our curated collections — seasonal picks, travel essentials, and signature leather goods selected for their quality and design.</p>

          {/* Categories visual grid */}
          <Categories />

          {/* Featured products section */}
          <FeaturedProducts />
        </div>
      </main>
      <Footer />
    </>
  )
}
