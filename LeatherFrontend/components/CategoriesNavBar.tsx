'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { apiFetch, CategoryItem } from '@/lib/api'

type FormattedCategory = {
  _id: string
  name: string
  slug: string
  subcategories: {
    _id: string
    name: string
    slug: string
  }[]
}

const DEFAULT_CATEGORIES: FormattedCategory[] = [
  {
    _id: 'default-women',
    name: 'WOMEN',
    slug: 'women',
    subcategories: [
      { _id: 'default-w-1', name: 'Handbags', slug: 'handbags' },
      { _id: 'default-w-2', name: 'Wallets', slug: 'wallets' },
      { _id: 'default-w-3', name: 'Accessories', slug: 'accessories' },
      { _id: 'default-w-4', name: 'Tote Bags', slug: 'tote-bags' },
      { _id: 'default-w-5', name: 'Jackets', slug: 'jackets' },
    ]
  },
  {
    _id: 'default-men',
    name: 'MEN',
    slug: 'men',
    subcategories: [
      { _id: 'default-m-1', name: 'Wallets', slug: 'wallets' },
      { _id: 'default-m-2', name: 'Belts', slug: 'belts' },
      { _id: 'default-m-3', name: 'Jackets', slug: 'jackets' },
      { _id: 'default-m-4', name: 'Messenger Bags', slug: 'messenger-bags' },
      { _id: 'default-m-5', name: 'Briefcases', slug: 'briefcases' },
    ]
  },
  {
    _id: 'default-gifts',
    name: 'GIFT IDEAS',
    slug: 'gift-ideas',
    subcategories: [
      { _id: 'default-g-1', name: 'For Him', slug: 'for-him' },
      { _id: 'default-g-2', name: 'For Her', slug: 'for-her' },
      { _id: 'default-g-3', name: 'Personalized', slug: 'personalized' },
      { _id: 'default-g-4', name: 'Keychains', slug: 'keychains' },
    ]
  },
  {
    _id: 'default-travel',
    name: 'TRAVEL',
    slug: 'travel',
    subcategories: [
      { _id: 'default-t-1', name: 'Duffel Bags', slug: 'duffel-bags' },
      { _id: 'default-t-2', name: 'Passport Covers', slug: 'passport-covers' },
      { _id: 'default-t-3', name: 'Luggage Tags', slug: 'luggage-tags' },
      { _id: 'default-t-4', name: 'Toiletry Bags', slug: 'toiletry-bags' },
    ]
  },
  {
    _id: 'default-office',
    name: 'OFFICE',
    slug: 'office',
    subcategories: [
      { _id: 'default-o-1', name: 'Laptop Bags', slug: 'laptop-bags' },
      { _id: 'default-o-2', name: 'Organizers', slug: 'organizers' },
      { _id: 'default-o-3', name: 'Desk Mats', slug: 'desk-mats' },
      { _id: 'default-o-4', name: 'Card Holders', slug: 'card-holders' },
    ]
  }
]

