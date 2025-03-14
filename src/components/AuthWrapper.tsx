'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { appKitModal } from '@/context';
import { useSession } from 'next-auth/react';

interface AuthWrapperProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'writer' | 'producer';
}

const publicRoutes = ['/', '/signin', '/signup'];
const onboardingRoutes = ['/writer/onboarding', '/producer/onboarding'];

export default function AuthWrapper({ 
  children, 
  requireAuth = false,
  requiredRole
}: AuthWrapperProps) {
  const { isConnected, address } = useAccount();
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      try {
        // Check if we're on a public route (no auth needed)
        const isPublicRoute = publicRoutes.includes(pathname);
        const isOnboardingRoute = onboardingRoutes.some(route => pathname.startsWith(route));
        
        // Store wallet address in localStorage when connected
        if (isConnected && address) {
          console.log('Storing connected wallet address in localStorage:', address);
          localStorage.setItem('walletAddress', address);
        }
        
        // Get user info from localStorage or session
        const userSession = session?.user;
        const storedRole = localStorage.getItem('userRole') || userSession?.role;
        const storedAddress = localStorage.getItem('walletAddress') || userSession?.address || address;
        const isAuthenticated = isConnected || status === 'authenticated' || (storedRole && storedAddress);
        
        console.log('Auth status check:', { 
          isAuthenticated, 
          isConnected,
          address: address || 'No connected address',
          storedAddress: storedAddress || 'No stored address',
          sessionStatus: status,
          pathname,
          isPublicRoute,
          isOnboardingRoute
        });
        
        // If authenticated, check onboarding status (except if already on onboarding route)
        if (isAuthenticated && !isPublicRoute && !isOnboardingRoute) {
          try {
            console.log('Checking onboarding status for authenticated user');
            const headers: HeadersInit = {
              'Content-Type': 'application/json'
            };
            
            // Add wallet address to headers if available - try multiple sources
            if (address) {
              headers['x-wallet-address'] = address;
              console.log('Using connected wallet address for API call:', address);
            } else if (storedAddress) {
              headers['x-wallet-address'] = storedAddress;
              console.log('Using stored wallet address for API call:', storedAddress);
            } else if (userSession?.address) {
              headers['x-wallet-address'] = userSession.address;
              console.log('Using session wallet address for API call:', userSession.address);
            }
            
            // Make API call with appropriate headers
            const response = await fetch('/api/users/me', { 
              headers,
              // Add cache busting parameter to prevent caching
              cache: 'no-store'
            });
            
            if (response.ok) {
              const userData = await response.json();
              console.log('User data fetched:', {
                id: userData.user?.id,
                address: userData.user?.address,
                onboarding_completed: userData.user?.onboarding_completed,
                role: userData.user?.role
              });
              
              // Store user role and onboarding status in localStorage
              if (userData.user?.role) {
                localStorage.setItem('userRole', userData.user.role);
              }
              
              if (userData.user?.address) {
                localStorage.setItem('walletAddress', userData.user.address);
              }
              
              if (userData.user?.profile_data?.name) {
                localStorage.setItem('userName', userData.user.profile_data.name);
              }
              
              if (userData.user?.onboarding_completed) {
                localStorage.setItem('onboardingCompleted', 'true');
              } else {
                localStorage.setItem('onboardingCompleted', 'false');
              }
              
              // If onboarding is not completed, redirect to onboarding
              if (!userData.user?.onboarding_completed) {
                const userRole = userData.user?.role || storedRole;
                if (userRole) {
                  console.log(`Redirecting to ${userRole} onboarding - onboarding not completed`);
                  router.push(`/${userRole}/onboarding`);
                  return;
                } else {
                  console.log('No role found for onboarding redirection');
                  // If no role is set, redirect to signup to choose a role
                  router.push('/signup');
                  return;
                }
              } else {
                console.log('User has completed onboarding');
              }
            } else {
              console.error('Failed to fetch user data:', response.status);
              const errorData = await response.json();
              console.log('Error details:', errorData);
              
              // If user not found but we have a wallet address, direct to signup to choose role
              if (response.status === 404 && (address || storedAddress)) {
                console.log('Wallet address not found in database, redirecting to signup');
                router.push('/signup');
                return;
              }
              
              // Otherwise check localStorage as fallback
              const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';
              if (!onboardingCompleted && storedRole) {
                console.log(`Redirecting to ${storedRole} onboarding (fallback)`);
                router.push(`/${storedRole}/onboarding`);
                return;
              }
            }
          } catch (error) {
            console.error('Error checking onboarding status:', error);
          }
        }

        // For routes that require authentication
        if (requireAuth && !isAuthenticated) {
          console.log('Authentication required but not authenticated, redirecting to signin');
          router.push('/signin');
          return;
        }
        
        // If we're authenticated and on a route that needs role verification
        if (isAuthenticated && requiredRole) {
          // Get the stored role or determine it if connected with wallet
          const userRole = storedRole || (isConnected && address ? determineUserRole(address) : null);
          
          // If the user doesn't have the required role, redirect to their dashboard
          if (userRole && userRole !== requiredRole) {
            console.log(`User role ${userRole} doesn't match required role ${requiredRole}, redirecting`);
            router.push(`/${userRole}/dashboard`);
            return;
          }
        }
        
        // If we're on an auth page but already authenticated, redirect to dashboard
        if (isAuthenticated && (pathname === '/signin' || pathname === '/signup')) {
          const userRole = storedRole || session?.user?.role || (isConnected && address ? determineUserRole(address) : 'writer');
          console.log(`Already authenticated on auth page, redirecting to ${userRole} dashboard`);
          router.push(`/${userRole}/dashboard`);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAuthAndOnboarding();
  }, [isConnected, address, pathname, requireAuth, requiredRole, router, session, status]);
  
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