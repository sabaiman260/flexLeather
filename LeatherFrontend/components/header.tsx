'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import SearchBox from '@/components/search/SearchBox'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Search, Menu, X } from 'lucide-react'
import { useCart } from '@/components/cart-context'
import { useAuth } from '@/components/auth-provider'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FaWhatsapp } from 'react-icons/fa';

const NAV_TEXT_COLOR = 'text-[#E6D8C8]'

export default function Header() {
  const [search, setSearch] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()
  const { totalItems } = useCart()
  const { user, isLoggedIn, logout, isLoading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  // Track whether we've loaded the client auth state to avoid server/client mismatch
  const [clientAuthLoaded, setClientAuthLoaded] = useState(false)
  const [clientLoggedIn, setClientLoggedIn] = useState(false)
  const [clientUser, setClientUser] = useState<any>(null)
  const pathname = usePathname()
  const [productsIndex, setProductsIndex] = useState<any[]>([])

  useEffect(() => {
    // Populate client-only auth-derived state on mount/update
    setClientAuthLoaded(true)
    setClientLoggedIn(!isLoading && !!isLoggedIn)
    setClientUser(user || null)
  }, [isLoggedIn, isLoading, user])

  useEffect(() => {
    let mounted = true
    // fetch a lightweight product list for client search/autocomplete
    apiFetch('/api/v1/products/getAll')
      .then(res => {
        const items = (res?.data || []).map((p: any) => ({
          id: p._id,
          name: p.name,
          price: p.price,
          image: Array.isArray(p.imageUrls) && p.imageUrls.length ? p.imageUrls[0] : (p.images && p.images[0]) || null,
          category: p.category?.name || p.category || '',
          brand: p.brand || '',
          description: p.description || '',
          tags: p.tags || [],
        }))
        if (mounted) setProductsIndex(items)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  // Keep rendering the header (call hooks in same order) but hide it
  // visually until the client hydrates. Using CSS `invisible` ensures
  // the server and initial client HTML match while avoiding hook-order
  // changes caused by conditional returns.

  useEffect(() => {
    const q = searchParams?.get('q') || ''
    setSearch(q)
  }, [searchParams])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <div>
      {/* ================= MOBILE HEADER ================= */}
      <header className="block md:hidden fixed left-0 w-full z-50 bg-primary shadow-md border-0 border-t-0" style={{ top: 'var(--announcement-height, 0px)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="relative w-10 h-10">
              <Image src="/logos.png" alt="Flex Leather Logo" width={40} height={40} className="object-contain" priority />
            </div>
            <div className="flex flex-col text-[#E6D8C8] whitespace-nowrap">
              <span className="text-[10px] tracking-[0.3em] uppercase opacity-70">Flex</span>
              <span className="text-[13px] font-serif font-bold tracking-widest uppercase leading-none">Leather</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/cart" className="relative p-2">
              <ShoppingCart className="w-5 h-5 text-[#E6D8C8]" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 bg-[#E6D8C8] text-black font-bold text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{totalItems}</span>
              )}
            </Link>

            {/* On mobile we hide the horizontal login/signup and move them into the menu. Keep cart and hamburger compact. */}

            {clientAuthLoaded && clientLoggedIn ? (
              <Link href="/profile" className="p-1">
                <Avatar className="h-8 w-8 border border-[#E6D8C8] bg-[#E6D8C8]">
                  <AvatarImage src={clientUser?.profileImage} alt={clientUser?.userName} />
                  <AvatarFallback className="font-semibold" style={{ backgroundColor: '#E6D8C8', color: '#3B2A1A' }}>{clientUser?.userName?.substring(0,2).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
              </Link>
            ) : null}

            <button
              onClick={() => setMobileOpen(v => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              className="p-2"
            >
              {mobileOpen ? <X className="w-6 h-6 text-[#E6D8C8]" /> : <Menu className="w-6 h-6 text-[#E6D8C8]" />}
            </button>
          </div>
        </div>

      </header>

      {/* ================= MOBILE DRAWER OVERLAY ================= */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer — slides in from the right */}
          <nav className="fixed top-0 right-0 bottom-0 w-64 bg-primary z-50 flex flex-col md:hidden shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 flex-shrink-0">
              <span className={`font-serif tracking-widest uppercase text-sm ${NAV_TEXT_COLOR}`}>Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="p-1"
              >
                <X className="w-5 h-5 text-[#E6D8C8]" />
              </button>
            </div>

            {/* Nav links */}
            <div className="flex flex-col flex-1 overflow-y-auto px-2 py-4 gap-1">
              <Link href="/shop" className={`py-3 px-4 rounded-md hover:bg-white/10 text-sm tracking-wide ${NAV_TEXT_COLOR}`} onClick={() => setMobileOpen(false)}>Shop</Link>
              <Link href="/collections" className={`py-3 px-4 rounded-md hover:bg-white/10 text-sm tracking-wide ${NAV_TEXT_COLOR}`} onClick={() => setMobileOpen(false)}>Collections</Link>
              <Link href="/about" className={`py-3 px-4 rounded-md hover:bg-white/10 text-sm tracking-wide ${NAV_TEXT_COLOR}`} onClick={() => setMobileOpen(false)}>About</Link>

              <div className="border-t border-white/10 my-2" />

              {(!clientAuthLoaded || !clientLoggedIn) && (
                <>
                  <Link href="/login" className={`text-left py-3 px-4 rounded-md hover:bg-white/10 text-sm tracking-wide ${NAV_TEXT_COLOR}`} onClick={() => setMobileOpen(false)}>Login</Link>
                  <Link href="/register" className={`py-3 px-4 rounded-md hover:bg-white/10 text-sm tracking-wide ${NAV_TEXT_COLOR}`} onClick={() => setMobileOpen(false)}>Sign Up</Link>
                </>
              )}
              {clientAuthLoaded && clientLoggedIn && (
                <>
                  <Link href="/profile" className={`py-3 px-4 rounded-md hover:bg-white/10 text-sm tracking-wide ${NAV_TEXT_COLOR}`} onClick={() => setMobileOpen(false)}>My Profile</Link>
                  {clientUser?.userRole === 'admin' && <Link href="/admin" className={`py-3 px-4 rounded-md hover:bg-white/10 text-sm tracking-wide ${NAV_TEXT_COLOR}`} onClick={() => setMobileOpen(false)}>Admin Panel</Link>}
                  <button onClick={() => { setMobileOpen(false); logout(); }} className={`text-left py-3 px-4 rounded-md hover:bg-white/10 text-sm tracking-wide ${NAV_TEXT_COLOR}`}>Log out</button>
                </>
              )}
            </div>
          </nav>
        </>
      )}
      {/* ================= DESKTOP HEADER ================= */}
      <header
        className="
          hidden md:block
          fixed left-0 w-full z-50
          bg-primary
          isolate
          shadow-md
          border-0 border-t-0
        "
        style={{ top: 'var(--announcement-height, 0px)' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-4 group">
            <div className="relative w-14 h-14 transition-transform group-hover:scale-105">
              <Image
                src="/logos.png"
                alt="Flex Leather Logo"
                width={56}
                height={56}
                className="object-contain"
                priority
              />
            </div>
            <div className={`flex flex-col ${NAV_TEXT_COLOR}`}>
              <span className="text-[10px] tracking-[0.3em] font-bold uppercase opacity-70">
                Flex
              </span>
              <span className="text-[15px] font-serif font-bold tracking-widest uppercase leading-none">
                Leather
              </span>
            </div>
          </Link>

          {/* Search */}
          <div className="flex-1 mx-12 max-w-xl">
            <div className="flex items-center border border-white/20 bg-white/10 px-4 py-2 rounded-full focus-within:bg-white/20 transition-all">
                <Search className="w-4 h-4 text-[#E6D8C8] cursor-pointer" onClick={() => search.trim() && router.push(`/search?q=${encodeURIComponent(search.trim())}`)} />
              <div className="flex-1 ml-2">
                <SearchBox
                  products={productsIndex}
                  onSelect={(p: any) => {
                    if (p && p.id && p.id.length === 24) router.push(`/products/${p.id}`)
                  }}
                  onQueryChange={(q: string) => setSearch(q)}
                />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className={`flex gap-8 items-center font-medium text-sm tracking-wide ${NAV_TEXT_COLOR}`}>
            <Link href="/shop" className="hover:opacity-70 transition">
              Shop
            </Link>
            <Link href="/collections" className="hover:opacity-70 transition">
              Collections
            </Link>
            <Link href="/about" className="hover:opacity-70 transition">
              About
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 hover:bg-white/10 rounded-full transition"
            >
              <ShoppingCart className="w-5 h-5 text-[#E6D8C8]" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-[#E6D8C8] text-black font-bold text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Signup as plain text (only if not logged in) */}
            {(!clientAuthLoaded || !clientLoggedIn) && (
              <Link href="/register" className="hover:opacity-70 transition">
                Sign Up
              </Link>
            )}

            {/* Avatar / Login */}
            {clientAuthLoaded ? (isLoading ? null : clientLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <Avatar className="h-8 w-8 border border-[#E6D8C8] bg-[#E6D8C8]">
                    <AvatarImage src={clientUser?.profileImage} alt={clientUser?.userName} />
                    <AvatarFallback
                      className="font-semibold"
                      style={{ backgroundColor: '#E6D8C8', color: '#3B2A1A' }}
                    >
                      {clientUser?.userName?.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="
                    w-56
                    bg-[#E6D8C8]
                    border border-[#3B2A1A]/20
                    text-[#3B2A1A]
                    shadow-xl
                  "
                >
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{clientUser?.userName}</p>
                      <p className="text-xs opacity-70">{clientUser?.userEmail}</p>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator className="bg-[#3B2A1A]/20" />

                  {clientUser?.userRole === 'admin' && (
                    <DropdownMenuItem
                      onClick={() => router.push('/admin')}
                      className="cursor-pointer hover:bg-[#3B2A1A]/10"
                    >
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={() => router.push('/profile')}
                    className="cursor-pointer hover:bg-[#3B2A1A]/10"
                  >
                    My Profile
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer hover:bg-[#3B2A1A]/10"
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login" className="hover:opacity-70 transition">Login</Link>
            )) : (
              /* Initial server/client render: show login link until auth is resolved on client */
              <Link href="/login" className="hover:opacity-70 transition">Login</Link>
            )}
          </nav>
        </div>
      </header>

      {/* Login Modal removed — header now links to /login page */}

      {/* Spacer so content starts below fixed header (match header height) */}
      <div className="md:hidden h-[64px]" />
      <div className="hidden md:block h-[88px]" />

      {/* WhatsApp Floating Widget: icon + message pill (no form) */}
      <div className="fixed bottom-4 right-4 z-50">
        <a
          href="https://wa.me/923717014449"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3"
          aria-label="Chat with us on WhatsApp"
        >
          {/* Message pill: visible on hover and on small+ screens */}
          <span className="hidden sm:inline-flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-full shadow-lg text-sm font-medium transition-all duration-150 transform group-hover:translate-x-0 -translate-x-2 group-hover:opacity-100 opacity-90">
            <FaWhatsapp size={18} />
            <span>Need Help? Chat on WhatsApp</span>
          </span>

          {/* Circular icon (always visible) */}
          <span className="flex items-center justify-center w-14 h-14 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600">
            <FaWhatsapp size={24} />
          </span>
        </a>
      </div>
    </div>
  )
}
