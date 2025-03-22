import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { ENV } from '@/lib/env-config';
import connectToDatabase from '@/lib/mongodb';
import { User, Transaction, Project } from '@/models';
import { updateProjectBlockchainStatus } from '@/lib/utils';

// Function to extract transaction hash from URL
function getTransactionHashFromUrl(url: string): string {
  const pathParts = url.split('/');
  // Find the index of 'status' and get the next part
  const statusIndex = pathParts.indexOf('status');
  return statusIndex >= 0 ? pathParts[statusIndex + 1] : '';
}

// Interface for response data
interface TransactionStatusResponse {
  success: boolean;
  txHash: string;
  transactionHash: string;
  exists: boolean;
  confirmed: boolean;
  status: 'pending' | 'mining' | 'confirmed' | 'failed' | 'error';
  blockNumber?: number | null;
  gasUsed?: string | null;
  message?: string;
  error?: string;
  details?: any;
}

// GET /api/blockchain/status/[hash] - Get transaction status
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const walletAddress = request.headers.get('x-wallet-address')?.toLowerCase();
    if (!walletAddress) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required. Wallet address not provided.',
        status: 'error',
        message: 'Authentication required. Wallet address not provided.'
      }, { status: 401 });
    }
    
    // Connect to database and verify user exists
    await connectToDatabase();
    // Check both 'address' and 'wallet_address' fields to ensure compatibility
    const user = await User.findOne({
      $or: [
        { address: walletAddress },
        { wallet_address: walletAddress }
      ]
    });
    
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'User not found for the provided wallet address.',
        status: 'error',
        message: 'User not found for the provided wallet address.'
      }, { status: 401 });
    }
    
    // Extract transaction hash from URL
    const txHash = getTransactionHashFromUrl(request.url);
    
    if (!txHash) {
      return NextResponse.json({ 
        success: false,
        error: 'Transaction hash is required',
        status: 'error',
        message: 'Transaction hash is required'
      }, { status: 400 });
    }

    // Log the request for debugging
    console.log(`Checking transaction status for hash: ${txHash}, requested by user: ${user.id || user._id}`);

    // Connect to blockchain using provider from environment or fallback
    let provider;
    try {
      // Try with the configured RPC URL from environment variables
      const rpcUrl = ENV.LISK_RPC_URL || ENV.SEPOLIA_RPC_URL;
      if (rpcUrl) {
        console.log(`Using configured RPC URL: ${rpcUrl}`);
        provider = new ethers.JsonRpcProvider(rpcUrl);
      } else {
        // Fallback to public node if no environment variable is set
        console.log('No RPC URL configured, using public fallback');
        provider = new ethers.JsonRpcProvider("https://ethereum-sepolia.publicnode.com");
      }
      
      // Quick health check
      await provider.getNetwork();
      
    } catch (providerError) {
      console.error('Error initializing blockchain provider:', providerError);
      return NextResponse.json({ 
        success: false,
        error: 'Blockchain connection failed',
        status: 'error',
        message: 'Blockchain connection failed',
        details: providerError instanceof Error ? providerError.message : 'Unknown provider error' 
      }, { status: 503 });
    }
    
    try {
      // Check if transaction exists
      const tx = await provider.getTransaction(txHash);
      
      if (!tx) {
        // Get transaction from database as fallback
        const transactionRecord = await Transaction.findOne({ transaction_hash: txHash });
          
        if (transactionRecord) {
          console.log(`Transaction ${txHash} found in database but not on chain, status: ${transactionRecord.status}`);
          // Return info from database
          
          let status: 'pending' | 'mining' | 'confirmed' | 'failed' | 'error';
          if (transactionRecord.status === 'verified') status = 'confirmed';
          else if (transactionRecord.status === 'failed') status = 'failed';
          else status = 'pending';
          
          const response: TransactionStatusResponse = { 
            success: true,
            txHash: txHash,
            transactionHash: txHash,
            exists: false,
            confirmed: transactionRecord.status === 'verified',
            status,
            message: `Transaction found in database with status: ${transactionRecord.status}`,
            details: transactionRecord.metadata || {}
          };
          
          return NextResponse.json(response, { status: 200 });
        }
        
        const response: TransactionStatusResponse = { 
          success: false,
          txHash: txHash,
          transactionHash: txHash,
          exists: false,
          confirmed: false,
          status: 'error',
          message: 'Transaction not found on blockchain or in database' 
        };
        return NextResponse.json(response, { status: 200 });
      }
      
      // Check transaction receipt to see if it's been mined
      const receipt = await provider.getTransactionReceipt(txHash);
      
      // Prepare response data
      const responseData: TransactionStatusResponse = {
        success: true,
        txHash: txHash,
        transactionHash: txHash,
        exists: true,
        confirmed: receipt !== null,
        status: receipt ? 'confirmed' : 'mining',
        message: receipt ? 'Transaction confirmed' : 'Transaction submitted and awaiting confirmation'
      };
      
      // If receipt exists, transaction is confirmed
      if (receipt) {
        responseData.blockNumber = receipt.blockNumber;
        responseData.gasUsed = receipt.gasUsed?.toString();
        
        // Update transaction record in database if available
        try {
          const transactionRecord = await Transaction.findOne({ transaction_hash: txHash });
          if (transactionRecord && transactionRecord.status !== 'verified') {
            transactionRecord.status = 'verified';
            await transactionRecord.save();
            console.log(`Updated transaction ${txHash} status to confirmed in database`);
            
            // Get project associated with this transaction if it's a project_creation
            if (transactionRecord.transaction_type === 'project_creation' && transactionRecord.project_id) {
              // Use the utility function to update project status
              const project = await updateProjectBlockchainStatus(
                transactionRecord.project_id,
                'confirmed',
                {
                  hash: transactionRecord.transaction_hash,
                  transaction_hash: transactionRecord.transaction_hash,
                  blockNumber: receipt.blockNumber,
                  gasUsed: receipt.gasUsed?.toString()
                }
              );
              
              if (project) {
                // Include project details in response
                responseData.details = {
                  ...responseData.details,
                  project: {
                    id: project.projectId || project.id,
                    title: project.title,
                    status: 'confirmed'
                  }
                };
              }
            }
          }
        } catch (dbError) {
          console.error('Error updating transaction in database:', dbError);
          // Continue without failing the request
        }
      } else {
        // If not confirmed, check if the transaction is still pending
        try {
          const transactionRecord = await Transaction.findOne({ transaction_hash: txHash });
          if (transactionRecord) {
            responseData.details = transactionRecord.metadata || {};
            
            // Check if the transaction was recorded a long time ago but still not confirmed
            const transactionAge = Date.now() - new Date(transactionRecord.created_at).getTime();
            const THREE_HOURS = 3 * 60 * 60 * 1000;
            
            if (transactionAge > THREE_HOURS) {
              responseData.status = 'failed';
              responseData.message = 'Transaction likely failed - submitted but not confirmed after 3 hours';
              
              // Update transaction in database
              transactionRecord.status = 'failed';
              await transactionRecord.save();
              
              // Update project if this is a project creation transaction
              if (transactionRecord.transaction_type === 'project_creation' && transactionRecord.project_id) {
                // Use the utility function to update project status
                await updateProjectBlockchainStatus(
                  transactionRecord.project_id,
                  'failed',
                  {
                    hash: transactionRecord.transaction_hash,
                    transaction_hash: transactionRecord.transaction_hash,
                    error: 'Transaction timeout - not confirmed after 3 hours'
                  }
                );
                
                // Include project in response
                responseData.details = {
                  ...responseData.details,
                  project: {
                    id: transactionRecord.project_id,
                    status: 'failed',
                    error: 'Transaction timeout'
                  }
                };
              }
            }
          }
        } catch (dbCheckError) {
          console.error('Error checking transaction record age:', dbCheckError);
        }
      }
      
      return NextResponse.json(responseData, { status: 200 });
      
    } catch (error) {
      console.error('Error checking transaction status:', error);
      return NextResponse.json({ 
        success: false,
        txHash: txHash,
        transactionHash: txHash,
        exists: false,
        confirmed: false,
        status: 'error',
        error: 'Failed to check transaction status',
        message: 'Failed to check transaction status',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error checking transaction status:', error);
    return NextResponse.json({ 
      success: false,
      status: 'error',
      error: 'Failed to check transaction status',
      message: 'Failed to check transaction status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 