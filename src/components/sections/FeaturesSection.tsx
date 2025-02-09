import { motion } from 'framer-motion';
import { BeakerIcon, LockClosedIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const features = [
  {
    icon: BeakerIcon,
    title: 'AI-Powered Selection',
    description: 'Advanced algorithms rank submissions based on creativity, originality, and adherence to bounty guidelines.',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: LockClosedIcon,
    title: 'Secure Bounty System',
    description: 'Smart contracts ensure transparent bounty distribution and protect intellectual property rights.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: UserGroupIcon,
    title: 'Creative Marketplace',
    description: 'A dynamic ecosystem where producers post bounties and writers compete with their best creative work.',
    color: 'from-green-500 to-emerald-500',
  },
];

const FeatureCard: React.FC<{
  feature: typeof features[0];
  index: number;
}> = ({ feature, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      className="relative"
    >
      <div className="card overflow-hidden group">
        {/* Gradient Background */}
        <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${feature.color}`} />
        
        {/* Icon */}
        <div className="relative mb-6">
          <feature.icon className="h-12 w-12 text-[rgb(var(--accent-primary))]" />
          <div className="absolute inset-0 bg-[rgb(var(--accent-primary))]/10 rounded-full filter blur-xl" />
        </div>
        
        {/* Content */}
        <h3 className="text-xl font-bold mb-4 gradient-text">
          {feature.title}
        </h3>
        
        <p className="text-gray-400">
          {feature.description}
        </p>
        
        {/* Hover Effect */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br ${feature.color}`} />
      </div>
    </motion.div>
  );
};

const FeaturesSection = () => {
  return (
    <section className="relative py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="gradient-text mb-6">
            Powered by Innovation
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Our platform combines AI-powered ranking with blockchain technology to create
            the most transparent and rewarding scriptwriting marketplace.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              feature={feature}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-64 h-64 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
        <div className="absolute top-1/3 right-0 w-64 h-64 bg-cyan-500/30 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-emerald-500/30 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
      </div>
    </section>
  );
};

export default FeaturesSection; 