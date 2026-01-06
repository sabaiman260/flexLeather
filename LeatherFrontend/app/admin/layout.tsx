'use client'

import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Header from '@/components/header'
import Footer from '@/components/footer'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminNavbar from '@/components/admin/AdminNavbar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || user?.userRole !== 'admin') {
        router.push('/login')
      }
    }
  }, [isLoading, isLoggedIn, user, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-lg font-medium animate-pulse">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn || user?.userRole !== 'admin') {
    return null // Redirecting
  }

  return (
    <>
      <Header />
      <main className="bg-background min-h-screen">
        <AdminNavbar />
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-16 pb-6 flex gap-6">
          <AdminSidebar />
          <div className="flex-1">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
