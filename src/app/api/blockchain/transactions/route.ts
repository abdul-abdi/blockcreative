import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import connectToDatabase from '@/lib/mongodb';
import { Transaction, Submission, Script, User } from '@/models';
import { ethers } from 'ethers';

// Load contract ABIs
import ScriptNFTABI from '@/contracts/ScriptNFT.json';
import EscrowManagerABI from '@/contracts/EscrowManager.json';

// Constants from environment variables
const SCRIPT_NFT_ADDRESS = process.env.SCRIPT_NFT_ADDRESS;
const ESCROW_MANAGER_ADDRESS = process.env.ESCROW_MANAGER_ADDRESS;
const LISK_RPC_URL = process.env.LISK_RPC_URL;
const LISK_PRIVATE_KEY = process.env.LISK_PRIVATE_KEY;
const PLATFORM_FEE_PERCENTAGE = parseInt(process.env.PLATFORM_FEE_PERCENTAGE || '3');

// GET /api/blockchain/transactions - Get transactions for the authenticated user
export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    await connectToDatabase();
    
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // Find transactions for the user
    const userAddress = user.address;
    const query = {
      $or: [
        { recipient_address: userAddress },
        { sender_address: userAddress }
      ]
    };
    
    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);
    
    return NextResponse.json({
      transactions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}, {});

// POST /api/blockchain/transactions - Create a new blockchain transaction
export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { transaction_type, submission_id, amount } = await req.json();
    
    if (!transaction_type || !submission_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Find the submission
    const submission = await Submission.findById(submission_id);
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }
    
    // Find the script
    const script = await Script.findById(submission.script_id);
    if (!script) {
      return NextResponse.json(
        { error: 'Script not found' },
        { status: 404 }
      );
    }
    
    // Find the script writer
    const writer = await User.findById(script.writer_id);
    if (!writer) {
      return NextResponse.json(
        { error: 'Writer not found' },
        { status: 404 }
      );
    }
    
    // Initialize blockchain provider and wallet
    if (!LISK_RPC_URL || !LISK_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Blockchain configuration not found' },
        { status: 500 }
      );
    }
    
    const provider = new ethers.JsonRpcProvider(LISK_RPC_URL);
    const platformWallet = new ethers.Wallet(LISK_PRIVATE_KEY, provider);
    
    let transactionHash = '';
    
    // Handle different transaction types
    switch (transaction_type) {
      case 'script_purchase': {
        // Check if user is the producer
        if (user.role !== 'producer') {
          return NextResponse.json(
            { error: 'Only producers can purchase scripts' },
            { status: 403 }
          );
        }
        
        // Check if contracts are deployed
        if (!SCRIPT_NFT_ADDRESS || !ESCROW_MANAGER_ADDRESS) {
          return NextResponse.json(
            { error: 'Smart contracts not deployed' },
            { status: 500 }
          );
        }
        
        // Calculate platform fee
        const platformFee = (amount * PLATFORM_FEE_PERCENTAGE) / 100;
        const writerAmount = amount - platformFee;
        
        // Initialize contracts
        const escrowManagerContract = new ethers.Contract(
          ESCROW_MANAGER_ADDRESS,
          EscrowManagerABI.abi,
          platformWallet
        );
        
        // Call escrow contract to release payment and transfer NFT
        const tx = await escrowManagerContract.releasePayment(
          submission_id,
          writer.address,
          user.address,
          ethers.parseEther(writerAmount.toString()),
          ethers.parseEther(platformFee.toString())
        );
        
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        transactionHash = receipt.hash;
        
        // Update submission status
        submission.status = 'accepted';
        await submission.save();
        
        // Update script status
        script.status = 'sold';
        script.owner = user.id;
        await script.save();
        
        break;
      }
      
      case 'nft_minting': {
        // Check if user is the writer
        if (user.role !== 'writer') {
          return NextResponse.json(
            { error: 'Only writers can mint script NFTs' },
            { status: 403 }
          );
        }
        
        // Check if contract is deployed
        if (!SCRIPT_NFT_ADDRESS) {
          return NextResponse.json(
            { error: 'ScriptNFT contract not deployed' },
            { status: 500 }
          );
        }
        
        // Initialize NFT contract
        const scriptNFTContract = new ethers.Contract(
          SCRIPT_NFT_ADDRESS,
          ScriptNFTABI.abi,
          platformWallet
        );
        
        // Generate script hash
        const scriptHash = ethers.keccak256(
          ethers.toUtf8Bytes(script.title + script.content)
        );
        
        // Mint NFT
        const tx = await scriptNFTContract.mintScriptNFT(
          writer.address,
          scriptHash,
          submission_id
        );
        
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        transactionHash = receipt.hash;
        
        // Update script with NFT details
        script.nft_token_id = receipt.logs[0].topics[1]; // Assuming the token ID is in the first log
        script.nft_contract_address = SCRIPT_NFT_ADDRESS;
        script.status = 'minted';
        await script.save();
        
        break;
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid transaction type' },
          { status: 400 }
        );
    }
    
    // Create transaction record
    const transaction = new Transaction({
      submission_id,
      transaction_hash: transactionHash,
      amount,
      status: 'completed',
      created_at: new Date(),
      platform_fee_amount: (amount * PLATFORM_FEE_PERCENTAGE) / 100,
      gas_fee_amount: 0, // Gas fees are handled by platform
      recipient_address: writer.address,
      sender_address: user.address,
      transaction_type
    });
    
    await transaction.save();
    
    return NextResponse.json({
      message: 'Transaction completed successfully',
      transaction_hash: transactionHash,
      transaction
    });
  } catch (error) {
    console.error('Error processing transaction:', error);
    return NextResponse.json(
      { error: 'Failed to process transaction' },
      { status: 500 }
    );
  }
}, {}); 