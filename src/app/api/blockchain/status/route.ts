import { NextRequest, NextResponse } from 'next/server';
import { getProvider, getBlockchainStatus, validateNetwork } from '@/lib/blockchain';
import { withApiMiddleware } from '@/lib/api-middleware';
import { ENV } from '@/lib/env-config';
import { serializeBigInts } from '@/lib/utils';

/**
 * Handler to check overall blockchain configuration status
 */
async function blockchainStatusHandler(_req: NextRequest) {
  try {
    // Get comprehensive blockchain status
    const blockchainStatus = await getBlockchainStatus();
    const networkStatus = await validateNetwork();
    
    // Construct detailed status response
    const status = {
      details: {
        ...blockchainStatus,
        network: networkStatus,
        endpoints: {
          rpc: ENV.LISK_RPC_URL
        },
        contracts: {
          projectRegistry: {
            address: ENV.PROJECT_REGISTRY_ADDRESS,
            isInitialized: blockchainStatus.contracts?.projectRegistry ?? false
          },
          escrowManager: {
            address: ENV.ESCROW_MANAGER_ADDRESS,
            isInitialized: blockchainStatus.contracts?.escrowManager ?? false
          },
          scriptNFT: {
            address: ENV.SCRIPT_NFT_ADDRESS,
            isInitialized: blockchainStatus.contracts?.scriptNFT ?? false
          },
          platformFeeManager: {
            address: ENV.PLATFORM_FEE_MANAGER_ADDRESS,
            isInitialized: blockchainStatus.contracts?.platformFeeManager ?? false
          }
        }
      }
    };
    
    // Check if the system is healthy
    const isHealthy = blockchainStatus.providerConnected && networkStatus.valid;
    const isDegraded = blockchainStatus.providerConnected && !networkStatus.valid;
    
    // If the provider is connected, return the full status
    if (isHealthy) {
      return NextResponse.json(serializeBigInts({
        success: true,
        status: 'healthy',
        data: status
      }));
    } else if (isDegraded) {
      return NextResponse.json(serializeBigInts({
        success: true,
        status: 'degraded',
        data: {
          ...status,
          details: {
            ...status.details,
            message: `Connected to wrong network: expected chainId ${networkStatus.expected}, found ${networkStatus.actual}`
          }
        }
      }), { status: 200 });
    } else {
      // If the provider isn't connected, return error status
      return NextResponse.json(serializeBigInts({
        success: false,
        status: 'unhealthy',
        data: {
          ...status,
          details: {
            ...status.details,
            message: 'Blockchain provider not connected',
            connectionAttempts: blockchainStatus.connectionAttempts,
            lastAttempt: blockchainStatus.lastInitializationTime 
              ? new Date(blockchainStatus.lastInitializationTime).toISOString() 
              : null
          }
        }
      }), { status: 503 });
    }
  } catch (error) {
    console.error('Error getting blockchain status:', error);
    
    return NextResponse.json(serializeBigInts(
      { 
        success: false,
        status: 'error',
        error: 'Failed to get blockchain status', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500 }
    );
  }
}

export const GET = withApiMiddleware(blockchainStatusHandler, {
  requireAuth: false, // Allow public access to blockchain status
  connectDb: false    // No need for database connection
}); 