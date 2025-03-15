import { ethers } from 'ethers';

// Use dynamic imports for Node.js modules to prevent client-side errors
let fs: any;
let path: any;
let dotenv: any;

// Only import Node.js modules on the server side
if (typeof window === 'undefined') {
  // Server-side only imports
  fs = require('fs');
  path = require('path');
  dotenv = require('dotenv');
  
  // Load environment variables on server side
  dotenv.config({ path: '.env.local' });
}

// Load contract ABIs
import ScriptNFTABI from '../contracts/ScriptNFT.json';
import ProjectRegistryABI from '../contracts/ProjectRegistry.json';
import EscrowManagerABI from '../contracts/EscrowManager.json';
import PlatformFeeManagerABI from '../contracts/PlatformFeeManager.json';

// Add bytecode to contract ABIs if not present
// This is a workaround for the linter errors
interface ContractABI {
  abi: any;
  bytecode: string;
}

// Create contract objects with bytecode
const ScriptNFT: ContractABI = {
  abi: ScriptNFTABI.abi,
  bytecode: '0x...' // This would be the actual bytecode from the compiled contract
};

const ProjectRegistry: ContractABI = {
  abi: ProjectRegistryABI.abi,
  bytecode: '0x...' // This would be the actual bytecode from the compiled contract
};

const EscrowManager: ContractABI = {
  abi: EscrowManagerABI.abi,
  bytecode: '0x...' // This would be the actual bytecode from the compiled contract
};

const PlatformFeeManager: ContractABI = {
  abi: PlatformFeeManagerABI.abi,
  bytecode: '0x...' // This would be the actual bytecode from the compiled contract
};

// Get environment variables
const getEnvironmentVariables = () => {
  // For browser environments, access environment variables from Next.js public runtime config
  if (typeof window !== 'undefined') {
    return {
      LISK_RPC_URL: process.env.NEXT_PUBLIC_LISK_RPC_URL,
      LISK_PRIVATE_KEY: process.env.NEXT_PUBLIC_LISK_PRIVATE_KEY,
    };
  }
  
  // For server environments, access environment variables directly
  return {
    LISK_RPC_URL: process.env.LISK_RPC_URL,
    LISK_PRIVATE_KEY: process.env.LISK_PRIVATE_KEY,
  };
};

const envVars = getEnvironmentVariables();
const LISK_RPC_URL = envVars.LISK_RPC_URL;
const LISK_PRIVATE_KEY = envVars.LISK_PRIVATE_KEY;

/**
 * Deploy a contract
 * @param contractName Name of the contract
 * @param abi Contract ABI
 * @param bytecode Contract bytecode
 * @param constructorArgs Constructor arguments
 * @returns Deployed contract address
 */
async function deployContract(
  contractName: string,
  abi: any,
  bytecode: string,
  constructorArgs: any[] = []
) {
  console.log(`Deploying ${contractName}...`);

  if (!LISK_RPC_URL || !LISK_PRIVATE_KEY) {
    throw new Error('Missing RPC URL or private key in environment variables');
  }

  // Initialize provider and wallet
  const provider = new ethers.JsonRpcProvider(LISK_RPC_URL);
  const wallet = new ethers.Wallet(LISK_PRIVATE_KEY, provider);

  // Create contract factory
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);

  // Deploy contract
  const contract = await factory.deploy(...constructorArgs);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`${contractName} deployed to: ${address}`);

  return address;
}

/**
 * Update .env.local file with contract addresses
 * @param addresses Contract addresses
 */
function updateEnvFile(addresses: {
  scriptNft: string;
  projectRegistry: string;
  escrowManager: string;
  platformFeeManager: string;
}) {
  // Only run on server side
  if (typeof window !== 'undefined') {
    console.log('Environment file can only be updated on the server');
    return;
  }

  try {
    const envFilePath = path.resolve(process.cwd(), '.env.local');
    let envContent = fs.readFileSync(envFilePath, 'utf8');

    // Update contract addresses
    envContent = envContent.replace(/SCRIPT_NFT_ADDRESS=.*$/m, `SCRIPT_NFT_ADDRESS=${addresses.scriptNft}`);
    envContent = envContent.replace(/PROJECT_REGISTRY_ADDRESS=.*$/m, `PROJECT_REGISTRY_ADDRESS=${addresses.projectRegistry}`);
    envContent = envContent.replace(/ESCROW_MANAGER_ADDRESS=.*$/m, `ESCROW_MANAGER_ADDRESS=${addresses.escrowManager}`);
    envContent = envContent.replace(/PLATFORM_FEE_MANAGER_ADDRESS=.*$/m, `PLATFORM_FEE_MANAGER_ADDRESS=${addresses.platformFeeManager}`);

    // Write updated content back to .env.local
    fs.writeFileSync(envFilePath, envContent);
    console.log('.env.local updated with contract addresses');
  } catch (error) {
    console.error('Error updating .env.local file:', error);
  }
}

/**
 * Main function to deploy contracts
 */
async function main() {
  // Check if running in browser - if so, deployment should happen in API route instead
  if (typeof window !== 'undefined') {
    console.error('Contract deployment should be performed on the server side');
    return false;
  }

  try {
    console.log('Starting contract deployment...');

    // Deploy PlatformFeeManager
    const platformFeeManagerAddress = await deployContract(
      'PlatformFeeManager',
      PlatformFeeManager.abi,
      PlatformFeeManager.bytecode,
      [3] // 3% platform fee
    );

    // Deploy ScriptNFT
    const scriptNftAddress = await deployContract(
      'ScriptNFT',
      ScriptNFT.abi,
      ScriptNFT.bytecode,
      ['BlockCreative Scripts', 'BCS']
    );

    // Deploy ProjectRegistry
    const projectRegistryAddress = await deployContract(
      'ProjectRegistry',
      ProjectRegistry.abi,
      ProjectRegistry.bytecode
    );

    // Deploy EscrowManager
    const escrowManagerAddress = await deployContract(
      'EscrowManager',
      EscrowManager.abi,
      EscrowManager.bytecode,
      [scriptNftAddress, platformFeeManagerAddress]
    );

    // Update .env.local file with contract addresses
    updateEnvFile({
      scriptNft: scriptNftAddress,
      projectRegistry: projectRegistryAddress,
      escrowManager: escrowManagerAddress,
      platformFeeManager: platformFeeManagerAddress
    });

    console.log('Contract deployment completed successfully!');
    return true;
  } catch (error) {
    console.error('Error deploying contracts:', error);
    return false;
  }
}

// Only run the script directly on server
if (typeof window === 'undefined' && require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main; 