'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/sections/Footer';
import SocialAuth from '@/components/SocialAuth';

const roles = [
  {
    id: 'writer',
    title: 'Writer',
    description: 'Submit scripts and connect with producers',
    features: [
      'AI-powered script analysis',
      'Direct producer connections',
      'Secure script submissions',
      'Automated payments',
    ],
  },
  {
    id: 'producer',
    title: 'Producer',
    description: 'Find and evaluate scripts from talented writers',
    features: [
      'AI script ranking system',
      'Writer talent pool access',
      'Project management tools',
      'Analytics dashboard',
    ],
  },
];

export default function SignUp() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Redirect to appropriate dashboard
    if (selectedRole === 'writer') {
      router.push('/writer/dashboard');
    } else {
      router.push('/producer/dashboard');
    }
  };

  const handleSocialAuth = async (provider: string) => {
    // Implement social authentication logic here
    console.log('Authenticating with:', provider, 'Role:', selectedRole);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center py-24 md:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full mx-auto space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">
              Join BlockCreative
            </h1>
            <p className="text-lg text-gray-400">
              Start your journey in the future of scriptwriting
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-8 sm:p-10 shadow-xl"
          >
            {!selectedRole ? (
              <div className="grid md:grid-cols-2 gap-8">
                {roles.map((role) => (
                  <motion.button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className="card group hover:scale-105 text-left p-8 transition-all duration-200 border border-white/10 hover:border-[rgb(var(--accent-primary))] shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <h3 className="text-2xl font-bold gradient-text mb-6">
                      {role.title}
                    </h3>
                    <p className="text-base text-gray-400 mb-8">
                      {role.description}
                    </p>
                    <ul className="space-y-4">
                      {role.features.map((feature) => (
                        <li key={feature} className="text-sm text-gray-300 flex items-center">
                          <span className="w-2 h-2 rounded-full bg-[rgb(var(--accent-primary))] mr-3" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="max-w-md mx-auto space-y-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] focus:ring-1 focus:ring-[rgb(var(--accent-primary))] text-white transition-colors duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] focus:ring-1 focus:ring-[rgb(var(--accent-primary))] text-white transition-colors duration-200"
                      required
                    />
                  </div>
                  <div className="space-y-4">
                    <button
                      type="submit"
                      className="w-full button-primary py-4 text-base font-medium"
                    >
                      Create Account
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole(null)}
                      className="w-full button-secondary py-4 text-base font-medium"
                    >
                      Back to Role Selection
                    </button>
                  </div>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-black text-gray-400">Or continue with</span>
                  </div>
                </div>

                <SocialAuth onConnect={handleSocialAuth} />

                <div className="text-center text-base text-gray-400">
                  Already have an account?{' '}
                  <Link 
                    href="/signin" 
                    className="text-[rgb(var(--accent-primary))] hover:underline hover:text-[rgb(var(--accent-primary))]/80 transition-colors font-medium"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 