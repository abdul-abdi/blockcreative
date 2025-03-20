import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api-middleware';
import { getProvider } from '@/lib/blockchain';

/**
 * Test endpoint for blockchain functionality
 * GET /api/blockchain/test
 */
async function blockchainTestHandler(_req: NextRequest) {
  try {
    // Get blockchain status
    const provider = await getProvider();
    const status = {
      details: {
        providerConnected: provider !== null
      }
    };
    
    // Additional test: Check if provider can connect to chain
    let providerInfo: { 
      connected: boolean;
      chainId: number | null;
      blockNumber: number | null;
    } = { 
      connected: false, 
      chainId: null, 
      blockNumber: null 
    };
    
    if (provider) {
      try {
        const network = await provider.getNetwork();
        const blockNumber = await provider.getBlockNumber();
        
        providerInfo = {
          connected: true,
          chainId: Number(network.chainId),
          blockNumber: Number(blockNumber)
        };
      } catch (err) {
        console.error('Error connecting to blockchain:', err);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Blockchain connection test completed',
      timestamp: new Date().toISOString(),
      status,
      providerInfo
    });
  } catch (error) {
    console.error('Blockchain test error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Blockchain test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export const GET = withApiMiddleware(blockchainTestHandler, {
  requireAuth: true,
  connectDb: false
}); 