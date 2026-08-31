'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Slide = {
  image: string
  heading: string
  category: string
  cta: string
}

const sliderImages: Slide[] = [
  {
    image: '/banner1.png',
    heading: 'MADE TO MATTER',
    category: 'men-collection',
    cta: 'Discover',
  },
  {
    image: '/banner2.png',
    heading: 'STYLE THAT ENDURES',
    category: 'office-collection',
    cta: 'Shop Now',
  },
  {
    image: '/banner3.png',
    heading: 'TIMELESS ELEGANCE',
    category: 'women-collection',
    cta: 'Explore',
  },
  {
    image: '/banner4.png',
    heading: 'CRAFTED FOR LIFE',
    category: 'travel-collection',
    cta: 'Discover',
  },
  {
    image: '/banner5.png',
    heading: 'REFINED FOREVER',
    category: 'new-arrivals',
    cta: 'Shop Now',
  },
  {
    image: '/banner6.png',
    heading: 'CARRY WITH CONFIDENCE',
    category: 'accessories-collection',
    cta: 'Explore',
  },
  {
    image: '/banner7.png',
    heading: 'MODERN LUXURY',
    category: 'limited-edition',
    cta: 'Discover',
  },
]

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState<number>(0)
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(true)
  const [assetVersion, setAssetVersion] = useState<string>('')
  const [remoteSlides, setRemoteSlides] = useState<Slide[] | null>(null)

  // Use remote banners if available, otherwise use local banners
  const slides =
    remoteSlides && remoteSlides.length > 0
      ? remoteSlides
      : sliderImages

  // Auto play
  useEffect(() => {
    if (!isAutoPlay || slides.length === 0) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlay, slides.length])

  // Cache buster
  useEffect(() => {
    setAssetVersion(String(Date.now()))
  }, [])

  // Fetch banners from backend
  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const res = await apiFetch('/api/v1/banners')
        const data = res?.data || []

        if (!mounted) return

        if (Array.isArray(data) && data.length > 0) {
          const mapped: Slide[] = data.map((b: any) => ({
            image: b.imageUrl || '/placeholder.svg',
            heading: b.title || b.subtitle || '',
            category: b.category || '',
            cta: b.ctaText || 'Shop',
          }))

          setRemoteSlides(mapped)
        }
      } catch (e) {
        console.warn(
          'Hero: failed to fetch banners, using fallback',
          e
        )
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  const goToSlide = (index: number) => {
    const idx =
      slides.length > 0 ? index % slides.length : 0

    setCurrentSlide(idx)
    setIsAutoPlay(false)

    setTimeout(() => {
      setIsAutoPlay(true)
    }, 3000)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) =>
      slides.length > 0
        ? (prev + 1) % slides.length
        : 0
    )

    setIsAutoPlay(false)

    setTimeout(() => {
      setIsAutoPlay(true)
    }, 3000)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      slides.length > 0
        ? (prev - 1 + slides.length) % slides.length
        : 0
    )

    setIsAutoPlay(false)

    setTimeout(() => {
      setIsAutoPlay(true)
    }, 3000)
  }

  // Make sure current slide is valid
  useEffect(() => {
    if (slides.length === 0) {
      setCurrentSlide(0)
      return
    }

    setCurrentSlide((prev) => {
      if (prev < 0) return 0
      if (prev >= slides.length) {
        return prev % slides.length
      }
      return prev
    })
  }, [slides.length])

  const currentImage = slides[currentSlide] || slides[0]

  return (
    <section className="w-full bg-[#2E1B19] mt-0 p-0 border-0">
      <div
        className="
          relative
          w-full
          overflow-hidden
          aspect-[2.56/1]
        "
      >
        {/* Slider Images */}
        {slides.map((slide: Slide, index: number) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide
                ? 'opacity-100'
                : 'opacity-0'
            }`}
          >
            {typeof slide.image === 'string' &&
            slide.image.startsWith('/') ? (
              <img
                src={`${slide.image}${
                  assetVersion
                    ? `?v=${assetVersion}`
                    : ''
                }`}
                alt={slide.heading}
                className="absolute inset-0 w-full h-full object-cover object-center"
                loading={
                  index === 0 ? 'eager' : 'lazy'
                }
              />
            ) : (
              <Image
                src={
                  slide.image || '/placeholder.svg'
                }
                alt={slide.heading}
                fill
                className="object-cover object-center"
                priority={index === 0}
              />
            )}
          </div>
        ))}

        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center z-10 px-4">
          <div className="text-center animate-fade-up max-w-3xl w-full px-2 sm:px-6">
            <h2 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light tracking-widest mb-3 sm:mb-6">
              {currentImage?.heading}
            </h2>

            <Link href="/shop">
              <Button className="btn-smooth bg-white text-neutral-900 hover:bg-gray-100 px-6 py-2 text-sm tracking-wide font-semibold border border-white">
                {currentImage?.cta}
              </Button>
            </Link>
          </div>
        </div>

        {/* Previous Button */}
        <button
          onClick={prevSlide}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Next Button */}
        <button
          onClick={nextSlide}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition"
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index: number) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-white w-8'
                  : 'bg-white/50 w-2 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}