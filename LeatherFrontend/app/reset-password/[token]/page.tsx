import Header from '@/components/header'
import Footer from '@/components/footer'

// Server component that renders a client form with token prop
import ResetForm from './ResetForm'

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  // In Next.js 16, params is a Promise that must be awaited
  const { token } = await params
  
  if (!token) {
    return (
      <>
        <Header />
        <main className="bg-background min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600">Invalid reset link. Token is missing.</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <ResetForm token={token} />
      <Footer />
    </>
  )
}
