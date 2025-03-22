import { NextRequest, NextResponse } from 'next/server';
import { getConnectionStatus } from '@/lib/mongodb';
import { createGeminiProClient } from '@/lib/gemini';
import { withApiMiddleware } from '@/lib/api-middleware';
import { getProvider, initBlockchain, getBlockchainStatus, validateNetwork } from '@/lib/blockchain';
import { ENV, SERVER_ENV } from '@/lib/env-config';
import { serializeBigInts } from '@/lib/utils';

/**
 * Health check endpoint to verify all system components are operational
 * GET /api/health
 */
async function healthCheck(_req: NextRequest) {
  const startTime = Date.now();
  const components: {
    api: { status: string, details: Record<string, string> },
    database: { status: string, details: Record<string, unknown> },
    blockchain: { status: string, details: Record<string, unknown> },
    ai: { status: string, details: Record<string, unknown> }
  } = {
    api: { status: 'healthy', details: { version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0' } },
    database: { status: 'unknown', details: {} },
    blockchain: { status: 'unknown', details: {} },
    ai: { status: 'unknown', details: {} }
  };

  try {
    // Check MongoDB connection
    const dbStatus = getConnectionStatus();
    components.database = {
      status: dbStatus.connected ? 'healthy' : 'unhealthy',
      details: {
        readyState: dbStatus.readyState,
        ...(dbStatus as any).lastAttempt && { lastAttempt: new Date((dbStatus as any).lastAttempt).toISOString() },
        ...(dbStatus as any).error && { error: (dbStatus as any).error }
      }
    };
    
    // Check blockchain connection and get detailed status
    const blockchainStatus = await getBlockchainStatus();
    const networkStatus = await validateNetwork();
    
    // Enhanced blockchain details
    const blockchainDetails = {
      ...blockchainStatus,
      networkValid: networkStatus.valid,
      expectedChainId: networkStatus.expected,
      actualChainId: networkStatus.actual,
      endpoints: {
        rpc: ENV.LISK_RPC_URL
      },
      contractAddresses: {
        projectRegistry: ENV.PROJECT_REGISTRY_ADDRESS,
        escrowManager: ENV.ESCROW_MANAGER_ADDRESS,
        scriptNFT: ENV.SCRIPT_NFT_ADDRESS,
        platformFeeManager: ENV.PLATFORM_FEE_MANAGER_ADDRESS
      }
    };
    
    // Determine overall blockchain status
    let blockchainStatusValue = 'unhealthy';
    if (blockchainStatus.providerConnected && networkStatus.valid) {
      blockchainStatusValue = 'healthy';
    } else if (blockchainStatus.providerConnected) {
      blockchainStatusValue = 'degraded';
    } else if (blockchainStatus.configPresent) {
      blockchainStatusValue = 'degraded';
    } else {
      blockchainStatusValue = 'configuration_required';
    }
    
    components.blockchain = {
      status: blockchainStatusValue,
      details: blockchainDetails
    };
    
    // Check AI service (Gemini)
    const hasGeminiKey = !!ENV.GEMINI_API_KEY;
    let aiClientInitialized = false;
    
    if (hasGeminiKey) {
      try {
        const geminiClient = createGeminiProClient();
        aiClientInitialized = !!geminiClient;
        
        // Optionally test the client with a simple request
        if (geminiClient) {
          // Quick test to verify connectivity - could be expanded
          console.log('Gemini client initialized successfully');
        }
      } catch (error) {
        console.error('Failed to initialize Gemini client:', error);
      }
    }
    
    components.ai = {
      status: aiClientInitialized ? 'healthy' : (hasGeminiKey ? 'unhealthy' : 'configuration_required'),
      details: {
        hasApiKey: hasGeminiKey,
        clientInitialized: aiClientInitialized
      }
    };
    
    // Calculate total response time
    const responseTime = Date.now() - startTime;
    
    // Overall system status
    const systemStatus = Object.values(components).every(c => c.status === 'healthy')
      ? 'healthy'
      : Object.values(components).some(c => c.status === 'unhealthy')
        ? 'unhealthy'
        : 'degraded';
    
    return NextResponse.json(serializeBigInts({
      status: systemStatus,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      responseTime: `${responseTime}ms`,
      components
    }), {
      status: systemStatus === 'healthy' ? 200 : (systemStatus === 'degraded' ? 200 : 503),
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(serializeBigInts({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      components
    }), {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  }
}

export const GET = withApiMiddleware(healthCheck, {
  requireAuth: false,
  connectDb: false,
  rateLimitType: 'default'
}); 