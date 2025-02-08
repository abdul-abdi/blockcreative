'use client';

import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Loading from './Loading';

// Dynamically import components with proper loading states
const Navbar = dynamic(() => import('./Navbar'), {
  ssr: false,
  loading: () => <Loading />
});

const HeroSection = dynamic(() => import('./sections/HeroSection'), {
  ssr: false,
  loading: () => <Loading />
});

const BenefitsSection = dynamic(() => import('./sections/BenefitsSection'), {
  loading: () => <Loading />
});

const ProcessSection = dynamic(() => import('./sections/ProcessSection'), {
  loading: () => <Loading />
});

const FeaturesSection = dynamic(() => import('./sections/FeaturesSection'), {
  loading: () => <Loading />
});

const TechnologySection = dynamic(() => import('./sections/TechnologySection'), {
  loading: () => <Loading />
});

const PricingSection = dynamic(() => import('./sections/PricingSection'), {
  loading: () => <Loading />
});

const TestimonialsSection = dynamic(() => import('./sections/TestimonialsSection'), {
  loading: () => <Loading />
});

const CTASection = dynamic(() => import('./sections/CTASection'), {
  loading: () => <Loading />
});

const Footer = dynamic(() => import('./sections/Footer'), {
  loading: () => <Loading />
});

export default function ClientWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Loading />;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Suspense fallback={<Loading />}>
          <HeroSection />
          <BenefitsSection />
          <ProcessSection />
          <FeaturesSection />
          <TechnologySection />
          <PricingSection />
          <TestimonialsSection />
          <CTASection />
        </Suspense>
      </main>
      <Suspense fallback={<Loading />}>
        <Footer />
      </Suspense>
    </>
  );
} 