'use client';

import { useEffect, useState } from 'react';
import startup from '@/lib/startup';

/**
 * Client-side component to initialize blockchain connection
 * This component doesn't render anything visible
 */
export default function BlockchainInitializer() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    const init = async () => {
      try {
        // Only run in browser environment
        if (typeof window !== 'undefined') {
          console.log('Initializing blockchain connection in browser...');
          
          // Check if we have the required environment variables
          const nextPublicRpcUrl = process.env.NEXT_PUBLIC_LISK_RPC_URL;
          if (!nextPublicRpcUrl) {
            console.warn('NEXT_PUBLIC_LISK_RPC_URL is not set. Using fallback RPC URL.');
          }
          
          const success = await startup();
          setInitialized(success);
          if (!success) {
            throw new Error('Failed to initialize blockchain connection');
          }
        }
      } catch (err) {
        console.error('Error initializing blockchain:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to connect to blockchain network. Please check your internet connection and try again. Details: ${errorMessage}`);
        setInitialized(false);
        
        // Retry initialization if we haven't exceeded max retries
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying blockchain initialization (${retryCount + 1}/${MAX_RETRIES})...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000); // Retry after 2 seconds
        }
      }
    };

    // Only run initialization once or when retrying
    if (!initialized && !error) {
      init();
    } else if (!initialized && error && retryCount > 0 && retryCount <= MAX_RETRIES) {
      // Reset error for retry
      setError(null);
      init();
    }
  }, [initialized, error, retryCount]);

  // Log state changes for debugging
  useEffect(() => {
    if (initialized) {
      console.log('Blockchain connection initialized successfully');
    } else if (error) {
      console.error('Blockchain initialization error:', error);
    }
  }, [initialized, error]);

  // This component doesn't render anything visible
  return null;
} 