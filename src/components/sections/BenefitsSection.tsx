'use client';

import { motion } from 'framer-motion';
import { 
  ShieldCheckIcon, 
  CurrencyDollarIcon, 
  ClockIcon, 
  UserGroupIcon,
  ChartBarIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';

const benefits = [
  {
    icon: ShieldCheckIcon,
    title: 'Protected Submissions',
    description: 'Every script submission is timestamped and secured through blockchain technology.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: CurrencyDollarIcon,
    title: 'Guaranteed Rewards',
    description: 'Smart contracts ensure winning submissions receive bounties automatically.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: ClockIcon,
    title: 'Efficient Selection',
    description: 'AI rapidly evaluates and ranks submissions based on bounty guidelines.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: UserGroupIcon,
    title: 'Direct Connections',
    description: 'Writers connect directly with producers through bounty submissions.',
    color: 'from-orange-500 to-red-500'
  },
  {
    icon: ChartBarIcon,
    title: 'Creative Analytics',
    description: 'Get insights on how your submissions align with bounty requirements.',
    color: 'from-indigo-500 to-purple-500'
  },
  {
    icon: DocumentCheckIcon,
    title: 'Fair Competition',
    description: 'AI ensures unbiased ranking based purely on creative merit and guidelines.',
    color: 'from-pink-500 to-rose-500'
  }
];

const BenefitCard = ({ benefit, index }: { benefit: typeof benefits[0], index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative group"
    >
      <div className="card h-full backdrop-blur-sm border border-white/10 hover:border-[rgb(var(--accent-primary))]/50 p-8">
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} opacity-5 group-hover:opacity-10 transition-all duration-300 rounded-xl`} />
        
        {/* Icon Container with Glow */}
        <div className="relative mb-6 p-4 rounded-xl bg-black/20 inline-block">
          <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} opacity-10 rounded-xl blur-xl group-hover:opacity-20 transition-all duration-300`} />
          <benefit.icon className={`h-12 w-12 relative z-10 text-white group-hover:text-[rgb(var(--accent-primary))] transition-colors duration-300`} />
        </div>
        
        <h3 className="text-xl font-bold mb-4">
          <span className={`bg-gradient-to-r ${benefit.color} bg-clip-text text-transparent`}>
            {benefit.title}
          </span>
        </h3>
        
        <p className="text-gray-300 group-hover:text-white transition-colors duration-300">
          {benefit.description}
        </p>
        
        {/* Hover Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[rgb(var(--accent-primary))]/5 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl" />
        <div className="absolute -inset-0.5 bg-gradient-to-br from-transparent to-[rgb(var(--accent-primary))]/30 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-300 rounded-xl -z-10" />
      </div>
    </motion.div>
  );
};

export default function BenefitsSection() {
  return (
    <section id="benefits" className="relative py-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-[rgb(var(--accent-primary))] via-purple-500 to-[rgb(var(--accent-secondary))] bg-clip-text text-transparent">
              Why Choose BlockCreative
            </span>
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Our bounty-based platform revolutionizes scriptwriting by combining
            AI-powered selection with blockchain-secured rewards.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <BenefitCard
              key={benefit.title}
              benefit={benefit}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-[rgb(var(--accent-primary))]/20 rounded-full mix-blend-multiply filter blur-[128px] animate-blob" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-[rgb(var(--accent-secondary))]/20 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-4000" />
      </div>
    </section>
  );
} 