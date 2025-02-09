'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

export default function SignOut() {
  const router = useRouter();

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        // Simulate API call to invalidate session
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Clear any stored authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
        
        // Redirect to home page
        router.push('/');
      } catch (error) {
        console.error('Error signing out:', error);
        // Still redirect to home page on error
        router.push('/');
      }
    };

    handleSignOut();
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <ArrowLeftOnRectangleIcon className="w-12 h-12 mx-auto text-[rgb(var(--accent-primary))] mb-4 animate-pulse" />
        <h1 className="text-2xl font-bold text-white mb-2">
          Signing you out...
        </h1>
        <p className="text-gray-400">
          Thank you for using BlockCreative
        </p>
      </div>
    </div>
  );
} 