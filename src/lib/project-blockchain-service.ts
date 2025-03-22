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
    
    console.log(`Starting to track blockchain transaction for project ${projectId}`);
    console.log(`Transaction hash: ${txHash}, Blockchain Project ID: ${blockchainProjectId}`);
    
    // Create an initial transaction record
    try {
      const existingTx = await Transaction.findOne({ transaction_hash: txHash });
      if (!existingTx) {
        // Find the project to get producer_id
        const project = await Project.findOne({ projectId: projectId });
        if (project) {
          const transaction = new Transaction({
            id: `tx_${uuidv4()}`,
            transaction_hash: txHash,
            transaction_type: 'project_creation',
            user_id: project.producer_id,
            project_id: projectId,
            amount: 0, // No funds transferred for creation
            status: 'pending',
            created_at: new Date(),
            metadata: {
              projectId: blockchainProjectId,
              contract: ENV.PROJECT_REGISTRY_ADDRESS
            }
          });
          await transaction.save();
          console.log(`Created initial transaction record for ${txHash}`);
        }
      }
    } catch (error) {
      console.error('Error creating initial transaction record:', error);
      // Continue even if initial record creation fails
    }
    
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
        console.log(`Transaction status update for ${txHash}:`, 
          `state=${txData.state}, confirmations=${txData.confirmations}`);
            
        // Update transaction record with latest status
        try {
          const txRecord = await Transaction.findOne({ transaction_hash: txHash });
          if (txRecord) {
            txRecord.status = txData.state === 'confirmed' ? 'completed' : 
                            txData.state === 'failed' ? 'failed' : 'pending';
            await txRecord.save();
            console.log(`Updated transaction record status to ${txRecord.status}`);
          }
        } catch (updateError) {
          console.error('Error updating transaction record:', updateError);
        }
            
        if (txData.state === TransactionState.CONFIRMED && txData.confirmations >= 1) {
          // Transaction is confirmed with enough confirmations
          console.log(`Transaction ${txHash} confirmed with ${txData.confirmations} confirmations`);
          try {
            // Update project in database
            const project = await Project.findOne({ projectId: projectId });
            if (project) {
              project.onChain = true;
              project.status = project.status === 'draft' ? 'published' : project.status;
              project.contract_address = ENV.PROJECT_REGISTRY_ADDRESS || '';
              project.blockchain_data = {
                ...project.blockchain_data,
                projectId: blockchainProjectId,
                transactionHash: txHash,
                confirmations: txData.confirmations,
                confirmed: true,
                timestamp: txData.timestamp,
                confirmationTime: new Date()
              };
              await project.save();
              console.log(`Updated project ${projectId} with blockchain confirmation`);
              
              // Update transaction record to completed
              const transaction = await Transaction.findOne({ transaction_hash: txHash });
              if (transaction) {
                transaction.status = 'completed';
                transaction.metadata = {
                  ...transaction.metadata,
                  confirmations: txData.confirmations,
                  gasUsed: txData.gasUsed,
                  blockNumber: txData.blockNumber
                };
                await transaction.save();
                console.log(`Marked transaction ${txHash} as completed`);
              } else {
                console.log(`Transaction record not found for ${txHash}, creating new one`);
                // Create transaction record if it doesn't exist
                const newTransaction = new Transaction({
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
                    contract: ENV.PROJECT_REGISTRY_ADDRESS,
                    confirmations: txData.confirmations,
                    gasUsed: txData.gasUsed,
                    blockNumber: txData.blockNumber
                  }
                });
                await newTransaction.save();
              }
            } else {
              console.error(`Project ${projectId} not found in database`);
            }
          } catch (error) {
            console.error('Error updating project blockchain status:', error);
          }
        } else if (txData.state === TransactionState.FAILED) {
          console.log(`Transaction ${txHash} failed`);
          try {
            // Update project in database to mark failure
            const project = await Project.findOne({ projectId: projectId });
            if (project) {
              project.blockchain_data = {
                ...project.blockchain_data,
                error: 'Transaction failed',
                transactionHash: txHash,
                confirmed: false,
                failedAt: new Date()
              };
              await project.save();
              console.log(`Updated project ${projectId} with blockchain failure`);
              
              // Update transaction record to failed
              const transaction = await Transaction.findOne({ transaction_hash: txHash });
              if (transaction) {
                transaction.status = 'failed';
                await transaction.save();
                console.log(`Marked transaction ${txHash} as failed`);
              }
            }
          } catch (error) {
            console.error('Error updating project blockchain failure status:', error);
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