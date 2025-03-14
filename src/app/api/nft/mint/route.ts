import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Project, Submission, Transaction } from '@/models';
import { getToken } from 'next-auth/jwt';
import { v4 as uuidv4 } from 'uuid';
import { mintScriptNFT } from '@/lib/blockchain';
import crypto from 'crypto';

// POST /api/nft/mint - Mint an NFT for a purchased script
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only producers can mint NFTs
    if (token.role !== 'producer') {
      return NextResponse.json({ 
        error: 'Only producers can mint NFTs' 
      }, { status: 403 });
    }

    // Connect to the database
    await connectToDatabase();

    // Parse request body
    const body = await request.json();
    const { 
      submission_id, 
      project_id,
      metadata
    } = body;

    if (!submission_id || !project_id) {
      return NextResponse.json({ 
        error: 'Submission ID and Project ID are required for minting' 
      }, { status: 400 });
    }

    // Get project and check ownership
    const project = await Project.findOne({ id: project_id });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.producer_id !== token.id) {
      return NextResponse.json({ 
        error: 'You can only mint NFTs for your own projects' 
      }, { status: 403 });
    }

    // Get submission
    const submission = await Submission.findOne({ 
      id: submission_id,
      project_id: project_id
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Check if submission is purchased
    if (!submission.is_purchased) {
      return NextResponse.json({ 
        error: 'You must purchase the script before minting an NFT' 
      }, { status: 400 });
    }

    // Check if NFT is already minted
    if (submission.nft_minted) {
      return NextResponse.json({ 
        error: 'NFT has already been minted for this submission',
        nft_token_id: submission.nft_token_id
      }, { status: 400 });
    }

    // Prepare metadata for NFT
    const nftMetadata = metadata || {
      name: submission.title,
      description: `NFT for script: ${submission.title}`,
      script_id: submission.id,
      project_id: project.id,
      writer_id: submission.writer_id,
      producer_id: project.producer_id,
      created_at: new Date().toISOString()
    };

    // Mint NFT
    try {
      if (!token.address || typeof token.address !== 'string') {
        return NextResponse.json({ 
          error: 'Invalid wallet address' 
        }, { status: 400 });
      }
      
      const mintResult = await mintScriptNFT(
        token.address,
        // Create a hash from the submission content
        "0x" + crypto.createHash('sha256').update(submission.content).digest('hex'),
        String(submission.id)
      );

      // Update submission with NFT data
      submission.nft_minted = true;
      submission.nft_token_id = mintResult.tokenId;
      submission.nft_metadata = {
        ...nftMetadata,
        token_id: mintResult.tokenId,
        transaction_hash: mintResult.transactionHash
      };
      await submission.save();

      // Create transaction record
      const transaction = new Transaction({
        id: uuidv4(),
        transaction_hash: mintResult.transactionHash,
        transaction_type: 'nft_minting',
        user_id: token.id,
        project_id: project_id,
        submission_id: submission_id,
        recipient_id: submission.writer_id,
        amount: 0, // No direct payment for minting
        status: 'verified',
        created_at: new Date(),
        metadata: {
          token_id: mintResult.tokenId,
          nft_metadata: nftMetadata
        }
      });
      await transaction.save();

      return NextResponse.json({
        message: 'NFT minted successfully',
        nft_data: {
          token_id: mintResult.tokenId,
          transaction_hash: mintResult.transactionHash,
          metadata: nftMetadata
        }
      }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ 
        error: 'Failed to mint NFT', 
        message: error.message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error minting NFT:', error);
    return NextResponse.json({ error: 'Failed to mint NFT' }, { status: 500 });
  }
} 