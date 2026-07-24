import type { Metadata } from 'next'
import { Geist, Geist_Mono, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import CartProvider from '@/components/cart-context'
import { AuthProvider } from '@/components/auth-provider'
import { Toaster } from '@/components/ui/sonner'
import AnnouncementBar from '@/components/AnnouncementBar'
import { Suspense } from 'react' // 1. Suspense import kiya

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400','700'], variable: '--font-playfair' })

export const metadata: Metadata = {
  title: 'FlexLeather',
  description: 'Luxury leather handbags, wallets, and travel accessories. Handcrafted with premium materials.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/logos.png', media: '(prefers-color-scheme: light)' },
      { url: '/logos.png', media: '(prefers-color-scheme: dark)' },
      { url: '/logos.png', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} font-sans antialiased overflow-x-hidden`}>
        <Toaster />
        <AnnouncementBar />
        <AuthProvider>
          <CartProvider>
            {/* 2. Pooray children content ko Suspense se wrap kar diya */}
            <Suspense fallback={
              <div className="flex min-h-screen items-center justify-center bg-black text-white font-serif">
                Loading FlexLeather...
              </div>
            }>
              {children}
            </Suspense>
          </CartProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}