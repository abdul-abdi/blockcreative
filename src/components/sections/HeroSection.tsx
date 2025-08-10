'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import BackgroundSplashes from '../BackgroundSplashes';

// Sample gradient colors for script placeholders
const gradients = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-red-500',
  'from-indigo-500 to-purple-500',
  'from-pink-500 to-rose-500',
];

export default function HeroSection() {
  // Handle smooth scrolling
  const handleScroll = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden">
      {/* Background Splashes */}
      <BackgroundSplashes />
      
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-900/40 to-black/80" />

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.h1 
              className="mb-4 md:mb-6 text-4xl md:text-5xl lg:text-6xl font-bold leading-tight bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent neon-glow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1,
                y: [0, -8, 0]
              }}
              transition={{
                duration: 0.5,
                y: {
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }
              }}
            >
              Revolutionize Scriptwriting with Blockchain & AI
            </motion.h1>

            <motion.p 
              className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 md:mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Producers post bounties, writers submit creative ideas, and our AI ranks the best submissions. 
              All secured and rewarded through blockchain, creating the future of scriptwriting collaboration.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link href="/signup" className="button-primary text-center">
                Get Started
              </Link>
              <button 
                onClick={() => handleScroll('features')}
                className="button-secondary"
              >
                Learn More
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="grid grid-cols-3 gap-2 md:gap-4 mt-8 md:mt-12"
            >
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold gradient-text">1K+</div>
                <div className="text-xs md:text-sm text-gray-400">Active Bounties</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold gradient-text">5K+</div>
                <div className="text-xs md:text-sm text-gray-400">Script Submissions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold gradient-text">$2.5M+</div>
                <div className="text-xs md:text-sm text-gray-400">Bounties Awarded</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Script Collage */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative h-[400px] md:h-[500px] lg:h-[600px] hidden md:block"
          >
            {/* Rotating script placeholders */}
            <div className="absolute inset-0">
              {gradients.map((gradient, index) => (
                <motion.div
                  key={gradient}
                  className="absolute w-36 md:w-48 h-48 md:h-64"
                  style={{
                    top: `${Math.sin(index * (Math.PI / 3)) * 150 + 250}px`,
                    left: `${Math.cos(index * (Math.PI / 3)) * 150 + 150}px`,
                  }}
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 20 + index * 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <div className="w-full h-full bg-white/10 backdrop-blur-sm rounded-lg p-2">
                    <div className={`w-full h-full rounded-lg bg-gradient-to-br ${gradient} opacity-80`}>
                      {/* Script-like content */}
                      <div className="p-4 space-y-2">
                        <div className="w-3/4 h-2 bg-white/20 rounded" />
                        <div className="w-1/2 h-2 bg-white/20 rounded" />
                        <div className="w-2/3 h-2 bg-white/20 rounded" />
                        <div className="w-3/4 h-2 bg-white/20 rounded" />
                        <div className="w-1/2 h-2 bg-white/20 rounded" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Center glow effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 md:w-64 h-48 md:h-64">
              <div className="absolute inset-0 bg-[rgb(var(--accent-primary))]/20 rounded-full blur-3xl animate-pulse-slow" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full p-1">
          <motion.div 
            className="w-1.5 h-3 bg-white rounded-full mx-auto"
            animate={{ 
              y: [0, 12, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </motion.div>
    </section>
  );
} 