import Header from '@/components/header'
import Footer from '@/components/footer'
import ReturnRequestForm from '@/components/return-request-form'

export const metadata = {
  title: 'Shipping & Returns — FlexLeather',
  description: 'Shipping options, processing times and returns information for FlexLeather orders.',
}

export default function ShippingReturnsPage() {
  return (
    <>
      <Header />
      <main className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <h1 className="text-3xl md:text-4xl font-serif font-light tracking-wide mb-6">Shipping & Returns</h1>

          <section className="mb-8">
            <h3 className="text-lg font-serif font-light mb-2">Shipping</h3>
            <p className="text-sm opacity-80 mb-4">Orders are processed in 1–2 business days. We offer standard and express shipping. Shipping costs and delivery times are calculated at checkout based on your chosen service and destination.</p>

            <ul className="list-disc ml-6 text-sm opacity-80">
              <li>Standard (Domestic): 5–10 business days</li>
              <li>Express (Domestic): 2–4 business days</li>
              <li>International: 10–20 business days (varies by destination)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-serif font-light mb-2">Return Policy</h3>
            <p className="text-sm opacity-80 mb-4">We accept returns within 14 days of delivery on items that are unworn and in original condition. To start a return, please fill out the form below or contact us via the contact page.</p>

            <div className="border border-border p-6 rounded">
              <h4 className="text-sm mb-3 font-serif font-light">Start a Return</h4>
              <ReturnRequestForm />
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-serif font-light mb-2">Refunds</h3>
            <p className="text-sm opacity-80">Once we receive and inspect your return, refunds are processed to the original payment method within 5–7 business days. If you used Cash on Delivery, we’ll contact you to issue a refund via agreed method.</p>
          </section>

        </div>
      </main>
      <Footer />
    </>
  )
}
