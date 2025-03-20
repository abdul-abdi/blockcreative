'use client';

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Dynamically load the ErrorBoundary component to avoid SSR issues
const ErrorBoundary = dynamic(
  () => import('@/components/ErrorBoundary'),
  { ssr: false }
);

export default function ErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
} 