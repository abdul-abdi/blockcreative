'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/sections/Footer';
import { appKitModal } from '@/context';
import { useAccount } from 'wagmi';

export default function SignIn() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  
  // Redirect if already connected
  useEffect(() => {
    if (isConnected && address) {
      // In a real application, you would likely check the user role from your backend
      // For now, let's check localStorage or default to writer
      const userRole = localStorage.getItem('userRole') || determineUserRole(address);
      
      // Add a short delay to ensure smooth transition
      setIsLoading(true);
      setTimeout(() => {
        router.push(`/${userRole}/dashboard`);
      }, 500);
    }
  }, [isConnected, address, router]);

  // Simple function to determine user role based on address
  // In a real app, this would likely be a backend call
  const determineUserRole = (address: string) => {
    // For demo purposes, assign roles based on last character of address
    // In a real app, this would be based on actual user roles stored in a database
    const lastChar = address.slice(-1).toLowerCase();
    const isEven = parseInt(lastChar, 16) % 2 === 0;
    const role = isEven ? 'writer' : 'producer';
    
    // Store role and wallet info in localStorage for future reference
    localStorage.setItem('userRole', role);
    localStorage.setItem('walletAddress', address);
    
    // For social auth users, we'll use a default name initially
    // This would be updated when we get the actual user data from social providers
    if (!localStorage.getItem('userName')) {
      localStorage.setItem('userName', role === 'writer' ? 'Writer User' : 'Producer User');
    }
    
    return role;
  };

  // Handle wallet connect button click
  const handleWalletConnect = async () => {
    try {
      setIsLoading(true);
      await appKitModal.open();
    } catch (error) {
      console.error('Connection error:', error);
      setIsLoading(false);
    }
  };

  // Handle email/social connect button click
  const handleEmailSocialConnect = async () => {
    try {
      setIsLoading(true);
      await appKitModal.open({ view: 'Connect' });
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
          <h2 className="text-xl font-bold text-white mb-2">Signing you in...</h2>
          <p className="text-gray-400">You'll be redirected shortly</p>
        </div>
      </div>
    );
  }

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
            className="bg-zinc-900/50 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/5"
          >
            <div className="space-y-6">
              <button
                onClick={handleWalletConnect}
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
                  onClick={handleEmailSocialConnect}
                  className="w-full py-3 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors flex items-center justify-center"
                  disabled={isLoading}
                >
                  Continue with Email or Social
                </button>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Don't have an account?{' '}
                <Link href="/signup" className="text-[rgb(var(--accent-primary))] hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 