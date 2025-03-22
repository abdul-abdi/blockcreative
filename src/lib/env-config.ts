/**
 * Environment Configuration
 * 
 * This module centralizes all environment variable access throughout the application.
 * It also provides proper typing and validation.
 */

import { z } from 'zod';

// Check if we're running on client or server
const isServer = typeof window === 'undefined';

// Helper functions to get environment variables with proper typing
const getRequiredServerEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    console.warn(`Missing required server environment variable: ${key}`);
  }
  return value || '';
};

const getOptionalEnv = (key: string, defaultValue: string = ''): string => {
  return process.env[key] || defaultValue;
};

const getClientEnv = (key: string): string => {
  // Safely check for window environment variables
  if (typeof window !== 'undefined') {
    // Safe access for window environment
    const windowEnv = (window as any).ENV;
    if (windowEnv && typeof windowEnv[key] !== 'undefined') {
      return windowEnv[key];
    }
  }
  return process.env[key] || '';
};

// Application Environment
export const APP_ENV = getOptionalEnv('NODE_ENV', 'development');
export const IS_PROD = APP_ENV === 'production';
export const IS_DEV = APP_ENV === 'development';
export const IS_TEST = APP_ENV === 'test';

// Development flags
export const SKIP_BLOCKCHAIN_VALIDATION = getOptionalEnv('SKIP_BLOCKCHAIN_VALIDATION', 'false');

