/**
 * Environment Configuration
 * 
 * This module centralizes all environment variable access throughout the application.
 * It also provides proper typing and validation.
 */

// Check if we're running on client or server
const isServer = typeof window === 'undefined';

// Helper to validate environment variables
function getRequiredServerEnv(key: string): string {
  const value = process.env[key];
  if (!value && isServer) {
    console.error(`Missing required environment variable: ${key}`);
  }
  return value || '';
}

// Helper to get an optional environment variable
function getOptionalEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

// Helper to get client-side environment variables
function getClientEnv(key: string): string {
  const nextPublicKey = `NEXT_PUBLIC_${key}`;
  return process.env[nextPublicKey] || '';
}

// Application Environment
export const APP_ENV = getOptionalEnv('NODE_ENV', 'development');
export const IS_PROD = APP_ENV === 'production';
export const IS_DEV = APP_ENV === 'development';
export const IS_TEST = APP_ENV === 'test';

// Server-specific environment variables (only accessible on server)
export const SERVER_ENV = {
  // MongoDB
  MONGODB_URI: getRequiredServerEnv('MONGODB_URI'),
  
  // Authentication
  NEXTAUTH_SECRET: getRequiredServerEnv('NEXTAUTH_SECRET'),
  NEXTAUTH_URL: getRequiredServerEnv('NEXTAUTH_URL'),
  
  // API Keys
  GEMINI_API_KEY: getRequiredServerEnv('GEMINI_API_KEY'),
  
  // Blockchain Configuration
  LISK_RPC_URL: getRequiredServerEnv('LISK_RPC_URL'),
  LISK_PRIVATE_KEY: getRequiredServerEnv('LISK_PRIVATE_KEY'),
  PLATFORM_ADDRESS: getRequiredServerEnv('PLATFORM_ADDRESS'),
  
  // Contract Addresses
  SCRIPT_NFT_ADDRESS: getRequiredServerEnv('SCRIPT_NFT_ADDRESS'),
  PROJECT_REGISTRY_ADDRESS: getRequiredServerEnv('PROJECT_REGISTRY_ADDRESS'),
  ESCROW_MANAGER_ADDRESS: getRequiredServerEnv('ESCROW_MANAGER_ADDRESS'),
  PLATFORM_FEE_MANAGER_ADDRESS: getRequiredServerEnv('PLATFORM_FEE_MANAGER_ADDRESS'),
  
  // Gas Configuration
  GAS_LIMIT: parseInt(getOptionalEnv('GAS_LIMIT', '5000000')),
  GAS_PRICE_MULTIPLIER: parseFloat(getOptionalEnv('GAS_PRICE_MULTIPLIER', '1.2'))
};

// Client-side public environment variables
export const CLIENT_ENV = {
  // Blockchain Configuration
  LISK_RPC_URL: getClientEnv('LISK_RPC_URL'),
  
  // Contract Addresses
  SCRIPT_NFT_ADDRESS: getClientEnv('SCRIPT_NFT_ADDRESS'),
  PROJECT_REGISTRY_ADDRESS: getClientEnv('PROJECT_REGISTRY_ADDRESS'),
  ESCROW_MANAGER_ADDRESS: getClientEnv('ESCROW_MANAGER_ADDRESS'),
  PLATFORM_FEE_MANAGER_ADDRESS: getClientEnv('PLATFORM_FEE_MANAGER_ADDRESS'),
  
  // Application Configuration
  API_BASE_URL: getClientEnv('API_BASE_URL'),
  PLATFORM_FEE_PERCENTAGE: parseInt(getClientEnv('PLATFORM_FEE_PERCENTAGE') || '3')
};

// Unified environment access (safe for both client and server)
// Only includes values that are safe to use on both client and server
export const ENV = {
  // Application
  APP_ENV,
  IS_PROD,
  IS_DEV,
  IS_TEST,
  
  // Public Blockchain Configuration
  LISK_RPC_URL: isServer ? SERVER_ENV.LISK_RPC_URL : CLIENT_ENV.LISK_RPC_URL,
  
  // Contract Addresses
  SCRIPT_NFT_ADDRESS: isServer ? SERVER_ENV.SCRIPT_NFT_ADDRESS : CLIENT_ENV.SCRIPT_NFT_ADDRESS,
  PROJECT_REGISTRY_ADDRESS: isServer ? SERVER_ENV.PROJECT_REGISTRY_ADDRESS : CLIENT_ENV.PROJECT_REGISTRY_ADDRESS,
  ESCROW_MANAGER_ADDRESS: isServer ? SERVER_ENV.ESCROW_MANAGER_ADDRESS : CLIENT_ENV.ESCROW_MANAGER_ADDRESS,
  PLATFORM_FEE_MANAGER_ADDRESS: isServer 
    ? SERVER_ENV.PLATFORM_FEE_MANAGER_ADDRESS 
    : CLIENT_ENV.PLATFORM_FEE_MANAGER_ADDRESS,
  
  // Platform Configuration
  PLATFORM_FEE_PERCENTAGE: isServer 
    ? parseInt(process.env.PLATFORM_FEE_PERCENTAGE || '3') 
    : CLIENT_ENV.PLATFORM_FEE_PERCENTAGE
};

// Export default for convenience
export default ENV; 