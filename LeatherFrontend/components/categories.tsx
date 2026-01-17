 'use client'

import Link from 'next/link'
import { useState } from 'react'
import Image from 'next/image'

const categories = [
  {
    name: 'WOMEN',
    image: '/woman.jpg',
    link: '/shop?category=women'
  },
  {
    name: 'MEN',
    image: '/man.jpg',
    link: '/shop?category=men'
  },
  {
    name: 'GIFT IDEAS',
    image: '/gifts.jpg',
    link: '/shop?category=gift-ideas'
  },
  {
    name: 'KIDS',
    image: '/travel.jpg',
    link: '/shop?category=kids'
  },
  {
    name: 'OFFICE',
    image: '/office.jpg',
    link: '/shop?category=office'
  }
]

export default function Categories() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  return (
    <section className="bg-transparent py-16 md:py-20 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-20 w-32 h-32 bg-amber-700 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-10 right-20 w-40 h-40 bg-amber-800 rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
          {categories.map(category => (
            <Link
              key={category.name}
              href={category.link}
              className="group relative flex items-center justify-center"
              onMouseEnter={() => setHoveredCategory(category.name)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <div className="relative w-full aspect-square rounded-full overflow-hidden bg-neutral-700">
                <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-110">
                  <Image
                    src={category.image}
                    alt={category.name}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/30 to-transparent" />
                </div>

                <div className="absolute inset-0 flex items-end justify-center pb-6 md:pb-8">
                  <h3 className="text-xl md:text-2xl font-light tracking-widest text-white text-center px-3">
                    {category.name}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
