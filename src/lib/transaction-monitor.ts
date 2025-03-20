import { ethers } from 'ethers';
import { getProvider } from './blockchain';
import { ENV } from './env-config';

// Transaction states
export enum TransactionState {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  DROPPED = 'dropped',
  UNKNOWN = 'unknown'
}

// Transaction types
export enum TransactionType {
  PROJECT_FUNDING = 'project_funding',
  SCRIPT_PURCHASE = 'script_purchase',
  NFT_MINTING = 'nft_minting',
  NFT_TRANSFER = 'nft_transfer',
  ESCROW_RELEASE = 'escrow_release',
  PLATFORM_FEE = 'platform_fee'
}

// Transaction metadata
export interface TransactionMetadata {
  id?: string;
  type: TransactionType;
  userId: string;
  projectId?: string;
  submissionId?: string;
  recipientId?: string;
  amount?: string;
  tokenId?: string;
  customData?: Record<string, any>;
}

// Transaction receipt data
export interface TransactionData {
  hash: string;
  state: TransactionState;
  blockNumber?: number;
  confirmations: number;
  from: string;
  to: string;
  gasUsed?: string;
  effectiveGasPrice?: string;
  totalCost?: string;
  timestamp?: number;
  receipt?: ethers.TransactionReceipt;
  error?: string;
  metadata: TransactionMetadata;
}

// In-memory transaction cache
const transactionCache = new Map<string, TransactionData>();

// Track transactions that are actively being monitored
const activeMonitoring = new Set<string>();

// Confirmation threshold
const CONFIRMATION_THRESHOLD = ENV.IS_PROD ? 3 : 1;

/**
 * Start monitoring a transaction
 */
export async function monitorTransaction(
  transactionHash: string,
  metadata: TransactionMetadata,
  callback?: (txData: TransactionData) => void
): Promise<TransactionData> {
  const provider = await getProvider();
  if (!provider) {
    throw new Error('Blockchain provider not initialized');
  }

  // Initialize transaction data
  const initialData: TransactionData = {
    hash: transactionHash,
    state: TransactionState.PENDING,
    confirmations: 0,
    from: '',
    to: '',
    metadata
  };
  
  // Store in cache
  transactionCache.set(transactionHash, initialData);
  
  // Start monitoring if not already active
  if (!activeMonitoring.has(transactionHash)) {
    activeMonitoring.add(transactionHash);
    
    // Immediate check
    const updatedData = await checkTransactionStatus(transactionHash);
    
    // Notify callback if provided
    if (callback) {
      callback(updatedData);
    }
    
    // Continue monitoring until confirmed or failed
    // This will periodically poll for updates
    monitorUntilComplete(transactionHash, callback);
  }
  
  return transactionCache.get(transactionHash) || initialData;
}

/**
 * Check current transaction status
 */
