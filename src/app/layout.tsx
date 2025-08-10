import './globals.css';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import ClientInitializer from '@/components/ClientInitializer';
import BlockchainInitializer from '@/components/BlockchainInitializer';
import type { Metadata } from "next";
import ContextProvider from '@/context';
import connectToDatabase from '@/lib/mongodb';
import ErrorBoundaryWrapper from '@/components/ErrorBoundaryWrapper';
import { MarketplaceProvider } from '@/context/audio';
import { AudioPlayerProvider } from '@/context/audioPlayer';
import GlobalAudioBar from '@/components/GlobalAudioBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BlockCreative',
  description: 'Connect writers with producers through blockchain',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Connect to database and check connection status
  let dbConnected = false;
  try {
    await connectToDatabase();
    dbConnected = true;
  } catch (e) {
    console.error('Failed to connect to database in layout:', e);
  }

  return (
    <html lang="en" className="scroll-smooth bg-black">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} min-h-screen bg-black antialiased`}>
        <ContextProvider cookies="" dbConnected={dbConnected}>
          <ErrorBoundaryWrapper>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black">
              <div className="w-16 h-16 border-t-2 border-b-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin"></div>
            </div>}>
              <ClientInitializer />
              <BlockchainInitializer />
              <MarketplaceProvider>
                <AudioPlayerProvider>
                  {children}
                  <GlobalAudioBar />
                </AudioPlayerProvider>
              </MarketplaceProvider>
             
            </Suspense>
          </ErrorBoundaryWrapper>
        </ContextProvider>
      </body>
    </html>
  );
}
