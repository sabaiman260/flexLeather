import Link from 'next/link'
import { Mail, MapPin, Phone, Facebook, Instagram, Youtube } from 'lucide-react'
import { Button } from '@/components/ui/button'

function TikTokIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M16.5 3c.4 2.1 1.9 3.8 4 4.4v3.1c-1.6-.1-3.1-.7-4.4-1.6v6.1c0 3.6-2.9 6.4-6.4 6.4S3.3 18.6 3.3 15c0-3.6 2.9-6.4 6.4-6.4.5 0 1 .1 1.5.2v3.2c-.5-.3-1-.4-1.5-.4-2 0-3.6 1.6-3.6 3.6s1.6 3.6 3.6 3.6 3.6-1.6 3.6-3.6V3h3.1z" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-max md:px-6 py-16">

        {/* Footer Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

          {/* Brand */}
          <div>
            <h3 className="text-xl font-serif font-light tracking-widest mb-6">
              FlexLeather
            </h3>
            <p className="text-sm font-light leading-relaxed opacity-80">
              Handcrafted luxury leather goods for the discerning individual.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-sm font-light tracking-wide mb-4">
              Shop
            </h4>
            <nav className="space-y-3">
              <Link href="/shop?category=office" className="block text-sm font-light opacity-80 hover:opacity-100">
                Office
              </Link>
              <Link href="/shop?category=gift-ideas" className="block text-sm font-light opacity-80 hover:opacity-100">
                Gift Ideas
              </Link>
              <Link href="/shop?category=women" className="block text-sm font-light opacity-80 hover:opacity-100">
                Women
              </Link>
              <Link href="/shop?category=kids" className="block text-sm font-light opacity-80 hover:opacity-100">
                Kids
              </Link>
            </nav>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-sm font-light tracking-wide mb-4">
              Customer Service
            </h4>
            <nav className="space-y-3">
              <Link href="/contact" className="block text-sm font-light opacity-80 hover:opacity-100">
                Contact Us
              </Link>
              <Link href="/shipping-returns" className="block text-sm font-light opacity-80 hover:opacity-100">
                Shipping & Returns
              </Link>
              <Link href="/faq" className="block text-sm font-light opacity-80 hover:opacity-100">
                FAQ
              </Link>
              <Link href="/privacy-policy" className="block text-sm font-light opacity-80 hover:opacity-100">
                Privacy Policy
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-light tracking-wide mb-4">
              Contact
            </h4>
            <div className="space-y-3 text-sm font-light opacity-80">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+92 3184642266</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>flexleather.official@gmail.com</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>
                  Maverick Engineers G-13<br />
                  Innovista Rachna DHA<br />
                  Gujranwala, Pakistan
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Newsletter */}
        <div className="border-t border-white/20 pt-12 mb-12">
          <h3 className="text-sm font-light tracking-wide mb-4 opacity-80">
            Subscribe to get latest updates and exclusive offers
          </h3>
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 bg-white/5 border border-white/20 text-sm font-light outline-none placeholder:text-white/60"
            />
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-light">
              Subscribe
            </Button>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center text-xs font-light opacity-75">

          <p>© {new Date().getFullYear()} FlexLeather. All rights reserved.</p>

          {/* Social Links */}
          <div className="flex gap-6 mt-4 md:mt-0">
            <a
              href="https://www.instagram.com/flexleather.official/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:opacity-100 transition"
            >
              <Instagram className="w-5 h-5" />
            </a>

            <a
              href="https://www.facebook.com/profile.php?id=61585260157289"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="hover:opacity-100 transition"
            >
              <Facebook className="w-5 h-5" />
            </a>

            <a
              href="https://www.youtube.com/@flexleather"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="hover:opacity-100 transition"
            >
              <Youtube className="w-5 h-5" />
            </a>

            <a
              href="https://www.tiktok.com/@flexleather5?lang=en"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="hover:opacity-100 transition"
            >
              <TikTokIcon className="w-5 h-5" />
            </a>
          </div>

        </div>
      </div>
    </footer>
  )
}