export default function CategoriesNavBar() {
  const [categories, setCategories] = useState<FormattedCategory[]>(DEFAULT_CATEGORIES)
  const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(null)
  const [activeHover, setActiveHover] = useState<string | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true

    const loadCategories = async () => {
      try {
        const res = await apiFetch('/api/v1/categories')
        const allCats: CategoryItem[] = res?.data || []

        if (!isMounted || allCats.length === 0) return

        // Separate main categories (parentCategory is null/undefined) and subcategories
        const mainCats = allCats.filter(c => !c.parentCategory && c.isActive !== false)
        const subCats = allCats.filter(c => Boolean(c.parentCategory) && c.isActive !== false)

        if (mainCats.length > 0) {
          const formatted: FormattedCategory[] = mainCats.map(main => {
            const mainSlug = (main.slug || main.name).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
            let subs = subCats
              .filter(sub => {
                const parentId = typeof sub.parentCategory === 'object' ? sub.parentCategory?._id : sub.parentCategory
                return String(parentId) === String(main._id)
              })
              .map(sub => {
                const rawSlug = (sub.slug || sub.name).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
                // If the subcategory slug is stored as parent-prefixed (e.g. "women-bags"), extract the clean sub slug ("bags") for clean URL
                const cleanSubSlug = rawSlug.startsWith(`${mainSlug}-`)
                  ? rawSlug.substring(mainSlug.length + 1)
                  : rawSlug

                return {
                  _id: sub._id,
                  name: sub.name,
                  slug: cleanSubSlug
                }
              })

            // If this main category matches a default category and has no subcategories in DB yet, fallback to default subs
            if (subs.length === 0) {
              const defaultMatch = DEFAULT_CATEGORIES.find(
                d => d.name.toUpperCase() === main.name.toUpperCase() || d.slug === mainSlug
              )
              if (defaultMatch) {
                subs = defaultMatch.subcategories
              }
            }

            return {
              _id: main._id,
              name: main.name,
              slug: mainSlug,
              subcategories: subs
            }
          })

          setCategories(formatted)
        }
      } catch (err) {
        console.warn('Using default fallback categories for CategoriesNavBar', err)
      }
    }

    loadCategories()

    return () => {
      isMounted = false
    }
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMobileDropdown(null)
        setActiveHover(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleMobile = (id: string) => {
    setOpenMobileDropdown(prev => (prev === id ? null : id))
  }

  return (
    <nav
      ref={navRef}
      className="relative z-30 w-full bg-[#2E1B19] text-[#E6D8C8] block border-0 shadow-none outline-none mt-0 mb-0"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Desktop Category Bar */}
        <div className="hidden md:flex items-center justify-center gap-7 lg:gap-12 py-1.5">
          {categories.map(cat => {
            const hasSubs = cat.subcategories.length > 0
            const isHovered = activeHover === cat._id

            return (
              <div
                key={cat._id}
                className="relative group"
                onMouseEnter={() => setActiveHover(cat._id)}
                onMouseLeave={() => setActiveHover(null)}
              >
                <div className="flex items-center gap-1 cursor-pointer py-1">
                  <Link
                    href={`/shop?category=${encodeURIComponent(cat.slug)}`}
                    className="text-[11px] lg:text-[12.5px] font-medium tracking-wide uppercase text-[#E6D8C8] hover:text-white transition-colors duration-200"
                  >
                    {cat.name}
                  </Link>
                  {hasSubs && (
                    <ChevronDown
                      size={13}
                      className={`text-[#E6D8C8]/70 transition-transform duration-200 ${
                        isHovered ? 'rotate-180 text-white' : ''
                      }`}
                    />
                  )}
                </div>

                {/* Desktop Dropdown Menu */}
                {hasSubs && (
                  <div
                    className={`
                      absolute top-full left-1/2 -translate-x-1/2 pt-2
                      transition-all duration-200 origin-top
                      ${isHovered ? 'opacity-100 scale-100 pointer-events-auto visible' : 'opacity-0 scale-95 pointer-events-none invisible'}
                    `}
                    style={{ zIndex: 60 }}
                  >
                    <div className="min-w-[200px] bg-[#3E2723] border border-[#E6D8C8]/20 rounded-md shadow-2xl py-2 px-1 backdrop-blur-md">
                      {/* View All Main Category link */}
                      <Link
                        href={`/shop?category=${encodeURIComponent(cat.slug)}`}
                        className="block px-3.5 py-1.5 text-[11.5px] font-medium tracking-wide text-[#E6D8C8] hover:bg-[#E6D8C8]/15 hover:text-white rounded transition-colors"
                        onClick={() => setActiveHover(null)}
                      >
                        All {cat.name}
                      </Link>
                      <div className="h-px bg-[#E6D8C8]/15 my-1 mx-2" />
                      {cat.subcategories.map(sub => (
                        <Link
                          key={sub._id}
                          href={`/shop?category=${encodeURIComponent(cat.slug)}&subcategory=${encodeURIComponent(sub.slug)}`}
                          className="block px-3.5 py-1.5 text-[11.5px] font-normal tracking-wide text-[#E6D8C8]/90 hover:bg-[#E6D8C8]/15 hover:text-white rounded transition-colors"
                          onClick={() => setActiveHover(null)}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile Horizontal Scrollable Category Bar with Tap/Expand */}
        <div className="md:hidden flex items-center gap-2.5 overflow-x-auto no-scrollbar py-2">
          {categories.map(cat => {
            const hasSubs = cat.subcategories.length > 0
            const isOpen = openMobileDropdown === cat._id

            return (
              <div key={cat._id} className="relative flex-shrink-0">
                {hasSubs ? (
                  <button
                    onClick={() => toggleMobile(cat._id)}
                    className="flex items-center gap-1 text-[10.5px] font-medium tracking-wide uppercase bg-[#3E2723] border border-[#E6D8C8]/20 px-3 py-1 rounded-full text-[#E6D8C8] active:scale-95 transition-all"
                  >
                    <span>{cat.name}</span>
                    <ChevronDown
                      size={11}
                      className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                ) : (
                  <Link
                    href={`/shop?category=${encodeURIComponent(cat.slug)}`}
                    className="block text-[10.5px] font-medium tracking-wide uppercase bg-[#3E2723] border border-[#E6D8C8]/20 px-3 py-1 rounded-full text-[#E6D8C8] active:scale-95 transition-all"
                  >
                    {cat.name}
                  </Link>
                )}

                {/* Mobile Dropdown */}
                {hasSubs && isOpen && (
                  <div
                    className="absolute left-0 top-full mt-2 min-w-[170px] bg-[#3E2723] border border-[#E6D8C8]/20 rounded-md shadow-2xl py-2 px-1 z-50 animate-in fade-in slide-in-from-top-1"
                  >
                    <Link
                      href={`/shop?category=${encodeURIComponent(cat.slug)}`}
                      className="block px-3 py-1.5 text-[10.5px] font-medium tracking-wide text-[#E6D8C8] hover:bg-[#E6D8C8]/15 rounded"
                      onClick={() => setOpenMobileDropdown(null)}
                    >
                      All {cat.name}
                    </Link>
                    <div className="h-px bg-[#E6D8C8]/15 my-1 mx-2" />
                    {cat.subcategories.map(sub => (
                      <Link
                        key={sub._id}
                        href={`/shop?category=${encodeURIComponent(cat.slug)}&subcategory=${encodeURIComponent(sub.slug)}`}
                        className="block px-3 py-1.5 text-[10.5px] font-normal tracking-wide text-[#E6D8C8]/90 hover:bg-[#E6D8C8]/15 rounded"
                        onClick={() => setOpenMobileDropdown(null)}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
