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
  const [error, setError] = useState<string | null>(null);
  const [redirectTimer, setRedirectTimer] = useState<number | null>(null);
  
  // Redirect if already connected and role is selected
  useEffect(() => {
    if (isConnected && address && selectedRole) {
      // Store user information
      storeUserInfo(address, selectedRole);
      
      // Register user in MongoDB
      registerUser(address, selectedRole);
    }
  }, [isConnected, address, selectedRole, router]);

  // Register user in MongoDB
  const registerUser = async (address: string, role: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setRedirectTimer(null);
      console.log(`Registering ${role} with wallet address ${address} in MongoDB`);
      
      // First, check if user already exists
      const checkResponse = await fetch('/api/users/me', {
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address
        }
      });
      
      if (checkResponse.ok) {
        // User exists, check if they have a different role
        const userData = await checkResponse.json();
        
        if (userData.user && userData.user.role !== role) {
          setIsLoading(false);
          const existingRole = userData.user.role;
          const errorMsg = `This wallet is already registered as a ${existingRole}. You cannot switch roles.`;
          setError(errorMsg);
          
          // Start a countdown for redirection
          let countdown = 5;
          setRedirectTimer(countdown);
          const timer = window.setInterval(() => {
            countdown -= 1;
            if (countdown <= 0) {
              clearInterval(timer);
              router.push(`/${existingRole}/dashboard`);
            } else {
              setRedirectTimer(countdown);
            }
          }, 1000);
          
          return;
        }
        
        console.log('User already exists in database, redirecting to onboarding');
        // Store the user role and address in localStorage
        localStorage.setItem('userRole', role);
        localStorage.setItem('walletAddress', address);
        
        // Check if onboarding is completed
        if (userData.user && userData.user.onboarding_completed) {
          console.log('User has completed onboarding, redirecting to dashboard');
          router.push(`/${role}/dashboard`);
        } else {
          console.log('User has not completed onboarding, redirecting to onboarding flow');
          router.push(`/${role}/onboarding`);
        }
        return;
      } else if (checkResponse.status === 404) {
        // User doesn't exist yet, which is expected for new signups
        console.log('User not found in database, creating new account');
      } else {
        // Unexpected error
        console.error('Error checking user existence:', await checkResponse.text());
      }
      
      // Create profile data based on role
      const profileData = {
        name: role === 'writer' ? 'Writer User' : 'Producer User',
        // Add minimal required fields based on role
        ...(role === 'writer' ? {
          genres: [],
          project_types: [],
          writing_experience: '',
          bio: ''
        } : {
          company: role === 'producer' ? 'Production Company' : '',
          industry: 'Entertainment',
          team_size: '',
          budget_range: '',
          bio: ''
        }),
        // Common fields for both roles
        social: {
          twitter: '',
          linkedin: '',
          instagram: ''
        }
      };
      
      console.log(`Creating new ${role} with profile data:`, profileData);
      
      // Create user in database
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address
        },
        body: JSON.stringify({
          address,
          role,
          profile_data: profileData,
          onboarding_completed: false,
          onboarding_step: 1
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response from API:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to register user');
      }
      
      const data = await response.json();
      console.log('User registration response:', data);
      
      // Store basic user information in localStorage
      localStorage.setItem('userRole', role);
      localStorage.setItem('walletAddress', address);
      localStorage.setItem('onboardingCompleted', 'false');
      
      if (profileData.name) {
        localStorage.setItem('userName', profileData.name);
      }
      
      // Redirect to onboarding
      console.log(`Registration successful, redirecting to ${role} onboarding`);
      setTimeout(() => {
        router.push(`/${role}/onboarding`);
      }, 500);
    } catch (error) {
      console.error('Error registering user:', error);
      setIsLoading(false);
      
      // Show the error to the user
      if (error instanceof Error) {
        setError(`Registration error: ${error.message}`);
      } else {
        setError('An unexpected error occurred during registration');
      }
      
      // Still redirect to onboarding even if registration fails
      // The onboarding process will handle creating the user if needed
      console.log('Attempting to redirect to onboarding despite registration error');
      setTimeout(() => {
        localStorage.setItem('userRole', role);
        localStorage.setItem('walletAddress', address);
        router.push(`/${role}/onboarding`);
      }, 3000);
    }
  };

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
          {error ? (
            <>
              <div className="bg-red-900/50 border border-red-500 rounded-xl p-6 mb-6 max-w-md mx-auto">
                <h2 className="text-xl font-bold text-white mb-2">Role Conflict</h2>
                <p className="text-red-200 mb-4">{error}</p>
                <p className="text-white">
                  Redirecting you in <span className="font-bold">{redirectTimer}</span> seconds...
                </p>
              </div>
              <button
                onClick={() => window.history.back()}
                className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Go Back
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 border-t-2 border-b-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin mb-4 mx-auto"></div>
              <h2 className="text-xl font-bold text-white mb-2">Setting up your account...</h2>
              <p className="text-gray-400">You'll be redirected shortly</p>
            </>
          )}
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