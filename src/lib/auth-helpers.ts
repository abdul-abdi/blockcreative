import { appKitModal } from '@/context';

// Helper function to clear all authentication data from localStorage
export const clearAuthData = () => {
  try {
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userAvatar');
    localStorage.removeItem('companyName');
    localStorage.removeItem('signupDate');
    localStorage.removeItem('onboardingCompleted');
    
    // Clear Wagmi state
    localStorage.removeItem('wagmi.connected');
    localStorage.removeItem('wagmi.store');
    localStorage.removeItem('wagmi.recentConnectorId');
    
    console.log('Cleared auth data from localStorage');
  } catch (err) {
    console.error('Error clearing localStorage:', err);
  }
};

// Helper to properly disconnect wallet
export const disconnectWallet = async () => {
  try {
    // First try AppKit disconnect
    try {
      await appKitModal.disconnect();
      console.log('AppKit disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting AppKit:', error);
    }
    
    // Clear all auth data regardless of AppKit disconnect success
    clearAuthData();
    
    console.log('Wallet disconnected successfully');
    return true;
  } catch (error) {
    console.error('Error during wallet disconnection:', error);
    return false;
  }
};

// Helper to check if a user exists in the database
export const checkUserExists = async (walletAddress: string) => {
  try {
    if (!walletAddress) {
      return { exists: false, error: 'No wallet address provided' };
    }
    
    // Normalize wallet address to lowercase
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Call API to check user existence
    const response = await fetch('/api/users/me', {
      headers: {
        'x-wallet-address': normalizedAddress,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (response.status === 404) {
      return { exists: false };
    } else if (response.ok) {
      const data = await response.json();
      
      if (!data.user) {
        return { exists: false, error: 'Invalid user data returned' };
      }
      
      return { 
        exists: true, 
        user: data.user 
      };
    } else {
      const errorData = await response.json();
      return { 
        exists: false,
        error: errorData.message || errorData.error || 'Failed to check user existence'
      };
    }
  } catch (error) {
    console.error('Error checking user existence:', error);
    return { 
      exists: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Helper to handle wallet connection errors
export const parseWalletError = (error: any): string => {
  if (!error) return 'Unknown error';
  
  const errorString = typeof error === 'string' 
    ? error 
    : error.message || error.toString();
  
  // Check for connector already connected error
  if (errorString.includes('already connected')) {
    return 'Wallet is already connected. Please try again.';
  }
  
  // Check for common SIWE error patterns
  if (errorString.includes('User rejected')) {
    return 'You rejected the signature request. Please try again.';
  }
  
  if (errorString.includes('nonce')) {
    return 'Authentication error: Invalid nonce. Please try again.';
  }
  
  if (errorString.includes('Connector not found')) {
    return 'No wallet connector found. Please make sure your wallet is installed.';
  }
  
  if (errorString.includes('Chain not configured')) {
    return 'Network not supported. Please switch to a supported network.';
  }
  
  // If we don't recognize the error, return the error string or a generic message
  return errorString || 'Failed to connect. Please try again.';
}; 