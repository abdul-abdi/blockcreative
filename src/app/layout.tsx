import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { headers } from 'next/headers';
import ContextProvider from '@/context';
import connectToDatabase from '@/lib/mongodb';
import ClientInitializer from '@/components/ClientInitializer';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BlockCreative",
  description: "Connect scriptwriters with producers securely using blockchain technology",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get headers for cookie handling
  const headersObj = await headers();
  const cookies = headersObj.get('cookie');
  
  // Connect to MongoDB on server-side
  let dbConnected = false;
  if (typeof window === 'undefined') {
    try {
      await connectToDatabase();
      console.log('Database connected successfully');
      dbConnected = true;
    } catch (error) {
      console.error('Database connection error:', error);
      console.log('Continuing without database connection - will use mock data for development');
    }
  }

  return (
    <html lang="en" className="scroll-smooth bg-black">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} min-h-screen bg-black antialiased`}>
        <ContextProvider cookies={cookies} dbConnected={dbConnected}>
          {/* Client-side component for blockchain initialization */}
          <ClientInitializer />
          {children}
        </ContextProvider>
      </body>
    </html>
  );
}
