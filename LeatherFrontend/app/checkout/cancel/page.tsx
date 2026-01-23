// 'use client'

// import Link from 'next/link'
// import Header from '@/components/header'
// import Footer from '@/components/footer'
// import { Button } from '@/components/ui/button'
// import { XCircle } from 'lucide-react'

// export default function CheckoutCancelPage() {
//   return (
//     <>
//       <Header />
//       <main className="bg-background min-h-[70vh] flex items-center justify-center">
//         <div className="max-w-md w-full mx-4 text-center p-8 border border-border">
//           <div className="flex justify-center mb-6">
//             <XCircle className="w-16 h-16 text-red-500" />
//           </div>
//           <h1 className="text-3xl font-serif mb-4">Payment Cancelled</h1>
//           <p className="text-muted-foreground mb-8">
//             Your payment was cancelled or failed. No charges were made.
//           </p>
//           <div className="space-y-3">
//             <Link href="/checkout" className="block">
//               <Button className="w-full">Try Again</Button>
//             </Link>
//             <Link href="/contact" className="block">
//               <Button variant="outline" className="w-full">Contact Support</Button>
//             </Link>
//           </div>
//         </div>
//       </main>
//       <Footer />
//     </>
//   )
// }
