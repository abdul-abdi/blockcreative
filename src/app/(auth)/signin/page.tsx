'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/sections/Footer';
import { appKitModal } from '@/context';
import { useAccount } from 'wagmi';
import MarketplaceChoiceModal from '@/components/MarketplaceChoiceModal';
import { useMarketplace } from '@/context/audio';

// Helper function to parse SIWE errors
const parseSiweError = (error: any): string => {
  if (!error) return 'Unknown error';
  
  // Check for common SIWE error patterns
  const errorString = error.toString();
  
  if (errorString.includes('User rejected signing')) {
    return 'You rejected the signature request. Please try again.';
  }
  if (errorString.includes('nonce')) {
    return 'Authentication error: Invalid nonce. Please try again.';
  }
  if (errorString.includes('Connector not found')) {
    return 'No wallet connector found. Please make sure your wallet is installed.';
  }
  if (errorString.includes('Chain not configured')) {
    return 'Network not supported. Please switch to a supported network.';
  }
  
  // If we don't recognize the error, return the error string or a generic message
  return errorString || 'Failed to connect. Please try again.';
};

// Helper function to clear authentication data from localStorage
const clearAuthData = () => {
  try {
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userAvatar');
    localStorage.removeItem('companyName');
    localStorage.removeItem('signupDate');
    console.log('Cleared auth data from localStorage due to authentication failure');
  } catch (err) {
    console.error('Error clearing localStorage:', err);
  }
};