export async function checkTransactionStatus(transactionHash: string): Promise<TransactionData> {
  const provider = await getProvider();
  if (!provider) {
    throw new Error('Blockchain provider not initialized');
  }
  
  // Get cached transaction data
  const txData = transactionCache.get(transactionHash) || {
    hash: transactionHash,
    state: TransactionState.UNKNOWN,
    confirmations: 0,
    from: '',
    to: '',
    metadata: { type: TransactionType.PROJECT_FUNDING, userId: '' }
  };
  
  try {
    // Get transaction details
    const tx = await provider.getTransaction(transactionHash);
    
    if (!tx) {
      // Transaction not found - might be dropped or not yet broadcast
      txData.state = TransactionState.UNKNOWN;
      transactionCache.set(transactionHash, txData);
      return txData;
    }
    
    // Update basic transaction info
    txData.from = tx.from;
    txData.to = tx.to || '';
    
    // Check if we have a receipt (transaction was mined)
    const receipt = await provider.getTransactionReceipt(transactionHash);
    
    if (!receipt) {
      // No receipt yet - transaction is still pending
      txData.state = TransactionState.PENDING;
      transactionCache.set(transactionHash, txData);
      return txData;
    }
    
    // Transaction is mined
    txData.receipt = receipt;
    txData.blockNumber = receipt.blockNumber;
    txData.gasUsed = receipt.gasUsed.toString();
    txData.effectiveGasPrice = receipt.gasPrice?.toString() || '';
    
    // Calculate total gas cost
    if (receipt.gasUsed && receipt.gasPrice) {
      const totalCost = receipt.gasUsed * receipt.gasPrice;
      txData.totalCost = ethers.formatEther(totalCost);
    }
    
    // Determine transaction state based on receipt status
    txData.state = receipt.status === 1 ? TransactionState.CONFIRMED : TransactionState.FAILED;
    
    // Get block to get timestamp
    const block = await provider.getBlock(receipt.blockNumber);
    if (block) {
      txData.timestamp = block.timestamp;
    }
    
    // Get confirmation count
    const currentBlock = await provider.getBlockNumber();
    txData.confirmations = currentBlock - receipt.blockNumber + 1;
    
    // Update cache
    transactionCache.set(transactionHash, txData);
    
    return txData;
  } catch (error) {
    console.error(`Error checking transaction ${transactionHash}:`, error);
    
    // Update cache with error
    txData.error = error instanceof Error ? error.message : 'Unknown error';
    transactionCache.set(transactionHash, txData);
    
    return txData;
  }
}

/**
 * Continue monitoring a transaction until it's complete
 */
async function monitorUntilComplete(
  transactionHash: string,
  callback?: (txData: TransactionData) => void
): Promise<void> {
  // Don't continue if we're no longer tracking this transaction
  if (!activeMonitoring.has(transactionHash)) {
    return;
  }
  
  try {
    // Check current status
    const txData = await checkTransactionStatus(transactionHash);
    
    // Notify callback if provided
    if (callback) {
      callback(txData);
    }
    
    // Determine if monitoring should continue
    if (
      txData.state === TransactionState.CONFIRMED && 
      txData.confirmations >= CONFIRMATION_THRESHOLD
    ) {
      // Transaction confirmed with enough confirmations
      activeMonitoring.delete(transactionHash);
      return;
    }
    
    if (txData.state === TransactionState.FAILED) {
      // Transaction failed
      activeMonitoring.delete(transactionHash);
      return;
    }
    
    if (txData.state === TransactionState.DROPPED) {
      // Transaction was dropped
      activeMonitoring.delete(transactionHash);
      return;
    }
    
    // Continue monitoring after delay
    // Use different polling intervals based on state
    const pollingDelay = txData.state === TransactionState.PENDING ? 5000 : 10000;
    
    setTimeout(() => {
      monitorUntilComplete(transactionHash, callback);
    }, pollingDelay);
  } catch (error) {
    console.error(`Error monitoring transaction ${transactionHash}:`, error);
    
    // Retry after a delay
    setTimeout(() => {
      monitorUntilComplete(transactionHash, callback);
    }, 15000);
  }
}

/**
 * Get transaction status from cache or check latest
 */
export async function getTransactionStatus(transactionHash: string): Promise<TransactionData> {
  // Check if we have it in cache
  const cachedData = transactionCache.get(transactionHash);
  
  // If it's confirmed with enough confirmations, just return cached data
  if (
    cachedData && 
    cachedData.state === TransactionState.CONFIRMED && 
    cachedData.confirmations >= CONFIRMATION_THRESHOLD
  ) {
    return cachedData;
  }
  
  // Otherwise, check for updates
  return checkTransactionStatus(transactionHash);
}

/**
 * Batch check multiple transactions at once
 */
export async function batchCheckTransactions(
  transactionHashes: string[]
): Promise<Record<string, TransactionData>> {
  const results: Record<string, TransactionData> = {};
  
  // Process transactions in parallel
  await Promise.all(
    transactionHashes.map(async (hash) => {
      results[hash] = await getTransactionStatus(hash);
    })
  );
  
  return results;
} 