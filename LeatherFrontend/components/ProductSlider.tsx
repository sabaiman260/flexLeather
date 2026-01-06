// "use client";

// import Image from "next/image";

// export default function ProductSlider() {
//   const images = [
//     "/woman.jpg",
//     "/man.jpg",
//     "/office.jpg",
//     "/travel.jpg",
//     "/gifts.jpg",
//   ];

//   return (
//     <div className="w-full overflow-hidden py-10 bg-white">
//       <div className="relative flex items-center">
//         {/* Infinite Slide Track */}
//         <div className="flex animate-slide whitespace-nowrap">
//           {images.concat(images).map((img, index) => (
//             <div key={index} className="mx-4 w-52 h-52 rounded-xl overflow-hidden shadow-md">
//               <img
//                 src={img}
//                 alt="Product"
//                 className="w-full h-full object-cover rounded-xl"
//               />
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }


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
      <div className="relative w-[300px] h-[300px] perspective">
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
