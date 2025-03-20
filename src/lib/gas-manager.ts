import { ethers } from 'ethers';
import { ENV, SERVER_ENV } from './env-config';
import { getProvider, getPlatformWallet } from './blockchain';

/**
 * Gas price strategy types
 */
export enum GasPriceStrategy {
  ECONOMIC = 'economic',     // Lower gas price for non-urgent transactions
  STANDARD = 'standard',     // Regular gas price for typical transactions
  FAST = 'fast',             // Higher gas price for faster confirmation
  AGGRESSIVE = 'aggressive', // Very high gas price for extremely fast confirmation
}

/**
 * Gas optimization level
 */
export enum GasOptimizationLevel {
  NONE = 'none',             // No optimization
  MODERATE = 'moderate',     // Some optimization
  AGGRESSIVE = 'aggressive', // Aggressive optimization
}

// Gas pricing multipliers based on strategy
const GAS_PRICE_MULTIPLIERS = {
  [GasPriceStrategy.ECONOMIC]: 0.9,
  [GasPriceStrategy.STANDARD]: 1.0,
  [GasPriceStrategy.FAST]: 1.5,
  [GasPriceStrategy.AGGRESSIVE]: 2.0,
};

// Gas safety margin percentage based on optimization level
const GAS_SAFETY_MARGINS = {
  [GasOptimizationLevel.NONE]: 0.3, // 30% safety margin
  [GasOptimizationLevel.MODERATE]: 0.2, // 20% safety margin
  [GasOptimizationLevel.AGGRESSIVE]: 0.1, // 10% safety margin
};

// Default gas limits for common operations
const DEFAULT_GAS_LIMITS = {
  TRANSFER: BigInt(21000),
  CONTRACT_DEPLOY: BigInt(5000000),
  NFT_MINT: BigInt(300000),
  CONTRACT_INTERACTION: BigInt(200000),
  COMPLEX_OPERATION: BigInt(500000),
};

/**
 * Gas settings for a transaction
 */
export interface GasSettings {
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  gasPrice?: bigint;
  type?: number; // 0 for legacy, 2 for EIP-1559
}

/**
 * Get the current gas price with optional strategy modifier
 */
export async function getGasPrice(
  strategy: GasPriceStrategy = GasPriceStrategy.STANDARD
): Promise<bigint> {
  const provider = await getProvider();
  if (!provider) {
    throw new Error('Blockchain provider not initialized');
  }
  
  try {
    // Get current gas price and EIP-1559 data
    const feeData = await provider.getFeeData();
    
    // Check if EIP-1559 is supported
    const supportsEIP1559 = feeData.maxFeePerGas !== null && feeData.maxPriorityFeePerGas !== null;
    
    if (supportsEIP1559) {
      // Use EIP-1559 pricing
      const baseFee = feeData.maxFeePerGas ?? ethers.parseUnits('30', 'gwei');
      const maxPriorityFee = feeData.maxPriorityFeePerGas ?? ethers.parseUnits('2', 'gwei');
      
      // Apply strategy multiplier to max priority fee
      const multiplier = GAS_PRICE_MULTIPLIERS[strategy];
      const adjustedMaxPriorityFee = maxPriorityFee * BigInt(Math.floor(multiplier * 100)) / BigInt(100);
      
      // Calculate max fee (base fee + adjusted priority fee)
      const maxFee = baseFee + adjustedMaxPriorityFee;
      
      console.log(`Gas price (${strategy}, EIP-1559):
  - Base Fee: ${ethers.formatUnits(baseFee, 'gwei')} gwei
  - Max Priority Fee: ${ethers.formatUnits(adjustedMaxPriorityFee, 'gwei')} gwei
  - Max Fee: ${ethers.formatUnits(maxFee, 'gwei')} gwei`);
      
      return maxFee;
    } else {
      // Fallback to legacy pricing
      const baseGasPrice = feeData.gasPrice ?? ethers.parseUnits('30', 'gwei');
      const multiplier = GAS_PRICE_MULTIPLIERS[strategy];
      const adjustedGasPrice = baseGasPrice * BigInt(Math.floor(multiplier * 100)) / BigInt(100);
      
      console.log(`Gas price (${strategy}, legacy): ${ethers.formatUnits(adjustedGasPrice, 'gwei')} gwei`);
      return adjustedGasPrice;
    }
  } catch (error) {
    console.error('Error fetching gas price:', error);
    // Fallback to a reasonable default
    return ethers.parseUnits('30', 'gwei');
  }
}

