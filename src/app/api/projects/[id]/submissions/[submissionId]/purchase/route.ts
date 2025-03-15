import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Project, Submission, Transaction, User } from '@/models';
import { getToken } from 'next-auth/jwt';
import { v4 as uuidv4 } from 'uuid';
import { releasePayment } from '@/lib/blockchain';
import { withApiMiddleware, validateRequestBody } from '@/lib/api-middleware';

// POST /api/projects/[id]/submissions/[submissionId]/purchase - Purchase a submission
export const POST = withApiMiddleware(async (
  request: NextRequest,
  { params, token }
) => {
  // Get project
  const project = await Project.findOne({ id: params.id });
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Check if user is the project owner
  if (project.producer_id !== token.id) {
    return NextResponse.json({ 
      error: 'You can only purchase scripts for your own projects' 
    }, { status: 403 });
  }

  // Check if project is funded
  if (!project.is_funded) {
    return NextResponse.json({ 
      error: 'Project must be funded before purchasing scripts' 
    }, { status: 400 });
  }

  // Get submission
  const submission = await Submission.findOne({ 
    id: params.submissionId,
    project_id: params.id
  });

  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  // Check if submission is approved
  if (submission.status !== 'approved') {
    return NextResponse.json({ 
      error: 'You can only purchase approved submissions' 
    }, { status: 400 });
  }

  // Check if submission is already purchased
  if (submission.is_purchased) {
    return NextResponse.json({ 
      error: 'Submission has already been purchased' 
    }, { status: 400 });
  }

  // Get writer info
  const writer = await User.findOne({ id: submission.writer_id });
  if (!writer) {
    return NextResponse.json({ error: 'Writer not found' }, { status: 404 });
  }

  // Parse request body
  const body = await request.json();
  
  // Validate required fields
  const validation = validateRequestBody(body, ['amount']);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  
  const { amount } = body;

  if (isNaN(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json({ 
      error: 'Valid purchase amount is required' 
    }, { status: 400 });
  }

  // Ensure we're working with strings for blockchain function
  if (!token.address || typeof token.address !== 'string') {
    return NextResponse.json({ 
      error: 'Invalid wallet address' 
    }, { status: 400 });
  }

  if (!writer.address || typeof writer.address !== 'string') {
    return NextResponse.json({ 
      error: 'Writer has no valid wallet address' 
    }, { status: 400 });
  }

  const submissionIdStr = typeof submission.id === 'string' ? submission.id : String(submission.id);
  
  // Call blockchain function to process payment
  try {
    const paymentResult = await releasePayment(
      submissionIdStr,
      writer.address,
      token.address,
      '' // No NFT yet
    );

    if (!paymentResult.success) {
      return NextResponse.json({ 
        error: 'Failed to process payment on blockchain', 
        message: paymentResult.error 
      }, { status: 500 });
    }

    // Update submission status
    submission.is_purchased = true;
    submission.purchase_amount = Number(amount);
    submission.updated_at = new Date();
    await submission.save();

    // Create transaction record
    const transaction = new Transaction({
      id: uuidv4(),
      transaction_hash: paymentResult.paymentTransactionHash,
      transaction_type: 'script_purchase',
      user_id: token.id,
      project_id: params.id,
      submission_id: params.submissionId,
      recipient_id: submission.writer_id,
      amount: Number(amount),
      status: 'verified',
      created_at: new Date(),
      metadata: {}
    });
    await transaction.save();

    return NextResponse.json({
      message: 'Script purchased successfully',
      purchase_data: {
        transaction_hash: paymentResult.paymentTransactionHash,
        amount,
        writer_id: submission.writer_id
      }
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to purchase script', 
      message: error.message 
    }, { status: 500 });
  }
}, {
  requireAuth: true,
  requireRoles: ['producer'],
  connectDb: true
}); 