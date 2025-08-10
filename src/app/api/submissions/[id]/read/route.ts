import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Submission from '@/models/Submission';
import User from '@/models/User';
import crypto from 'crypto';

// POST /api/submissions/[id]/read - Mark a submission as read by a producer
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: submissionId } = await params; // Await the params Promise
    const walletAddress = request.headers.get('x-wallet-address');
    if (!walletAddress) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Wallet address required' }, { status: 401 });
    }
    const normalizedWallet = walletAddress.toLowerCase();

    await connectToDatabase();

    const user = await User.findOne({ address: normalizedWallet });
    if (!user || user.role !== 'producer') {
      return NextResponse.json({ error: 'Forbidden', message: 'User not authorized as producer' }, { status: 403 });
    }

    const submission = await Submission.findOne({ id: submissionId });
    if (!submission) {
      return NextResponse.json({ error: 'Not Found', message: 'Submission not found' }, { status: 404 });
    }

    // Check if producer already marked as read
    const alreadyRead = submission.readByProducers?.some(
      (entry: { producer_id: string }) => entry.producer_id === user.id
    );

    if (alreadyRead) {
      return NextResponse.json({ message: 'Already marked as read' }, { status: 200 });
    }

    // Generate a hash for this read event
    const hashInput = submissionId + user.id + Date.now().toString();
    const readHash = crypto.createHash('sha256').update(hashInput).digest('hex');

    // Add read entry
    submission.readByProducers = submission.readByProducers || [];
    submission.readByProducers.push({
      producer_id: user.id,
      read_at: new Date(),
      read_hash: readHash
    });

    await submission.save();

    return NextResponse.json({ message: 'Marked as read', read_hash: readHash }, { status: 200 });
  } catch (error) {
    console.error('Error marking submission as read:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}