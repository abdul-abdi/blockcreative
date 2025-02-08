'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Benefits', href: '#benefits' },
  { name: 'Process', href: '#process' },
  { name: 'Features', href: '#features' },
  { name: 'Technology', href: '#technology' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'Testimonials', href: '#testimonials' },
];

const authLinks = [
  { name: 'Sign In', href: '/signin' },
  { name: 'Get Started', href: '/signup', isPrimary: true },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  // Memoize the scroll handler
  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 10);

    // Check which section is currently in view
    const sections = navigation.map(nav => nav.href.replace('#', ''));
    const scrollPosition = window.scrollY + window.innerHeight / 3;

    for (const section of sections) {
      const element = document.getElementById(section);
      if (element) {
        const offsetTop = element.offsetTop;
        const offsetBottom = offsetTop + element.offsetHeight;

        if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
          setActiveSection(section);
          break;
        }
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Handle smooth scrolling
  const scrollToSection = useCallback((sectionId: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(sectionId.replace('#', ''));
    if (element) {
      const navHeight = 80; // Approximate navbar height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-black/80 backdrop-blur-lg shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link 
              href="/" 
              className="text-xl md:text-2xl font-bold gradient-text hover:scale-105 transition-transform"
              onClick={() => scrollToSection('#top')}
            >
              BlockCreative
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-8">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className={`px-3 py-2 text-sm lg:text-base transition-all hover:scale-105 ${
                    activeSection === item.href.replace('#', '')
                    ? 'text-[rgb(var(--accent-primary))] font-semibold'
                    : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {item.name}
                </button>
              ))}
              <div className="flex items-center gap-2 lg:gap-4 pl-2 lg:pl-4 border-l border-white/10">
                {authLinks.map((link) => (
                  <Link 
                    key={link.name}
                    href={link.href}
                    className={link.isPrimary ? 'button-primary text-sm lg:text-base whitespace-nowrap' : 'text-sm lg:text-base text-gray-300 hover:text-white transition-colors'}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-300 hover:text-white p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div className="fixed inset-0 bg-black/90 backdrop-blur-lg">
              <div className="flex flex-col items-center justify-center min-h-screen space-y-6 p-4">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => scrollToSection(item.href)}
                    className={`text-xl transition-all hover:scale-105 ${
                      activeSection === item.href.replace('#', '')
                      ? 'text-[rgb(var(--accent-primary))] font-semibold'
                      : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
                <div className="flex flex-col items-center gap-4 pt-6 border-t border-white/10 w-full">
                  {authLinks.map((link) => (
                    <Link 
                      key={link.name}
                      href={link.href}
                      className={link.isPrimary ? 'button-primary text-lg w-full max-w-[200px] text-center' : 'text-lg text-gray-300 hover:text-white transition-colors'}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 