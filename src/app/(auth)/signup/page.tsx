'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/sections/Footer';
import { appKitModal } from '@/context';
import { useAccount } from 'wagmi';
import Image from 'next/image';

const roles = [
  {
    id: 'writer',
    title: 'Writer',
    description: 'Submit scripts and connect with producers',
    icon: '📝',
    features: [
      'AI-powered script analysis',
      'Direct producer connections',
      'Secure script submissions',
      'Automated payments',
    ],
    gradient: 'from-blue-500/20 to-indigo-500/20',
    activeGradient: 'from-blue-500/30 to-indigo-500/30',
  },
  {
    id: 'producer',
    title: 'Producer',
    description: 'Find and evaluate scripts from talented writers',
    icon: '🎬',
    features: [
      'AI script ranking system',
      'Writer talent pool access',
      'Project management tools',
      'Analytics dashboard',
    ],
    gradient: 'from-purple-500/20 to-pink-500/20',
    activeGradient: 'from-purple-500/30 to-pink-500/30',
  },
];

export default function SignUp() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Redirect if already connected with a role
  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    const storedWallet = localStorage.getItem('walletAddress');
    
    if (storedRole && storedWallet) {
      // Redirect to the appropriate dashboard
      const dashboardPath = `/${storedRole}/dashboard`;
      console.log(`User already has stored role ${storedRole}, redirecting to dashboard`);
      router.push(dashboardPath);
    } else if (isConnected && address && selectedRole) {
      // If connected and role selected, check user in database and handle accordingly
      handleUserAuthentication(address);
    }
  }, [isConnected, address, selectedRole, router]);
  
  // Simple function to determine a mock user role based on address
  const determineUserRole = (address: string): string => {
    // For demo purposes, assign roles based on last character of address
    const lastChar = address.slice(-1).toLowerCase();
    const isEven = parseInt(lastChar, 16) % 2 === 0;
    return isEven ? 'writer' : 'producer';
  };

  // Helper function to clear authentication data from localStorage
  const clearAuthData = () => {
    try {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userAvatar');
      localStorage.removeItem('companyName');
      localStorage.removeItem('signupDate');
      console.log('Cleaned up localStorage during signup');
    } catch (err) {
      console.error('Error clearing localStorage:', err);
    }
  };

  // Store user info in localStorage for persistence
  const storeUserInfo = (address: string, role: string) => {
    try {
      // Clear any old data first
      clearAuthData();
      
      // Normalize wallet address to lowercase before storing
      const normalizedAddress = address.toLowerCase();
      localStorage.setItem('walletAddress', normalizedAddress);
      localStorage.setItem('userRole', role);
      console.log(`Stored wallet address ${normalizedAddress} and role ${role} in localStorage`);
    } catch (err) {
      console.error('Error storing wallet info in localStorage:', err);
    }
  };
  
  // Handle wallet connect
  const handleConnect = async () => {
    try {
      if (!selectedRole) {
        setError('Please select a role before connecting your wallet');
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      // Check if we're already connected with a wallet address
      if (isConnected && address) {
        console.log('Using existing wallet connection:', address);
        if (address) {
          handleUserAuthentication(address);
        } else {
          setIsLoading(false);
          setError('Wallet address is undefined.');
        }
        return;
      }
      
      // Clear existing wallet connection data
      localStorage.removeItem('wagmi.connected');
      localStorage.removeItem('wagmi.store');
      
      console.log(`Opening AppKit modal with selected role: ${selectedRole}`);
      
      try {
        // Step 1: Use Reown AppKit for authentication
        await appKitModal.open();
        
      // Step 2: Once AppKit connection is successful, check if wallet is connected
      // Refactor to use a promise-based wait for wallet connection with timeout fallback
      const waitForWalletConnection = () => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Wallet connection timeout'));
          }, 10000); // 10 seconds timeout

          const checkConnection = () => {
            if (isConnected && address) {
              clearTimeout(timeout);
              resolve(true);
            } else {
              // Retry after 500ms
              setTimeout(checkConnection, 500);
            }
          };

          checkConnection();
        });
      };

      try {
        await waitForWalletConnection();
        console.log(`Wallet connected: ${address}, with role: ${selectedRole}`);
        // Step 3: Check the database for the user with this wallet address
        if (address) {
          handleUserAuthentication(address);
        } else {
          setIsLoading(false);
          setError('Wallet address is undefined.');
        }
      } catch (err) {
        setIsLoading(false);
        console.log('Wallet not connected after timeout');
        setError('Wallet connection failed. Please try again.');
      }
      } catch (modalError) {
        console.error('AppKit modal error:', modalError);
        
        // Handle the "already connected" error
        if (modalError instanceof Error && 
            modalError.message.includes('already connected')) {
          console.log('Wallet already connected, using existing connection');
          if (address) {
            handleUserAuthentication(address);
            return;
          }
        }
        
        setIsLoading(false);
        setError(modalError instanceof Error ? modalError.message : 'Connection failed');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setIsLoading(false);
      setError(error instanceof Error ? error.message : 'Failed to connect wallet');
    }
  };

  // Handle user authentication with wallet
  const handleUserAuthentication = async (walletAddress: string) => {
    try {
      // Make sure we have a role selected
      if (!selectedRole) {
        setError('Please select a role first');
        setIsLoading(false);
        return;
      }
      
      // Normalize wallet address to lowercase
      const normalizedAddress = walletAddress.toLowerCase();
      console.log(`Creating or fetching user with wallet address: ${normalizedAddress}`);
      
      // First, check if the user already exists
      const checkResponse = await fetch('/api/users/me', {
        headers: {
          'x-wallet-address': normalizedAddress,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (checkResponse.ok) {
        // User exists, check if their role matches the selected role
        const userData = await checkResponse.json();
        
        if (userData.user && userData.user.role) {
          if (userData.user.role !== selectedRole) {
            // Role mismatch
            clearAuthData();
            localStorage.removeItem('walletAddress');
            setError(`This wallet is already registered as a ${userData.user.role}. Please use a different wallet.`);
            setIsLoading(false);
            return;
          }
          
          // Role matches, store user info and redirect
          console.log('User already exists with matching role, storing info and redirecting');
          storeUserInfo(normalizedAddress, selectedRole);
          
          // Redirect based on onboarding status
          if (userData.user.onboarding_completed) {
            console.log('Onboarding already completed, redirecting to dashboard');
            router.push(`/${selectedRole}/dashboard`);
          } else {
            console.log('Redirecting to onboarding');
            router.push(`/${selectedRole}/onboarding`);
          }
          return;
        }
      }
      
      // If user doesn't exist or the check failed, proceed with user creation
      console.log('Creating new user with API');
      
      // Call API to create/get user
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': normalizedAddress,
        },
        body: JSON.stringify({
          walletAddress: normalizedAddress,
          role: selectedRole,
          profile_data: {
            // Initial profile data can be set here
          }
        }),
      });
      
      // Get the response data regardless of status to properly handle errors
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error during user creation:', data);
        
        // Clear wallet address if there's a role conflict or other error
        if (response.status === 409) {
          // Role conflict
          clearAuthData();
          localStorage.removeItem('walletAddress');
          setError(data.message || 'This wallet is already registered with a different role.');
        } else {
          clearAuthData();
          localStorage.removeItem('walletAddress');
          // Extract the specific error message if available
          const errorMessage = data.message || data.error || 'Failed to create user account.';
          setError(errorMessage);
          console.error('Detailed error:', errorMessage);
        }
        setIsLoading(false);
        return;
      }
      
      console.log('User authentication successful:', data);
      
      // Store user info in localStorage
      storeUserInfo(normalizedAddress, selectedRole);
      
      // Redirect based on role and onboarding status
      if (data.user.onboarding_completed) {
        console.log('Onboarding already completed, redirecting to dashboard');
        router.push(`/${selectedRole}/dashboard`);
      } else {
        console.log('Redirecting to onboarding');
        router.push(`/${selectedRole}/onboarding`);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      clearAuthData();
      localStorage.removeItem('walletAddress');
      setError('Failed to authenticate. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle email/social connect
  const handleContinueWithEmailSocial = () => {
    try {
      if (!selectedRole) {
        setError('Please select a role before continuing');
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      // For email/social, we'll create a mock address
      const mockAddress = '0x' + Math.random().toString(16).substring(2, 42);
      
      // Handle authentication with the mock address
      handleUserAuthentication(mockAddress);
    } catch (error) {
      console.error('Error with email/social:', error);
      setIsLoading(false);
      setError(error instanceof Error ? error.message : 'Failed to continue with email/social');
    }
  };

  const handleChangeRole = () => {
    setSelectedRole(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="relative">
          {/* Animated glow effect */}
          <div className="absolute inset-0 w-24 h-24 bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] rounded-full blur-xl opacity-20 animate-pulse"></div>
          
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 border-t-2 border-b-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin mb-4 mx-auto"></div>
            <h2 className="text-xl font-bold text-white mb-2">Connecting wallet...</h2>
            <p className="text-gray-400">You'll be redirected shortly</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden relative flex flex-col">
      {/* Background decoration elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-[rgb(var(--accent-primary))]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-[rgb(var(--accent-secondary))]/10 rounded-full blur-3xl"></div>
      </div>
      
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl w-full mx-auto space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-6"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))]">
                Join BlockCreative
              </h1>
            </motion.div>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Choose your role to get started on your creative journey
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-red-900/30 backdrop-blur-sm border border-red-500/50 rounded-xl p-4 text-red-200 text-sm max-w-md mx-auto flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={`mb-8 w-full ${selectedRole ? 'md:mb-6' : 'md:mb-8'}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {roles.map((role, index) => (
                  <motion.div
                    key={role.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                    whileHover={{ 
                      scale: selectedRole === role.id ? 1.01 : 1.03,
                      y: -5
                    }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative bg-zinc-900/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                      selectedRole === role.id
                        ? 'border-[rgb(var(--accent-primary))] ring-2 ring-[rgb(var(--accent-primary))]/30'
                        : 'border-white/5 hover:border-white/20'
                    }`}
                    onClick={() => setSelectedRole(role.id)}
                  >
                    {/* Background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${selectedRole === role.id ? role.activeGradient : role.gradient} opacity-50`}></div>
                    
                    <div className="relative z-10 flex items-start space-x-4">
                      <div className={`w-14 h-14 flex items-center justify-center rounded-xl text-3xl ${
                        selectedRole === role.id
                          ? 'bg-[rgb(var(--accent-primary))]/20'
                          : 'bg-zinc-800/80'
                      }`}>
                        {role.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h3 className="text-2xl font-bold text-white">{role.title}</h3>
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                            selectedRole === role.id
                              ? 'bg-[rgb(var(--accent-primary))] border-[rgb(var(--accent-primary))]'
                              : 'border-gray-600'
                          }`}>
                            {selectedRole === role.id && (
                              <motion.svg 
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-4 w-4 text-white" 
                                viewBox="0 0 20 20" 
                                fill="currentColor"
                              >
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </motion.svg>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-300 mt-2 mb-4">{role.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {role.features.map((feature, idx) => (
                            <motion.div 
                              key={idx} 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4 + idx * 0.1 }}
                              className="flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[rgb(var(--accent-primary))] mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-gray-300 text-sm">{feature}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <AnimatePresence mode="wait">
              {selectedRole && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/5 max-w-md w-full"
                >
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="inline-block px-3 py-1 bg-[rgb(var(--accent-primary))]/20 rounded-full text-[rgb(var(--accent-primary))] text-sm font-medium mb-3">
                        {selectedRole === 'writer' ? 'Writer' : 'Producer'} Selected
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        Continue your journey
                      </h3>
                      <p className="text-gray-400 text-sm">Choose your preferred way to connect</p>
                    </div>
                    
                    <button
                      onClick={handleConnect}
                      className="w-full py-3.5 px-4 rounded-xl text-white font-medium bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] hover:opacity-90 transition-all duration-300 flex items-center justify-center group relative overflow-hidden"
                    >
                      <span className="absolute inset-0 w-full h-full bg-white/10 group-hover:translate-y-0 -translate-y-full transition-transform duration-300"></span>
                      <span className="relative flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13 7H7v6h6V7z" />
                          <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
                        </svg>
                        Connect Wallet
                      </span>
                    </button>
                    
                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-white/10"></div>
                      <span className="flex-shrink mx-4 text-sm text-gray-400">or use email & socials</span>
                      <div className="flex-grow border-t border-white/10"></div>
                    </div>
                    
                    <button
                      onClick={handleContinueWithEmailSocial}
                      className="w-full py-3.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all duration-300 flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      Continue with Email or Social
                    </button>
                    
                    <button
                      onClick={handleChangeRole}
                      className="w-full py-2 px-4 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Change Role
                    </button>
                    
                    <div className="mt-6 text-center">
                      <p className="text-sm text-gray-400">
                        Already have an account?{' '}
                        <Link href="/signin" className="text-[rgb(var(--accent-primary))] hover:text-[rgb(var(--accent-secondary))] transition-colors">
                          Sign in
                        </Link>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {!selectedRole && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center mt-6"
              >
                <p className="text-gray-400 text-sm">
                  Already have an account?{' '}
                  <Link href="/signin" className="text-[rgb(var(--accent-primary))] hover:text-[rgb(var(--accent-secondary))] transition-colors">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 