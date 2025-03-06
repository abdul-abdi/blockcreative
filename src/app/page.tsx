import type { Metadata } from 'next';
import ClientWrapper from '@/components/ClientWrapper';

export const metadata: Metadata = {
  title: 'BlockCreative | Home',
  description: 'Welcome to BlockCreative - The future of scriptwriting powered by blockchain and AI.',
};

export default function Home() {
  return (
    <div className="relative">
      <ClientWrapper />
      <appkit-button />
    </div>
  );
}
