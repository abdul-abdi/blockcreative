'use client'
import { createContext, ReactNode, useContext, useState } from 'react';

const MarketplaceContext = createContext({
  marketplace: 'script', // default
  setMarketplace: (_: string) => {},
});

export const useMarketplace = () => useContext(MarketplaceContext);

export const MarketplaceProvider = ({ children }: {children: ReactNode}) => {
  const [marketplace, setMarketplace] = useState('script');
  return (
    <MarketplaceContext.Provider value={{ marketplace, setMarketplace }}>
      {children}
    </MarketplaceContext.Provider>
  );
};