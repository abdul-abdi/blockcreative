import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Submission, Script, Project, User } from '@/models';
import { v4 as uuidv4 } from 'uuid';
import { analyzeScript } from '@/lib/ai';
import mongoose from 'mongoose';
import { uploadFileToIPFS } from '@/lib/ipfs';
import { mintScriptNFT } from '@/lib/blockchain';

// GET /api/submissions - Get all submissions or filtered list
export async function GET(request: NextRequest) {
  // Wrap everything in a try/catch to ensure we always return JSON
  try {
    // Check authentication via wallet address header
    const walletAddress = request.headers.get('x-wallet-address');
    
    console.log('GET /api/submissions - Checking authentication with wallet:', walletAddress);
    
    if (!walletAddress) {
      console.log('Error: No wallet address provided in headers');
      return NextResponse.json({ error: 'Unauthorized', message: 'No wallet address provided' }, { status: 401 });
    }

    // Normalize the wallet address
    const normalizedWalletAddress = walletAddress.toLowerCase();
    console.log('Normalized wallet address:', normalizedWalletAddress);

    // Connect to the database
    try {
      await connectToDatabase();
      console.log('Connected to database');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json({ 
        error: 'Database connection failed', 
        message: dbError instanceof Error ? dbError.message : 'Unknown error' 
      }, { status: 500 });
    }

    // Find user with wallet address
    let user;
    try {
      user = await User.findOne({ address: normalizedWalletAddress });
    } catch (userError) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ 
        error: 'Database query failed', 
        message: userError instanceof Error ? userError.message : 'Unknown error' 
      }, { status: 500 });
    }
    
    if (!user) {
      console.log('Error: User not found with wallet address:', normalizedWalletAddress);
      // Try to create a user on the fly for the writer role
      console.log('Creating temporary writer user for wallet:', normalizedWalletAddress);
      
      try {
        const newUser = new User({
          id: uuidv4(),
          address: normalizedWalletAddress,
          role: 'writer',
          profile_data: { name: 'New Writer' },
          onboarding_completed: true,
          onboarding_step: 3,
          created_at: new Date(),
          updated_at: new Date()
        });
        
        await newUser.save();
        console.log('Created new writer user with ID:', newUser.id);
        
        // Continue with the new user
        const result = await getSubmissionsForUser(request, newUser);
        return result;
      } catch (createError) {
        console.error('Failed to create user on the fly:', createError);
        return NextResponse.json({ 
          error: 'Unauthorized - User not found and auto-creation failed',
          details: createError instanceof Error ? createError.message : 'Unknown error' 
        }, { status: 401 });
      }
    }

    // If we have a valid user, get submissions
    console.log('User found:', user.id, 'with role:', user.role);
    return await getSubmissionsForUser(request, user);
    
  } catch (error) {
    console.error('Error in GET /api/submissions:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch submissions',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to get submissions for a user
async function getSubmissionsForUser(request: NextRequest, user: any) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const project_id = searchParams.get('project_id');
    const writer_id = searchParams.get('writer_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    
    // Filter by project ID if provided
    if (project_id) {
      console.log('Filtering by project_id:', project_id);
      filter.project_id = project_id;
      
      // If user is not the producer of this project, only show their own submissions
      if (user.role !== 'producer') {
        // Try to find the project using different ID fields
        let project;
        try {
          const projectQuery = { 
            $or: [
              { id: project_id },
              { projectId: project_id },
              { _id: mongoose.isValidObjectId(project_id) ? project_id : null }
            ]
          };
          console.log('Project query:', JSON.stringify(projectQuery));
          project = await Project.findOne(projectQuery);
          console.log('Project found:', project ? 'Yes' : 'No');
        } catch (projectError) {
          console.error('Error finding project:', projectError);
          // Default to user's submissions if project lookup fails
          filter.writer_id = user.id;
          console.log('Defaulting to writer_id filter due to project lookup error');
        }
        
        // If project not found or user is not the producer, only show user's submissions
        if (!project || 
            (project.producer_id !== user.id && 
             project.producer && project.producer.toString() !== user._id.toString() && 
             project.producer_address !== user.address.toLowerCase() &&
             project.producer_wallet !== user.address.toLowerCase())
          ) {
          filter.writer_id = user.id;
          console.log('User is not producer of this project, filtering by writer_id:', user.id);
        }
      }
    } else if (user.role === 'writer') {
      // Writers can only see their own submissions if not filtering by project
      console.log('Writer role detected, filtering submissions by writer_id:', user.id);
      filter.writer_id = user.id;
    } else if (user.role === 'producer') {
      // Producers can only see submissions to their projects if not filtering by project
      console.log('DEBUG: Finding producer projects for', user.id, 'with wallet address', user.address.toLowerCase());
      
      try {
        // Find all projects that might belong to this producer using multiple fields
        const producerProjects = await Project.find({
          $or: [
            { producer_id: user.id },
            { producer: user._id },
            { producer_address: user.address.toLowerCase() },
            { producer_wallet: user.address.toLowerCase() }
          ]
        }).select('id projectId _id title producer producer_id producer_address');
        
        console.log('DEBUG: Found producer projects:', producerProjects.length);
        
        if (producerProjects.length > 0) {
          console.log('DEBUG: First project details:', JSON.stringify(producerProjects[0], null, 2));
        }
        
        // Build an array of possible project IDs, including projectId and id
        const projectIds = [];
        
        for (const project of producerProjects) {
          if (project.id) projectIds.push(project.id);
          if (project.projectId && project.projectId !== project.id) projectIds.push(project.projectId);
          if (project._id) projectIds.push(project._id.toString());
        }
        
        console.log('DEBUG: Project IDs for submissions filter:', projectIds);
        
        if (projectIds.length > 0) {
          filter.project_id = { $in: projectIds };
        } else {
          // Try a secondary approach - search for any project created by this wallet address directly
          const walletAddress = user.address.toLowerCase();
          console.log('DEBUG: Trying secondary lookup by direct wallet:', walletAddress);
          
          const producerWalletProjects = await Project.find({
            $or: [
              { producer_address: walletAddress },
              { producer_wallet: walletAddress }
            ]
          }).select('id projectId _id');
          
          console.log('DEBUG: Direct wallet lookup found projects:', producerWalletProjects.length);
          
          if (producerWalletProjects.length > 0) {
            const walletProjectIds = [];
            for (const project of producerWalletProjects) {
              if (project.id) walletProjectIds.push(project.id);
              if (project.projectId && project.projectId !== project.id) walletProjectIds.push(project.projectId);
              if (project._id) walletProjectIds.push(project._id.toString());
            }
            filter.project_id = { $in: walletProjectIds };
          } else {
            // No projects found, return empty result
            console.log('DEBUG: No projects found for producer, returning empty submissions');
            return NextResponse.json({
              submissions: [],
              pagination: {
                total: 0,
                page,
                limit,
                pages: 0
              }
            }, { status: 200 });
          }
        }
      } catch (projectsError) {
        console.error('Error finding producer projects:', projectsError);
        // Return empty list on error to avoid failure
        return NextResponse.json({
          submissions: [],
          error: 'Failed to find producer projects',
          pagination: {
            total: 0,
            page,
            limit,
            pages: 0
          }
        }, { status: 200 });
      }
    }
    
    // Additional filters
    if (writer_id && (user.role === 'producer' || writer_id === user.id)) {
      filter.writer_id = writer_id;
    }
    
    if (status) {
      filter.status = status;
    }

    console.log('Final filter for submissions:', JSON.stringify(filter, null, 2));

    // Get submissions count for pagination
    const total = await Submission.countDocuments(filter);

    // Get filtered submissions with pagination and sorting
    const submissions = await Submission.find(filter)
      .select('-__v +readByProducers')
      .skip(skip)
      .limit(limit)
      .sort({ created_at: -1 });
      
    console.log(`Found ${submissions.length} submissions for user ${user.id}`);

    return NextResponse.json({
      submissions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error in getSubmissionsForUser:', error);
    // Return an empty response with error info rather than throwing
    return NextResponse.json({
      error: 'Failed to get submissions',
      message: error instanceof Error ? error.message : 'Unknown error',
      submissions: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 50,
        pages: 0
      }
    }, { status: 200 });
  }
}

// POST /api/submissions - Create a new submission
export async function POST(request: NextRequest) {
  try {
    // Get wallet address from header for authentication
    const walletAddress = request.headers.get('x-wallet-address');
    if (!walletAddress) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Wallet address is required for authentication'
      }, { status: 401 });
    }

    // Connect to database
    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json({ 
        error: 'Database connection failed', 
        message: dbError instanceof Error ? dbError.message : 'Unknown error' 
      }, { status: 500 });
    }

    // Find user with wallet address
    const normalizedWalletAddress = walletAddress.toLowerCase();
    const user = await User.findOne({ address: normalizedWalletAddress });
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'User not found with the provided wallet address'
      }, { status: 401 });
    }

    // Only writers can submit scripts
    if (user.role !== 'writer') {
      return NextResponse.json({ 
        error: 'Only writers can submit scripts' 
      }, { status: 403 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (bodyError) {
      return NextResponse.json({ 
        error: 'Invalid request body', 
        message: 'Failed to parse JSON body'
      }, { status: 400 });
    }
    
    const { 
      title, 
      content, 
      project_id, 
      logline, 
      synopsis, 
      genre, 
      target_audience, 
      market, // Add market field
      runtime,
      comparables,
      key_characters,
      analysis,
      file_data,
      file_name
    } = body;

    // Validate required fields - enforce project_id as required
    if (!title || !content || !project_id) {
      return NextResponse.json({ 
        error: 'Title, content, and project ID are required' 
      }, { status: 400 });
    }

    if (!file_data || !file_name) {
      return NextResponse.json({
        error: 'File data and file name are required for submission'
      }, { status: 400 });
    }

    // Check if project exists and is open
    const project = await Project.findOne({ id: project_id });
    if (!project) {
      return NextResponse.json({ 
        error: 'Project not found', 
        message: `No project found with ID: ${project_id}`
      }, { status: 404 });
    }

    if (project.status !== 'open' && project.status !== 'published') {
      return NextResponse.json({ 
        error: 'Project is not open for submissions',
        message: `Project status is ${project.status}`
      }, { status: 400 });
    }

    // Check if user already submitted to this project
    const existingSubmission = await Submission.findOne({
      project_id,
      writer_id: user.id
    });

    if (existingSubmission) {
      return NextResponse.json({ 
        error: 'You already have a submission for this project',
        submission_id: existingSubmission.id
      }, { status: 400 });
    }

    // Analyze script with AI if analysis not already provided
    let scriptAnalysis = analysis;
    if (!scriptAnalysis) {
      try {
        const analysisResult = await analyzeScript(content, project.requirements);
        if (analysisResult.success) {
          scriptAnalysis = analysisResult.result;
        }
      } catch (error) {
        console.error('Error analyzing script:', error);
        // Continue without analysis if it fails
      }
    }

    // Upload file to IPFS
    let ipfsHash;
    try {
      // Decode base64 file data to buffer
      const fileBuffer = Buffer.from(file_data, 'base64');
      ipfsHash = await uploadFileToIPFS(fileBuffer, file_name);
      console.log('File uploaded to IPFS with hash:', ipfsHash);
    } catch (error) {
      console.error('Failed to upload file to IPFS:', error);
      return NextResponse.json({
        error: 'Failed to upload file to IPFS',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // Create submission
    try {
      const submission = new Submission({
        id: uuidv4(),
        project_id,
        writer_id: user.id,
        title,
        content,
        analysis: scriptAnalysis,
        status: 'pending',
        logline: logline || '',
        synopsis: synopsis || '',
        genre: genre || '',
        target_audience: target_audience || '',
        market: market || '', // Add market field
        runtime: runtime || '',
        comparables: comparables || '',
        key_characters: key_characters || '',
        ipfs_hash: ipfsHash,
        created_at: new Date(),
        updated_at: new Date()
      });

      await submission.save();

      // Mint NFT on blockchain
      const mintResult = await mintScriptNFT(
        normalizedWalletAddress,
        ipfsHash,
        submission.id
      );

      if (!mintResult.success) {
        console.error('Failed to mint NFT:', mintResult.error);
        return NextResponse.json({
          error: 'Failed to mint NFT',
          message: mintResult.error
        }, { status: 500 });
      }

      // Update submission with NFT minting info
      submission.nft_minted = true;
      submission.nft_token_id = mintResult.tokenId;
      submission.updated_at = new Date();
      await submission.save();

      return NextResponse.json({
        message: 'Submission created successfully',
        submission_id: submission.id,
        project_title: project.title,
        nft_token_id: mintResult.tokenId,
        transaction_hash: mintResult.transactionHash
      }, { status: 201 });
    } catch (error) {
      console.error('Error creating submission:', error);
      return NextResponse.json({ 
        error: 'Failed to create submission', 
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json({ 
      error: 'Failed to process submission' 
    }, { status: 500 });
  }
}
