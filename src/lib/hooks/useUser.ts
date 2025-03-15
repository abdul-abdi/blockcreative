import useSWR from 'swr';

// Enhanced fetcher that handles credentials and includes debugging information
const fetcher = async (url: string) => {
  try {
    // Include credentials in the request (important for Vercel production environment)
    const res = await fetch(url, { 
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache', // Prevent browser cache issues during debugging
      }
    });
    
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
    
    return res.json();
  } catch (error) {
    console.error('Fetch exception:', error);
    throw error;
  }
};

/**
 * Hook to fetch and cache current user data
 * Uses SWR for caching and revalidation
 */
export function useUser() {
  const { data, error, isLoading, isValidating, mutate } = useSWR('/api/users/me', fetcher, {
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
    // Add credentials to ensure cookies are sent
    shouldRetryOnError: true,
  });
  
  return {
    user: data?.user,
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
      // Add credentials to ensure cookies are sent
      shouldRetryOnError: true,
    }
  );
  
  return {
    profile: data?.user,
    error,
    isLoading
  };
} 