export default function SignIn() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMarketplaceModal,setShowMarketplaceModal] = useState(false);
  const [userRole,setUserRole] = useState<string | null> (null);
  const { setMarketplace } = useMarketplace();

  
  // Simple function to determine a mock user role based on address
  const determineUserRole = (address: string) => {
    // For demo purposes, assign roles based on last character of address
    // In a real app, this would be based on actual user roles stored in a database
    const lastChar = address.slice(-1).toLowerCase();
    const isEven = parseInt(lastChar, 16) % 2 === 0;
    const role = isEven ? 'writer' : 'producer';
    console.log(`Role determined for ${address}: ${role}`);
    return role;
  };

  // Handle wallet connect button click
  const handleWalletConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if we already have a wallet address
      const existingWalletAddress = localStorage.getItem('walletAddress');
      if (existingWalletAddress && isConnected && address) {
        console.log('Using existing wallet connection:', address);
        checkUserExists(address);
        return;
      }
      
      // Clear any existing state to ensure a fresh start
      console.log('Clearing existing authentication data');
      clearAuthData();
      localStorage.removeItem('wagmi.connected');
      localStorage.removeItem('wagmi.store');
      localStorage.removeItem('wagmi.recentConnectorId');
      
      console.log('Opening AppKit modal for wallet connection');
      
      try {
        // First try to disconnect any existing wallet connection
        if (isConnected) {
          try {
            // Attempt to handle the already connected case gracefully
            console.log('Wallet already connected, using existing connection');
            checkUserExists(address || '');
            return;
          } catch (connectorError) {
            console.warn('Error handling existing connection:', connectorError);
            // Continue with new connection attempt
          }
        }
        
        // Step 1: Use Reown AppKit for authentication
        await appKitModal.open();
        console.log('AppKit modal opened successfully');
        
        // Step 2: Once AppKit connection is successful, check if wallet is connected
        // The useEffect will handle the redirect when isConnected/address update
      } catch (modalError) {
        console.error('AppKit modal error:', modalError);
        
        // Check if this is a "connector already connected" error
        if (modalError instanceof Error && 
            modalError.message.includes('already connected')) {
          console.log('Wallet already connected, using existing connection');
          if (address) {
            checkUserExists(address);
            return;
          }
        }
        
        setIsLoading(false);
        setError(parseSiweError(modalError));
      }
    } catch (error) {
      console.error('Connection error:', error);
      clearAuthData();
      setIsLoading(false);
      setError(parseSiweError(error));
    }
  };

  // Helper function to check user status after connection
  const checkUserAfterConnection = () => {
    if (isConnected && address) {
      console.log('Wallet connected:', address);
      checkUserExists(address);
    } else {
      setIsLoading(false);
      console.log('Wallet not connected after timeout');
      setError('Wallet connection failed. Please try again.');
    }
  };

  // Helper function to check if user exists in the database
  const checkUserExists = async (walletAddress: string) => {
    try {
      // Store normalized wallet address in localStorage (convert to lowercase)
      const normalizedAddress = walletAddress.toLowerCase();
      localStorage.setItem('walletAddress', normalizedAddress);
      
      console.log('Checking if user exists in database:', normalizedAddress);
      const response = await fetch('/api/users/me', {
        headers: {
          'x-wallet-address': normalizedAddress,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.status === 404) {
        // User doesn't exist, clear localStorage (except walletAddress) and redirect to signup
        console.log('User not found in database, redirecting to signup');
        // Keep the wallet address for signup but clear any other data
        const tempWalletAddress = localStorage.getItem('walletAddress');
        clearAuthData();
        if (tempWalletAddress) {
          localStorage.setItem('walletAddress', tempWalletAddress);
        }
        router.push('/signup');
        return;
      } else if (response.ok) {
        // User exists, get their data and redirect to dashboard
        const userData = await response.json();
        console.log('User found:', userData);
        
        // Store role in localStorage
        if (userData.user && userData.user.role) {
          localStorage.setItem('userRole', userData.user.role);
          
          // Check if onboarding is completed
          if (!userData.user.onboarding_completed) {
            console.log('Onboarding not completed, redirecting to onboarding');
            router.push(`/${userData.user.role}/onboarding`);
            setIsLoading(false);
          } else {
            setUserRole(userData.user.role);
            setShowMarketplaceModal(true);
            setIsLoading(false);
          }
        } else {
          setError('Invalid user data returned from server');
          clearAuthData();
          setIsLoading(false);
        }
      } else {
        clearAuthData();
        throw new Error('Failed to check user status');
      }
    } catch (error) {
      console.error('Error checking user in database:', error);
      clearAuthData();
      setError(error instanceof Error ? error.message : 'Authentication failed');
      setIsLoading(false);
    }
  };

  const handleMarketPlaceChoice = (choice : "audio" | "script") =>{
    setShowMarketplaceModal(false);
    setMarketplace(choice);
    if (choice==="script" && userRole){
      router.push(`/${userRole}/dashboard`);
    }else{
      router.push(`/audiomarket/${userRole}/dashboard`);
    }
  }

  // Handle email/social connect button click
  const handleEmailSocialConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Opening AppKit modal with social providers view');
      
      try {
        // Step 1: Use Reown AppKit for authentication with social providers view
        await appKitModal.open({ view: 'Connect' });
        
        // Step 2: Once AppKit connection is successful, check if wallet is connected
        setTimeout(() => {
          checkUserAfterConnection();
        }, 2000);
      } catch (modalError) {
        console.error('AppKit modal error with social:', modalError);
        
        // Handle already connected error
        if (modalError instanceof Error && 
            modalError.message.includes('already connected')) {
          console.log('Wallet already connected, using existing connection');
          if (address) {
            checkUserExists(address);
            return;
          }
        }
        
        setIsLoading(false);
        setError(parseSiweError(modalError));
      }
    } catch (error) {
      console.error('Email/social login error:', error);
      clearAuthData();
      setIsLoading(false);
      setError(parseSiweError(error));
    }
  };

  useEffect(() => {
    if (isLoading && isConnected && address) {
      // Only check user if loading and wallet just connected
      checkUserExists(address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-2 border-b-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin mb-4 mx-auto"></div>
          <h2 className="text-xl font-bold text-white mb-2">Connecting wallet...</h2>
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
              Connect to continue your creative journey
            </p>
          </motion.div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-200 text-sm">
              {error}
            </div>
          )}

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
      <MarketplaceChoiceModal 
        open ={showMarketplaceModal}
        onClose={() => setShowMarketplaceModal(false)}
        onSelect={handleMarketPlaceChoice}  
      />
    </div>
  );
} 