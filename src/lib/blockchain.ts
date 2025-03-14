import { ethers } from 'ethers';

// Load contract ABIs
import ScriptNFTABI from '../contracts/ScriptNFT.json';
import ProjectRegistryABI from '../contracts/ProjectRegistry.json';
import EscrowManagerABI from '../contracts/EscrowManager.json';
import PlatformFeeManagerABI from '../contracts/PlatformFeeManager.json';

// Get environment variables based on environment
const getEnvironmentVariables = () => {
  if (typeof window !== 'undefined') {
    // Browser environment - use Next.js public env vars
    return {
      LISK_RPC_URL: process.env.NEXT_PUBLIC_LISK_RPC_URL,
      SCRIPT_NFT_ADDRESS: process.env.NEXT_PUBLIC_SCRIPT_NFT_ADDRESS,
      PROJECT_REGISTRY_ADDRESS: process.env.NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS,
      ESCROW_MANAGER_ADDRESS: process.env.NEXT_PUBLIC_ESCROW_MANAGER_ADDRESS,
      PLATFORM_FEE_MANAGER_ADDRESS: process.env.NEXT_PUBLIC_PLATFORM_FEE_MANAGER_ADDRESS,
      LISK_PRIVATE_KEY: process.env.NEXT_PUBLIC_LISK_PRIVATE_KEY // Note: Never expose private keys in browser
    };
  }

  // Server environment - use server-side env vars
  return {
    LISK_RPC_URL: process.env.LISK_RPC_URL,
    SCRIPT_NFT_ADDRESS: process.env.SCRIPT_NFT_ADDRESS,
    PROJECT_REGISTRY_ADDRESS: process.env.PROJECT_REGISTRY_ADDRESS,
    ESCROW_MANAGER_ADDRESS: process.env.ESCROW_MANAGER_ADDRESS,
    PLATFORM_FEE_MANAGER_ADDRESS: process.env.PLATFORM_FEE_MANAGER_ADDRESS,
    LISK_PRIVATE_KEY: process.env.LISK_PRIVATE_KEY
  };
};

// Get environment variables
const envVars = getEnvironmentVariables();

// Contract addresses - these would be set after deployment
const CONTRACT_ADDRESSES = {
  SCRIPT_NFT: envVars.SCRIPT_NFT_ADDRESS || '',
  PROJECT_REGISTRY: envVars.PROJECT_REGISTRY_ADDRESS || '',
  ESCROW_MANAGER: envVars.ESCROW_MANAGER_ADDRESS || '',
  PLATFORM_FEE_MANAGER: envVars.PLATFORM_FEE_MANAGER_ADDRESS || '',
};

// Create provider and platform wallet
let provider: ethers.JsonRpcProvider | null = null;
let platformWallet: ethers.Wallet | null = null;
let scriptNFTContract: ethers.Contract | null = null;
let projectRegistryContract: ethers.Contract | null = null;
let escrowManagerContract: ethers.Contract | null = null;
let platformFeeManagerContract: ethers.Contract | null = null;

/**
 * Initialize blockchain connection and contracts
 */
