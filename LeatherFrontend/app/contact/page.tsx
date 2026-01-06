import Header from '@/components/header'
import Footer from '@/components/footer'
import ContactForm from '@/components/contact-form'

export const metadata = {
  title: 'Contact Us — FlexLeather',
  description: 'Get in touch with FlexLeather customer support for orders, repairs, and general inquiries.',
}

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="bg-background min-h-screen">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-12">
          <h1 className="text-3xl md:text-4xl font-serif font-light tracking-wide mb-6">Contact Us</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-lg font-serif font-light mb-3">Customer Support</h2>
              <p className="text-sm opacity-80 mb-4">We’re happy to help. Whether you have a question about your order, want to request a repair, or need help with product care — send us a message and we’ll respond within 1-2 business days.</p>

              <div className="text-sm opacity-80 space-y-3">
                <div>
                  <strong>Email</strong>
                  <div className="opacity-80">info@flexleather.com</div>
                </div>
                <div>
                  <strong>Phone</strong>
                  <div className="opacity-80">+92 300 339 5535</div>
                </div>
                <div>
                  <strong>Address</strong>
                  <div className="opacity-80">Innovista Rachna DHA, G-12 Gujranwala, Pakistan</div>
                </div>
              </div>
            </div>

            <div>
              <ContactForm />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
