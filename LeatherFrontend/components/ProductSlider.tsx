
"use client";

export default function ProductSlider3D() {
  const images = [
    "/woman.jpg",
    "/man.jpg",
    "/office.jpg",
    "/travel.jpg",
    "/gifts.jpg",
    "/leather belt.jpg", // repeat if needed for smooth rotation
  ];

  return (
    <div className="w-full py-16 bg-white flex justify-center">
      <div className="relative w-full max-w-[300px] aspect-square perspective">
        <div className="slider3d animate-rotate3D">
          {images.map((img, i) => (
            <div key={i} className="slide">
              <img
                src={img}
                alt="product"
                className="w-full h-full object-cover rounded-xl shadow-lg"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
