import Header from '@/components/header'
import Footer from '@/components/footer'
// Note: the site does not support return request submissions.
// This page shows the official Return Policy only.

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
              <li>Standard (Domestic): 3–5 business days</li>
              <li>Express (Domestic): 2–4 business days</li>
              <li>International: 10–20 business days (varies by destination)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-serif font-light mb-2">Return Policy</h3>
            <p className="text-sm opacity-80 mb-4">We accept returns only for genuine issues with your order. Please read the policy below carefully; this page explains the circumstances in which returns or replacements will be considered and the steps to follow.</p>

            <div className="border border-border p-6 rounded">
              <h4 className="text-sm mb-3 font-serif font-light">When We Accept Returns</h4>
              <ul className="list-disc ml-6 text-sm opacity-80 mb-4">
                <li>Wrong product delivered (an entirely different item than ordered).</li>
                <li>Product received damaged, defective, or with a manufacturing fault.</li>
                <li>We have sent an incorrect size (not a sizing issue caused by normal wear).</li>
              </ul>

              <h4 className="text-sm mb-3 font-serif font-light">When Returns Are Not Accepted</h4>
              <ul className="list-disc ml-6 text-sm opacity-80 mb-4">
                <li>Change of mind or buyer's remorse.</li>
                <li>Colour preference or perceived difference due to screen/lighting.</li>
                <li>Normal wear and tear or damage caused after delivery.</li>
              </ul>

              <h4 className="text-sm mb-3 font-serif font-light">How To Request A Return</h4>
              <p className="text-sm opacity-80 mb-2">Contact our support team within <strong>7 days of delivery</strong> with the following information:</p>
              <ul className="list-disc ml-6 text-sm opacity-80 mb-4">
                <li>Your order number and the item SKU or name.</li>
                <li>A clear photo or video showing the issue (damage, defect, wrong item, or incorrect size).</li>
                <li>Date of delivery and the delivery address used.</li>
              </ul>

              <p className="text-sm opacity-80 mb-2">After you contact support, our team will verify the information and may request additional photos or details. Once verified, we will approve either a replacement or a return.</p>

              <p className="text-sm opacity-80">If your return or replacement is approved, you will receive detailed instructions via email or WhatsApp explaining the next steps, including how to return the item (if required) and timelines for replacement or refund. No online return form is provided on this site.</p>
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
