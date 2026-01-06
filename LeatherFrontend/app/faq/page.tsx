import Header from '@/components/header'
import Footer from '@/components/footer'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'

export const metadata = {
  title: 'FAQ — FlexLeather',
  description: 'Frequently asked questions about ordering, shipping, returns, and product care at FlexLeather.',
}

export default function FaqPage() {
  return (
    <>
      <Header />
      <main className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <h1 className="text-3xl md:text-4xl font-serif font-light tracking-wide mb-6">Frequently Asked Questions</h1>

          <div className="max-w-3xl">
            <Accordion type="single" collapsible>
              <AccordionItem value="q1">
                <AccordionTrigger>How long does shipping take?</AccordionTrigger>
                <AccordionContent>
                  Delivery times depend on your location. Standard shipping usually takes 5–10 business days; international shipping may take longer. Orders are processed within 1–2 business days.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q2">
                <AccordionTrigger>What is your returns policy?</AccordionTrigger>
                <AccordionContent>
                  We accept returns within 14 days of delivery for items in unworn condition. Please use the 'Shipping & Returns' page for full instructions and the return form.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q3">
                <AccordionTrigger>Do you offer repairs?</AccordionTrigger>
                <AccordionContent>
                  Yes — we offer lifetime repair support for many of our products. Contact support with photos and details, and we’ll advise on next steps and estimated costs.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q4">
                <AccordionTrigger>How do I care for leather?</AccordionTrigger>
                <AccordionContent>
                  Avoid prolonged exposure to sunlight and moisture. Use a dry, soft cloth to remove surface dust. For conditioning and deep cleaning, use recommended leather care products.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
