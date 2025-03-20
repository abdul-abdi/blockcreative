'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { appKitModal } from '@/context';
import { useSession } from 'next-auth/react';
import { useUser } from '@/lib/hooks/useUser';
import { logAuthDebugInfo } from '@/lib/session-helper';

// Add interface for route history items
interface RouteHistoryItem {
  path: string;
  timestamp: number;
}

interface AuthWrapperProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'writer' | 'producer';
}

const publicRoutes = ['/', '/signin', '/signup'];
const onboardingRoutes = ['/writer/onboarding', '/producer/onboarding'];
// Add a max redirect count to prevent infinite loops
const MAX_REDIRECTS = 3;

// Helper function to thoroughly clear all auth state
const clearAuthState = () => {
  // Clear all localStorage items
  localStorage.clear();
  
  // Clear sessionStorage too
  try {
    sessionStorage.clear();
  } catch (e) {
    console.warn('Error clearing sessionStorage:', e);
  }
  
  // Clear all cookies by setting them to expire
  document.cookie.split(';').forEach(cookie => {
    const [name] = cookie.trim().split('=');
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      // Also try to clear secure cookies and domain-specific cookies
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure=true;`;
      
      try {
        // Also try domain-specific clearing
        const domain = window.location.hostname;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${domain}; path=/;`;
      } catch (e) {
        // Ignore domain errors
      }
    }
  });
  
  // Clear specific auth related items to be extra sure
  const authItems = [
    // User data
    'userRole', 
    'walletAddress', 
    'userName', 
    'onboardingCompleted', 
    
    // JWT tokens
    'token',
    'refreshToken',
    
    // Session management
    'authErrorCount', 
    'routeHistory', 
    
    // NextAuth tokens
    'next-auth.session-token',
    'next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.session-token',
    
    // AppKit related
    'appkit.session',
    'wagmi.store'
  ];
  
  authItems.forEach(item => {
    localStorage.removeItem(item);
    
    // Clear as cookies with all possible options
    document.cookie = `${item}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${item}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure=true;`;
    
    // For the token cookie specifically, try to explicitly invalidate it first
    if (item === 'token') {
      document.cookie = 'token=invalid; path=/; max-age=0;';
      document.cookie = 'token=invalid; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    }
  });
  
  console.log('Auth state completely cleared');
};

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
  const [redirectCount, setRedirectCount] = useState(0);
  
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
  
  // Keep track of route history to detect potential loops
  useEffect(() => {
    try {
      // Keep a small history of recent routes to detect potential loops
      const routeHistory = JSON.parse(localStorage.getItem('routeHistory') || '[]') as RouteHistoryItem[];
      const currentRoute = pathname || '/';
      
      // Add current route to history
      routeHistory.push({
        path: currentRoute,
        timestamp: Date.now()
      });
      
      // Keep only last 5 routes
      if (routeHistory.length > 5) {
        routeHistory.shift();
      }
      
      // Look for rapid toggles between same routes (potential loop)
      const lastTwoRoutes = routeHistory.slice(-2);
      if (lastTwoRoutes.length === 2 && 
          lastTwoRoutes[0].path === lastTwoRoutes[1].path && 
          lastTwoRoutes[1].timestamp - lastTwoRoutes[0].timestamp < 2000) {
        console.warn('Potential route loop detected!', routeHistory);
        // Force clear auth state to break the loop
        clearAuthState();
        
        // Hard reset if needed by sending to our reset API
        if (routeHistory.length >= 4) {
          const lastFourPaths = routeHistory.slice(-4).map((r: RouteHistoryItem) => r.path);
          const uniquePaths = new Set(lastFourPaths);
          if (uniquePaths.size <= 2) {
            // We have a serious loop, force full reset
            window.location.href = '/api/auth/reset';
            return;
          }
        }
      }
      
      localStorage.setItem('routeHistory', JSON.stringify(routeHistory));
    } catch (error) {
      console.error('Error tracking route history:', error);
    }
  }, [pathname]);
  
  // Monitor for auth errors
  useEffect(() => {
    const handleAuthError = (event: ErrorEvent) => {
      console.error('Auth error detected:', event.error);
      // If we hit too many errors, provide a clean reset
      const errorCount = parseInt(localStorage.getItem('authErrorCount') || '0') + 1;
      localStorage.setItem('authErrorCount', errorCount.toString());
      
      if (errorCount > 3 && pathname !== '/') {
        console.error('Too many auth errors, forcing reset');
        window.location.href = '/api/auth/reset';
      }
    };
    
    window.addEventListener('error', handleAuthError);
    return () => window.removeEventListener('error', handleAuthError);
  }, [pathname]);
  
  // Helper function to safely redirect while preventing loops
  const safeRedirect = (targetPath: string, reason: string) => {
    // Add a timestamp to prevent browser caching the redirect
    const timestamp = Date.now();
    const redirectPath = `${targetPath}${targetPath.includes('?') ? '&' : '?'}ts=${timestamp}`;
    
    if (pathname === targetPath || pathname === redirectPath.split('?')[0]) {
      console.log(`Preventing redirect loop: Already at ${targetPath}`);
      return false;
    }
    
    // Increment the redirect count
    setRedirectCount(prev => prev + 1);
    
    // If we've exceeded the max redirects, show an error instead
    if (redirectCount >= MAX_REDIRECTS) {
      console.error(`Too many redirects (${redirectCount}). Last attempted: ${targetPath}. Reason: ${reason}`);
      return false;
    }
    
    console.log(`Redirecting to ${redirectPath} - Reason: ${reason}`);
    router.push(redirectPath);
    return true;
  };

  // Synchronize session data between different auth methods
  const syncSessionData = (userData: any, walletAddress?: string) => {
    if (!userData) return;
    
    // Update localStorage with latest user data
    if (userData.role) {
      localStorage.setItem('userRole', userData.role);
      document.cookie = `userRole=${userData.role}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    }
    
    if (walletAddress || userData.address) {
      const addressToStore = walletAddress || userData.address;
      localStorage.setItem('walletAddress', addressToStore);
      document.cookie = `walletAddress=${addressToStore}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    }
    
    if (userData.profile_data?.name) {
      localStorage.setItem('userName', userData.profile_data.name);
    }
    
    if (userData.onboarding_completed !== undefined) {
      localStorage.setItem('onboardingCompleted', userData.onboarding_completed ? 'true' : 'false');
      document.cookie = `onboardingCompleted=${userData.onboarding_completed ? 'true' : 'false'}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    }
  };

  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      try {
        // Check if we're on a public route (no auth needed)
        const isPublicRoute = pathname ? publicRoutes.includes(pathname) : false;
        const isOnboardingRoute = pathname ? onboardingRoutes.some(route => pathname.startsWith(route)) : false;
        
        // Store wallet address in localStorage when connected
        if (isConnected && address) {
          console.log('Wallet connected:', address);
          localStorage.setItem('walletAddress', address);
          document.cookie = `walletAddress=${address}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
          // Refresh user data when wallet changes
          refreshUser();
        }
        
        // Get user info from various sources
        const userSession = session?.user;
        const storedRole = localStorage.getItem('userRole') || userSession?.role;
        const storedAddress = localStorage.getItem('walletAddress') || userSession?.address || address;
        const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true' || user?.onboarding_completed;
        const isAuthenticated = isConnected || status === 'authenticated' || (storedRole && storedAddress) || !!user;
        
        // More verbose logging to help diagnose issues
        if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_AUTH === 'true') {
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
            isOnboardingRoute,
            onboardingCompleted,
            redirectCount
          });
        }
        
        // If authenticated, check onboarding status (except if already on onboarding route)
        if (isAuthenticated && !isPublicRoute && !isOnboardingRoute) {
          // If user data is available from the hook
          if (user) {
            // Synchronize user data across authentication methods
            syncSessionData(user, address);
            
            // If onboarding is not completed, redirect to onboarding
            if (!user.onboarding_completed) {
              const userRole = user.role || storedRole;
              if (userRole) {
                safeRedirect(`/${userRole}/onboarding`, 'Onboarding not completed');
                return;
              } else {
                safeRedirect('/signup', 'No role found for onboarding redirection');
                return;
              }
            }
          } else if (!isUserLoading && error) {
            console.error('Failed to fetch user data:', error);
            
            // If we have a wallet address but no user data, the user might need to sign up
            if (address || storedAddress) {
              // Fallback to onboarding check from localStorage
              if (!onboardingCompleted && storedRole) {
                safeRedirect(`/${storedRole}/onboarding`, 'Onboarding not completed (fallback)');
                return;
              } else if (!isPublicRoute && pathname !== '/signup') {
                // Only redirect to signup if we're not already on a public route
                safeRedirect('/signup', 'User data not found, potential new user');
                return;
              }
            }
          }
        }

        // For routes that require authentication
        if (requireAuth && !isAuthenticated) {
          safeRedirect('/signin', 'Authentication required');
          return;
        }
        
        // If we're authenticated and on a route that needs role verification
        if (isAuthenticated && requiredRole) {
          // Get the stored role or determine it from user data
          const userRole = user?.role || storedRole || (isConnected && address ? determineUserRole(address) : null);
          
          // If the user doesn't have the required role, redirect to their dashboard
          if (userRole && userRole !== requiredRole) {
            safeRedirect(`/${userRole}/dashboard`, `Role mismatch: has ${userRole}, needs ${requiredRole}`);
            return;
          }
        }
        
        // If we're on an auth page but already authenticated, redirect to dashboard
        if (isAuthenticated && pathname && (pathname === '/signin' || pathname === '/signup')) {
          const userRole = user?.role || storedRole || session?.user?.role || (isConnected && address ? determineUserRole(address) : 'writer');
          safeRedirect(`/${userRole}/dashboard`, 'Already authenticated on auth page');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAuthAndOnboarding();
  }, [isConnected, address, pathname, requireAuth, requiredRole, router, session, status, user, error, refreshUser, isChecking, redirectCount]);
  
  // Function to determine user role based on address
  const determineUserRole = (address: string): 'writer' | 'producer' => {
    // For demo purposes - in a real app, this would check with a backend
    const lastChar = address.slice(-1).toLowerCase();
    const isEven = parseInt(lastChar, 16) % 2 === 0;
    const role = isEven ? 'writer' : 'producer';
    
    // Store role in localStorage and cookies for future reference
    localStorage.setItem('userRole', role);
    document.cookie = `userRole=${role}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    localStorage.setItem('walletAddress', address);
    document.cookie = `walletAddress=${address}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    
    return role as 'writer' | 'producer';
  };
  
  // Show error state if we've hit too many redirects
  if (redirectCount >= MAX_REDIRECTS) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-red-500">Authentication Error</h2>
          <p className="text-gray-400 mb-6">
            We encountered an issue while trying to authenticate you. Please try again or contact support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 rounded-lg text-white font-medium bg-white/10 hover:bg-white/20 transition-colors"
            >
              Go to Home
            </button>
            <button
              onClick={() => {
                clearAuthState();
                window.location.href = '/signin';
              }}
              className="px-6 py-3 rounded-lg text-white font-medium bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] hover:opacity-90 transition-opacity"
            >
              Reset & Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }
  
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
  
  // Render children if all checks pass
  return <>{children}</>;
} 