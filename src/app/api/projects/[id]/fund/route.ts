import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Project, Transaction } from '@/models';
import { getToken } from 'next-auth/jwt';
import { v4 as uuidv4 } from 'uuid';
import { fundProjectEscrow } from '@/lib/blockchain';

// POST /api/projects/[id]/fund - Fund a project
export async function POST(
  request: NextRequest,
) {
  try {
    // Extract the id from the URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.indexOf('projects') + 1];

    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get wallet address from headers or cookies
    const walletAddress = request.headers.get('x-wallet-address') || request.cookies.get('walletAddress')?.value;
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address not found' }, { status: 400 });
    }

    // Only producers can fund projects
    if (token.role !== 'producer') {
      return NextResponse.json({
        error: 'Only producers can fund projects'
      }, { status: 403 });
    }

    // Connect to the database
    await connectToDatabase();

    // Get project
    const project = await Project.findOne({ id });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user is the project owner
    if (project.producer_id !== token.id) {
      return NextResponse.json({
        error: 'You can only fund your own projects'
      }, { status: 403 });
    }

    // Check if project is already funded
    if (project.is_funded) {
      return NextResponse.json({
        error: 'Project is already funded'
      }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { amount } = body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({
        error: 'Valid funding amount is required'
      }, { status: 400 });
    }

    // Call blockchain function to fund project escrow
    try {
      if (!token.address) {
        return NextResponse.json({
          error: 'User wallet address not found'
        }, { status: 400 });
      }

      const fundingResult = await fundProjectEscrow(
        walletAddress,
        id,
        amount.toString()
      );

      if (!fundingResult.success) {
        return NextResponse.json({
          error: 'Failed to fund project on blockchain',
          message: fundingResult.error
        }, { status: 500 });
      }

      // Update project status
      project.is_funded = true;
      project.funding_amount = Number(amount);
      project.updated_at = new Date();
      project.blockchain_data = {
        transaction_hash: fundingResult.transactionHash
      };
      await project.save();

      // Create transaction record
      const transaction = new Transaction({
        id: uuidv4(),
        transaction_hash: fundingResult.transactionHash,
        transaction_type: 'project_funding',
        user_id: token.id,
        project_id: id,
        amount: Number(amount),
        status: 'verified',
        created_at: new Date(),
        metadata: {}
      });
      await transaction.save();

      return NextResponse.json({
        message: 'Project funded successfully',
        funding_data: {
          transaction_hash: fundingResult.transactionHash,
          amount
        }
      }, { status: 200 });
    } catch (error: any) {
      return NextResponse.json({
        error: 'Failed to fund project',
        message: error.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error(`Error funding project:`, error);
    return NextResponse.json({ error: 'Failed to fund project' }, { status: 500 });
  }
}