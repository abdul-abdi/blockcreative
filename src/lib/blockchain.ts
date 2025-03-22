import { ethers } from 'ethers';
import { ENV, SERVER_ENV } from './env-config';
import { GasPriceStrategy, GasOptimizationLevel, prepareGasSettings, trackGasUsage } from './gas-manager';

// Load contract ABIs
import ScriptNFTABI from '../contracts/ScriptNFT.json';
import ProjectRegistryABI from '../contracts/ProjectRegistry.json';
import EscrowManagerABI from '../contracts/EscrowManager.json';
import PlatformFeeManagerABI from '../contracts/PlatformFeeManager.json';

// Cache for providers, wallets and contracts
let provider: ethers.JsonRpcProvider | null = null;
let platformWallet: ethers.Wallet | null = null;

// Contract cache with typing
interface ContractCache {
  scriptNFT: ethers.Contract | null;
  projectRegistry: ethers.Contract | null;
  escrowManager: ethers.Contract | null;
  platformFeeManager: ethers.Contract | null;
}

// Initialize contract cache
const contractCache: ContractCache = {
  scriptNFT: null,
  projectRegistry: null,
  escrowManager: null,
  platformFeeManager: null
};

// Initialize status tracking
let initializationAttempted = false;
let lastInitializationTime: number | null = null;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_COOLDOWN = 30000; // 30 seconds between reconnection attempts

/**
 * Initialize blockchain connection and contracts
 */
