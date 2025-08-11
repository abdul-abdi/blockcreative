'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { appKitModal } from '@/context';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import MarketplaceChoiceModal from '@/components/MarketplaceChoiceModal';
import { useMarketplace } from '@/context/audio';

const navigation = [
  { name: 'Story', href: '#story' },
  { name: 'Benefits', href: '#benefits' },
  { name: 'Process', href: '#process' },
  { name: 'Features', href: '#features' },
  { name: 'Testimonials', href: '#testimonials' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  const { setMarketplace } = useMarketplace();
  
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
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Function to handle connect/account button click
  const handleConnectClick = async () => {
    if (isConnected) {
      await appKitModal.open({ view: 'Account' });
    } else {
      await appKitModal.open();
    }
  };

  // Function to go to dashboard based on user choice and role
  const handleDashboardClick = () => {
    // Open marketplace modal instead of direct navigation
    setShowMarketplaceModal(true);
  };

  const handleMarketPlaceModal = (choice: 'script' | 'audio') => {
    setShowMarketplaceModal(false);
    setMarketplace(choice);

    const userRole = localStorage.getItem('userRole') || 'writer';
    if (choice === 'script') {
      router.push(`/${userRole}/dashboard`);
    } else {
      router.push(`/audiomarket/${userRole}/dashboard`);
    }
  };

  const scrollToSection = (href: string) => {
    const sectionId = href.replace('#', '');
    const element = document.getElementById(sectionId);

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'backdrop-blur-lg bg-black/80' : 'bg-transparent'}`}>
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
            
            <div className="ml-4 flex items-center space-x-3">
              {isConnected && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleDashboardClick}
                    className="px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Dashboard
                  </button>
                  
                  <button
                    onClick={handleConnectClick}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] rounded-lg hover:opacity-90 transition-opacity flex items-center"
                  >
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                  </button>
                </div>
              )}
              
              {!isConnected && (
                <Link 
                  href="/signup"
                  className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] rounded-lg hover:opacity-90 transition-opacity"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-white focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-black/95 backdrop-blur-lg"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-4">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      scrollToSection(item.href);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-3 py-2 text-sm font-medium transition-all ${
                      activeSection === item.href.replace('#', '')
                      ? 'text-[rgb(var(--accent-primary))]'
                      : 'text-gray-300'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
                
                <div className="grid grid-cols-1 gap-3 pt-4 border-t border-white/10">
                  {isConnected ? (
                    <>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          handleDashboardClick();
                        }}
                        className="w-full py-3 text-center bg-white/10 rounded-lg text-white font-medium"
                      >
                        Dashboard
                      </button>
                      
                      <button
                        onClick={() => {
                          handleConnectClick();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full py-3 text-center bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] rounded-lg text-white font-medium flex items-center justify-center"
                      >
                        <span className="flex items-center justify-center">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                          {address?.slice(0, 6)}...{address?.slice(-4)}
                        </span>
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-3 text-center bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] rounded-lg text-white font-medium"
                    >
                      Get Started
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MarketplaceChoiceModal
        open={showMarketplaceModal}
        onClose={() => setShowMarketplaceModal(false)}
        onSelect={handleMarketPlaceModal}
      />
    </header>
  );
}