import useSWR from 'swr';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';

// Clear local storage when user authentication fails
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

// Enhanced fetcher that handles wallet address authentication
const fetcher = async (url: string) => {
  try {
    // Get the wallet address from localStorage
    const walletAddress = localStorage.getItem('walletAddress');
    
    // Include wallet address in request headers if available
    const headers: HeadersInit = {
      'Cache-Control': 'no-cache', // Prevent browser cache issues during debugging
      'Content-Type': 'application/json'
    };
    
    if (walletAddress) {
      headers['x-wallet-address'] = walletAddress;
    }
    
    // Make the request with appropriate headers
    const res = await fetch(url, { 
      headers: headers
    });
    
    // For 404 errors from /api/users/me, clear localStorage and return empty user state
    if (res.status === 404 && url.includes('/api/users/me')) {
      console.log('User not found (404), clearing localStorage and returning empty user state');
      clearAuthData(); // Clear localStorage when user not found
      return { user: null, authenticated: false };
    }
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Fetch error for ${url}:`, {
        status: res.status,
        statusText: res.statusText,
        body: errorText
      });
      
      const error = new Error('An error occurred while fetching the data.');
      error.message = errorText;
      throw error;
    }
    
    const data = await res.json();
    return { 
      ...data, 
      authenticated: !!data.user 
    };
  } catch (error) {
    console.error('Fetch exception:', error);
    throw error;
  }
};

/**
 * Hook to fetch and cache current user data
 * Uses SWR for caching and revalidation
 * Now uses wallet address for authentication instead of NextAuth
 */
export function useUser({
  redirectTo = '',
  redirectIfFound = false
} = {}) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  // Check for wallet address in localStorage or from wagmi
  useEffect(() => {
    const storedAddress = localStorage.getItem('walletAddress');
    if (address) {
      // If wagmi has an address, use it and update localStorage
      setWalletAddress(address);
      localStorage.setItem('walletAddress', address);
    } else if (storedAddress) {
      // Otherwise use localStorage if available
      setWalletAddress(storedAddress);
    }
  }, [address]);
  
  // Only fetch if we have a wallet address
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    walletAddress ? '/api/users/me' : null, 
    fetcher, 
    {
      // Cache for 10 seconds
      dedupingInterval: 10000,
      // Different refresh intervals for dev/prod
      refreshInterval: process.env.NODE_ENV === 'production' ? 60000 : 30000, // 1min in prod, 30s in dev
      // Settings to avoid unnecessary revalidation which can cause redirect loops
      revalidateOnFocus: false,
      revalidateIfStale: true,
      // Cache data between component mounts
      revalidateOnReconnect: false,
      // Retry failed requests to handle intermittent issues
      errorRetryCount: 3,
      // On error, don't retry immediately to prevent rapid request loops
      errorRetryInterval: 5000, // 5 seconds between retries
      shouldRetryOnError: true,
    }
  );

  // Handle redirects based on authentication state
  useEffect(() => {
    // Don't redirect if no redirect path specified
    if (!redirectTo) return;
    
    // Wait until data is loaded and not in error state
    if (isLoading) return;
    
    // Check if user is authenticated through wallet
    const isAuthenticated = !!(isConnected || walletAddress) && data?.authenticated;

    if (
      // If redirectIfFound is true, redirect if the user was found
      (redirectIfFound && isAuthenticated) ||
      // If redirectIfFound is false, redirect if the user was not found
      (!redirectIfFound && !isAuthenticated)
    ) {
      router.push(redirectTo);
    }
  }, [data, redirectIfFound, redirectTo, router, isLoading, isConnected, walletAddress]);
  
  return {
    user: data?.user,
    authenticated: data?.authenticated || false,
    error,
    isLoading,
    isValidating,
    mutate
  };
}

/**
 * Hook to fetch other user profiles with caching
 */
export function useUserProfile(userId: string | null | undefined) {
  const { data, error, isLoading } = useSWR(
    userId ? `/api/users/${userId}` : null,
    fetcher,
    {
      // Cache for 1 minute
      dedupingInterval: 60000,
      // Don't revalidate automatically
      revalidateOnFocus: false,
      revalidateIfStale: false,
      shouldRetryOnError: true,
    }
  );
  
  return {
    profile: data?.user,
    error,
    isLoading
  };
} 