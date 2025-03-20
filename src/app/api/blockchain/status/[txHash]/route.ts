import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess, ErrorType } from '@/lib/api-error';
import { getTransactionStatus } from '@/lib/transaction-monitor';
import { getToken } from 'next-auth/jwt';
import connectToDatabase from '@/lib/mongodb';
import { Transaction } from '@/models';
import { getProvider } from '@/lib/blockchain';
import { serializeBigInts } from '@/lib/utils';

// GET /api/blockchain/status/[txHash] - Get status of a blockchain transaction
export async function GET(
  request: NextRequest,
  { params }: { params: { txHash: string } }
) {
  try {
    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token) {
      return createApiError(
        ErrorType.UNAUTHORIZED,
        'Authentication required'
      );
    }

    const { txHash } = params;
    if (!txHash) {
      return createApiError(
        ErrorType.MISSING_FIELD,
        'Transaction hash is required',
        { field: 'txHash' }
      );
    }

    // Verify blockchain connection is available
    const provider = await getProvider();
    if (!provider) {
      return createApiError(
        ErrorType.BLOCKCHAIN_ERROR,
        'Blockchain provider not connected',
        { details: 'Provider connection failed' }
      );
    }

    // Connect to database to get transaction metadata
    await connectToDatabase();

    // Get transaction from database
    const dbTransaction = await Transaction.findOne({ transaction_hash: txHash });

    // Check if transaction exists in our system
    const isAuthorized = dbTransaction && (
      dbTransaction.user_id === token.id || 
      dbTransaction.recipient_id === token.id ||
      token.role === 'admin'
    );

    if (dbTransaction && !isAuthorized) {
      return createApiError(
        ErrorType.FORBIDDEN,
        'You do not have permission to view this transaction'
      );
    }

    // Get blockchain transaction status with retry if needed
    let retryCount = 0;
    const maxRetries = 2;
    let txStatus;
    
    while (retryCount <= maxRetries) {
      txStatus = await getTransactionStatus(txHash);
      
      // Check if the transaction status call was successful
      if (!txStatus.error) {
        break;
      }
      
      // Only retry on provider errors, not on invalid hash
      if (txStatus.error && txStatus.error.includes('provider')) {
        retryCount++;
        if (retryCount <= maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise(r => setTimeout(r, 1000 * retryCount));
          continue;
        }
      } else {
        // Don't retry on other errors
        break;
      }
    }

    // If we have the transaction in our database, enhance the response
    // with our database information
    if (dbTransaction) {
      return createApiSuccess(serializeBigInts({
        transaction: {
          ...txStatus,
          db: {
            id: dbTransaction.id,
            type: dbTransaction.transaction_type,
            amount: dbTransaction.amount,
            status: dbTransaction.status,
            created_at: dbTransaction.created_at,
            user_id: dbTransaction.user_id,
            recipient_id: dbTransaction.recipient_id,
            project_id: dbTransaction.project_id,
            submission_id: dbTransaction.submission_id,
            metadata: dbTransaction.metadata
          }
        }
      }));
    }

    // If we don't have it in our database, just return blockchain status
    return createApiSuccess(serializeBigInts({
      transaction: txStatus,
      warning: 'Transaction not found in database'
    }));
  } catch (error) {
    console.error('Error checking transaction status:', error);
    return createApiError(
      ErrorType.INTERNAL_ERROR,
      `Failed to check transaction status for hash: ${params.txHash}`,
      { 
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    );
  }
} 