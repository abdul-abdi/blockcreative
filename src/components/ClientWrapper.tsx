'use client';

import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import HeroSection from './sections/HeroSection';
import BenefitsSection from './sections/BenefitsSection';
import ProcessSection from './sections/ProcessSection';
import FeaturesSection from './sections/FeaturesSection';
import TestimonialsSection from './sections/TestimonialsSection';
import StorySection from './sections/StorySection';
import CTASection from './sections/CTASection';
import Footer from './sections/Footer';
import { ModalProvider } from './ModalProvider';

export default function ClientWrapper() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-black">
      {isClient && (
        <ModalProvider>
          <Navbar />
          <main className="flex-grow">
            <HeroSection />
            <div id="story">
              <StorySection />
            </div>
            <div id="benefits">
              <BenefitsSection />
            </div>
            <div id="process">
              <ProcessSection />
            </div>
            <div id="features">
              <FeaturesSection />
            </div>
            <div id="testimonials">
              <TestimonialsSection />
            </div>
            <CTASection />
          </main>
          <Footer />
        </ModalProvider>
      )}
    </div>
  );
} 