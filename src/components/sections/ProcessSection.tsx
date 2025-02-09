import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  DocumentTextIcon, 
  PencilSquareIcon, 
  ChartBarIcon, 
  CubeTransparentIcon,
  ArrowLongRightIcon,
  SparklesIcon,
  UserGroupIcon,
  RocketLaunchIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
  BanknotesIcon,
  BeakerIcon,
  LockClosedIcon,
  CloudArrowUpIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';

const innovations = [
  {
    icon: BeakerIcon,
    title: 'AI-Powered Selection',
    description: 'Advanced algorithms rank submissions based on creativity, originality, and adherence to guidelines.',
    color: 'from-purple-500 to-pink-500',
    features: ['Pattern Recognition', 'Sentiment Analysis', 'Style Evaluation']
  },
  {
    icon: LockClosedIcon,
    title: 'Blockchain Security',
    description: 'Smart contracts ensure transparent bounty distribution and protect intellectual property rights.',
    color: 'from-blue-500 to-cyan-500',
    features: ['Immutable Records', 'Automated Payments', 'Copyright Protection']
  },
  {
    icon: CloudArrowUpIcon,
    title: 'Cloud Infrastructure',
    description: 'Scalable architecture ensures reliable performance and global accessibility.',
    color: 'from-emerald-500 to-teal-500',
    features: ['High Availability', 'Global CDN', 'Real-time Updates']
  },
  {
    icon: CommandLineIcon,
    title: 'Advanced Analytics',
    description: 'Comprehensive analytics help track script performance and market trends.',
    color: 'from-orange-500 to-red-500',
    features: ['Market Insights', 'Performance Metrics', 'Trend Analysis']
  }
];

const processSteps = [
  {
    icon: DocumentTextIcon,
    secondaryIcon: SparklesIcon,
    title: 'Bounty Creation',
    description: 'Producers post core ideas or bounties with clear guidelines.',
    color: 'from-blue-500 to-cyan-500',
    details: [
      'Set project requirements',
      'Define budget range',
      'Specify genre and format'
    ],
    innovation: innovations[0]
  },
  {
    icon: PencilSquareIcon,
    secondaryIcon: UserGroupIcon,
    title: 'Creative Submissions',
    description: 'Writers submit synopses, treatments, and detailed plots.',
    color: 'from-purple-500 to-pink-500',
    details: [
      'Submit original concepts',
      'Include detailed treatments',
      'Showcase unique perspectives'
    ],
    innovation: innovations[1]
  },
  {
    icon: ChartBarIcon,
    secondaryIcon: RocketLaunchIcon,
    title: 'AI Selection',
    description: 'AI ranks top three submissions based on creativity and guidelines.',
    color: 'from-emerald-500 to-teal-500',
    details: [
      'Advanced analysis algorithms',
      'Fair and unbiased ranking',
      'Detailed feedback provided'
    ],
    innovation: innovations[2]
  },
  {
    icon: CubeTransparentIcon,
    secondaryIcon: BanknotesIcon,
    title: 'Smart Rewards',
    description: 'Winner receives bounty through blockchain-secured smart contracts.',
    color: 'from-orange-500 to-red-500',
    details: [
      'Automatic payment release',
      'Transparent transactions',
      'Secure fund distribution'
    ],
    innovation: innovations[3]
  },
];

const ProcessSection = () => {
  return (
    <section className="relative min-h-screen py-32 overflow-hidden bg-black/50 backdrop-blur-sm">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-[120px] animate-blob" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-cyan-500/30 rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-2000" />
      </div>

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-8">
            How It Works
          </h2>
          <p className="text-gray-300 text-xl max-w-3xl mx-auto">
            Our innovative bounty system combines AI-powered ranking with blockchain rewards,
            creating a transparent and fair scriptwriting marketplace.
          </p>
        </motion.div>

        <div className="max-w-7xl mx-auto">
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/50 to-cyan-500/50 hidden lg:block" />

            {processSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative mb-20 lg:mb-32"
              >
                <div className={`flex flex-col lg:flex-row ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-16`}>
                  {/* Process Card */}
                  <div className={`w-full lg:w-1/2 card p-8 bg-gradient-to-br ${step.color}/10 hover:${step.color}/20 transition-all duration-300 relative`}>
                    {/* Step Number Badge */}
                    <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-black flex items-center justify-center border-2 border-[rgb(var(--accent-primary))] z-10">
                      <span className="text-[rgb(var(--accent-primary))] font-bold text-xl">{index + 1}</span>
                    </div>

                    <div className="flex items-start gap-4 mb-6 mt-4">
                      <step.icon className="w-8 h-8 text-[rgb(var(--accent-primary))]" />
                      <div>
                        <h3 className="text-2xl font-bold gradient-text">{step.title}</h3>
                        <p className="text-gray-300 mt-2">{step.description}</p>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-center gap-2 text-gray-300">
                          <CheckBadgeIcon className="w-5 h-5 text-[rgb(var(--accent-primary))]" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center gap-2">
                      <step.secondaryIcon className="w-6 h-6 text-[rgb(var(--accent-primary))]" />
                      <ArrowLongRightIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>

                  {/* Technology Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className={`w-full lg:w-1/2 card p-8 bg-gradient-to-br ${step.innovation.color}/10 hover:${step.innovation.color}/20 transition-all duration-300`}
                  >
                    <div className="flex items-start gap-4 mb-6">
                      <step.innovation.icon className="w-8 h-8 text-[rgb(var(--accent-primary))]" />
                      <div>
                        <h3 className="text-2xl font-bold gradient-text">{step.innovation.title}</h3>
                        <p className="text-gray-300 mt-2">{step.innovation.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                      {step.innovation.features.map((feature, i) => (
                        <div 
                          key={i}
                          className="text-center p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <span className="text-sm text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mt-16"
          >
            <Link 
              href="/signup"
              className="button-primary bg-gradient-to-r from-purple-500 to-cyan-500 inline-flex items-center text-lg px-8 py-4 group"
            >
              Start Your Journey
              <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection; 