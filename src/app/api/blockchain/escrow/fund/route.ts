import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Project, Transaction } from '@/models';
import { getToken } from 'next-auth/jwt';
import { v4 as uuidv4 } from 'uuid';
import { fundProjectEscrow } from '@/lib/blockchain';

// POST /api/blockchain/escrow/fund - Fund escrow for a project
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only producers can fund escrow
    if (token.role !== 'producer') {
      return NextResponse.json({ 
        error: 'Only producers can fund project escrow' 
      }, { status: 403 });
    }

    // Connect to the database
    await connectToDatabase();

    // Parse request body
    const body = await request.json();
    const { project_id, amount } = body;

    if (!project_id || !amount) {
      return NextResponse.json({ 
        error: 'Project ID and amount are required' 
      }, { status: 400 });
    }

    // Get project and check ownership
    const project = await Project.findOne({ id: project_id });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.producer_id !== token.id) {
      return NextResponse.json({ 
        error: 'You can only fund your own projects' 
      }, { status: 403 });
    }

    // Check if project is already funded
    if (project.escrow_funded) {
      return NextResponse.json({ 
        error: 'Project escrow is already funded' 
      }, { status: 400 });
    }

    // Check if amount matches project budget
    if (parseFloat(amount) !== parseFloat(project.budget)) {
      return NextResponse.json({ 
        error: `Funding amount must match project budget of ${project.budget}` 
      }, { status: 400 });
    }

    // Fund project escrow
    try {
      if (!token.address || typeof token.address !== 'string') {
        return NextResponse.json({ 
          error: 'Invalid wallet address' 
        }, { status: 400 });
      }
      
      const fundResult = await fundProjectEscrow(
        token.address,
        project.id,
        amount
      );

      if (!fundResult.success) {
        return NextResponse.json({
          error: 'Failed to fund project escrow',
          details: fundResult.error
        }, { status: 500 });
      }

      // Update project in database
      project.escrow_funded = true;
      project.escrow_transaction_hash = fundResult.transactionHash;
      await project.save();

      // Create transaction record
      const transaction = new Transaction({
        id: `tx_${uuidv4()}`,
        submission_id: null, // No submission associated yet
        transaction_hash: fundResult.transactionHash,
        amount: amount,
        status: 'completed',
        created_at: new Date(),
        platform_fee_amount: '0', // No platform fee for escrow funding
        gas_fee_amount: fundResult.gasFee || '0',
        recipient_address: project.contract_address,
        sender_address: token.address,
        transaction_type: 'escrow_funding'
      });

      await transaction.save();

      return NextResponse.json({
        message: 'Project escrow funded successfully',
        project: {
          id: project.id,
          escrow_funded: project.escrow_funded,
          escrow_transaction_hash: project.escrow_transaction_hash
        },
        transaction: {
          id: transaction.id,
          transaction_hash: transaction.transaction_hash,
          amount: transaction.amount,
          status: transaction.status
        }
      }, { status: 200 });
    } catch (error) {
      console.error('Error funding project escrow:', error);
      return NextResponse.json({ 
        error: 'Failed to fund project escrow' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in escrow funding endpoint:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 