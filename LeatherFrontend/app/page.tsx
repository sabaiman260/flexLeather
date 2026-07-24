import Link from 'next/link'
import { ShoppingCart, Menu, X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Header from '@/components/header'
import Hero from '@/components/hero'
import Categories from '@/components/categories'
import AnnouncementBar from '@/components/AnnouncementBar'
import ProductSlider from '@/components/ProductSlider'
import FeaturedProducts from '@/components/featured-products'
import LeatherShowcase from '@/components/LeatherShowcase'
import Footer from '@/components/footer'

export default function Home() {
  return (
    <main>
       <AnnouncementBar />
      <Header />
      {/* <Categories /> */}
      <Hero />
      <FeaturedProducts />
      {/* <ProductSlider /> */}
      <LeatherShowcase />
      <Footer />
    </main>
  )
}
