'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { appKitModal } from '@/context';

interface AuthWrapperProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'writer' | 'producer';
}

const publicRoutes = ['/', '/signin', '/signup'];

export default function AuthWrapper({ 
  children, 
  requireAuth = false,
  requiredRole
}: AuthWrapperProps) {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if we're on a public route (no auth needed)
    const isPublicRoute = publicRoutes.includes(pathname);
    
    // Get user info from localStorage
    const storedRole = localStorage.getItem('userRole');
    const storedAddress = localStorage.getItem('walletAddress');
    const isAuthenticated = isConnected || (storedRole && storedAddress);
    
    // For routes that require authentication
    if (requireAuth && !isAuthenticated) {
      // Redirect to sign in page if not authenticated
      router.push('/signin');
      return;
    }
    
    // If we're authenticated and on a route that needs role verification
    if (isAuthenticated && requiredRole) {
      // Get the stored role or determine it if connected with wallet
      const userRole = storedRole || (isConnected && address ? determineUserRole(address) : null);
      
      // If the user doesn't have the required role, redirect to their dashboard
      if (userRole && userRole !== requiredRole) {
        router.push(`/${userRole}/dashboard`);
      }
    }
    
    // If we're on an auth page but already authenticated, redirect to dashboard
    if (isAuthenticated && (pathname === '/signin' || pathname === '/signup')) {
      const userRole = storedRole || (isConnected && address ? determineUserRole(address) : 'writer');
      router.push(`/${userRole}/dashboard`);
    }
    
    setIsChecking(false);
  }, [isConnected, address, pathname, requireAuth, requiredRole, router]);
  
  // Function to determine user role based on address
  const determineUserRole = (address: string): 'writer' | 'producer' => {
    // For demo purposes - in a real app, this would check with a backend
    const lastChar = address.slice(-1).toLowerCase();
    const isEven = parseInt(lastChar, 16) % 2 === 0;
    const role = isEven ? 'writer' : 'producer';
    
    // Store role in localStorage for future reference
    localStorage.setItem('userRole', role);
    localStorage.setItem('walletAddress', address);
    
    return role as 'writer' | 'producer';
  };
  
  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black">
        <div className="w-12 h-12 border-t-2 border-b-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // If we need authentication but aren't authenticated, show auth required screen
  if (requireAuth && !isConnected && !localStorage.getItem('userRole') && !publicRoutes.includes(pathname)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-white">Authentication Required</h2>
          <p className="text-gray-400 mb-6">
            Please connect your wallet or sign in to access this page.
          </p>
          <button
            onClick={() => appKitModal.open()}
            className="px-6 py-3 rounded-lg text-white font-medium bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] hover:opacity-90 transition-opacity"
          >
            Connect Now
          </button>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
} 