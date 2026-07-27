'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
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

  useEffect(() => {
    if (!isAutoPlay) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlay])

  // Client-only cache buster so replaced images show immediately during development.
  useEffect(() => {
    // Use a timestamp so browsers refetch assets when component mounts.
    setAssetVersion(String(Date.now()))
  }, [])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlay(false)
    setTimeout(() => setIsAutoPlay(true), 3000)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderImages.length)
    setIsAutoPlay(false)
    setTimeout(() => setIsAutoPlay(true), 3000)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length)
    setIsAutoPlay(false)
    setTimeout(() => setIsAutoPlay(true), 3000)
  }

  const currentImage = sliderImages[currentSlide]

  return (
      <section className="w-full bg-background">
        <div className="relative w-full h-[18rem] md:h-[560px] lg:h-[720px] overflow-hidden">
        {/* Slider Images */}
        {sliderImages.map((slide: Slide, index: number) => (
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
