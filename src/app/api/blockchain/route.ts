import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Project, Submission, Transaction, User } from '@/models';
import { getToken } from 'next-auth/jwt';
import { v4 as uuidv4 } from 'uuid';

// POST /api/blockchain/verify-transaction - Verify a blockchain transaction
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

    // Parse request body
    const body = await request.json();
    const { 
      transaction_hash, 
      transaction_type, 
      project_id, 
      submission_id,
      amount,
      metadata
    } = body;

    if (!transaction_hash || !transaction_type) {
      return NextResponse.json({ 
        error: 'Transaction hash and type are required' 
      }, { status: 400 });
    }

    // Validate transaction type
    const validTypes = ['project_funding', 'script_purchase', 'nft_minting'];
    if (!validTypes.includes(transaction_type)) {
      return NextResponse.json({ 
        error: `Invalid transaction type. Must be one of: ${validTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Check if transaction already exists
    const existingTransaction = await Transaction.findOne({ transaction_hash });
    if (existingTransaction) {
      return NextResponse.json({ 
        error: 'Transaction already processed',
        transaction: existingTransaction
      }, { status: 400 });
    }

    // Validate transaction based on type
    let projectData = null;
    let submissionData = null;
    let userData = null;

    switch (transaction_type) {
      case 'project_funding':
        // Validate project exists
        if (!project_id) {
          return NextResponse.json({ error: 'Project ID is required for project funding' }, { status: 400 });
        }
        
        projectData = await Project.findOne({ id: project_id });
        if (!projectData) {
          return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        
        // Only producers can fund their own projects
        if (token.role !== 'producer' || projectData.producer_id !== token.id) {
          return NextResponse.json({ error: 'Only the project owner can fund this project' }, { status: 403 });
        }
        
        // Update project funding status
        projectData.is_funded = true;
        projectData.funding_amount = amount || 0;
        projectData.updated_at = new Date();
        await projectData.save();
        break;
        
      case 'script_purchase':
        // Validate submission exists
        if (!submission_id || !project_id) {
          return NextResponse.json({ 
            error: 'Project ID and Submission ID are required for script purchase' 
          }, { status: 400 });
        }
        
        projectData = await Project.findOne({ id: project_id });
        if (!projectData) {
          return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        
        submissionData = await Submission.findOne({ 
          id: submission_id,
          project_id: project_id
        });
        
        if (!submissionData) {
          return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }
        
        // Only producers can purchase scripts for their own projects
        if (token.role !== 'producer' || projectData.producer_id !== token.id) {
          return NextResponse.json({ error: 'Only the project owner can purchase this script' }, { status: 403 });
        }
        
        // Update submission status
        submissionData.status = 'approved';
        submissionData.is_purchased = true;
        submissionData.purchase_amount = amount || 0;
        submissionData.updated_at = new Date();
        await submissionData.save();
        
        // Get writer data for the transaction record
        userData = await User.findOne({ id: submissionData.writer_id });
        break;
        
      case 'nft_minting':
        // Validate submission exists and is purchased
        if (!submission_id || !project_id) {
          return NextResponse.json({ 
            error: 'Project ID and Submission ID are required for NFT minting' 
          }, { status: 400 });
        }
        
        projectData = await Project.findOne({ id: project_id });
        if (!projectData) {
          return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        
        submissionData = await Submission.findOne({ 
          id: submission_id,
          project_id: project_id
        });
        
        if (!submissionData) {
          return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }
        
        // Check if submission is purchased
        if (!submissionData.is_purchased) {
          return NextResponse.json({ 
            error: 'Script must be purchased before minting an NFT' 
          }, { status: 400 });
        }
        
        // Only producers can mint NFTs for their purchased scripts
        if (token.role !== 'producer' || projectData.producer_id !== token.id) {
          return NextResponse.json({ error: 'Only the project owner can mint an NFT for this script' }, { status: 403 });
        }
        
        // Update submission with NFT data
        submissionData.nft_minted = true;
        submissionData.nft_token_id = metadata?.token_id;
        submissionData.nft_metadata = metadata;
        submissionData.updated_at = new Date();
        await submissionData.save();
        
        // Get writer data for the transaction record
        userData = await User.findOne({ id: submissionData.writer_id });
        break;
    }

    // Create transaction record
    const transaction = new Transaction({
      id: uuidv4(),
      transaction_hash,
      transaction_type,
      user_id: token.id,
      project_id: project_id || null,
      submission_id: submission_id || null,
      recipient_id: userData?.id || null,
      amount: amount || 0,
      metadata: metadata || {},
      status: 'verified',
      created_at: new Date()
    });

    await transaction.save();

    return NextResponse.json({
      message: 'Transaction verified successfully',
      transaction
    }, { status: 201 });
  } catch (error) {
    console.error('Error verifying blockchain transaction:', error);
    return NextResponse.json({ error: 'Failed to verify transaction' }, { status: 500 });
  }
}

// GET /api/blockchain/transactions - Get user's transactions
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    const type = searchParams.get('type');
    
    // Build query
    let query: any = {};
    
    // Filter by user (either as sender or recipient)
    query.$or = [
      { user_id: token.id },
      { recipient_id: token.id }
    ];
    
    // Filter by transaction type if provided
    if (type) {
      query.transaction_type = type;
    }
    
    // Count total transactions for pagination
    const total = await Transaction.countDocuments(query);
    
    // Get transactions with pagination
    const transactions = await Transaction.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');
    
    return NextResponse.json({
      transactions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching blockchain transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
} 