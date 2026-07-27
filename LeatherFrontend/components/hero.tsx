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
  }
];


export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState<number>(0)
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(true)
  const [assetVersion, setAssetVersion] = useState<string>('')
  const [remoteSlides, setRemoteSlides] = useState<Slide[] | null>(null)

  // Determine which slides to show (remote banners if available, otherwise local)
  const slides = remoteSlides && remoteSlides.length > 0 ? remoteSlides : sliderImages

  useEffect(() => {
    if (!isAutoPlay) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlay, slides.length])

  // Client-only cache buster so replaced images show immediately during development.
  useEffect(() => {
    // Use a timestamp so browsers refetch assets when component mounts.
    setAssetVersion(String(Date.now()))
  }, [])

  // Fetch banners from backend; fall back silently to local sliderImages
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
        // ignore and fall back to local images
        console.warn('Hero: failed to fetch banners, using fallback', e)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const goToSlide = (index: number) => {
    const idx = slides.length > 0 ? index % slides.length : 0
    setCurrentSlide(idx)
    setIsAutoPlay(false)
    setTimeout(() => setIsAutoPlay(true), 3000)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (slides.length > 0 ? (prev + 1) % slides.length : 0))
    setIsAutoPlay(false)
    setTimeout(() => setIsAutoPlay(true), 3000)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (slides.length > 0 ? (prev - 1 + slides.length) % slides.length : 0))
    setIsAutoPlay(false)
    setTimeout(() => setIsAutoPlay(true), 3000)
  }

  // Ensure currentSlide is within bounds when slides length changes
  useEffect(() => {
    if (!slides || slides.length === 0) {
      setCurrentSlide(0)
      return
    }
    setCurrentSlide((prev) => {
      if (prev < 0) return 0
      if (prev >= slides.length) return prev % slides.length
      return prev
    })
  }, [slides.length])

  const currentImage = slides[currentSlide] || slides[0]

  return (
      <section className="w-full bg-background">
        <div className="relative w-full h-[18rem] md:h-[560px] lg:h-[720px] overflow-hidden">
        {/* Slider Images */}
        {slides.map((slide: Slide, index: number) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {typeof slide.image === 'string' && slide.image.startsWith('/') ? (
              // For local images we render a plain <img> when adding a cache-busting query
              // Next Image rejects local images with query strings unless configured. Using
              // a regular <img> here avoids that while preserving object-cover behavior.
              <img
                src={`${(slide.image || '/placeholder.svg')}${assetVersion ? `?v=${assetVersion}` : ''}`}
                alt={slide.heading}
                className="object-cover w-full h-full"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            ) : (
              <Image
                src={slide.image || '/placeholder.svg'}
                alt={slide.heading}
                fill
                className="object-cover"
                priority={index === 0}
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            )}
            <div className="absolute inset-0 bg-black/30" />
          </div>
        ))}

        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <div className="text-center animate-fade-up">
            <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-light tracking-widest mb-6">
              {currentImage.heading}
            </h2>
            <Link href="/shop">
              <Button className="btn-smooth bg-white text-neutral-900 hover:bg-gray-100 px-6 py-2 text-sm tracking-wide font-semibold border border-white">
                {currentImage.cta}
              </Button>
            </Link>
          </div>
        </div>

        <button
          onClick={prevSlide}
          className="absolute left-6 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-6 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition"
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
          {sliderImages.map((_, index: number) => (
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
