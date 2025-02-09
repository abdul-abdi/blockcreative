'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface SocialAuthProps {
  onConnect: (provider: string) => void;
}

const socialProviders = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
    type: 'web3'
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: 'https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Logo/Blue%20(Default)/Logo.svg',
    type: 'web3'
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    icon: 'https://seeklogo.com/images/C/coinbase-coin-logo-C86F46D7B8-seeklogo.com.png',
    type: 'web3'
  },
  {
    id: 'google',
    name: 'Google',
    icon: 'https://www.svgrepo.com/show/475656/google-color.svg',
    type: 'traditional'
  },
  {
    id: 'apple',
    name: 'Apple',
    icon: 'https://seeklogo.com/images/A/apple-logo-52C416BDDD-seeklogo.com.png',
    type: 'traditional'
  }
];

export default function SocialAuth({ onConnect }: SocialAuthProps) {
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  const handleConnect = async (providerId: string) => {
    setIsConnecting(providerId);
    try {
      await onConnect(providerId);
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setIsConnecting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {socialProviders.map((provider) => (
          <motion.button
            key={provider.id}
            onClick={() => handleConnect(provider.id)}
            disabled={isConnecting !== null}
            className={`
              flex items-center justify-center space-x-2 w-full px-4 py-3
              border border-white/10 rounded-lg
              ${provider.type === 'web3' ? 'bg-[#2D2D2D]' : 'bg-white/5'}
              hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative w-5 h-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={provider.icon}
                alt={`${provider.name} icon`}
                className="w-full h-full object-contain"
              />
              {isConnecting === provider.id && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white/10 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-white">
              {provider.name}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
} 