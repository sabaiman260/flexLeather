import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import Image from 'next/image'

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <h1 className="text-4xl font-serif font-light tracking-wide mb-6">About FlexLeather</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg mb-4 opacity-80">
                FlexLeather is a modern workshop of handcrafted leather goods — combining traditional
                craftsmanship with contemporary design. Each piece is made with premium materials
                and an obsessive attention to detail.
              </p>
              <p className="text-sm mb-6 opacity-80">
                Our designs are inspired by timeless shapes and built to last a lifetime. From handbags
                to travel accessories, we focus on quality and responsible sourcing in every step.
              </p>

              <h3 className="text-xl font-serif font-light mb-4">Why FlexLeather?</h3>
              <ul className="list-disc ml-6 mb-6 text-sm opacity-80">
                <li>Genuine, responsibly-sourced leather</li>
                <li>Small-batch production for higher quality</li>
                <li>Design-first approach — built to last</li>
                <li>World-class customer support and lifetime repairs</li>
              </ul>

              <Link href="/shop" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded font-light">Shop our Collection</Link>
            </div>

            <div className="relative w-full h-80 md:h-96 overflow-hidden rounded">
              <Image
                src="/luxury-leather-handbag-showcase-premium.jpg"
                alt="Artisan crafting a leather handbag"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-serif font-light mb-3">Our Craft</h4>
              <p className="text-sm opacity-80">Our leather goods are handcrafted using a blend of modern
                techniques and time-tested artisan practices. We inspect each item at every step for
                durability and finish.</p>
            </div>

            <div>
              <h4 className="text-lg font-serif font-light mb-3">Sustainability</h4>
              <p className="text-sm opacity-80">We work with tanneries that follow ethical policies and minimize
                waste. FlexLeather is committed to responsible sourcing and repair-first product care.</p>
            </div>

            <div>
              <h4 className="text-lg font-serif font-light mb-3">Our Promise</h4>
              <p className="text-sm opacity-80">If you’re not satisfied, our support team will help you with repairs
                or a fair solution — we believe in craftsmanship that stands behind its products.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
