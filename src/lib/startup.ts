import { initBlockchain } from './blockchain';
import deployContracts from './deploy-contracts';

// Only import dotenv on the server side
if (typeof window === 'undefined') {
  // Server-side only import
  const dotenv = require('dotenv');
  dotenv.config({ path: '.env.local' });
}

/**
 * Checks if smart contracts are deployed by checking environment variables
 */
function areContractsDeployed(): boolean {
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
 * - Deploys contracts if needed and AUTO_DEPLOY_CONTRACTS is true (server-side only)
 * - Initializes blockchain connection
 */
export async function startup(): Promise<boolean> {
  console.log('Starting up BlockCreative application...');

  // Check if contracts are deployed
  const contractsDeployed = areContractsDeployed();
  console.log(`Contracts deployed: ${contractsDeployed}`);

  // If contracts are not deployed and AUTO_DEPLOY_CONTRACTS is true, deploy them
  // This can only happen on the server side
  if (!contractsDeployed && process.env.AUTO_DEPLOY_CONTRACTS === 'true' && typeof window === 'undefined') {
    console.log('Auto-deploying contracts...');
    try {
      await deployContracts();
      console.log('Contracts deployed successfully');
    } catch (error) {
      console.error('Error deploying contracts:', error);
      return false;
    }
  } else if (!contractsDeployed && typeof window !== 'undefined') {
    console.log('Contracts not deployed, but deployment can only occur on the server side');
    // In a real app, you might want to show a message to the user or redirect to a setup page
  }

  // Initialize blockchain connection
  try {
    const blockchainInitialized = await initBlockchain();
    if (!blockchainInitialized) {
      console.error('Failed to initialize blockchain connection');
      return false;
    }
    console.log('Blockchain connection initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing blockchain connection:', error);
    return false;
  }
}

// Export default for direct import
export default startup; 