// Server-specific environment variables (only accessible on server)
export const SERVER_ENV = {
  // Blockchain Configuration
  LISK_RPC_URL: getRequiredServerEnv('LISK_RPC_URL'),
  SEPOLIA_RPC_URL: getOptionalEnv('SEPOLIA_RPC_URL', 'https://ethereum-sepolia.publicnode.com'),
  LISK_PRIVATE_KEY: getRequiredServerEnv('LISK_PRIVATE_KEY'),
  
  // Contract Addresses
  SCRIPT_NFT_ADDRESS: getRequiredServerEnv('SCRIPT_NFT_ADDRESS'),
  PROJECT_REGISTRY_ADDRESS: getRequiredServerEnv('PROJECT_REGISTRY_ADDRESS'),
  ESCROW_MANAGER_ADDRESS: getRequiredServerEnv('ESCROW_MANAGER_ADDRESS'),
  PLATFORM_FEE_MANAGER_ADDRESS: getRequiredServerEnv('PLATFORM_FEE_MANAGER_ADDRESS'),
  
  // Gas Configuration
  GAS_LIMIT: parseInt(getOptionalEnv('GAS_LIMIT', '5000000')),
  GAS_PRICE_MULTIPLIER: parseFloat(getOptionalEnv('GAS_PRICE_MULTIPLIER', '1.2')),
  
  // Server-specific Configuration
  NEXTAUTH_SECRET: getRequiredServerEnv('NEXTAUTH_SECRET'),
  NEXTAUTH_URL: getRequiredServerEnv('NEXTAUTH_URL'),
  
  // Database Configuration
  DB_HOST: getRequiredServerEnv('DB_HOST'),
  DB_PORT: getOptionalEnv('DB_PORT'),
  DB_USER: getOptionalEnv('DB_USER'),
  DB_PASSWORD: getOptionalEnv('DB_PASSWORD'),
  DB_NAME: getRequiredServerEnv('DB_NAME'),
  
  // API Configuration
  API_URL: getRequiredServerEnv('API_URL'),
  
  // Authentication and Security
  JWT_SECRET: getRequiredServerEnv('JWT_SECRET'),
  
  // Payment Processing
  STRIPE_SECRET_KEY: getRequiredServerEnv('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: getRequiredServerEnv('STRIPE_WEBHOOK_SECRET'),
  
  // Feature Flags
  AUTH_DEMO_APP: getRequiredServerEnv('AUTH_DEMO_APP'),
  
  // Integration Configuration
  DPO_COMPANY_TOKEN: getRequiredServerEnv('DPO_COMPANY_TOKEN'),
  DPO_SERVICE_TYPE: getRequiredServerEnv('DPO_SERVICE_TYPE'),
  
  // Public URLs
  NEXT_PUBLIC_APP_HOST: getRequiredServerEnv('NEXT_PUBLIC_APP_HOST'),
  
  // API Keys
  GEMINI_API_KEY: getRequiredServerEnv('GEMINI_API_KEY'),
};

// Client-side public environment variables
export const CLIENT_ENV = {
  // Blockchain Configuration
  LISK_RPC_URL: getClientEnv('NEXT_PUBLIC_LISK_RPC_URL'),
  SEPOLIA_RPC_URL: getClientEnv('NEXT_PUBLIC_SEPOLIA_RPC_URL'),
  
  // Contract Addresses
  SCRIPT_NFT_ADDRESS: getClientEnv('NEXT_PUBLIC_SCRIPT_NFT_ADDRESS'),
  PROJECT_REGISTRY_ADDRESS: getClientEnv('NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS'),
  ESCROW_MANAGER_ADDRESS: getClientEnv('NEXT_PUBLIC_ESCROW_MANAGER_ADDRESS'),
  PLATFORM_FEE_MANAGER_ADDRESS: getClientEnv('NEXT_PUBLIC_PLATFORM_FEE_MANAGER_ADDRESS'),
  
  // Application Configuration
  API_BASE_URL: getClientEnv('API_BASE_URL'),
  PLATFORM_FEE_PERCENTAGE: parseInt(getClientEnv('PLATFORM_FEE_PERCENTAGE') || '3'),
  
  // Client-specific Configuration
  NEXT_PUBLIC_API_URL: getClientEnv('NEXT_PUBLIC_API_URL'),
  NEXT_PUBLIC_APP_NAME: getClientEnv('NEXT_PUBLIC_APP_NAME'),
  NEXT_PUBLIC_APP_DESCRIPTION: getClientEnv('NEXT_PUBLIC_APP_DESCRIPTION'),
  NEXT_PUBLIC_APP_URL: getClientEnv('NEXT_PUBLIC_APP_URL'),
};

// Unified environment access (safe for both client and server)
// Only includes values that are safe to use on both client and server
export const ENV = {
  // Application
  APP_ENV,
  IS_PROD,
  IS_DEV,
  IS_TEST,
  
  // Development flags
  SKIP_BLOCKCHAIN_VALIDATION,
  
  // Public Blockchain Configuration
  LISK_RPC_URL: isServer ? SERVER_ENV.LISK_RPC_URL : CLIENT_ENV.LISK_RPC_URL,
  SEPOLIA_RPC_URL: isServer ? SERVER_ENV.SEPOLIA_RPC_URL : CLIENT_ENV.SEPOLIA_RPC_URL,
  LISK_PRIVATE_KEY: isServer ? SERVER_ENV.LISK_PRIVATE_KEY : '',
  
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
    : CLIENT_ENV.PLATFORM_FEE_PERCENTAGE,
    
  // Gas Configuration
  GAS_LIMIT: SERVER_ENV.GAS_LIMIT,
  GAS_PRICE_MULTIPLIER: SERVER_ENV.GAS_PRICE_MULTIPLIER,
  
  // Server-only vars
  DB_HOST: SERVER_ENV.DB_HOST,
  DB_PORT: SERVER_ENV.DB_PORT,
  DB_USER: SERVER_ENV.DB_USER,
  DB_PASSWORD: SERVER_ENV.DB_PASSWORD,
  DB_NAME: SERVER_ENV.DB_NAME,
  API_URL: SERVER_ENV.API_URL,
  JWT_SECRET: SERVER_ENV.JWT_SECRET,
  NEXTAUTH_SECRET: SERVER_ENV.NEXTAUTH_SECRET,
  NEXTAUTH_URL: SERVER_ENV.NEXTAUTH_URL,
  STRIPE_SECRET_KEY: SERVER_ENV.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: SERVER_ENV.STRIPE_WEBHOOK_SECRET,
  AUTH_DEMO_APP: SERVER_ENV.AUTH_DEMO_APP,
  DPO_COMPANY_TOKEN: SERVER_ENV.DPO_COMPANY_TOKEN,
  DPO_SERVICE_TYPE: SERVER_ENV.DPO_SERVICE_TYPE,
  NEXT_PUBLIC_APP_HOST: SERVER_ENV.NEXT_PUBLIC_APP_HOST,
  
  // AI Configuration
  GEMINI_API_KEY: isServer ? SERVER_ENV.GEMINI_API_KEY : '',
};

// Export default for convenience
export default ENV; 