export const initBlockchain = async () => {
  // Track initialization attempt
  initializationAttempted = true;
  lastInitializationTime = Date.now();
  
  // Skip blockchain validation if environment variable is set
  if (ENV.SKIP_BLOCKCHAIN_VALIDATION === 'true') {
    console.log('Blockchain validation skipped due to SKIP_BLOCKCHAIN_VALIDATION flag');
    return true;
  }
  
  try {
    // Check if we're in browser or server environment
    const isClient = typeof window !== 'undefined';
    
    // Initialize provider
    if (ENV.LISK_RPC_URL) {
      console.log('Connecting to blockchain using RPC URL:', ENV.LISK_RPC_URL);
      provider = new ethers.JsonRpcProvider(ENV.LISK_RPC_URL);
      
      // Test the connection by making a simple call
      try {
        const network = await provider.getNetwork();
        console.log('Connected to blockchain network:', network.name, 'chainId:', network.chainId);
        
        // Validate network - Lisk Sepolia is chain ID 4202
        const expectedChainId = ENV.IS_PROD ? BigInt(4202) : BigInt(4202); // Use same for now, change when mainnet launches
        if (network.chainId !== expectedChainId) {
          console.warn(`Connected to unexpected network: chainId ${network.chainId}, expected ${expectedChainId}`);
        }
        
        // Reset connection attempts on success
        connectionAttempts = 0;
      } catch (error) {
        console.error('Failed to connect to blockchain network:', error);
        provider = null;
        connectionAttempts++;
        return false;
      }
    } else if (isClient) {
      // In browser, use a public RPC URL as fallback for development
      if (ENV.IS_DEV || ENV.IS_TEST) {
        console.log('Using fallback public RPC URL for development in browser');
        provider = new ethers.JsonRpcProvider('https://rpc.sepolia-api.lisk.com');
        
        // Test the connection
        try {
          await provider.getNetwork();
          connectionAttempts = 0;
        } catch (error) {
          console.error('Failed to connect to fallback blockchain network:', error);
          provider = null;
          connectionAttempts++;
          return false;
        }
      } else {
        console.error('Lisk RPC URL not found in browser production environment!');
        return false;
      }
    } else {
      console.error('Lisk RPC URL not found!');
      return false;
    }
    
    // Initialize platform wallet (for gas fees) - only on server side or in controlled environments
    const isServer = typeof window === 'undefined';
    if (isServer && SERVER_ENV.LISK_PRIVATE_KEY) {
      platformWallet = new ethers.Wallet(SERVER_ENV.LISK_PRIVATE_KEY, provider);
    } else if (!isServer) {
      console.log('Platform wallet initialization skipped in browser environment');
      // In browser, we'd normally use a wallet connector like MetaMask instead
    } else {
      console.error('Platform wallet private key not found!');
      return false;
    }
    
    // Initialize contracts - if we have a wallet or provider
    const signerOrProvider = platformWallet || provider;
    if (!signerOrProvider) {
      return false;
    }
    
    // Only initialize contracts if we have their addresses
    if (ENV.SCRIPT_NFT_ADDRESS) {
      contractCache.scriptNFT = new ethers.Contract(
        ENV.SCRIPT_NFT_ADDRESS,
        ScriptNFTABI.abi,
        signerOrProvider
      );
    }
    
    if (ENV.PROJECT_REGISTRY_ADDRESS) {
      contractCache.projectRegistry = new ethers.Contract(
        ENV.PROJECT_REGISTRY_ADDRESS,
        ProjectRegistryABI.abi,
        signerOrProvider
      );
    }
    
    if (ENV.ESCROW_MANAGER_ADDRESS) {
      contractCache.escrowManager = new ethers.Contract(
        ENV.ESCROW_MANAGER_ADDRESS,
        EscrowManagerABI.abi,
        signerOrProvider
      );
    }
    
    if (ENV.PLATFORM_FEE_MANAGER_ADDRESS) {
      contractCache.platformFeeManager = new ethers.Contract(
        ENV.PLATFORM_FEE_MANAGER_ADDRESS,
        PlatformFeeManagerABI.abi,
        signerOrProvider
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing blockchain:', error);
    connectionAttempts++;
    return false;
  }
};

/**
 * Force a reconnection attempt if the previous connection failed
 */
export const reconnectBlockchain = async (): Promise<boolean> => {
  // Avoid reconnecting too frequently
  if (lastInitializationTime && (Date.now() - lastInitializationTime < RECONNECT_COOLDOWN)) {
    console.log('Reconnection attempt too soon, cooling down');
    return false;
  }
  
  // Don't exceed maximum reconnection attempts
  if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error(`Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached`);
    return false;
  }
  
  // Reset provider and contracts to force clean reconnection
  provider = null;
  platformWallet = null;
  contractCache.scriptNFT = null;
  contractCache.projectRegistry = null;
  contractCache.escrowManager = null;
  contractCache.platformFeeManager = null;
  
  console.log(`Attempting blockchain reconnection (attempt ${connectionAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
  return initBlockchain();
};

/**
 * Get the current status of the blockchain connection
 */
export const getBlockchainStatus = async () => {
  const providerConnected = provider !== null;
  
  // If provider is null, try reconnection if we haven't exceeded attempts
  if (!providerConnected && connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
    console.log('Provider not connected, attempting reconnection');
    const reconnected = await reconnectBlockchain();
    return {
      providerConnected: reconnected,
      configPresent: !!ENV.LISK_RPC_URL && !!SERVER_ENV.LISK_PRIVATE_KEY,
      initializationAttempted,
      connectionAttempts,
      lastInitializationTime,
      reconnected
    };
  }
  
  return {
    providerConnected,
    configPresent: !!ENV.LISK_RPC_URL && !!SERVER_ENV.LISK_PRIVATE_KEY,
    initializationAttempted,
    connectionAttempts,
    lastInitializationTime,
    contracts: {
      scriptNFT: contractCache.scriptNFT !== null,
      projectRegistry: contractCache.projectRegistry !== null,
      escrowManager: contractCache.escrowManager !== null,
      platformFeeManager: contractCache.platformFeeManager !== null
    }
  };
};

/**
 * Validate connected network is the expected one
 */
export const validateNetwork = async (): Promise<{ valid: boolean; expected: bigint; actual?: bigint }> => {
  if (!provider) {
    return { valid: false, expected: BigInt(4202) };
  }
  
  try {
    const network = await provider.getNetwork();
    const expectedChainId = ENV.IS_PROD ? BigInt(4202) : BigInt(4202); // Use same for now, change when mainnet launches
    
    return {
      valid: network.chainId === expectedChainId,
      expected: expectedChainId,
      actual: network.chainId
    };
  } catch (error) {
    console.error('Error validating network:', error);
    return { valid: false, expected: BigInt(4202) };
  }
};

// Initialize blockchain when this module is imported on server-side
if (typeof window === 'undefined') {
  console.log('Auto-initializing blockchain provider on server...');
  initBlockchain().then(success => {
    if (success) {
      console.log('Blockchain provider initialized successfully');
    } else {
      console.error('Failed to initialize blockchain provider during auto-initialization');
    }
  }).catch(error => {
    console.error('Error during blockchain auto-initialization:', error);
  });
}

/**
 * Get the current provider, initializing it if necessary
 */
export const getProvider = async () => {
  if (!provider && !initializationAttempted) {
    await initBlockchain();
  } else if (!provider && initializationAttempted && connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
    // If initialization was attempted but provider is null, try reconnection
    if (lastInitializationTime && (Date.now() - lastInitializationTime > RECONNECT_COOLDOWN)) {
      await reconnectBlockchain();
    }
  }
  return provider;
};

/**
 * Get platform wallet instance
 */
export const getPlatformWallet = async () => {
  if (!platformWallet && !initializationAttempted) {
    await initBlockchain();
  }
  return platformWallet;
};

/**
 * Get a contract, with type safety and reconnection attempt if needed
 * @param contractName The name of the contract to retrieve
 * @returns The contract instance or null if not available
 */
export const getContract = async <T extends keyof ContractCache>(
  contractName: T
): Promise<ethers.Contract | null> => {
  const contract = contractCache[contractName];
  
  // If contract is null but we haven't initialized yet, try initialization
  if (!contract && !initializationAttempted) {
    await initBlockchain();
    return contractCache[contractName];
  }
  
  // If contract is null after initialization, try reconnection
  if (!contract && initializationAttempted && connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
    if (lastInitializationTime && (Date.now() - lastInitializationTime > RECONNECT_COOLDOWN)) {
      await reconnectBlockchain();
      return contractCache[contractName];
    }
  }
  
  return contract;
};

/**
 * Get ScriptNFT contract instance
 */
export const getScriptNFTContract = async () => {
  return getContract('scriptNFT');
};

/**
 * Get ProjectRegistry contract instance
 */
export const getProjectRegistryContract = async () => {
  return getContract('projectRegistry');
};

/**
 * Get EscrowManager contract instance
 */
export const getEscrowManagerContract = async () => {
  return getContract('escrowManager');
};

/**
 * Get PlatformFeeManager contract instance
 */
export const getPlatformFeeManagerContract = async () => {
  return getContract('platformFeeManager');
};

/**
 * Mint a new NFT for a script
 */
export const mintScriptNFT = async (
  recipientAddress: string,
  scriptHash: string,
  submissionId: string
) => {
  try {
    const contract = await getScriptNFTContract();
    const wallet = await getPlatformWallet();
    
    if (!contract || !wallet) {
      throw new Error('Failed to initialize blockchain or Script NFT contract');
    }
    
    // Convert string submissionId to BigInt
    const submissionIdBigInt = BigInt(submissionId);
    
    // Prepare arguments for the function call
    const args = [recipientAddress, scriptHash, submissionIdBigInt];
    
    // Use gas manager to get optimal gas settings
    const gasSettings = await prepareGasSettings(
      contract,
      'mintScriptNFT',
      args,
      {
        gasStrategy: GasPriceStrategy.STANDARD // Standard priority for NFT minting
      }
    );
    
    // Mint NFT with optimized gas settings
    const tx = await contract.mintScriptNFT(
      ...args,
      {
        gasPrice: gasSettings.gasPrice,
        gasLimit: gasSettings.gasLimit
      }
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    // Track gas usage for analytics and future optimization
    await trackGasUsage(receipt.hash, 'mintScriptNFT', gasSettings.gasLimit || BigInt(0));
    
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
      } catch {
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
      gasUsed: receipt.gasUsed.toString()
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
    const contract = await getScriptNFTContract();
    const wallet = await getPlatformWallet();
    
    if (!contract || !wallet) {
      throw new Error('Failed to initialize blockchain or Script NFT contract');
    }
    
    // Convert string tokenId to BigInt
    const tokenIdBigInt = BigInt(tokenId);
    
    // Prepare arguments for the function call
    const args = [fromAddress, toAddress, tokenIdBigInt];
    
    // Use gas manager to get optimal gas settings
    const gasSettings = await prepareGasSettings(
      contract,
      'transferFrom',
      args,
      {
        gasStrategy: GasPriceStrategy.STANDARD // Standard priority for NFT transfer
      }
    );
    
    // Transfer NFT with optimized gas settings
    const tx = await contract['transferFrom(address,address,uint256)'](
      ...args,
      gasSettings
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    // Track gas usage for analytics and future optimization
    await trackGasUsage(receipt.hash, 'transferFrom', gasSettings.gasLimit || BigInt(0));
    
    return {
      success: true,
      transactionHash: receipt.hash,
      gasUsed: receipt.gasUsed.toString()
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
 * @param walletAddress The wallet address of the authenticated user
 * @param projectHash A unique hash for the project
 * @returns Promise with transaction result
 */
export const createProject = async (walletAddress: string, projectHash: string) => {
  if (!walletAddress) {
    return { 
      success: false, 
      error: 'Authentication required. Wallet address not provided.' 
    };
  }
  
  try {
    // If blockchain validation is skipped, return a mocked success response
    if (ENV.SKIP_BLOCKCHAIN_VALIDATION === 'true') {
      console.log('Blockchain project creation skipped due to SKIP_BLOCKCHAIN_VALIDATION flag');
      return {
        success: true,
        projectId: projectHash,
        transactionHash: `0x${Date.now().toString(16)}mock`,
        gasUsed: '0',
        skipped: true
      };
    }
    
    // Initialize blockchain if needed
    if (!provider || !contractCache.projectRegistry) {
      const initialized = await initBlockchain();
      if (!initialized) {
        return { 
          success: false, 
          error: 'Failed to initialize blockchain connection' 
        };
      }
    }
    
    // Validate that project registry contract is available
    if (!contractCache.projectRegistry) {
      return { 
        success: false, 
        error: 'Project registry contract not initialized' 
      };
    }
    
    console.log(`Creating project on blockchain for wallet ${walletAddress} with hash ${projectHash}`);
    
    // Get the contract instance
    const contract = contractCache.projectRegistry;
    
    // Convert the project hash to bytes32 format
    // Use ethers.js utilities to convert string to bytes32
    let bytes32Hash;
    try {
      // If hash is already in bytes32 format, use it directly
      if (projectHash.startsWith('0x') && projectHash.length === 66) {
        bytes32Hash = projectHash;
      } else {
        // If it's a string, convert to bytes32
        // First, convert to UTF-8 bytes
        const utf8Bytes = ethers.toUtf8Bytes(projectHash);
        
        // Then hash it to ensure it's exactly 32 bytes (use keccak256)
        bytes32Hash = ethers.keccak256(utf8Bytes);
      }
      
      console.log(`Converted project hash to bytes32: ${bytes32Hash}`);
    } catch (error) {
      console.error('Error converting project hash to bytes32:', error);
      return {
        success: false,
        error: 'Failed to convert project hash to blockchain format'
      };
    }
    
    // Prepare gas settings for the transaction
    const gasSettings = await prepareGasSettings(
      contract,
      'createProject',
      [bytes32Hash], // Use the converted bytes32 hash
      {
        gasStrategy: GasPriceStrategy.FAST,
        optimizationLevel: GasOptimizationLevel.MODERATE
      }
    );
    
    // Create project using platform wallet for gas
    const contractWithSigner = platformWallet 
      ? contract.connect(platformWallet) 
      : contract;
    
    // Call the createProject function using the correct signature (only projectHash)
    let tx;
    
    try {
      // Call with the correct signature - only bytes32Hash
      tx = await contractWithSigner.getFunction('createProject')(
        bytes32Hash, // Use bytes32 hash
        gasSettings
      );
    } catch (error: any) {
      console.error('Error calling createProject function:', error);
      
      // Try with just the hash as fallback
      if (error.message && error.message.includes('incorrect arguments')) {
        console.log('First signature attempt failed, trying minimal signature');
        tx = await contractWithSigner.getFunction('createProject')(bytes32Hash); // Use bytes32 hash
      } else {
        throw error;
      }
    }
    
    console.log('Project creation transaction submitted:', tx.hash);
    
    // Record gas usage for optimization
    trackGasUsage(tx.hash, 'createProject', gasSettings.gasLimit || BigInt(0));
    
    // Return success with transaction hash
    return {
      success: true,
      transactionHash: tx.hash,
      projectId: projectHash // Keep using original projectHash as ID
    };
  } catch (error) {
    console.error('Error creating project on blockchain:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error creating project' 
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
    const contract = await getEscrowManagerContract();
    const wallet = await getPlatformWallet();
    
    if (!contract || !wallet) {
      return {
        success: false,
        error: 'Failed to initialize blockchain connection'
      };
    }

    // Convert amount to wei (assuming amount is in ETH)
    const amountInWei = ethers.parseEther(amount);

    // Prepare arguments for the function call
    const args = [projectId];

    // Use gas manager to get optimal gas settings
    const gasSettings = await prepareGasSettings(
      contract,
      'fundProject',
      args,
      {
        value: amountInWei,
        gasStrategy: GasPriceStrategy.STANDARD // Standard priority for funding
      }
    );

    // Fund project escrow with optimized gas settings
    const tx = await contract.fundProject(
      ...args,
      {
        ...gasSettings,
        value: amountInWei
      }
    );

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    // Track gas usage for analytics and future optimization
    await trackGasUsage(receipt.hash, 'fundProject', gasSettings.gasLimit || BigInt(0));

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
    const contract = await getEscrowManagerContract();
    const wallet = await getPlatformWallet();
    
    if (!contract || !wallet) {
      throw new Error('Failed to initialize blockchain or Escrow Manager contract');
    }
    
    // Convert string submissionId to BigInt
    const submissionIdBigInt = BigInt(submissionId);
    
    // Prepare arguments for the function call
    const args = [submissionIdBigInt, writerAddress, producerAddress];
    
    // Use gas manager to get optimal gas settings
    const gasSettings = await prepareGasSettings(
      contract,
      'releasePayment',
      args,
      {
        gasStrategy: GasPriceStrategy.STANDARD // Standard priority for payment release
      }
    );
    
    // Release payment with optimized gas settings
    const tx = await contract.releasePayment(
      ...args,
      gasSettings
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    // Track gas usage for analytics and future optimization
    await trackGasUsage(receipt.hash, 'releasePayment', gasSettings.gasLimit || BigInt(0));
    
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
      paymentGasUsed: receipt.gasUsed.toString(),
      nftGasUsed: nftResult.gasUsed
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
    const provider = await getProvider();
    
    if (!provider) {
      throw new Error('Failed to initialize blockchain provider');
    }
    
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return {
        success: true,
        status: 'pending',
        confirmations: 0,
      };
    }

    // Get transaction details for gas information
    const tx = await provider.getTransaction(txHash);
    const gasPrice = tx?.gasPrice?.toString() ?? 'N/A';
    const maxFeePerGas = tx?.maxFeePerGas?.toString() ?? 'N/A';
    const maxPriorityFeePerGas = tx?.maxPriorityFeePerGas?.toString() ?? 'N/A';
    
    // Since confirmations can be a number or a function in ethers v6, handle it safely
    const confirmations = typeof receipt.confirmations === 'number' ? 
      receipt.confirmations : 
      1; // Default to 1 if we can't determine the exact number
    
    return {
      success: true,
      status: receipt.status ? 'confirmed' : 'failed',
      confirmations,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      gasPrice,
      maxFeePerGas,
      maxPriorityFeePerGas,
      transactionType: tx?.type === 2 ? 'EIP-1559' : 'Legacy',
      totalGasCost: (receipt.gasUsed * receipt.gasPrice).toString()
    };
  } catch (error) {
    console.error('Failed to get transaction status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Refund escrowed funds to producer
 * @param projectId The project ID
 * @param producerAddress The producer's wallet address
 * @returns Result of the transaction
 */
export const refundProducer = async (
  projectId: string,
  producerAddress: string
): Promise<{ 
  success: boolean; 
  transactionHash?: string; 
  refundAmount?: string;
  error?: string 
}> => {
  try {
    const contract = await getEscrowManagerContract();
    const wallet = await getPlatformWallet();
    
    if (!contract || !wallet) {
      return {
        success: false,
        error: 'Failed to initialize blockchain connection'
      };
    }

    // Get current funds in escrow for the project
    const funds = await contract.getProjectFunds(projectId);
    if (funds <= 0) {
      return {
        success: false,
        error: 'No funds available for refund'
      };
    }

    // Prepare arguments for the function call
    const args = [projectId, producerAddress];

    // Use gas manager to get optimal gas settings
    const gasSettings = await prepareGasSettings(
      contract,
      'refundProducer',
      args,
      {
        gasStrategy: GasPriceStrategy.STANDARD // Standard priority for refunds
      }
    );

    // Refund project escrow with optimized gas settings
    const tx = await contract.refundProducer(
      ...args,
      gasSettings
    );

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    // Track gas usage for analytics and future optimization
    await trackGasUsage(receipt.hash, 'refundProducer', gasSettings.gasLimit || BigInt(0));

    return {
      success: true,
      transactionHash: receipt.hash,
      refundAmount: ethers.formatEther(funds)
    };
  } catch (error) {
    console.error('Error refunding project escrow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}; 