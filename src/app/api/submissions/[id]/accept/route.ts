import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Submission, Script, Project, Transaction, User } from '@/models';
import { getToken } from 'next-auth/jwt';
import { v4 as uuidv4 } from 'uuid';
import { releasePayment, mintScriptNFT } from '@/lib/blockchain';

// Utility function to extract submission ID from URL
function getSubmissionIdFromUrl(url: string): string {
  const pathParts = url.split('/');
  const submissionsIndex = pathParts.indexOf('submissions');
  return submissionsIndex >= 0 ? pathParts[submissionsIndex + 1] : '';
}

// POST /api/submissions/[id]/accept - Accept a submission
export async function POST(request: NextRequest) {
  try {
    // Extract submission ID from URL
    const submissionId = getSubmissionIdFromUrl(request.url);

    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only producers can accept submissions
    if (token.role !== 'producer') {
      return NextResponse.json({ 
        error: 'Only producers can accept submissions' 
      }, { status: 403 });
    }

    // Connect to the database
    await connectToDatabase();

    // Find submission
    const submission = await Submission.findOne({ id: submissionId });
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Get project and check ownership
    const project = await Project.findOne({ id: submission.project_id });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.producer_id !== token.id) {
      return NextResponse.json({ 
        error: 'You can only accept submissions for your own projects' 
      }, { status: 403 });
    }

    // Check if project escrow is funded
    if (!project.escrow_funded) {
      return NextResponse.json({ 
        error: 'Project escrow must be funded before accepting submissions' 
      }, { status: 400 });
    }

    // Check if submission is already accepted
    if (submission.status === 'accepted' || submission.is_purchased) {
      return NextResponse.json({ 
        error: 'Submission is already accepted' 
      }, { status: 400 });
    }

    // Get script and writer information
    const script = await Script.findOne({ id: submission.script_id });
    if (!script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    const writer = await User.findOne({ id: submission.writer_id });
    if (!writer) {
      return NextResponse.json({ error: 'Writer not found' }, { status: 404 });
    }

    // Check if NFT is minted, if not, mint it
    let nftTokenId = submission.nft_token_id;
    if (!submission.nft_minted || !nftTokenId) {
      try {
        const mintResult = await mintScriptNFT(
          writer.address,
          script.script_hash,
          submission.id
        );

        if (!mintResult.success) {
          return NextResponse.json({ 
            error: 'Failed to mint NFT for script',
            details: mintResult.error
          }, { status: 500 });
        }

        nftTokenId = mintResult.tokenId;
        
        // Update submission with NFT information
        submission.nft_minted = true;
        submission.nft_token_id = nftTokenId;
        await submission.save();
      } catch (error) {
        console.error('Error minting NFT:', error);
        return NextResponse.json({ 
          error: 'Failed to mint NFT' 
        }, { status: 500 });
      }
    }

    // Process payment and transfer NFT
    try {
      const paymentResult = await releasePayment(
        submission.id,
        writer.address,
        token.address,
        nftTokenId as string
      );

      if (!paymentResult.success) {
        return NextResponse.json({ 
          error: 'Failed to process payment',
          details: paymentResult.error
        }, { status: 500 });
      }

      // Calculate platform fee (3%)
      const submissionPrice = parseFloat(submission.price);
      const platformFee = (submissionPrice * 0.03).toFixed(6);
      const writerPayment = (submissionPrice - parseFloat(platformFee)).toFixed(6);

      // Update submission status
      submission.status = 'accepted';
      submission.is_purchased = true;
      submission.nft_transfer_transaction = paymentResult.nftTransactionHash;
      await submission.save();

      // Update script status
      script.status = 'sold';
      script.nft_token_id = nftTokenId;
      await script.save();

      // Create transaction record
      const transaction = new Transaction({
        id: `tx_${uuidv4()}`,
        submission_id: submission.id,
        transaction_hash: paymentResult.paymentTransactionHash,
        amount: submission.price,
        status: 'completed',
        created_at: new Date(),
        platform_fee_amount: platformFee,
        gas_fee_amount: '0', // Gas fees are handled by platform wallet
        recipient_address: writer.address,
        sender_address: token.address,
        transaction_type: 'script_purchase'
      });

      await transaction.save();

      return NextResponse.json({
        message: 'Submission accepted and payment processed successfully',
        submission: {
          id: submission.id,
          status: submission.status,
          is_purchased: submission.is_purchased,
          nft_token_id: submission.nft_token_id,
          nft_transfer_transaction: submission.nft_transfer_transaction
        },
        transaction: {
          id: transaction.id,
          transaction_hash: transaction.transaction_hash,
          amount: transaction.amount,
          platform_fee_amount: transaction.platform_fee_amount,
          recipient_address: transaction.recipient_address
        }
      }, { status: 200 });
    } catch (error) {
      console.error('Error processing payment:', error);
      return NextResponse.json({ 
        error: 'Failed to process payment' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error accepting submission:', error);
    return NextResponse.json({ 
      error: 'Failed to accept submission' 
    }, { status: 500 });
  }
} 