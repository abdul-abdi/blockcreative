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
    title: 'Secure IP Protection',
    description: 'Your intellectual property is protected through blockchain technology and smart contracts.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: CurrencyDollarIcon,
    title: 'Fair Compensation',
    description: 'Automated payment distribution ensures writers receive fair compensation for their work.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: ClockIcon,
    title: 'Fast Turnaround',
    description: 'AI-powered ranking system accelerates the script evaluation process.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: UserGroupIcon,
    title: 'Global Network',
    description: 'Connect with producers and writers from around the world.',
    color: 'from-orange-500 to-red-500'
  },
  {
    icon: ChartBarIcon,
    title: 'Data Insights',
    description: 'Get valuable insights into script performance and market trends.',
    color: 'from-indigo-500 to-purple-500'
  },
  {
    icon: DocumentCheckIcon,
    title: 'Quality Assurance',
    description: 'AI-driven analysis ensures high-quality script submissions.',
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
    >
      <div className="card group h-full">
        <div className="relative mb-6">
          <benefit.icon className="h-12 w-12 text-[rgb(var(--accent-primary))]" />
          <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} opacity-20 rounded-full blur-xl group-hover:opacity-30 transition-opacity duration-300`} />
        </div>
        
        <h3 className="text-xl font-bold mb-4 gradient-text">
          {benefit.title}
        </h3>
        
        <p className="text-gray-400">
          {benefit.description}
        </p>
        
        <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl`} />
      </div>
    </motion.div>
  );
};

export default function BenefitsSection() {
  return (
    <section id="benefits" className="relative py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="gradient-text mb-6">
            Why Choose BlockCreative
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Experience the future of scriptwriting with our innovative platform
            that combines blockchain security with AI-powered insights.
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

      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-[rgb(var(--accent-primary))]/20 rounded-full mix-blend-multiply filter blur-[128px] animate-blob" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-[rgb(var(--accent-secondary))]/20 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-2000" />
      </div>
    </section>
  );
} 