/**
 * Estimate gas for a contract function call with retries
 */
export async function estimateGas(
  contract: ethers.Contract,
  functionName: string,
  args: unknown[],
  value: bigint = BigInt(0),
  optimizationLevel: GasOptimizationLevel = GasOptimizationLevel.MODERATE,
  maxRetries: number = 3
): Promise<bigint> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Get default gas limit for the operation type
      const defaultLimit = DEFAULT_GAS_LIMITS[functionName as keyof typeof DEFAULT_GAS_LIMITS] ?? 
                          DEFAULT_GAS_LIMITS.CONTRACT_INTERACTION;
      
      // Try to estimate gas
      const estimatedGas = await contract.getFunction(functionName).estimateGas(...args, { value });
      
      // Apply safety margin based on optimization level
      const safetyMargin = GAS_SAFETY_MARGINS[optimizationLevel];
      const gasLimit = estimatedGas + (estimatedGas * BigInt(Math.floor(safetyMargin * 100)) / BigInt(100));
      
      // Ensure gas limit is not below default
      const finalGasLimit = gasLimit > defaultLimit ? gasLimit : defaultLimit;
      
      console.log(`Gas estimate for ${functionName} (attempt ${attempt + 1}):
  - Estimated: ${estimatedGas}
  - With Safety: ${gasLimit}
  - Final: ${finalGasLimit}
  - Optimization Level: ${optimizationLevel}`);
      
      return finalGasLimit;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Gas estimation attempt ${attempt + 1} failed:`, error);
      
      // If this is the last attempt, use default gas limit
      if (attempt === maxRetries - 1) {
        const defaultLimit = DEFAULT_GAS_LIMITS[functionName as keyof typeof DEFAULT_GAS_LIMITS] ?? 
                            DEFAULT_GAS_LIMITS.CONTRACT_INTERACTION;
        console.log(`Using default gas limit: ${defaultLimit}`);
        return defaultLimit;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  
  throw lastError || new Error('Failed to estimate gas after all retries');
}

/**
 * Prepare gas settings for a transaction
 */
export async function prepareGasSettings(
  contract: ethers.Contract,
  functionName: string,
  args: unknown[],
  options: {
    value?: bigint;
    gasStrategy?: GasPriceStrategy;
    optimizationLevel?: GasOptimizationLevel;
    useEIP1559?: boolean;
  } = {}
): Promise<GasSettings> {
  const {
    value = BigInt(0),
    gasStrategy = GasPriceStrategy.STANDARD,
    optimizationLevel = GasOptimizationLevel.MODERATE,
    useEIP1559 = true,
  } = options;
  
  const provider = await getProvider();
  if (!provider) {
    throw new Error('Blockchain provider not initialized');
  }
  
  // Check if EIP-1559 is supported
  const feeData = await provider.getFeeData();
  const supportsEIP1559 = useEIP1559 && 
                          feeData.maxFeePerGas !== null && 
                          feeData.maxPriorityFeePerGas !== null;
  
  if (supportsEIP1559) {
    // Get EIP-1559 gas settings
    const [maxFeePerGas, gasLimit] = await Promise.all([
      getGasPrice(gasStrategy),
      estimateGas(contract, functionName, args, value, optimizationLevel),
    ]);
    
    // Calculate max priority fee (10% of max fee)
    const maxPriorityFeePerGas = maxFeePerGas * BigInt(10) / BigInt(100);
    
    return {
      type: 2, // EIP-1559 transaction type
      maxFeePerGas,
      maxPriorityFeePerGas,
      gasLimit,
    };
  } else {
    // Fallback to legacy transaction
    const [gasPrice, gasLimit] = await Promise.all([
      getGasPrice(gasStrategy),
      estimateGas(contract, functionName, args, value, optimizationLevel),
    ]);
    
    return {
      type: 0, // Legacy transaction type
      gasPrice,
      gasLimit,
    };
  }
}

/**
 * Track gas used by a transaction for analytics and optimization
 */
export async function trackGasUsage(
  transactionHash: string,
  functionName: string,
  gasEstimate: bigint
): Promise<void> {
  try {
    const provider = await getProvider();
    if (!provider) {
      throw new Error('Blockchain provider not initialized');
    }
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(transactionHash);
    if (!receipt) {
      console.log(`No receipt found for transaction ${transactionHash}`);
      return;
    }
    
    // Calculate gas usage statistics
    const gasUsed = receipt.gasUsed;
    const efficiency = Number((gasEstimate * BigInt(100)) / gasUsed) / 100;
    
    // Get transaction details
    const tx = await provider.getTransaction(transactionHash);
    if (!tx) {
      console.log(`No transaction found for hash ${transactionHash}`);
      return;
    }
    
    const gasPrice = tx.gasPrice?.toString() ?? 'N/A';
    const maxFeePerGas = tx.maxFeePerGas?.toString() ?? 'N/A';
    const maxPriorityFeePerGas = tx.maxPriorityFeePerGas?.toString() ?? 'N/A';
    
    // Log gas usage with detailed information
    console.log(`Gas usage for ${functionName}:
  - Transaction Hash: ${transactionHash}
  - Estimated: ${gasEstimate}
  - Actual: ${gasUsed}
  - Efficiency: ${efficiency > 1 ? 'Over-estimated' : 'Under-estimated'} by ${Math.abs(efficiency - 1) * 100}%
  - Gas Price: ${gasPrice}
  - Max Fee Per Gas: ${maxFeePerGas}
  - Max Priority Fee Per Gas: ${maxPriorityFeePerGas}
  - Transaction Type: ${tx.type === 2 ? 'EIP-1559' : 'Legacy'}
  - Block Number: ${receipt.blockNumber}
  - Confirmations: ${receipt.confirmations}`);
    
    // In a real-world implementation, you might store this data for analytics
    // This could be used to optimize future gas estimates
  } catch (error) {
    console.error(`Error tracking gas usage for ${transactionHash}:`, error);
  }
}

// Gas price tiers
export enum GasTier {
  ECONOMY = 'economy',   // Slower but cheaper
  STANDARD = 'standard', // Balance of speed and cost
  FAST = 'fast',         // Faster but more expensive
  URGENT = 'urgent'      // Fastest, highest priority
}

// Multiplier factors for different gas tiers
const GAS_MULTIPLIERS: Record<GasTier, number> = {
  [GasTier.ECONOMY]: 0.9,    // 90% of base fee
  [GasTier.STANDARD]: 1.1,   // 110% of base fee
  [GasTier.FAST]: 1.5,       // 150% of base fee
  [GasTier.URGENT]: 2.0      // 200% of base fee
};

// Minimum gas prices (wei) to prevent extremely low values
const MIN_GAS_PRICE = ethers.parseUnits('1.0', 'gwei');

// Cache for gas estimates to reduce provider calls
interface GasCache {
  timestamp: number;
  baseFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  gasEstimates: Record<GasTier, GasEstimate>;
}

// Gas estimate object
export interface GasEstimate {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  gasPrice?: bigint; // For legacy transactions
  tier: GasTier;
  estimatedTimeInSeconds?: number;
}

// In-memory cache
let gasCache: GasCache | null = null;

// Cache expiration in milliseconds (30 seconds)
const CACHE_EXPIRATION = 30000;

/**
 * Get current gas prices for all tiers
 */
export async function getGasPrices(): Promise<Record<GasTier, GasEstimate>> {
  // Check cache first
  if (gasCache && Date.now() - gasCache.timestamp < CACHE_EXPIRATION) {
    return gasCache.gasEstimates;
  }
  
  const provider = await getProvider();
  if (!provider) {
    throw new Error('Blockchain provider not initialized');
  }
  
  try {
    // Get current block
    const block = await provider.getBlock('latest');
    if (!block) {
      throw new Error('Could not fetch latest block');
    }
    
    // Get network fee data
    const feeData = await provider.getFeeData();
    
    // Initialize with default values if needed
    const baseFeePerGas = block.baseFeePerGas || feeData.gasPrice || MIN_GAS_PRICE;
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || ethers.parseUnits('1.5', 'gwei');
    
    // Calculate estimates for each tier
    const gasEstimates: Record<GasTier, GasEstimate> = {} as Record<GasTier, GasEstimate>;
    
    for (const tier of Object.values(GasTier)) {
      const multiplier = GAS_MULTIPLIERS[tier];
      const tierBaseFee = baseFeePerGas * BigInt(Math.floor(multiplier * 100)) / BigInt(100);
      const tierPriorityFee = maxPriorityFeePerGas * BigInt(Math.floor(multiplier * 100)) / BigInt(100);
      
      gasEstimates[tier] = {
        maxFeePerGas: tierBaseFee * BigInt(2) + tierPriorityFee, // 2x base fee + priority fee
        maxPriorityFeePerGas: tierPriorityFee,
        gasPrice: feeData.gasPrice ? feeData.gasPrice : undefined, // For legacy transactions
        tier,
        estimatedTimeInSeconds: getEstimatedTime(tier)
      };
    }
    
    // Update cache
    gasCache = {
      timestamp: Date.now(),
      baseFeePerGas,
      maxPriorityFeePerGas,
      gasEstimates
    };
    
    return gasEstimates;
  } catch (error) {
    console.error('Error fetching gas prices:', error);
    
    // Fallback to defaults
    return getDefaultGasPrices();
  }
}

/**
 * Estimate gas for a specific transaction
 */
export async function estimateGasWithTier(
  txRequest: ethers.TransactionRequest,
  tier: GasTier = GasTier.STANDARD
): Promise<ethers.TransactionRequest> {
  const provider = await getProvider();
  if (!provider) {
    throw new Error('Blockchain provider not initialized');
  }
  
  try {
    // Get current gas prices
    const gasPrices = await getGasPrices();
    const gasEstimate = gasPrices[tier];
    
    // Estimate gas for this specific transaction
    const gasLimit = await provider.estimateGas(txRequest);
    
    // Apply gas buffer based on transaction type (20% buffer)
    const gasBuffer = gasLimit * BigInt(20) / BigInt(100);
    const bufferedGasLimit = gasLimit + gasBuffer;
    
    // Copy original tx request and add gas parameters
    const gasUpdatedTx: ethers.TransactionRequest = {
      ...txRequest,
      gasLimit: bufferedGasLimit
    };
    
    // Add EIP-1559 parameters if available
    if (gasEstimate.maxFeePerGas && gasEstimate.maxPriorityFeePerGas) {
      gasUpdatedTx.maxFeePerGas = gasEstimate.maxFeePerGas;
      gasUpdatedTx.maxPriorityFeePerGas = gasEstimate.maxPriorityFeePerGas;
    } else if (gasEstimate.gasPrice) {
      // Fallback to legacy gas price
      gasUpdatedTx.gasPrice = gasEstimate.gasPrice;
    }
    
    return gasUpdatedTx;
  } catch (error) {
    console.error('Error estimating gas:', error);
    
    // Return original tx with default gas parameters
    return applyDefaultGasParams(txRequest, tier);
  }
}

/**
 * Returns estimated time in seconds for each gas tier
 */
function getEstimatedTime(tier: GasTier): number {
  switch (tier) {
    case GasTier.ECONOMY:
      return 120; // ~2 minutes
    case GasTier.STANDARD:
      return 60;  // ~1 minute
    case GasTier.FAST:
      return 30;  // ~30 seconds
    case GasTier.URGENT:
      return 15;  // ~15 seconds
    default:
      return 60;
  }
}

/**
 * Get default gas prices if provider fails
 */
function getDefaultGasPrices(): Record<GasTier, GasEstimate> {
  const defaultGasPrice = ethers.parseUnits('50', 'gwei');
  const defaultPriorityFee = ethers.parseUnits('1.5', 'gwei');
  
  const gasEstimates: Record<GasTier, GasEstimate> = {} as Record<GasTier, GasEstimate>;
  
  for (const tier of Object.values(GasTier)) {
    const multiplier = GAS_MULTIPLIERS[tier];
    
    gasEstimates[tier] = {
      maxFeePerGas: defaultGasPrice * BigInt(Math.floor(multiplier * 100)) / BigInt(100),
      maxPriorityFeePerGas: defaultPriorityFee * BigInt(Math.floor(multiplier * 100)) / BigInt(100),
      gasPrice: defaultGasPrice * BigInt(Math.floor(multiplier * 100)) / BigInt(100),
      tier,
      estimatedTimeInSeconds: getEstimatedTime(tier)
    };
  }
  
  return gasEstimates;
}

/**
 * Apply default gas parameters to a transaction
 */
async function applyDefaultGasParams(
  txRequest: ethers.TransactionRequest,
  tier: GasTier = GasTier.STANDARD
): Promise<ethers.TransactionRequest> {
  const defaults = getDefaultGasPrices()[tier];
  const defaultGasLimit = BigInt('300000'); // Default gas limit
  
  return {
    ...txRequest,
    gasLimit: defaultGasLimit,
    maxFeePerGas: defaults.maxFeePerGas,
    maxPriorityFeePerGas: defaults.maxPriorityFeePerGas
  };
}

/**
 * Calculate gas cost estimate in ETH for a transaction
 */
export function calculateGasCost(
  gasLimit: bigint,
  gasEstimate: GasEstimate
): string {
  const maxCost = gasLimit * gasEstimate.maxFeePerGas;
  return ethers.formatEther(maxCost);
} 