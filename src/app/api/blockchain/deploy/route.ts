import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import deployContracts from '@/lib/deploy-contracts';

/**
 * POST /api/blockchain/deploy - Deploy contracts and update environment variables
 * This endpoint is protected and only accessible by admin users
 */
export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Verify the user is an admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can deploy contracts' },
        { status: 403 }
      );
    }

    // Deploy contracts
    const success = await deployContracts();
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to deploy contracts' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Contracts deployed successfully',
      success: true
    });
  } catch (error) {
    console.error('Error deploying contracts:', error);
    return NextResponse.json(
      { error: 'Failed to deploy contracts' },
      { status: 500 }
    );
  }
}, { requiredRole: 'admin' }); 