'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { appKitModal } from '@/context';
import { useDisconnect } from 'wagmi';

export default function SignOut() {
  const router = useRouter();
  const { disconnect } = useDisconnect();
  
  useEffect(() => {
    const performSignOut = async () => {
      try {
        // Clear user data from localStorage
        localStorage.removeItem('userRole');
        
        // Disconnect wallet
        disconnect();
        
        // Open AppKit modal to Account view to allow manual disconnect if needed
        await appKitModal.open({ view: 'Account' });
        
        // Redirect to home page after a short delay
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } catch (error) {
        console.error('Error during sign out:', error);
        // Redirect to home page even if there's an error
        router.push('/');
      }
    };
    
    performSignOut();
  }, [router, disconnect]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-white">Signing you out...</h1>
        <p className="text-gray-400">You'll be redirected to the home page momentarily.</p>
      </div>
    </div>
  );
} 