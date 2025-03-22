'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';

interface AuthWrapperProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'writer' | 'producer' | 'admin';
}

/**
 * AuthWrapper component that checks for wallet authentication
 * and redirects to signin if not authenticated
 */
export default function AuthWrapper({ 
  children, 
  requireAuth = true, 
  requiredRole 
}: AuthWrapperProps) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!requireAuth) {
      setIsAuthorized(true);
      setIsLoading(false);
      return;
    }

    // Check for wallet connection via wagmi
    const walletConnected = isConnected && !!address;
    
    // Check for wallet in localStorage as fallback
    const storedWalletAddress = localStorage.getItem('walletAddress');
    const storedUserRole = localStorage.getItem('userRole');
    
    // Determine if the user is authenticated
    const isAuthenticated = walletConnected || !!storedWalletAddress;
    
    // Check role if required
    const hasCorrectRole = !requiredRole || 
      (storedUserRole === requiredRole);

    console.log('Auth check:', { 
      walletConnected, 
      storedWallet: !!storedWalletAddress, 
      storedRole: storedUserRole,
      requiredRole,
      hasCorrectRole
    });
    
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to signin');
      router.push('/signin');
      return;
    }
    
    if (!hasCorrectRole) {
      console.log(`Role mismatch. Required: ${requiredRole}, Current: ${storedUserRole}`);
      router.push(`/${storedUserRole}/dashboard`);
      return;
    }
    
    setIsAuthorized(true);
    setIsLoading(false);
  }, [requireAuth, requiredRole, router, address, isConnected]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If authorized, render children
  if (isAuthorized) {
    return <>{children}</>;
  }

  // This should never happen because of the redirects in useEffect,
  // but it's here as a fallback
  return null;
}