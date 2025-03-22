'use client'

import { wagmiAdapter, projectId, domain } from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum, lisk, liskSepolia } from '@reown/appkit/networks'
import React, { type ReactNode, createContext, useContext, useEffect } from 'react'
import { cookieToInitialState, WagmiProvider, type Config, type State } from 'wagmi'

// Set up queryClient
const queryClient = new QueryClient()

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = {
  name: 'Blockcreative',
  description: 'Revolutionize scriptwriting with blockchain & AI. Empowering producers and scriptwriters to create award-winning content securely and transparently.',
  url: `https://${domain}`, // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

console.log('Initializing AppKit with domain:', domain, 'and projectId:', projectId);

// Create the AppKit modal without SIWE integration
export const appKitModal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [mainnet, arbitrum, liskSepolia, lisk],
  defaultNetwork: mainnet,
  metadata: metadata,
  features: {
    analytics: true,
    email: true,
    socials: ['google', 'x', 'github', 'discord', 'apple', 'facebook', 'farcaster'],
    emailShowWallets: false,
  },
  allWallets: 'SHOW',
})

// Create a context for database connection status
export const DatabaseContext = createContext<{ connected: boolean }>({ connected: false });

// Hook to use database connection status
export const useDatabaseStatus = () => useContext(DatabaseContext);

function ContextProvider({ 
  children, 
  cookies, 
  dbConnected = false 
}: { 
  children: ReactNode; 
  cookies: string | null;
  dbConnected?: boolean;
}) {
  // For Wagmi state, don't set a default state as it expects a specific structure with Maps
  let initialState = undefined;
  
  try {
    if (cookies && cookies.trim() !== '') {
      console.log('Parsing cookies for Wagmi state initialization');
      initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies);
      console.log('Wagmi state initialized from cookies');
    } else {
      console.log('No cookies available for Wagmi state initialization');
    }
  } catch (error) {
    console.error('Error parsing cookies for Wagmi state:', error);
  }

  // Effect for wallet initialization logging
  useEffect(() => {
    console.log('ContextProvider mounted - wallet services initialized');
    
    // Listen for wallet connection events if needed
    const handleWalletChange = () => {
      console.log('Wallet state changed');
    };

    // You can add global event listeners here if needed
    window.addEventListener('wallet-changed', handleWalletChange);
    
    return () => {
      window.removeEventListener('wallet-changed', handleWalletChange);
      console.log('ContextProvider unmounted - cleaning up wallet listeners');
    };
  }, []);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <DatabaseContext.Provider value={{ connected: dbConnected }}>
          {children}
        </DatabaseContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default ContextProvider