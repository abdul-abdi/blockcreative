'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { appKitModal } from '@/context';
import { useDisconnect } from 'wagmi';
import { signOut as nextAuthSignOut } from 'next-auth/react';

export default function SignOut() {
  const router = useRouter();
  const { disconnect } = useDisconnect();
  
  useEffect(() => {
    const performSignOut = async () => {
      try {
        console.log('Starting signout process...');
        
        // Sign out of NextAuth first (important to do this before clearing client storage)
        try {
          await nextAuthSignOut({ redirect: false });
          console.log('NextAuth sign out completed');
        } catch (nextAuthError) {
          console.error('NextAuth sign out failed:', nextAuthError);
        }
        
        // First clear everything in client-side storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Revoke any existing tokens by setting to invalid values
        try {
          // Clear specific JWT token that might be persisting
          document.cookie = 'token=invalid; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
          // Also try with various attributes
          document.cookie = 'token=invalid; path=/; max-age=0;';
          document.cookie = 'token=invalid; path=/; max-age=0; domain=' + window.location.hostname + ';';
        } catch (tokenError) {
          console.error('Error clearing token:', tokenError);
        }
        
        // Clear all cookies by setting them to expire
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.trim().split('=');
          if (name) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            // Also try to clear secure cookies and domain-specific cookies
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure=true;`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}; path=/;`;
            
            // Additional attempt for root path
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
          }
        });
        
        // Disconnect wallet
        disconnect();
        console.log('Wallet disconnected');
        
        // Try to open AppKit modal to ensure it's disconnected there too
        try {
          await appKitModal.open({ view: 'Account' });
          // Give it a moment to process the disconnection
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log('AppKit modal opened for disconnection');
        } catch (modalError) {
          console.error('Error opening AppKit modal:', modalError);
          // Continue with signout even if modal fails
        }
        
        // Call our server-side reset API for a thorough cleanup of all cookies
        // This ensures proper server-side cookie clearing with the right security attributes
        console.log('Redirecting to reset API...');
        
        // First call the specific token-clearing API endpoint then redirect to home
        try {
          console.log('Calling token clear API...');
          const clearResponse = await fetch('/api/auth/clear-token', { 
            method: 'GET',
            cache: 'no-store',
            credentials: 'include'
          });
          
          if (clearResponse.ok) {
            console.log('Token clear API call successful');
          } else {
            console.warn('Token clear API call failed:', await clearResponse.text());
          }
        } catch (clearError) {
          console.error('Error calling token clear API:', clearError);
        }
        
        const timestamp = Date.now();
        const resetUrl = `/api/auth/reset?ts=${timestamp}&source=signout`;
        
        // Small delay to ensure previous actions complete
        setTimeout(() => {
          console.log('Redirecting to main reset endpoint...');
          window.location.href = resetUrl;
        }, 300);
      } catch (error) {
        console.error('Error during sign out:', error);
        // Force navigation to reset API on error
        window.location.href = '/api/auth/reset?error=signout_error';
      }
    };
    
    performSignOut();
  }, [router, disconnect]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-white">Signing you out...</h1>
        <p className="text-gray-400">Please wait while we securely sign you out.</p>
        <div className="mt-6">
          <div className="w-12 h-12 border-t-2 border-b-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    </div>
  );
} 