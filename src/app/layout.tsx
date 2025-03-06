import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { headers } from 'next/headers' 
import ContextProvider from '@/context'

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#40E0D0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export const metadata: Metadata = {
  title: "BlockCreative | AI-Powered Blockchain Scriptwriting Platform",
  description: "Revolutionize scriptwriting with blockchain & AI. Empowering producers and scriptwriters to create award-winning content securely and transparently.",
  keywords: ["blockchain", "AI", "scriptwriting", "creative", "platform", "decentralized"],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    apple: [
      { url: "/icon.svg", type: "image/svg+xml" }
    ]
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

const headersObj = await headers();
const cookies = headersObj.get('cookie');

 
  return (
    <html lang="en" className="scroll-smooth bg-black">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className={`${inter.className} min-h-screen bg-black antialiased`}>
       
        <ContextProvider cookies={cookies}>{children}</ContextProvider>
      </body>
    </html>
  );
}
