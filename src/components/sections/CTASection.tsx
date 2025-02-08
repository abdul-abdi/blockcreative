'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

const CTASection = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setStatus('success');
    setEmail('');
  };

  return (
    <section className="relative py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto relative">
          {/* Background Card */}
          <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--accent-primary))]/10 to-[rgb(var(--accent-secondary))]/10 rounded-2xl blur-3xl" />
          
          {/* Content */}
          <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-8 md:p-12 border border-white/10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <h2 className="gradient-text mb-6">
                Join the Creative Revolution
              </h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
                Be among the first to experience the future of scriptwriting.
                Sign up for early access and exclusive updates.
              </p>
            </motion.div>

            {/* Subscription Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              onSubmit={handleSubmit}
              className="max-w-md mx-auto"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white placeholder-gray-400"
                  required
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="button-primary whitespace-nowrap"
                >
                  {status === 'loading' ? 'Subscribing...' : 'Get Early Access'}
                </button>
              </div>

              {/* Status Messages */}
              {status === 'success' && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-green-400 mt-4 text-center"
                >
                  Thanks for subscribing! We&apos;ll be in touch soon.
                </motion.p>
              )}
              {status === 'error' && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 mt-4 text-center"
                >
                  Oops! Something went wrong. Please try again.
                </motion.p>
              )}
            </motion.form>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row justify-center gap-4 mt-12"
            >
              <button className="button-primary">
                Become a Producer
              </button>
              <button className="button-secondary">
                Become a Scriptwriter
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-1/2 h-1/2 bg-[rgb(var(--accent-primary))]/30 rounded-full mix-blend-multiply filter blur-[128px] animate-blob" />
        <div className="absolute -bottom-1/2 -left-1/4 w-1/2 h-1/2 bg-[rgb(var(--accent-secondary))]/30 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-2000" />
      </div>
    </section>
  );
};

export default CTASection; 