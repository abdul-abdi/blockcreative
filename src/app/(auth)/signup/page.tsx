'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/sections/Footer';
import { appKitModal } from '@/context';
import { useAccount } from 'wagmi';

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
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  
  // Redirect if already connected and role is selected
  useEffect(() => {
    if (isConnected && address && selectedRole) {
      // Store user information
      storeUserInfo(address, selectedRole);
      
      // Add a short delay to ensure smooth transition
      setIsLoading(true);
      setTimeout(() => {
        router.push(`/${selectedRole}/dashboard`);
      }, 500);
    }
  }, [isConnected, address, selectedRole, router]);

  // Store user information in localStorage
  const storeUserInfo = (address: string, role: string) => {
    localStorage.setItem('userRole', role);
    localStorage.setItem('walletAddress', address);
    
    // For social auth users, we'll use a default name initially
    // This would be updated when we get the actual user data from social providers
    if (!localStorage.getItem('userName')) {
      localStorage.setItem('userName', role === 'writer' ? 'Writer User' : 'Producer User');
    }
    
    // Additional metadata could be stored here
    localStorage.setItem('signupDate', new Date().toISOString());
  };

  // Handle connect button click
  const handleConnect = async () => {
    if (!selectedRole) {
      alert('Please select a role first');
      return;
    }
    
    try {
      setIsLoading(true);
      // Store role before connecting
      localStorage.setItem('userRole', selectedRole);
      await appKitModal.open();
    } catch (error) {
      console.error('Connection error:', error);
      setIsLoading(false);
    }
  };

  // Continue with email/social handler
  const handleContinueWithEmailSocial = () => {
    if (!selectedRole) {
      alert('Please select a role first');
      return;
    }
    
    try {
      setIsLoading(true);
      // Store role before connecting
      localStorage.setItem('userRole', selectedRole);
      appKitModal.open({ view: 'Connect' });
    } catch (error) {
      console.error('Email/social login error:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-2 border-b-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin mb-4 mx-auto"></div>
          <h2 className="text-xl font-bold text-white mb-2">Setting up your account...</h2>
          <p className="text-gray-400">You'll be redirected shortly</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center py-20 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full mx-auto space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">
              Join BlockCreative
            </h1>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              Select your role and connect to start your creative journey on the blockchain
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {roles.map((role) => (
              <div
                key={role.id}
                className={`bg-zinc-900/50 backdrop-blur-lg rounded-2xl p-6 border transition-all cursor-pointer ${
                  selectedRole === role.id
                    ? 'border-[rgb(var(--accent-primary))] shadow-lg shadow-[rgb(var(--accent-primary))]/10'
                    : 'border-white/5 hover:border-white/20'
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <h3 className="text-2xl font-bold mb-3 text-white">{role.title}</h3>
                <p className="text-gray-400 mb-4">{role.description}</p>
                
                <ul className="space-y-2 mb-6">
                  {role.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="h-5 w-5 text-[rgb(var(--accent-primary))] mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="pt-2">
                  <button
                    type="button"
                    className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                      selectedRole === role.id
                        ? 'bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))]'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRole(role.id);
                    }}
                    disabled={isLoading}
                  >
                    {selectedRole === role.id ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
          
          {selectedRole && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-zinc-900/50 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/5 max-w-md mx-auto"
            >
              <div className="space-y-6">
                <button
                  onClick={handleConnect}
                  className="w-full py-3 px-4 rounded-lg text-white font-medium bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] hover:opacity-90 transition-opacity flex items-center justify-center"
                  disabled={isLoading}
                >
                  Connect Wallet
                </button>
                
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink mx-4 text-sm text-gray-400">or use email & socials</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>
                
                <div>
                  <button
                    onClick={handleContinueWithEmailSocial}
                    className="w-full py-3 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors flex items-center justify-center"
                    disabled={isLoading}
                  >
                    Continue with Email or Social
                  </button>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                  Already have an account?{' '}
                  <Link href="/signin" className="text-[rgb(var(--accent-primary))] hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 