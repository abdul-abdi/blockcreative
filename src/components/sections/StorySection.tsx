'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function StorySection() {
  return (
    <section className="relative min-h-screen py-32 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-[120px] animate-blob" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-cyan-500/30 rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-2000" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-8">
              The Story Behind BlockCreative
            </h2>
            <p className="text-gray-300 text-xl max-w-3xl mx-auto">
              A Journey from Nairobi to the Future of Scriptwriting
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-12"
          >
            <div className="card p-10 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 hover:from-purple-500/20 hover:to-cyan-500/20 transition-all duration-300">
              <p className="text-xl text-gray-300 leading-relaxed mb-8">
                As a media student in Kenya, I witnessed firsthand the incredible talent and creativity 
                within our local film industry. However, I also saw how many brilliant scripts never made 
                it to production due to the lack of direct connections with producers and a transparent 
                evaluation system.
              </p>
              <p className="text-xl text-gray-300 leading-relaxed mb-8">
                The idea for BlockCreative was born from this challenge. By combining blockchain technology 
                with AI-powered script analysis, we&apos;re creating a platform that gives every talented writer, 
                regardless of their location or network, a fair chance to showcase their work and connect 
                with producers globally.
              </p>
              <p className="text-xl text-gray-300 leading-relaxed">
                Our mission is to democratize the scriptwriting industry, making it more accessible, 
                transparent, and rewarding for creators worldwide. We believe that great stories can 
                come from anywhere, and technology should help these stories find their way to the screen.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="card p-8 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 transition-all duration-300"
              >
                <h3 className="text-2xl font-bold gradient-text mb-6">For Writers</h3>
                <p className="text-lg text-gray-300 mb-8">
                  Get your scripts in front of top producers and receive fair, AI-powered evaluations 
                  that highlight your work's unique strengths.
                </p>
                <Link 
                  href="/signup?role=writer"
                  className="button-primary bg-gradient-to-r from-emerald-500 to-teal-500 inline-flex items-center"
                >
                  Join as a Writer
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="card p-8 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 transition-all duration-300"
              >
                <h3 className="text-2xl font-bold gradient-text mb-6">For Producers</h3>
                <p className="text-lg text-gray-300 mb-8">
                  Discover exceptional scripts and connect with talented writers through our 
                  innovative bounty system and AI-powered ranking.
                </p>
                <Link 
                  href="/signup?role=producer"
                  className="button-primary bg-gradient-to-r from-blue-500 to-indigo-500 inline-flex items-center"
                >
                  Join as a Producer
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 