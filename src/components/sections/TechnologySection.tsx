import { motion } from 'framer-motion';
import { CodeBracketIcon, CpuChipIcon, CubeTransparentIcon, ServerIcon } from '@heroicons/react/24/outline';

const technologies = [
  {
    icon: CodeBracketIcon,
    title: 'Next.js & React',
    description: 'Built with modern web technologies for optimal performance and scalability.',
  },
  {
    icon: CpuChipIcon,
    title: 'AI Integration',
    description: 'Advanced machine learning algorithms for intelligent script analysis and ranking.',
  },
  {
    icon: CubeTransparentIcon,
    title: 'Blockchain Security',
    description: 'Decentralized storage and smart contracts ensure transparency and trust.',
  },
  {
    icon: ServerIcon,
    title: 'Cloud Infrastructure',
    description: 'Scalable cloud architecture for reliable performance and global accessibility.',
  },
];

const TechnologySection = () => {
  return (
    <section className="relative py-20 bg-gradient-to-b from-black/50 to-purple-900/20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="gradient-text mb-6">
            Cutting-Edge Technology Stack
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Our platform leverages the latest technologies to provide a seamless,
            secure, and powerful scriptwriting experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {technologies.map((tech, index) => (
            <motion.div
              key={tech.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <div className="card group hover:scale-105 transition-transform duration-300">
                <div className="flex items-start space-x-4">
                  <div className="relative flex-shrink-0">
                    <tech.icon className="h-8 w-8 text-[rgb(var(--accent-primary))]" />
                    <div className="absolute inset-0 bg-[rgb(var(--accent-primary))]/10 rounded-full filter blur-xl" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold mb-2 gradient-text">
                      {tech.title}
                    </h3>
                    <p className="text-gray-400">
                      {tech.description}
                    </p>
                  </div>
                </div>

                {/* Interactive Elements */}
                <div className="absolute inset-0 border border-[rgb(var(--accent-primary))]/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--accent-primary))]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-[rgb(var(--accent-primary))]/5 rounded-full filter blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-[rgb(var(--accent-secondary))]/5 rounded-full filter blur-[100px]" />
      </div>
    </section>
  );
};

export default TechnologySection; 