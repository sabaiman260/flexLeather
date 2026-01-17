"use client";
import Link from 'next/link'
import Image from 'next/image'

export default function LeatherShowcase() {
  const images = [
    "/woman.jpg",
    "/man.jpg",
    "/office.jpg",
    "/travel.jpg",
    "/gifts.jpg",
    "/Tote Bag.jpg",
  ];

  return (
    <section className="w-full bg-white py-20">
      <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center lg:items-start gap-12">
        
        {/* Left Text Section */}
        <div className="flex-1 text-center lg:text-left">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 mb-4">
            Premium Leather Collections
          </h2>
          <p className="text-gray-700 mb-6 text-base sm:text-lg">
            Discover our exquisite range of handcrafted leather products. Each piece is designed for durability, elegance, and timeless style.
          </p>
         <Link
  href="/shop"
  className="inline-block bg-brand-brown text-white px-6 py-3 rounded-lg shadow-md hover:bg-black transition"
>
  Explore Collection
</Link>

        </div>

        {/* Right 3D Slider */}
        <div className="flex-1 flex justify-center lg:justify-end">
          <div className="relative w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] md:w-[340px] md:h-[340px] perspective">
            <div className="slider3d animate-rotate3D">
              {images.map((img, i) => (
                <div key={i} className="slide">
                  <Image
                    src={img}
                    alt={`showcase ${i+1}`}
                    width={340}
                    height={340}
                    className="w-full h-full object-cover rounded-xl shadow-lg"
                    priority={i === 0}
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
