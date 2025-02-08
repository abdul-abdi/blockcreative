import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BlockCreative | AI-Powered Blockchain Scriptwriting Platform",
  description: "Revolutionize scriptwriting with blockchain & AI. Empowering producers and scriptwriters to create award-winning content securely and transparently.",
  keywords: ["blockchain", "AI", "scriptwriting", "creative", "platform", "decentralized"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} min-h-screen`}>
        <main className="relative">
          {children}
        </main>
      </body>
    </html>
  );
}
