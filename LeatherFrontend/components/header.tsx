'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
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

const NAV_TEXT_COLOR = 'text-[#E6D8C8]'

export default function Header() {
  const [search, setSearch] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()
  const { totalItems } = useCart()
  const { user, isLoggedIn, logout, isLoading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const q = searchParams?.get('q') || ''
    setSearch(q)
  }, [searchParams])

  // Rehydrate mobile menu state from localStorage on mount and on route changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mobileMenuOpen')
      if (stored !== null) {
        setMobileOpen(stored === 'true')
      }
    } catch (e) {}
  }, [])

  // Persist mobile menu state and re-apply on navigation so header remains consistent
  useEffect(() => {
    try {
      localStorage.setItem('mobileMenuOpen', mobileOpen ? 'true' : 'false')
    } catch (e) {}
  }, [mobileOpen])

  // When route changes, rehydrate the menu state from storage (preserve user's preference)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mobileMenuOpen')
      if (stored !== null) {
        setMobileOpen(stored === 'true')
      }
    } catch (e) {}
  }, [pathname])

  return (
    <>
      {/* ================= MOBILE HEADER ================= */}
      <header className="block md:hidden fixed top-0 left-0 w-full z-50 bg-primary shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image src="/logos.png" alt="Flex Leather Logo" width={40} height={40} className="object-contain" priority />
            </div>
            <div className="flex flex-col text-[#E6D8C8]">
              <span className="text-[10px] tracking-[0.3em] uppercase opacity-70">ESTD 2025</span>
              <span className="text-[13px] font-serif font-bold tracking-widest uppercase leading-none">Flex Leather</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/cart" className="relative p-2">
              <ShoppingCart className="w-5 h-5 text-[#E6D8C8]" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 bg-[#E6D8C8] text-black font-bold text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{totalItems}</span>
              )}
            </Link>

            {/* Show Login/Register (when not logged in) or Avatar (when logged in) */}
            {!isLoading && !isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm px-2 py-1 rounded hover:bg-white/5 text-[#E6D8C8]">Login</Link>
                <Link href="/register" className="text-sm px-2 py-1 rounded bg-white text-neutral-900">Sign Up</Link>
              </div>
            ) : null}

            {isLoggedIn && !isLoading ? (
              <Link href="/profile" className="p-1">
                <Avatar className="h-8 w-8 border border-[#E6D8C8] bg-[#E6D8C8]">
                  <AvatarImage src={user?.profileImage} alt={user?.userName} />
                  <AvatarFallback className="font-semibold" style={{ backgroundColor: '#E6D8C8', color: '#3B2A1A' }}>{user?.userName?.substring(0,2).toUpperCase() || 'U'}</AvatarFallback>
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

        {mobileOpen && (
          <nav className="bg-primary/95 border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3">
              <Link href="/shop" className="py-2 px-3 rounded hover:bg-white/5" onClick={() => setMobileOpen(false)}>Shop</Link>
              <Link href="/collections" className="py-2 px-3 rounded hover:bg-white/5" onClick={() => setMobileOpen(false)}>Collections</Link>
              <Link href="/about" className="py-2 px-3 rounded hover:bg-white/5" onClick={() => setMobileOpen(false)}>About</Link>
              {!isLoggedIn && <Link href="/login" className="py-2 px-3 rounded hover:bg-white/5" onClick={() => setMobileOpen(false)}>Login</Link>}
              {isLoggedIn && (
                <>
                  <Link href="/profile" className="py-2 px-3 rounded hover:bg-white/5" onClick={() => setMobileOpen(false)}>My Profile</Link>
                  {user?.userRole === 'admin' && <Link href="/admin" className="py-2 px-3 rounded hover:bg-white/5" onClick={() => setMobileOpen(false)}>Admin</Link>}
                  <button onClick={() => { setMobileOpen(false); logout(); }} className="text-left py-2 px-3 rounded hover:bg-white/5">Log out</button>
                </>
              )}
            </div>
          </nav>
        )}
      </header>
      {/* ================= DESKTOP HEADER ================= */}
      <header
        className="
          hidden md:block
          fixed top-0 left-0 w-full z-50
          bg-primary
          isolate
          shadow-md
        "
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
              <span className="text-[10px] tracking-[0.3em] uppercase opacity-70">
                ESTD 2025
              </span>
              <span className="text-[15px] font-serif font-bold tracking-widest uppercase leading-none">
                Flex Leather
              </span>
            </div>
          </Link>

          {/* Search */}
          <div className="flex-1 mx-12 max-w-md">
            <div className="flex items-center border border-white/20 bg-white/10 px-4 py-2 rounded-full focus-within:bg-white/20 transition-all">
              <Search
                className="w-4 h-4 text-[#E6D8C8] cursor-pointer"
                onClick={() =>
                  search.trim() &&
                  router.push(`/shop?q=${encodeURIComponent(search.trim())}`)
                }
              />
              <input
                type="text"
                placeholder="Search products..."
                className="flex-1 ml-2 bg-transparent outline-none text-sm text-[#E6D8C8] placeholder:text-[#E6D8C8]/60"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && search.trim()) {
                    router.push(`/shop?q=${encodeURIComponent(search.trim())}`)
                  }
                }}
              />
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

            {/* Signup/Register Icon (only if not logged in) */}
            {!isLoggedIn && !isLoading && (
              <Link
                href="/register"
                className="p-2 hover:bg-white/10 rounded-full transition"
                title="Sign Up"
              >
                <svg className="w-5 h-5 text-[#E6D8C8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </Link>
            )}

            {/* Avatar / Login */}
            {isLoading ? null : isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <Avatar className="h-8 w-8 border border-[#E6D8C8] bg-[#E6D8C8]">
                    <AvatarImage src={user?.profileImage} alt={user?.userName} />
                    <AvatarFallback
                      className="font-semibold"
                      style={{ backgroundColor: '#E6D8C8', color: '#3B2A1A' }}
                    >
                      {user?.userName?.substring(0, 2).toUpperCase() || 'U'}
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
                      <p className="text-sm font-medium">{user?.userName}</p>
                      <p className="text-xs opacity-70">{user?.userEmail}</p>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator className="bg-[#3B2A1A]/20" />

                  {user?.userRole === 'admin' && (
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
              <Link href="/login" className="hover:opacity-70 transition">
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Spacer so content starts below fixed header (match header height) */}
      <div className="md:hidden h-[64px]" />
      <div className="hidden md:block h-[88px]" />
    </>
  )
}
