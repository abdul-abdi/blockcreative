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

  useEffect(() => {
    const init = async () => {
      try {
        // Only run in browser environment
        if (typeof window !== 'undefined') {
          console.log('Initializing blockchain connection in browser...');
          const success = await startup();
          setInitialized(success);
          if (!success) {
            setError('Failed to initialize blockchain connection');
          }
        }
      } catch (err) {
        console.error('Error initializing blockchain:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setInitialized(false);
      }
    };

    // Only run initialization once
    if (!initialized && !error) {
      init();
    }
  }, [initialized, error]);

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