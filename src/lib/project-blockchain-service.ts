import { monitorTransaction, TransactionState, TransactionType } from './transaction-monitor';
import connectToDatabase from './mongodb';
import { Project, Transaction } from '@/models';
import { ENV } from './env-config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Updates a project's blockchain status in the database
 * @param projectId - The project ID
 * @param txHash - The blockchain transaction hash
 * @param blockchainProjectId - The project ID on the blockchain
 */
export async function trackProjectCreation(
  projectId: string,
  txHash: string,
  blockchainProjectId: string
) {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Start monitoring the transaction
    await monitorTransaction(
      txHash,
      {
        type: TransactionType.PROJECT_FUNDING,
        userId: '', // Will be filled during monitoring
        projectId: projectId
      },
      async (txData) => {
        // This callback is triggered whenever transaction status updates
        if (txData.state === TransactionState.CONFIRMED && txData.confirmations >= 1) {
          // Transaction is confirmed with enough confirmations
          try {
            // Update project in database
            const project = await Project.findOne({ id: projectId });
            if (project) {
              project.onChain = true;
              project.contract_address = ENV.PROJECT_REGISTRY_ADDRESS;
              project.blockchain_data = {
                ...project.blockchain_data,
                projectId: blockchainProjectId,
                transactionHash: txHash,
                confirmations: txData.confirmations,
                confirmed: true,
                timestamp: txData.timestamp
              };
              await project.save();
              
              // Create or update transaction record
              const existingTx = await Transaction.findOne({ transaction_hash: txHash });
              if (!existingTx) {
                const transaction = new Transaction({
                  id: `tx_${uuidv4()}`,
                  transaction_hash: txHash,
                  transaction_type: 'project_creation',
                  user_id: project.producer_id,
                  project_id: projectId,
                  amount: 0, // No funds transferred for creation
                  status: 'completed',
                  created_at: new Date(),
                  metadata: {
                    projectId: blockchainProjectId,
                    contract: ENV.PROJECT_REGISTRY_ADDRESS
                  }
                });
                await transaction.save();
              }
            }
          } catch (error) {
            console.error('Error updating project blockchain status:', error);
          }
        }
      }
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error tracking project creation:', error);
    return { success: false, error };
  }
} 