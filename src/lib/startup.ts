import { initBlockchain } from './blockchain';

// Only import dotenv on the server side
if (typeof window === 'undefined') {
  // Use dynamic import instead of require
  import('dotenv').then(dotenv => {
    dotenv.config({ path: '.env.local' });
  });
}

/**
 * Checks if smart contracts are deployed by checking environment variables
 */
export function areContractsDeployed(): boolean {
  // Get contract addresses (different method based on environment)
  const getContractAddresses = () => {
    if (typeof window !== 'undefined') {
      // Browser environment
      return {
        scriptNFTAddress: process.env.NEXT_PUBLIC_SCRIPT_NFT_ADDRESS,
        projectRegistryAddress: process.env.NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS,
        escrowManagerAddress: process.env.NEXT_PUBLIC_ESCROW_MANAGER_ADDRESS,
        platformFeeManagerAddress: process.env.NEXT_PUBLIC_PLATFORM_FEE_MANAGER_ADDRESS
      };
    }
    // Server environment
    return {
      scriptNFTAddress: process.env.SCRIPT_NFT_ADDRESS,
      projectRegistryAddress: process.env.PROJECT_REGISTRY_ADDRESS,
      escrowManagerAddress: process.env.ESCROW_MANAGER_ADDRESS,
      platformFeeManagerAddress: process.env.PLATFORM_FEE_MANAGER_ADDRESS
    };
  };

  const {
    scriptNFTAddress,
    projectRegistryAddress,
    escrowManagerAddress,
    platformFeeManagerAddress
  } = getContractAddresses();

  // Check if all contract addresses are set and not empty
  return !!(
    scriptNFTAddress &&
    projectRegistryAddress &&
    escrowManagerAddress &&
    platformFeeManagerAddress &&
    scriptNFTAddress !== '0x0000000000000000000000000000000000000000' &&
    projectRegistryAddress !== '0x0000000000000000000000000000000000000000' &&
    escrowManagerAddress !== '0x0000000000000000000000000000000000000000' &&
    platformFeeManagerAddress !== '0x0000000000000000000000000000000000000000'
  );
}

/**
 * Startup function to initialize the application
 * - Checks if contracts are deployed
 * - Initializes blockchain connection
 */
export async function startup(): Promise<boolean> {
  console.log('Starting up BlockCreative application...');

  // Check if contracts are deployed
  const contractsDeployed = areContractsDeployed();
  console.log(`Contracts deployed: ${contractsDeployed}`);

  // If contracts are not deployed, show warning but continue
  if (!contractsDeployed) {
    if (typeof window === 'undefined') {
      console.warn('Contracts not deployed. Deploy contracts manually using the deployment script.');
    } else {
      console.warn('Contracts not deployed. Please contact administrator.');
    }
  }

  // Initialize blockchain connection
  try {
    // In browser environment, log RPC URL for debugging (without sensitive details)
    if (typeof window !== 'undefined') {
      const rpcUrl = typeof process.env.NEXT_PUBLIC_LISK_RPC_URL === 'string' 
        ? `${process.env.NEXT_PUBLIC_LISK_RPC_URL.split('://')[0]}://***` 
        : 'Not configured';
      console.log(`Connecting to blockchain using RPC URL: ${rpcUrl}`);
    }
    
    const blockchainInitialized = await initBlockchain();
    if (!blockchainInitialized) {
      console.error('Failed to initialize blockchain connection');
      return false;
    }
    console.log('Blockchain connection initialized successfully');
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error initializing blockchain connection: ${errorMessage}`);
    return false;
  }
}

// Export default for direct import
export default startup; 