export const initBlockchain = async () => {
  try {
    // Initialize provider
    if (envVars.LISK_RPC_URL) {
      provider = new ethers.JsonRpcProvider(envVars.LISK_RPC_URL);
    } else {
      console.error('Lisk RPC URL not found!');
      return false;
    }
    
    // Initialize platform wallet (for gas fees) - only on server side or in controlled environments
    if (envVars.LISK_PRIVATE_KEY && (typeof window === 'undefined' || process.env.NODE_ENV === 'development')) {
      platformWallet = new ethers.Wallet(envVars.LISK_PRIVATE_KEY, provider);
    } else if (typeof window !== 'undefined') {
      console.log('Platform wallet initialization skipped in browser environment');
      // In browser, we'd normally use a wallet connector like MetaMask instead
    } else {
      console.error('Platform wallet private key not found!');
      return false;
    }
    
    // Initialize contracts - if we have a wallet
    const signerOrProvider = platformWallet || provider;
    
    if (CONTRACT_ADDRESSES.SCRIPT_NFT) {
      scriptNFTContract = new ethers.Contract(
        CONTRACT_ADDRESSES.SCRIPT_NFT,
        ScriptNFTABI.abi,
        signerOrProvider
      );
    }
    
    if (CONTRACT_ADDRESSES.PROJECT_REGISTRY) {
      projectRegistryContract = new ethers.Contract(
        CONTRACT_ADDRESSES.PROJECT_REGISTRY,
        ProjectRegistryABI.abi,
        signerOrProvider
      );
    }
    
    if (CONTRACT_ADDRESSES.ESCROW_MANAGER) {
      escrowManagerContract = new ethers.Contract(
        CONTRACT_ADDRESSES.ESCROW_MANAGER,
        EscrowManagerABI.abi,
        signerOrProvider
      );
    }
    
    if (CONTRACT_ADDRESSES.PLATFORM_FEE_MANAGER) {
      platformFeeManagerContract = new ethers.Contract(
        CONTRACT_ADDRESSES.PLATFORM_FEE_MANAGER,
        PlatformFeeManagerABI.abi,
        signerOrProvider
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing blockchain:', error);
    return false;
  }
};

/**
 * Get provider instance
 */
export const getProvider = () => provider;

/**
 * Get platform wallet instance
 */
export const getPlatformWallet = () => platformWallet;

/**
 * Get ScriptNFT contract instance
 */
export const getScriptNFTContract = () => scriptNFTContract;

/**
 * Get ProjectRegistry contract instance
 */
export const getProjectRegistryContract = () => projectRegistryContract;

/**
 * Get EscrowManager contract instance
 */
export const getEscrowManagerContract = () => escrowManagerContract;

/**
 * Get PlatformFeeManager contract instance
 */
export const getPlatformFeeManagerContract = () => platformFeeManagerContract;

/**
 * Mint a new NFT for a script
 */
export const mintScriptNFT = async (
  recipientAddress: string,
  scriptHash: string,
  submissionId: string
) => {
  try {
    if (!scriptNFTContract || !platformWallet) {
      const initialized = await initBlockchain();
      if (!initialized || !scriptNFTContract) {
        throw new Error('Failed to initialize blockchain or Script NFT contract');
      }
    }
    
    // At this point, we've confirmed scriptNFTContract is not null
    const contract = scriptNFTContract!;
    
    // Convert string submissionId to BigInt
    const submissionIdBigInt = BigInt(submissionId);
    
    // Mint NFT
    const tx = await contract.mintScriptNFT(
      recipientAddress,
      scriptHash,
      submissionIdBigInt
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    // Find the token ID from the event
    // Instead of using getEvent which causes type issues, we'll look for the event by name pattern
    let tokenId = null;
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog(log);
        if (parsedLog && parsedLog.name === 'ScriptNFTMinted') {
          tokenId = parsedLog.args.tokenId;
          break;
        }
      } catch (e) {
        // Skip logs that can't be parsed
        continue;
      }
    }
    
    if (!tokenId) {
      throw new Error('NFT minting event not found in transaction logs');
    }
    
    return {
      success: true,
      tokenId: tokenId.toString(),
      transactionHash: receipt.hash,
    };
  } catch (error) {
    console.error('Failed to mint script NFT:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Transfer NFT ownership from writer to producer
 */
export const transferNFTOwnership = async (
  tokenId: string,
  fromAddress: string,
  toAddress: string
) => {
  try {
    if (!scriptNFTContract || !platformWallet) {
      const initialized = await initBlockchain();
      if (!initialized || !scriptNFTContract) {
        throw new Error('Failed to initialize blockchain or Script NFT contract');
      }
    }
    
    // Convert string tokenId to BigInt
    const tokenIdBigInt = BigInt(tokenId);
    
    // Transfer NFT - platform wallet pays gas
    const tx = await scriptNFTContract['transferFrom(address,address,uint256)'](
      fromAddress,
      toAddress,
      tokenIdBigInt
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash,
    };
  } catch (error) {
    console.error('Failed to transfer NFT ownership:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Create a new project on the blockchain
 */
export const createProject = async (
  producerAddress: string,
  projectHash: string
) => {
  try {
    if (!projectRegistryContract || !platformWallet) {
      const initialized = await initBlockchain();
      if (!initialized || !projectRegistryContract) {
        throw new Error('Failed to initialize blockchain or Project Registry contract');
      }
    }
    
    // At this point, we've confirmed projectRegistryContract is not null
    const contract = projectRegistryContract!;
    
    // Create project
    const tx = await contract.createProject(projectHash);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    // Find the project ID from the event
    // Instead of using getEvent which causes type issues, we'll look for the event by name pattern
    let projectId = null;
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog(log);
        if (parsedLog && parsedLog.name === 'ProjectCreated') {
          projectId = parsedLog.args.projectId;
          break;
        }
      } catch (e) {
        // Skip logs that can't be parsed
        continue;
      }
    }
    
    if (!projectId) {
      throw new Error('Project creation event not found in transaction logs');
    }
    
    return {
      success: true,
      projectId: projectId.toString(),
      transactionHash: receipt.hash,
    };
  } catch (error) {
    console.error('Failed to create project:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Fund escrow for a project
 * @param producerAddress The producer's wallet address
 * @param projectId The project ID
 * @param amount The amount to fund
 * @returns Result of the transaction
 */
export const fundProjectEscrow = async (
  producerAddress: string,
  projectId: string,
  amount: string
): Promise<{ 
  success: boolean; 
  transactionHash?: string; 
  gasFee?: string;
  error?: string 
}> => {
  try {
    if (!escrowManagerContract || !platformWallet) {
      const initialized = await initBlockchain();
      if (!initialized || !escrowManagerContract) {
        return {
          success: false,
          error: 'Failed to initialize blockchain connection'
        };
      }
    }

    // Convert amount to wei (assuming amount is in ETH)
    const amountInWei = ethers.parseEther(amount);

    // Fund project escrow
    const tx = await escrowManagerContract.fundProject(
      projectId,
      {
        value: amountInWei,
        gasLimit: 300000 // Set appropriate gas limit
      }
    );

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    // Calculate gas fee
    const gasFee = (receipt.gasUsed * receipt.gasPrice).toString();

    return {
      success: true,
      transactionHash: receipt.hash,
      gasFee
    };
  } catch (error) {
    console.error('Error funding project escrow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Release payment to writer and transfer NFT to producer
 */
export const releasePayment = async (
  submissionId: string,
  writerAddress: string,
  producerAddress: string,
  scriptNFTId: string
) => {
  try {
    if (!escrowManagerContract || !platformWallet) {
      const initialized = await initBlockchain();
      if (!initialized || !escrowManagerContract) {
        throw new Error('Failed to initialize blockchain or Escrow Manager contract');
      }
    }
    
    // Convert string submissionId to BigInt
    const submissionIdBigInt = BigInt(submissionId);
    
    // Release payment
    const tx = await escrowManagerContract.releasePayment(
      submissionIdBigInt,
      writerAddress,
      producerAddress
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    // Now transfer the NFT
    const nftResult = await transferNFTOwnership(
      scriptNFTId,
      writerAddress,
      producerAddress
    );
    
    if (!nftResult.success) {
      throw new Error(`Payment released but NFT transfer failed: ${nftResult.error}`);
    }
    
    return {
      success: true,
      paymentTransactionHash: receipt.hash,
      nftTransactionHash: nftResult.transactionHash,
    };
  } catch (error) {
    console.error('Failed to release payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Get the transaction status
 */
export const getTransactionStatus = async (txHash: string) => {
  try {
    if (!provider) {
      const initialized = await initBlockchain();
      if (!initialized || !provider) {
        throw new Error('Failed to initialize blockchain provider');
      }
    }
    
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return {
        success: true,
        status: 'pending',
        confirmations: 0,
      };
    }
    
    return {
      success: true,
      status: receipt.status ? 'confirmed' : 'failed',
      confirmations: receipt.confirmations,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (error) {
    console.error('Failed to get transaction status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}; 