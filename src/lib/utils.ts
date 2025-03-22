/**
 * Recursively transforms BigInt values to strings in an object
 * to make it safe for JSON serialization
 */
export function serializeBigInts<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString() as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInts) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInts(value);
    }
    return result as T;
  }
  
  return obj;
}

/**
 * Create a blockchain transaction record with consistent field structure
 * @param transactionType Transaction type (project_creation, project_funding, etc)
 * @param data Transaction data including user, project, hashes, etc.
 * @returns Transaction object ready to be saved
 */
export const createTransactionRecord = async (
  transactionType: 'project_creation' | 'project_funding' | 'script_purchase' | 'nft_minting',
  data: {
    user: any;
    project?: any;
    submission?: any;
    recipient?: any;
    transactionHash: string;
    amount?: number;
    status?: 'pending' | 'verified' | 'failed';
    metadata?: any;
  }
) => {
  // Dynamically import uuid if needed
  const { v4: uuidv4 } = require('uuid');
  
  // Destructure data with defaults
  const { 
    user, 
    project, 
    submission, 
    recipient, 
    transactionHash, 
    amount = 0, 
    status = 'pending',
    metadata = {}
  } = data;
  
  // Get the Transaction model - we need to require it here to avoid
  // circular dependencies when this file is imported elsewhere
  const Transaction = await import('@/models/Transaction').then(module => module.default);
  
  // Create standardized transaction record
  const transaction = new Transaction({
    id: uuidv4(),
    transaction_hash: transactionHash || `${status}_${Date.now()}`,
    transaction_type: transactionType,
    user_id: user._id || user.id,
    project_id: project?._id || project?.id,
    submission_id: submission?._id || submission?.id,
    recipient_id: recipient?._id || recipient?.id,
    amount: amount,
    status: status,
    created_at: new Date(),
    metadata: {
      networkName: 'Lisk Sepolia',
      ...metadata
    }
  });
  
  return transaction;
};

/**
 * Update a project's blockchain status
 * @param projectId Project ID or _id
 * @param status New blockchain status
 * @param data Additional data to include in the blockchain_data field
 * @returns Updated project object or null if not found
 */
export const updateProjectBlockchainStatus = async (
  projectId: string,
  status: 'pending' | 'confirmed' | 'failed' | 'skipped',
  data: {
    hash?: string;
    transaction_hash?: string;
    error?: string;
    timestamp?: Date;
    [key: string]: any;
  } = {}
) => {
  try {
    // Get the Project model dynamically to avoid circular dependencies
    const Project = await import('@/models/Project').then(module => module.default);
    
    // Find the project by any of its possible ID fields
    const project = await Project.findOne({
      $or: [
        { _id: projectId },
        { id: projectId },
        { projectId: projectId }
      ]
    });
    
    if (!project) {
      console.warn(`Project not found for ID: ${projectId}`);
      return null;
    }
    
    // Update blockchain data
    project.onChain = status === 'confirmed';
    project.blockchain_data = {
      ...project.blockchain_data,
      status,
      timestamp: data.timestamp || new Date(),
      ...data
    };
    project.updatedAt = new Date();
    
    // Save changes
    await project.save();
    console.log(`Updated project ${projectId} blockchain status to ${status}`);
    
    return project;
  } catch (error) {
    console.error(`Error updating project blockchain status:`, error);
    return null;
  }
};

/**
 * Get the user's wallet address from all possible sources
 * (localStorage, cookies, connected wallet, etc)
 * 
 * @returns Wallet address or null if not found
 */
export const getWalletAddress = (): string | null => {
  // Check for localStorage first (most common storage method)
  if (typeof window !== 'undefined') {
    const localStorageAddress = localStorage.getItem('walletAddress');
    if (localStorageAddress) {
      return localStorageAddress.toLowerCase();
    }
  }
  
  // If we're on the server side or localStorage is empty, we can't do much
  // The middleware will need to handle extracting from cookies or headers
  return null;
};

/**
 * Create headers with authentication information for fetch requests
 * 
 * @param additionalHeaders Any additional headers to include
 * @returns Headers object with authentication information
 */
export const createAuthenticatedHeaders = (additionalHeaders: Record<string, string> = {}): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
  
  // Add wallet address if available
  const walletAddress = getWalletAddress();
  if (walletAddress) {
    headers['x-wallet-address'] = walletAddress;
  }
  
  return headers;
}; 