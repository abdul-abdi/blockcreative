import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Project, User, Transaction } from '@/models';
import crypto from 'crypto';
import { ENV } from '@/lib/env-config';
import { createProject } from '@/lib/blockchain';
import { trackProjectCreation } from '@/lib/project-blockchain-service';
import { initBlockchain } from '@/lib/blockchain';
import { createTransactionRecord, updateProjectBlockchainStatus } from '@/lib/utils';
import mongoose from 'mongoose';

// GET /api/projects - List all projects or filtered list
export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const producerId = searchParams.get('producer_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // Check if this is a producer-specific request
    const isProducerRequest = searchParams.get('producer') === 'true';
    const walletAddress = request.headers.get('x-wallet-address')?.toLowerCase();
    
    // Build filter
    const filter: any = {};
    if (status) {
      filter.status = status;
    }
    if (producerId) {
      filter.producer_id = producerId;
    }
    
    // If producer request, only show their projects
    if (isProducerRequest && walletAddress) {
      console.log('DEBUG: Producer request with wallet address:', walletAddress);
      
      // Find the producer by wallet address
      const producer = await User.findOne({ 
        $or: [
          { address: walletAddress },
          { wallet_address: walletAddress }
        ]
      });
      
      if (producer) {
        console.log('DEBUG: Producer found', {
          id: producer.id,
          _id: producer._id,
          address: producer.address
        });
        
        // Use $or to try multiple potential producer fields
        filter.$or = [
          { producer_id: producer.id },
          { producer: producer._id },
          { producer_address: producer.address },
          { producer_wallet: producer.address }
        ];
        
        console.log('DEBUG: Using filter', JSON.stringify(filter));
      } else {
        console.log('DEBUG: Producer not found for wallet', walletAddress);
        return NextResponse.json({ 
          error: 'Producer not found',
          projects: []
        }, { status: 404 });
      }
    }

    // Get projects count for pagination
    const total = await Project.countDocuments(filter);

    // Get filtered projects
    const projects = await Project.find(filter)
      .select('-__v')
      .skip(skip)
      .limit(limit)
      .sort({ created_at: -1 });

    return NextResponse.json({
      projects,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get wallet address from request headers with fallbacks
    let walletAddress = request.headers.get('x-wallet-address')?.toLowerCase();
    
    // If wallet address is not in headers, check cookies
    if (!walletAddress) {
      walletAddress = request.cookies.get('walletAddress')?.value?.toLowerCase();
    }
    
    // If still no wallet address, check request body as last resort
    if (!walletAddress) {
      try {
        const body = await request.clone().json(); // clone to avoid consuming the body
        walletAddress = body.walletAddress || body.wallet_address || body.address;
        if (walletAddress) walletAddress = walletAddress.toLowerCase();
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    if (!walletAddress) {
      return NextResponse.json({ 
        error: 'No wallet address provided',
        details: 'Please ensure your wallet is connected and you are logged in.'
      }, { status: 401 });
    }
    
    // Find the user by wallet address
    const user = await User.findOne({ 
      $or: [
        { address: walletAddress },
        { wallet_address: walletAddress }
      ]
    });
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found',
        details: 'No user found with the provided wallet address. Please sign up first.'
      }, { status: 404 });
    }
    
    // Parse the request body
    const data = await request.json();
    
    // Generate a unique project ID for consistency
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    // Additional validation
    if (!data.title || !data.description) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Title and description are required.'
      }, { status: 400 });
    }
    
    // First, check and clean up any projects with null id
    try {
      const nullIdProjects = await Project.find({ id: null });
      if (nullIdProjects.length > 0) {
        console.log(`Found ${nullIdProjects.length} projects with null id, cleaning up...`);
        await Project.deleteMany({ id: null });
      }
    } catch (cleanupError) {
      console.error('Error cleaning up null id projects:', cleanupError);
      // Continue with project creation attempt
    }
    
    // Prepare project data
    const projectData = {
      id: projectId,
      projectId: projectId,
      producer: user._id,
      producer_id: user.id || user._id.toString(),
      title: data.title,
      description: data.description,
      requirements: data.requirements || "",
      budget: data.budget || 0,
      deadline: data.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      genre: data.genre || "",
      type: data.type || "",
      status: 'open',
      metadata: {
        target_audience: data.target_audience || "",
        estimated_runtime: data.estimated_runtime || "",
        content_rating: data.content_rating || "",
        script_length: data.script_length || "",
        format_requirements: data.format_requirements || "",
        screenplay_elements: data.screenplay_elements || "",
        tone: data.tone || "",
        themes: data.themes || [],
        visual_style: data.visual_style || "",
        character_notes: data.character_notes || "",
        additional_materials: data.additional_materials || "",
        compensation_details: data.compensation_details || "",
        submission_guidelines: data.submission_guidelines || ""
      }
    };
    
    console.log('Creating project in database:', projectId);

    let project;
    
    // Try direct MongoDB insert first, bypassing any Mongoose middleware that might interfere
    try {
      const db = mongoose.connection.db;
      
      if (!db) {
        console.log('MongoDB connection not fully established, falling back to Mongoose model');
        throw new Error('MongoDB connection not ready');
      }
      
      const projectsCollection = db.collection('projects');
      
      // Insert directly into MongoDB
      const result = await projectsCollection.insertOne({
        ...projectData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Project created via direct MongoDB insertion:', result.insertedId);
      
      // Retrieve the inserted project
      project = await Project.findOne({ id: projectId });
      
      if (!project) {
        console.log('Project not found after direct insertion, trying Mongoose model');
        throw new Error('Project not found after direct insertion');
      }
    } catch (directInsertError) {
      console.error('Error with direct MongoDB insert:', directInsertError);
      
      // Fallback to Mongoose model if direct insert fails
      try {
        // Create a new project with the necessary fields
        project = new Project(projectData);
        
        // Force-set the id field to ensure it's not null
        project.id = projectId;
        project.set('id', projectId, { strict: true });
        
        // Additional check
        if (!project.id) {
          console.error('Project ID is still null after explicit setting, forcing it again');
          Object.defineProperty(project, 'id', {
            value: projectId,
            writable: true,
            configurable: true
          });
        }
        
        await project.save();
        console.log('Project created via Mongoose model successfully');
      } catch (saveError) {
        console.error('Error saving project via Mongoose:', saveError);
        
        if (saveError instanceof Error && saveError.message.includes('duplicate key error')) {
          // Last resort: try with a completely different ID
          const finalAttemptId = `project_emergency_${Date.now()}_${Math.random().toString(36).substring(2, 20)}`;
          console.log('Making final attempt with emergency ID:', finalAttemptId);
          
          project = new Project({
            ...projectData,
            id: finalAttemptId,
            projectId: finalAttemptId
          });
          
          await project.save();
        } else {
          throw saveError;
        }
      }
    }
    
    // Save project to blockchain
    console.log('Initializing blockchain connection...');
    let blockchainInitialized = false;
    
    try {
      blockchainInitialized = await initBlockchain();
      console.log('Blockchain initialization result:', blockchainInitialized);
    } catch (blockchainInitError) {
      console.error('Error initializing blockchain:', blockchainInitError);
    }
    
    // Attempt to create project on blockchain if initialization was successful
    if (blockchainInitialized) {
      console.log('Creating project on blockchain...');
      
      try {
        // Generate a unique hash for the project with UUID for extra uniqueness
        const { v4: uuidv4 } = require('uuid');
        const projectHash = `${projectId}_${Date.now()}_${uuidv4().substring(0, 8)}`;
        
        console.log(`Registering project on blockchain: ${projectId} with hash ${projectHash}`);
        console.log(`User: ${user.name || user.id || user._id}, Wallet: ${walletAddress}`);
        
        // Register project on blockchain
        const blockchainResult = await createProject(walletAddress, projectHash);
        console.log('Blockchain creation result:', blockchainResult);
        
        if (blockchainResult.success) {
          // Store transaction details using the utility function
          const transaction = await createTransactionRecord('project_creation', {
            user: user,
            project: project,
            transactionHash: blockchainResult.transactionHash,
            status: 'pending',
            metadata: {
              projectId: projectId,
              projectHash: projectHash,
              title: data.title,
              description: data.description?.substring(0, 200),
              budget: data.budget,
              deadline: data.deadline
            }
          });
          
          await transaction.save();
          console.log('Transaction recorded successfully');
          
          // Update project with blockchain information using utility function
          await updateProjectBlockchainStatus(projectId, 'pending', {
            hash: projectHash,
            transaction_hash: blockchainResult.transactionHash
          });
          
          // Return success with project and blockchain transaction data
          return NextResponse.json({
            success: true,
            project,
            blockchain: {
              success: true,
              projectId: projectId,
              projectHash: projectHash,
              txHash: blockchainResult.transactionHash,
              transactionHash: blockchainResult.transactionHash,
              status: 'pending',
              networkName: 'Lisk Sepolia'
            },
            transaction
          }, { status: 201 });
        } else {
          // If blockchain creation failed but database creation succeeded
          console.error('Failed to create project on blockchain:', blockchainResult.error);
          
          // Create a transaction record for the failed attempt using the utility function
          const transaction = await createTransactionRecord('project_creation', {
            user: user,
            project: project,
            transactionHash: blockchainResult.transactionHash || `failed_${Date.now()}`,
            status: 'failed',
            metadata: {
              projectId: projectId,
              projectHash: projectHash,
              title: data.title,
              description: data.description?.substring(0, 200),
              budget: data.budget,
              deadline: data.deadline,
              error: blockchainResult.error
            }
          });
          
          await transaction.save();
          
          // Update project with failed blockchain status using utility function
          await updateProjectBlockchainStatus(projectId, 'failed', {
            hash: projectHash,
            error: blockchainResult.error
          });
          
          // Return success with project but indicate blockchain failure
          return NextResponse.json({
            success: false,
            project,
            blockchain: {
              success: false,
              error: blockchainResult.error,
              projectId: projectId,
              projectHash: projectHash,
              status: 'failed'
            },
            transaction
          }, { status: 200 });
        }
      } catch (blockchainError) {
        console.error('Error in blockchain project creation:', blockchainError);
        
        // Generate a failed transaction hash
        const { v4: uuidv4 } = require('uuid');
        const projectHash = `${projectId}_${Date.now()}_${uuidv4().substring(0, 8)}`;
        
        // Create a transaction record for the failed attempt using the utility function
        const transaction = await createTransactionRecord('project_creation', {
          user: user,
          project: project,
          transactionHash: `error_${Date.now()}`,
          status: 'failed',
          metadata: {
            projectId: projectId,
            projectHash: projectHash,
            title: data.title,
            description: data.description?.substring(0, 200),
            budget: data.budget,
            deadline: data.deadline,
            error: blockchainError instanceof Error ? blockchainError.message : 'Unknown blockchain error'
          }
        });
        
        await transaction.save();
        
        // Update project with failed blockchain status using utility function
        await updateProjectBlockchainStatus(projectId, 'failed', {
          hash: projectHash,
          error: blockchainError instanceof Error ? blockchainError.message : 'Unknown blockchain error'
        });
        
        // Return success with project but indicate blockchain error
        return NextResponse.json({
          success: false,
          project,
          blockchain: {
            success: false,
            error: blockchainError instanceof Error ? blockchainError.message : 'Unknown blockchain error',
            projectId: projectId,
            projectHash: projectHash,
            status: 'failed'
          },
          transaction
        }, { status: 200 });
      }
    } else {
      // If blockchain initialization failed
      console.warn('Blockchain was not initialized, skipping blockchain registration');
      
      // Update project with skipped blockchain status using utility function
      await updateProjectBlockchainStatus(projectId, 'skipped', {
        error: 'Blockchain connection not available'
      });
      
      // Return success with project but indicate blockchain was not available
      return NextResponse.json({
        success: true,
        project,
        blockchain: {
          success: false,
          error: 'Blockchain connection not available',
          status: 'skipped'
        }
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating project:', error);
    
    // Check if error is a MongoDB duplicate key error
    if (error instanceof Error && error.message.includes('duplicate key error')) {
      return NextResponse.json({ 
        error: 'A project with the same ID already exists', 
        details: error.message
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to create project', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 