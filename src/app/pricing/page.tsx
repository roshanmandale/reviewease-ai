import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQ } from '@/components/landing/FAQ';
import { CTASection } from '@/components/landing/CTASection';

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <div className="bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 py-20 text-center">
          <h1 className="text-5xl font-extrabold text-white">Simple, transparent pricing</h1>
          <p className="mt-4 text-xl text-gray-400 max-w-xl mx-auto">
            Start free. Upgrade when you need more. No hidden fees.
          </p>
        </div>
        <PricingSection />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
