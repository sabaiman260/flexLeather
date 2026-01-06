import Header from '@/components/header'
import Footer from '@/components/footer'

export const metadata = {
  title: 'Privacy Policy — FlexLeather',
  description: 'Our privacy policy explains how we collect and use personal data when you shop at FlexLeather.',
}

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <h1 className="text-3xl md:text-4xl font-serif font-light tracking-wide mb-6">Privacy Policy</h1>

          <p className="text-sm opacity-80 mb-6">FlexLeather respects your privacy and is committed to protecting your personal data. This policy describes how we collect and use your information when you visit our website or make a purchase.</p>

          <section className="mb-8">
            <h3 className="text-lg font-serif font-light mb-2">Information We Collect</h3>
            <ul className="list-disc ml-6 text-sm opacity-80">
              <li>Contact details (name, email, phone) when you create an account or place an order.</li>
              <li>Order history and billing/shipping addresses to process and deliver orders.</li>
              <li>Payment information is processed securely via our payment provider and is not stored on our servers.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-serif font-light mb-2">How We Use Your Data</h3>
            <p className="text-sm opacity-80">We use your information to process orders, respond to inquiries, and improve our products and service. With your consent we may send promotional emails; you can unsubscribe at any time.</p>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-serif font-light mb-2">Security & Sharing</h3>
            <p className="text-sm opacity-80">We follow industry standards to keep your data secure. We never sell your personal information. We may share necessary data with trusted partners (shipping carriers, payment gateways) only for order fulfillment.</p>
          </section>

          <p className="text-sm opacity-80">For any questions about privacy or data removal, contact us at <a className="underline" href="mailto:info@flexleather.com">info@flexleather.com</a>.</p>
        </div>
      </main>
      <Footer />
    </>
  )
}
