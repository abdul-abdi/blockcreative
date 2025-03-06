'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { ModalProvider } from './ModalProvider';

const navigation = [
  { name: 'Story', href: '#story' },
  { name: 'Benefits', href: '#benefits' },
  { name: 'Process', href: '#process' },
  { name: 'Features', href: '#features' },
  { name: 'Testimonials', href: '#testimonials' },
];

const authLinks = [
  { name: 'Sign In', href: '/signin', isPrimary: false },
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
              className="flex items-center space-x-2 text-xl md:text-2xl font-bold gradient-text hover:scale-105 transition-transform"
              onClick={() => scrollToSection('#top')}
            >
              <svg width="32" height="32" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
                <defs>
                  <linearGradient id="navGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'rgb(var(--accent-primary))' }} />
                    <stop offset="100%" style={{ stopColor: 'rgb(var(--accent-secondary))' }} />
                  </linearGradient>
                </defs>
                <path d="M256 96L384 176V336L256 416L128 336V176L256 96Z" 
                      stroke="url(#navGradient)" 
                      strokeWidth="24" 
                      strokeLinejoin="round"
                      fill="none"/>
                <path d="M320 192L240 272L224 336L288 320L368 240L320 192Z" 
                      fill="url(#navGradient)"/>
                <circle cx="208" cy="352" r="8" fill="url(#navGradient)"/>
                <circle cx="192" cy="368" r="6" fill="url(#navGradient)"/>
                <circle cx="184" cy="384" r="4" fill="url(#navGradient)"/>
              </svg>
              <span>BlockCreative</span>
              
               <appkit-button />

              {/* Uncomment this if needed
              <ModalProvider>
                <div></div>
              </ModalProvider> */}
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
                    className={link.isPrimary 
                      ? 'button-primary text-sm lg:text-base whitespace-nowrap' 
                      : 'px-4 py-2 text-sm lg:text-base text-white transition-all rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 hover:scale-105'}
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
                      className={link.isPrimary 
                        ? 'button-primary text-lg w-full max-w-[200px] text-center' 
                        : 'text-lg text-white w-full max-w-[200px] text-center px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-all hover:scale-105'}
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