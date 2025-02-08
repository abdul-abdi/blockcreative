'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';

export default function BackgroundSplashes() {
  // Respect user's reduced motion preferences
  const shouldReduceMotion = useReducedMotion();

  // Memoize the random positions to prevent recalculation on re-renders
  const particlePositions = useMemo(() => 
    Array.from({ length: 8 }, () => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
    })), 
  []);

  // Adjust sizes for mobile
  const getSplashSize = (baseSize: number, increment: number, index: number) => {
    return {
      width: `clamp(${baseSize}px, ${baseSize/10}vw, ${baseSize + increment * index}px)`,
      height: `clamp(${baseSize}px, ${baseSize/10}vw, ${baseSize + increment * index}px)`,
    };
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Large central splash - responsive size */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={shouldReduceMotion ? { opacity: 0.05 } : { 
          opacity: [0.05, 0.08, 0.05],
          scale: [1, 1.2, 1],
          rotate: [0, 45, 0]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[clamp(300px,80vw,800px)] h-[clamp(300px,80vw,800px)]"
      >
        <div className="w-full h-full bg-white/10 rounded-full blur-3xl" />
      </motion.div>

      {/* Floating splashes - fewer on mobile */}
      {[...Array(shouldReduceMotion ? 3 : 6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={shouldReduceMotion ? { opacity: 0.02 } : {
            opacity: [0.01, 0.03, 0.01],
            y: [0, -20, 0],
            x: [0, i % 2 === 0 ? 20 : -20, 0]
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            delay: i * 1.5,
            ease: "easeInOut"
          }}
          className="absolute hidden sm:block"
          style={{
            top: `${20 + i * 15}%`,
            left: `${10 + i * 15}%`,
            ...getSplashSize(200, 50, i)
          }}
        >
          <div className="w-full h-full bg-white/5 rounded-full blur-3xl" />
        </motion.div>
      ))}

      {/* Additional diagonal splashes - fewer on mobile */}
      {[...Array(shouldReduceMotion ? 2 : 4)].map((_, i) => (
        <motion.div
          key={`diagonal-${i}`}
          initial={{ opacity: 0 }}
          animate={shouldReduceMotion ? { opacity: 0.02 } : {
            opacity: [0.02, 0.04, 0.02],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 6 + i * 2,
            repeat: Infinity,
            delay: i * 2,
            ease: "easeInOut"
          }}
          className="absolute hidden md:block"
          style={{
            top: `${30 + i * 20}%`,
            right: `${10 + i * 20}%`,
            ...getSplashSize(300, 40, i)
          }}
        >
          <div className="w-full h-full bg-white/5 rounded-full blur-3xl" />
        </motion.div>
      ))}

      {/* Small floating particles - optimized for mobile */}
      {[...Array(shouldReduceMotion ? 4 : 8)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          initial={{ opacity: 0 }}
          animate={shouldReduceMotion ? { opacity: 0.05 } : {
            opacity: [0.05, 0.1, 0.05],
            y: [0, -30, 0],
            x: [0, i % 2 === 0 ? 30 : -30, 0]
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut"
          }}
          className="absolute"
          style={{
            ...particlePositions[i],
            ...getSplashSize(20, 10, i)
          }}
        >
          <div className="w-full h-full bg-white/10 rounded-full blur-xl" />
        </motion.div>
      ))}
    </div>
  );
} 