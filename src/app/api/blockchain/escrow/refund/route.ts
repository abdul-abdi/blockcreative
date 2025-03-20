import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Project, Transaction } from '@/models';
import { getToken } from 'next-auth/jwt';
import { v4 as uuidv4 } from 'uuid';
import { refundProducer } from '@/lib/blockchain';
import { withApiMiddleware } from '@/lib/api-middleware';

/**
 * Refund escrow funds for a project to the producer
 * POST /api/blockchain/escrow/refund
 */
async function refundProjectEscrow(
  request: NextRequest,
  context: { params: any; token?: any; db?: any; user?: any }
) {
  try {
    const { token } = context;
    
    // Token should be available since we require auth
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only producers can request refunds
    if (token.role !== 'producer') {
      return NextResponse.json({ 
        error: 'Only producers can request project escrow refunds' 
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { project_id } = body;

    if (!project_id) {
      return NextResponse.json({ 
        error: 'Project ID is required' 
      }, { status: 400 });
    }

    // Get project and check ownership
    const project = await Project.findOne({ id: project_id });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Ensure the requester is the project owner
    if (project.producer_id !== token.id) {
      return NextResponse.json({ 
        error: 'You can only request refunds for your own projects' 
      }, { status: 403 });
    }

    // Check if project is eligible for refund
    // Projects can only be refunded if they are in specific states and have escrow funded
    if (!project.escrow_funded) {
      return NextResponse.json({ 
        error: 'Project escrow is not funded' 
      }, { status: 400 });
    }

    // Check project status - typically only projects that are not in 'completed' state can be refunded
    if (project.status === 'completed') {
      return NextResponse.json({ 
        error: 'Completed projects cannot be refunded' 
      }, { status: 400 });
    }

    // Check if there are any approved submissions
    const hasApprovedSubmissions = await checkForApprovedSubmissions(project_id);
    if (hasApprovedSubmissions) {
      return NextResponse.json({ 
        error: 'Projects with approved submissions cannot be refunded' 
      }, { status: 400 });
    }

    // Process the refund via blockchain
    try {
      if (!token.address || typeof token.address !== 'string') {
        return NextResponse.json({ 
          error: 'Invalid wallet address' 
        }, { status: 400 });
      }
      
      const refundResult = await refundProducer(
        project.id,
        token.address
      );

      if (!refundResult.success) {
        return NextResponse.json({
          error: 'Failed to refund project escrow',
          details: refundResult.error
        }, { status: 500 });
      }

      // Update project in database
      project.escrow_funded = false;
      project.refund_transaction_hash = refundResult.transactionHash;
      project.status = 'cancelled'; // Update status to reflect cancellation
      await project.save();

      // Create transaction record
      const transaction = new Transaction({
        id: `tx_${uuidv4()}`,
        submission_id: null,
        transaction_hash: refundResult.transactionHash,
        amount: refundResult.refundAmount || project.budget,
        status: 'completed',
        created_at: new Date(),
        platform_fee_amount: '0', // No platform fee for refunds
        gas_fee_amount: '0', // Gas fees are handled by platform wallet
        recipient_address: token.address,
        sender_address: project.contract_address || '',
        transaction_type: 'escrow_refund'
      });

      await transaction.save();

      return NextResponse.json({
        message: 'Project escrow refunded successfully',
        project: {
          id: project.id,
          escrow_funded: project.escrow_funded,
          status: project.status,
          refund_transaction_hash: project.refund_transaction_hash
        },
        transaction: {
          id: transaction.id,
          transaction_hash: transaction.transaction_hash,
          amount: transaction.amount,
          status: transaction.status
        }
      }, { status: 200 });
    } catch (error) {
      console.error('Error refunding project escrow:', error);
      return NextResponse.json({ 
        error: 'Failed to refund project escrow' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in escrow refund endpoint:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * Helper function to check if a project has any approved submissions
 */
async function checkForApprovedSubmissions(projectId: string): Promise<boolean> {
  try {
    // Import the Submission model dynamically to avoid circular dependencies
    const { default: Submission } = await import('@/models/Submission');
    
    // Count submissions with approved status for this project
    const count = await Submission.countDocuments({
      project_id: projectId,
      status: 'approved'
    });
    
    return count > 0;
  } catch (error) {
    console.error('Error checking for approved submissions:', error);
    // If there's an error, we assume there are approved submissions as a safety measure
    return true;
  }
}

// Apply API middleware
export const POST = withApiMiddleware(refundProjectEscrow, {
  requireAuth: true,
  requireRoles: ['producer'],
  connectDb: true,
  rateLimitType: 'blockchain'
}); 