'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/sections/Footer';
import SocialAuth from '@/components/SocialAuth';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, redirect to producer dashboard
    router.push('/producer/dashboard');
  };

  const handleSocialAuth = async (provider: string) => {
    // Implement social authentication logic here
    console.log('Authenticating with:', provider);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center py-24 md:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full mx-auto space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">
              Welcome Back
            </h1>
            <p className="text-lg text-gray-400">
              Sign in to continue your creative journey
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-8 sm:p-10 shadow-xl space-y-8"
          >
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
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/10 bg-white/5 text-[rgb(var(--accent-primary))] focus:ring-[rgb(var(--accent-primary))] focus:ring-offset-black"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <Link
                    href="/forgot-password"
                    className="text-[rgb(var(--accent-primary))] hover:underline hover:text-[rgb(var(--accent-primary))]/80 transition-colors font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
              <button
                type="submit"
                className="w-full button-primary py-4 text-base font-medium"
              >
                Sign In
              </button>
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
              Don&apos;t have an account?{' '}
              <Link 
                href="/signup" 
                className="text-[rgb(var(--accent-primary))] hover:underline hover:text-[rgb(var(--accent-primary))]/80 transition-colors font-medium"
              >
                Sign up
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
      
    </div>
  );
} 