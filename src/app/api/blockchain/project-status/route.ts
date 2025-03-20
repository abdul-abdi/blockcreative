import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api-middleware';
import { Project, Transaction } from '@/models';
import { checkTransactionStatus, TransactionState } from '@/lib/transaction-monitor';
import { ENV } from '@/lib/env-config';
import { v4 as uuidv4 } from 'uuid';
import { getProvider, validateNetwork } from '@/lib/blockchain';
import { serializeBigInts } from '@/lib/utils';

/**
 * Checks and updates a project's blockchain status in the database
 * GET /api/blockchain/project-status?projectId=xxx
 */
async function checkProjectBlockchainStatus(
  request: NextRequest,
  context: { params: any; token?: any; db?: any; user?: any }
) {
  try {
    // Get query params
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId parameter' }, { status: 400 });
    }
    
    // Check if blockchain provider is available
    const provider = await getProvider();
    if (!provider) {
      return NextResponse.json({ 
        error: 'Blockchain provider not available',
        message: 'Cannot check blockchain status: provider not connected'
      }, { status: 503 });
    }
    
    // Validate network
    const networkStatus = await validateNetwork();
    if (!networkStatus.valid) {
      return NextResponse.json(serializeBigInts({ 
        error: 'Wrong blockchain network',
        message: `Connected to chain ID ${networkStatus.actual}, but expected ${networkStatus.expected}`,
        networkStatus
      }), { status: 400 });
    }
    
    // Find the project
    const project = await Project.findOne({ id: projectId });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Check if the project has blockchain data
    if (!project.blockchain_data?.transactionHash) {
      return NextResponse.json({ 
        error: 'Project has no blockchain transaction data',
        project 
      }, { status: 400 });
    }
    
    const txHash = project.blockchain_data.transactionHash;
    
    // Check transaction status
    const txData = await checkTransactionStatus(txHash);
    
    // Update project based on transaction status
    if (txData.state === TransactionState.CONFIRMED && txData.confirmations >= 1) {
      project.onChain = true;
      project.contract_address = ENV.PROJECT_REGISTRY_ADDRESS;
      project.blockchain_data = {
        ...project.blockchain_data,
        confirmations: txData.confirmations,
        confirmed: true,
        timestamp: txData.timestamp
      };
      await project.save();
      
      // Create transaction record if it doesn't exist
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
            projectId: project.blockchain_data.projectId,
            contract: ENV.PROJECT_REGISTRY_ADDRESS
          }
        });
        await transaction.save();
      }
    }
    
    return NextResponse.json(serializeBigInts({
      message: 'Project blockchain status checked',
      project: {
        id: project.id,
        onChain: project.onChain,
        blockchain_data: project.blockchain_data
      },
      transaction: txData,
      blockchain: {
        network: networkStatus.valid ? 'valid' : 'invalid',
        chainId: networkStatus.actual
      }
    }), { status: 200 });
  } catch (error) {
    console.error('Error checking project blockchain status:', error);
    return NextResponse.json({ 
      error: 'Failed to check project blockchain status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const GET = withApiMiddleware(checkProjectBlockchainStatus); 