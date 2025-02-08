'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { StarIcon } from '@heroicons/react/24/solid';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  image: string;
  quote: string;
  rating: number;
  company: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Executive Producer at Dreamworks",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    quote: "BlockCreative has transformed our script evaluation process. The AI ranking system is remarkably accurate, and the blockchain integration ensures complete transparency. We've discovered exceptional talent through the platform.",
    rating: 5,
    company: "DreamWorks Animation"
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Award-Winning Screenwriter",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    quote: "As a writer, I appreciate how BlockCreative protects my intellectual property while connecting me with serious producers. The smart contract system ensures fair compensation, and the AI feedback has helped me improve my craft.",
    rating: 5,
    company: "Independent"
  },
  {
    id: 3,
    name: "David Rodriguez",
    role: "Head of Content, Netflix",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
    quote: "The quality of submissions we receive through BlockCreative is consistently outstanding. The platform has streamlined our content acquisition process and helped us discover unique voices we might have otherwise missed.",
    rating: 5,
    company: "Netflix Studios"
  },
  {
    id: 4,
    name: "Emma Thompson",
    role: "Creative Director",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
    quote: "BlockCreative's innovative approach to script submissions and evaluation has revolutionized how we source content. The platform's AI-driven insights have proven invaluable in our decision-making process.",
    rating: 5,
    company: "Universal Pictures"
  }
];

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setIsAutoPlaying(false);
    setDirection(newDirection);
    setCurrent((prev) => (prev + newDirection + testimonials.length) % testimonials.length);
  };

  return (
    <section id="testimonials" className="relative py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="gradient-text mb-6">
            What Our Community Says
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Join thousands of producers and writers who are revolutionizing
            the scriptwriting industry with BlockCreative.
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={current}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);

                if (swipe < -swipeConfidenceThreshold) {
                  paginate(1);
                } else if (swipe > swipeConfidenceThreshold) {
                  paginate(-1);
                }
              }}
              className="card group"
            >
              <div className="relative">
                {/* Quote Icon */}
                <div className="absolute -top-4 -left-4 w-8 h-8 text-[rgb(var(--accent-primary))] opacity-50">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-full h-full"
                  >
                    <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
                  </svg>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 p-8">
                  {/* Profile Image */}
                  <div className="relative w-32 h-32 flex-shrink-0">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] blur-lg opacity-50" />
                    <div className="relative z-10 w-full h-full rounded-full overflow-hidden border-2 border-white/10">
                      <Image
                        src={testimonials[current].image}
                        alt={testimonials[current].name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-center md:text-left">
                    {/* Rating */}
                    <div className="flex justify-center md:justify-start gap-1 mb-4">
                      {[...Array(testimonials[current].rating)].map((_, i) => (
                        <StarIcon key={i} className="w-5 h-5 text-yellow-400" />
                      ))}
                    </div>

                    {/* Quote */}
                    <blockquote className="text-lg text-gray-300 mb-6 italic">
                      &quot;{testimonials[current].quote}&quot;
                    </blockquote>

                    {/* Author Info */}
                    <div>
                      <div className="font-bold gradient-text text-xl mb-1">
                        {testimonials[current].name}
                      </div>
                      <div className="text-gray-400 text-sm mb-1">
                        {testimonials[current].role}
                      </div>
                      <div className="text-[rgb(var(--accent-primary))] text-sm">
                        {testimonials[current].company}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          <button
            onClick={() => paginate(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 p-2 text-white/50 hover:text-white transition-colors"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => paginate(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 p-2 text-white/50 hover:text-white transition-colors"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Navigation Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > current ? 1 : -1);
                  setCurrent(index);
                  setIsAutoPlaying(false);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === current
                    ? 'bg-[rgb(var(--accent-primary))] w-8'
                    : 'bg-gray-600'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-[rgb(var(--accent-primary))]/20 rounded-full mix-blend-multiply filter blur-[128px] animate-blob" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-[rgb(var(--accent-secondary))]/20 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-2000" />
      </div>
    </section>
  );
} 