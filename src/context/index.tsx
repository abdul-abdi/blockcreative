'use client'

import { wagmiAdapter, projectId, domain } from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum, lisk, liskSepolia } from '@reown/appkit/networks'
import React, { type ReactNode, createContext, useContext } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { SessionProvider } from 'next-auth/react'

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

// Create the AppKit modal
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
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <DatabaseContext.Provider value={{ connected: dbConnected }}>
            {children}
          </DatabaseContext.Provider>
        </SessionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default ContextProvider