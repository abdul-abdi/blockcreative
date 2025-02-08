'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/outline';

const plans = [
  {
    name: 'Writer',
    price: { monthly: 29, annual: 24 },
    description: 'Perfect for individual scriptwriters looking to showcase their work.',
    features: [
      'Submit unlimited scripts',
      'AI-powered script analysis',
      'Basic analytics dashboard',
      'Community access',
      'Email support',
    ],
    color: 'from-blue-500 to-cyan-500'
  },
  {
    name: 'Producer',
    price: { monthly: 99, annual: 89 },
    description: 'Ideal for production companies and studios.',
    features: [
      'Post unlimited projects',
      'Advanced AI ranking system',
      'Full analytics suite',
      'Priority script matching',
      'Dedicated support',
      'Custom contract templates',
      'Team collaboration tools'
    ],
    featured: true,
    color: 'from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))]'
  },
  {
    name: 'Enterprise',
    price: { monthly: 299, annual: 249 },
    description: 'For large studios and production houses.',
    features: [
      'All Producer features',
      'Custom AI model training',
      'API access',
      'White-label solution',
      'Advanced security features',
      'Dedicated account manager',
      'Custom integration support',
      'SLA guarantee'
    ],
    color: 'from-purple-500 to-pink-500'
  }
];

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="relative py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="gradient-text mb-6">
            Choose Your Plan
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            Select the perfect plan for your needs and start revolutionizing
            your scriptwriting process today.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm ${!isAnnual ? 'text-white' : 'text-gray-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-16 h-8 rounded-full bg-gray-700 transition-colors duration-300"
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-[rgb(var(--accent-primary))] transition-transform duration-300 ${
                  isAnnual ? 'translate-x-8' : ''
                }`}
              />
            </button>
            <span className={`text-sm ${isAnnual ? 'text-white' : 'text-gray-400'}`}>
              Annual
              <span className="ml-1 text-[rgb(var(--accent-primary))]">
                (Save 20%)
              </span>
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative ${plan.featured ? 'lg:-mt-8' : ''}`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-0 right-0 text-center">
                  <span className="bg-[rgb(var(--accent-primary))] text-white text-sm font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className={`card group h-full ${
                plan.featured ? 'border-[rgb(var(--accent-primary))]' : ''
              }`}>
                <h3 className="text-2xl font-bold mb-2 gradient-text">
                  {plan.name}
                </h3>
                <p className="text-gray-400 mb-6">
                  {plan.description}
                </p>

                <div className="mb-8">
                  <span className="text-4xl font-bold text-white">
                    ${isAnnual ? plan.price.annual : plan.price.monthly}
                  </span>
                  <span className="text-gray-400">/month</span>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckIcon className="h-6 w-6 flex-shrink-0 text-[rgb(var(--accent-primary))]" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full button-primary ${
                  plan.featured ? 'bg-[rgb(var(--accent-primary))]' : ''
                }`}>
                  Get Started
                </button>

                <div className={`absolute inset-0 bg-gradient-to-br ${plan.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-[rgb(var(--accent-primary))]/20 rounded-full mix-blend-multiply filter blur-[128px] animate-blob" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-[rgb(var(--accent-secondary))]/20 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-2000" />
      </div>
    </section>
  );
} 