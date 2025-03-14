'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Use dynamic import in a client component
const BlockchainInitializer = dynamic(() => import('./BlockchainInitializer'), { ssr: false });

export default function ClientInitializer() {
  return <BlockchainInitializer />;
} 