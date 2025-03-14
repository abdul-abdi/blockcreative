import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    error.message = await res.text();
    throw error;
  }
  
  return res.json();
};

/**
 * Hook to fetch and cache current user data
 * Uses SWR for caching and revalidation
 */
export function useUser() {
  const { data, error, isLoading, isValidating, mutate } = useSWR('/api/users/me', fetcher, {
    // Cache for 10 seconds
    dedupingInterval: 10000,
    // Revalidate every 30 seconds
    refreshInterval: 30000,
    // Keep stale data on error
    revalidateOnFocus: false,
    revalidateIfStale: false,
    // Cache data between component mounts
    revalidateOnReconnect: false
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
      revalidateIfStale: false
    }
  );
  
  return {
    profile: data?.user,
    error,
    isLoading
  };
} 