import { motion } from 'framer-motion';
import { DocumentTextIcon, PencilSquareIcon, ChartBarIcon, CubeTransparentIcon } from '@heroicons/react/24/outline';

const processSteps = [
  {
    icon: DocumentTextIcon,
    title: 'Idea Submission',
    description: 'Producers submit core ideas or bounties.',
  },
  {
    icon: PencilSquareIcon,
    title: 'Scriptwriting',
    description: 'Scriptwriters craft synopses, treatments, and plots.',
  },
  {
    icon: ChartBarIcon,
    title: 'AI Ranking',
    description: 'AI evaluates and ranks the top three submissions.',
  },
  {
    icon: CubeTransparentIcon,
    title: 'Blockchain Award',
    description: 'The winning submission is timestamped and awarded via blockchain.',
  },
];

const ProcessSection = () => {
  return (
    <section className="relative py-20 bg-black/50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="gradient-text mb-6">How It Works</h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Our streamlined process combines AI intelligence with blockchain security
            to revolutionize scriptwriting.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {processSteps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <div className="card group hover:scale-105 transition-transform duration-300">
                <div className="relative h-20 w-20 mx-auto mb-6">
                  <step.icon className="h-full w-full text-[rgb(var(--accent-primary))] group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-[rgb(var(--accent-primary))]/10 rounded-full filter blur-xl group-hover:blur-2xl transition-all duration-300" />
                </div>
                
                <h3 className="text-xl font-bold mb-4 text-center gradient-text">
                  {step.title}
                </h3>
                
                <p className="text-gray-400 text-center">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection; 