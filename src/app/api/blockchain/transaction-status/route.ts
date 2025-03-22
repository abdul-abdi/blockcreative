import { NextRequest, NextResponse } from 'next/server';
import { getTransactionStatus } from '@/lib/blockchain';
import connectToDatabase from '@/lib/mongodb';
import { Transaction } from '@/models';

/**
 * GET /api/blockchain/transaction-status - Get the status of a blockchain transaction
 */
export async function GET(request: NextRequest) {
  try {
    // Get the transaction hash from the query parameters
    const { searchParams } = new URL(request.url);
    const txHash = searchParams.get('txHash');
    
    if (!txHash) {
      return NextResponse.json({ 
        error: 'Transaction hash is required' 
      }, { status: 400 });
    }

    console.log(`Checking transaction status for hash: ${txHash}`);
    
    // First check if we have this transaction in our database
    try {
      await connectToDatabase();
      const dbTransaction = await Transaction.findOne({ transaction_hash: txHash });
      
      if (dbTransaction) {
        console.log(`Found transaction in database with status: ${dbTransaction.status}`);
        // Map database status to API response format
        const statusMap: Record<string, string> = {
          'pending': 'pending',
          'completed': 'confirmed',
          'failed': 'failed'
        };
        
        // If transaction is already complete in our database, use that status
        if (dbTransaction.status === 'completed' || dbTransaction.status === 'failed') {
          return NextResponse.json({
            txHash,
            status: statusMap[dbTransaction.status] || 'pending',
            confirmations: dbTransaction.metadata?.confirmations || 0,
            blockNumber: dbTransaction.metadata?.blockNumber || null,
            gasUsed: dbTransaction.metadata?.gasUsed || null,
            fromDatabase: true
          });
        }
      }
    } catch (dbError) {
      console.error('Error checking transaction in database:', dbError);
      // Continue with blockchain check if database check fails
    }
    
    // Check the blockchain for transaction status
    const result = await getTransactionStatus(txHash);
    
    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Failed to get transaction status',
        status: 'unknown'
      }, { status: 500 });
    }
    
    // Map blockchain status to our API response format
    let status = 'pending';
    if (result.status === 'confirmed' && (typeof result.confirmations === 'number' && result.confirmations >= 1)) {
      status = 'confirmed';
    } else if (result.status === 'failed') {
      status = 'failed';
    }
    
    return NextResponse.json({
      txHash,
      status,
      confirmations: result.confirmations,
      blockNumber: result.blockNumber,
      gasUsed: result.gasUsed,
      fromBlockchain: true
    });
  } catch (error) {
    console.error('Error checking transaction status:', error);
    return NextResponse.json({ 
      error: 'Failed to check transaction status',
      details: error instanceof Error ? error.message : 'Unknown error',
      status: 'unknown'
    }, { status: 500 });
  }
} 