'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { appKitModal } from '@/context';
import { useSession } from 'next-auth/react';
import { useUser } from '@/lib/hooks/useUser';
import { logAuthDebugInfo } from '@/lib/session-helper';

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
  const { user, error, isLoading: isUserLoading, mutate: refreshUser } = useUser();
  
  // Log additional debugging information to help troubleshoot Vercel deployment issues
  useEffect(() => {
    // Only log in development or when explicitly enabled
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_AUTH === 'true') {
      logAuthDebugInfo(session, status);
      console.log('Path:', pathname);
      console.log('Wallet connected:', isConnected);
      console.log('User from hook:', !!user);
      console.log('Error from hook:', error);
    }
  }, [session, status, pathname, isConnected, user, error]);

  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      try {
        // Check if we're on a public route (no auth needed)
        const isPublicRoute = pathname ? publicRoutes.includes(pathname) : false;
        const isOnboardingRoute = pathname ? onboardingRoutes.some(route => pathname.startsWith(route)) : false;
        
        // Store wallet address in localStorage when connected
        if (isConnected && address) {
          console.log('Storing connected wallet address in localStorage:', address);
          localStorage.setItem('walletAddress', address);
          // Refresh user data when wallet changes
          refreshUser();
        }
        
        // Get user info from localStorage or session
        const userSession = session?.user;
        const storedRole = localStorage.getItem('userRole') || userSession?.role;
        const storedAddress = localStorage.getItem('walletAddress') || userSession?.address || address;
        const isAuthenticated = isConnected || status === 'authenticated' || (storedRole && storedAddress);
        
        // More verbose logging to help diagnose issues
        console.log('Auth status check:', { 
          env: process.env.NODE_ENV || 'unknown',
          isAuthenticated, 
          isConnected,
          sessionStatus: status,
          address: address || 'No connected address',
          storedAddress: storedAddress || 'No stored address',
          userFromLocalStorage: !!localStorage.getItem('userRole'),
          userFromSession: !!session?.user,
          userFromSWR: !!user,
          pathname,
          isPublicRoute,
          isOnboardingRoute
        });
        
        // If authenticated, check onboarding status (except if already on onboarding route)
        if (isAuthenticated && !isPublicRoute && !isOnboardingRoute) {
          // If user data is available from the hook
          if (user) {
            console.log('User data fetched from cache:', {
              id: user.id,
              address: user.address,
              onboarding_completed: user.onboarding_completed,
              role: user.role
            });
            
            // Store user role and onboarding status in localStorage
            if (user.role) {
              localStorage.setItem('userRole', user.role);
            }
            
            if (user.address) {
              localStorage.setItem('walletAddress', user.address);
            }
            
            if (user.profile_data?.name) {
              localStorage.setItem('userName', user.profile_data.name);
            }
            
            if (user.onboarding_completed) {
              localStorage.setItem('onboardingCompleted', 'true');
            } else {
              localStorage.setItem('onboardingCompleted', 'false');
            }
            
            // If onboarding is not completed, redirect to onboarding
            if (!user.onboarding_completed) {
              const userRole = user.role || storedRole;
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
          } else if (error) {
            console.error('Failed to fetch user data:', error);
            
            // Instead of immediately redirecting, add a small delay and a check
            // This can help prevent redirect loops on Vercel
            if (!isChecking && (address || storedAddress)) {
              console.log('Wallet address not found in database, redirecting to signup with delay');
              
              // Wait 500ms before redirecting to avoid rapid redirect loops
              setTimeout(() => {
                if (pathname !== '/signup') {
                  router.push('/signup');
                }
              }, 500);
              return;
            }
            
            // Otherwise check localStorage as fallback
            const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';
            if (!onboardingCompleted && storedRole) {
              console.log(`Redirecting to ${storedRole} onboarding (fallback)`);
              const targetPath = `/${storedRole}/onboarding`;
              
              // Prevent redirect loops by checking the current path
              if (pathname !== targetPath) {
                router.push(targetPath);
              }
              return;
            }
          }
        }

        // For routes that require authentication
        if (requireAuth && !isAuthenticated) {
          console.log('Authentication required but not authenticated, redirecting to signin');
          
          // Prevent redirect loops
          if (pathname !== '/signin') {
            router.push('/signin');
          }
          return;
        }
        
        // If we're authenticated and on a route that needs role verification
        if (isAuthenticated && requiredRole) {
          // Get the stored role or determine it if connected with wallet
          const userRole = storedRole || (isConnected && address ? determineUserRole(address) : null);
          
          // If the user doesn't have the required role, redirect to their dashboard
          if (userRole && userRole !== requiredRole) {
            console.log(`User role ${userRole} doesn't match required role ${requiredRole}, redirecting`);
            const targetPath = `/${userRole}/dashboard`;
            
            // Prevent redirect loops
            if (pathname !== targetPath) {
              router.push(targetPath);
            }
            return;
          }
        }
        
        // If we're on an auth page but already authenticated, redirect to dashboard
        if (isAuthenticated && pathname && (pathname === '/signin' || pathname === '/signup')) {
          const userRole = storedRole || session?.user?.role || (isConnected && address ? determineUserRole(address) : 'writer');
          console.log(`Already authenticated on auth page, redirecting to ${userRole} dashboard`);
          const targetPath = `/${userRole}/dashboard`;
          
          // Prevent redirect loops
          if (pathname !== targetPath) {
            router.push(targetPath);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAuthAndOnboarding();
  }, [isConnected, address, pathname, requireAuth, requiredRole, router, session, status, user, error, refreshUser, isChecking]);
  
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
  if (requireAuth && !isConnected && !localStorage.getItem('userRole') && pathname && !publicRoutes.includes(pathname)) {
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