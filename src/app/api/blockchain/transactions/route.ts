import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api-middleware';
import connectToDatabase from '@/lib/mongodb';
import { Transaction, Submission, Script, User } from '@/models';
import { IUser } from '@/models/User';
import { ITransaction } from '@/models/Transaction';
// Import ethers properly
import { JsonRpcProvider, Wallet, Contract, keccak256, toUtf8Bytes, parseEther } from 'ethers';
// Import environment configuration
import { SERVER_ENV, ENV } from '@/lib/env-config';

// Load contract ABIs
import ScriptNFTABI from '@/contracts/ScriptNFT.json';
import EscrowManagerABI from '@/contracts/EscrowManager.json';

// Define transaction type
type TransactionType = 'script_purchase' | 'nft_minting';

// GET /api/blockchain/transactions - Get transactions for the authenticated user
export const GET = withApiMiddleware(async (req: NextRequest, { user }) => {
  try {
    await connectToDatabase();
    
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // Find transactions for the user
    const userAddress = user.address;
    if (!userAddress) {
      return NextResponse.json(
        { error: 'User address not found' },
        { status: 400 }
      );
    }

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
export const POST = withApiMiddleware(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const transaction_type = body.transaction_type as TransactionType;
    const submission_id = body.submission_id as string;
    const amount = body.amount as number;
    
    if (!transaction_type || !submission_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
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
    
    // Check blockchain configuration
    if (!SERVER_ENV.LISK_RPC_URL || !SERVER_ENV.LISK_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Blockchain configuration not found' },
        { status: 500 }
      );
    }
    
    // Initialize blockchain provider and wallet
    let provider: JsonRpcProvider;
    let platformWallet: Wallet;
    
    try {
      provider = new JsonRpcProvider(SERVER_ENV.LISK_RPC_URL);
      platformWallet = new Wallet(SERVER_ENV.LISK_PRIVATE_KEY, provider);
    } catch (error) {
      console.error('Error initializing blockchain connection:', error);
      return NextResponse.json(
        { error: 'Failed to connect to blockchain' },
        { status: 500 }
      );
    }
    
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
        if (!SERVER_ENV.SCRIPT_NFT_ADDRESS || !SERVER_ENV.ESCROW_MANAGER_ADDRESS) {
          return NextResponse.json(
            { error: 'Smart contracts not deployed' },
            { status: 500 }
          );
        }
        
        // Calculate platform fee
        const platformFee = (amount * ENV.PLATFORM_FEE_PERCENTAGE) / 100;
        const writerAmount = amount - platformFee;
        
        try {
          // Initialize contracts
          const escrowManagerContract = new Contract(
            SERVER_ENV.ESCROW_MANAGER_ADDRESS,
            EscrowManagerABI.abi,
            platformWallet
          );
          
          // Call escrow contract to release payment and transfer NFT
          const tx = await escrowManagerContract.releasePayment(
            submission_id,
            writer.address,
            user.address,
            parseEther(writerAmount.toString()),
            parseEther(platformFee.toString())
          );
          
          // Wait for transaction to be mined
          const receipt = await tx.wait();
          if (!receipt || !receipt.hash) {
            throw new Error('Transaction failed or receipt not available');
          }
          
          transactionHash = receipt.hash;
          
          // Update submission status
          submission.status = 'accepted';
          await submission.save();
          
          // Update script status
          script.status = 'sold';
          script.owner = user.id;
          await script.save();
        } catch (error) {
          console.error('Blockchain transaction error:', error);
          return NextResponse.json(
            { error: 'Blockchain transaction failed' },
            { status: 500 }
          );
        }
        
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
        if (!SERVER_ENV.SCRIPT_NFT_ADDRESS) {
          return NextResponse.json(
            { error: 'ScriptNFT contract not deployed' },
            { status: 500 }
          );
        }
        
        try {
          // Initialize NFT contract
          const scriptNFTContract = new Contract(
            SERVER_ENV.SCRIPT_NFT_ADDRESS,
            ScriptNFTABI.abi,
            platformWallet
          );
          
          // Generate script hash
          const scriptHash = keccak256(
            toUtf8Bytes(script.title + script.content)
          );
          
          // Mint NFT
          const tx = await scriptNFTContract.mintScriptNFT(
            writer.address,
            scriptHash,
            submission_id
          );
          
          // Wait for transaction to be mined
          const receipt = await tx.wait();
          if (!receipt || !receipt.hash) {
            throw new Error('Transaction failed or receipt not available');
          }
          
          transactionHash = receipt.hash;
          
          // Find token ID in transaction logs
          let tokenId = null;
          for (const log of receipt.logs) {
            try {
              // Try to parse the log and check if it contains token ID
              const parsed = scriptNFTContract.interface.parseLog(log);
              if (parsed && parsed.name === 'Transfer' && parsed.args.length >= 3) {
                tokenId = parsed.args[2]; // Token ID is typically the third argument in Transfer events
                break;
              }
            } catch (e) {
              // Skip logs that can't be parsed
              continue;
            }
          }
          
          if (!tokenId) {
            console.warn('Token ID not found in transaction logs');
          }
          
          // Update script with NFT details
          script.nft_token_id = tokenId || 'unknown';
          script.nft_contract_address = SERVER_ENV.SCRIPT_NFT_ADDRESS;
          script.status = 'minted';
          await script.save();
        } catch (error) {
          console.error('NFT minting error:', error);
          return NextResponse.json(
            { error: 'NFT minting failed' },
            { status: 500 }
          );
        }
        
        break;
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid transaction type' },
          { status: 400 }
        );
    }
    
    if (!transactionHash) {
      return NextResponse.json(
        { error: 'Transaction hash not generated' },
        { status: 500 }
      );
    }
    
    try {
      // Create transaction record
      const transaction = new Transaction({
        id: `txn_${Date.now()}`, // Generate unique ID
        submission_id,
        transaction_hash: transactionHash,
        transaction_type,
        user_id: user.id,
        amount,
        status: 'verified',
        created_at: new Date(),
        platform_fee_amount: (amount * ENV.PLATFORM_FEE_PERCENTAGE) / 100,
        gas_fee_amount: 0, // Gas fees are handled by platform
        recipient_address: writer.address,
        sender_address: user.address,
      });
      
      await transaction.save();
      
      return NextResponse.json({
        message: 'Transaction completed successfully',
        transaction_hash: transactionHash,
        transaction
      });
    } catch (error) {
      console.error('Error saving transaction record:', error);
      return NextResponse.json(
        { 
          error: 'Transaction processed but failed to save record',
          transaction_hash: transactionHash 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing transaction:', error);
    return NextResponse.json(
      { error: 'Failed to process transaction' },
      { status: 500 }
    );
  }
}, {}); 