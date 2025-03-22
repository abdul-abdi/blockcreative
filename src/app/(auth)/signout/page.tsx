'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDisconnect } from 'wagmi';
import { disconnectWallet } from '@/lib/auth-helpers';

export default function SignOut() {
  const router = useRouter();
  const { disconnect } = useDisconnect();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const performSignOut = async () => {
      try {
        console.log('Starting signout process...');
        
        // First attempt to disconnect using the new helper
        const success = await disconnectWallet();
        
        if (!success) {
          // If the helper fails, try the direct wagmi disconnect
          console.log('Falling back to direct wagmi disconnect');
          disconnect();
          console.log('Local storage cleared via backup method');
          localStorage.clear();
        }
        
        // Small delay before redirecting to home
        setTimeout(() => {
          console.log('Redirecting to home page...');
          router.push('/');
        }, 1000);
      } catch (error) {
        console.error('Error during sign out:', error);
        setError('There was an issue signing out. Please try again.');
        
        // Still try to clear localStorage and redirect even if there's an error
        try {
          localStorage.clear();
          console.log('Local storage cleared after error');
        } catch (e) {
          console.error('Failed to clear localStorage:', e);
        }
        
        // Redirect to home even if there's an error
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    };
    
    performSignOut();
  }, [router, disconnect]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-white">Signing you out...</h1>
        <p className="text-gray-400">Please wait while we disconnect your wallet.</p>
        {error && (
          <p className="text-red-500 mt-4">{error}</p>
        )}
        <div className="mt-6">
          <div className="w-12 h-12 border-t-2 border-b-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    </div>
  );
} 