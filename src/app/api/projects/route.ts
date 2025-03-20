import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Project, User } from '@/models';
import { getToken } from 'next-auth/jwt';
import { createProject } from '@/lib/blockchain';
import crypto from 'crypto';
import { ENV } from '@/lib/env-config';
import { trackProjectCreation } from '@/lib/project-blockchain-service';

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

    // Build filter
    const filter: any = {};
    if (status) {
      filter.status = status;
    }
    if (producerId) {
      filter.producer_id = producerId;
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
    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only producers can create projects
    if (token.role !== 'producer') {
      return NextResponse.json({ error: 'Only producers can create projects' }, { status: 403 });
    }

    const body = await request.json();

    // Connect to the database
    await connectToDatabase();

    // Verify user exists and is a producer
    const user = await User.findOne({ id: token.id });
    if (!user || user.role !== 'producer') {
      return NextResponse.json({ error: 'User not found or not a producer' }, { status: 404 });
    }

    // Calculate project hash for blockchain
    const projectData = {
      producer_id: token.id,
      title: body.title,
      description: body.description,
      budget: body.budget,
      deadline: body.deadline,
      requirements: body.requirements || [],
      timestamp: Date.now()
    };
    
    const projectHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(projectData))
      .digest('hex');

    // Create project in blockchain
    const blockchainResult = await createProject(
      user.address,
      '0x' + projectHash
    );

    if (!blockchainResult.success) {
      return NextResponse.json({
        error: 'Failed to create project on blockchain',
        details: blockchainResult.error
      }, { status: 500 });
    }

    // Create project in database
    const newProject = new Project({
      id: `project_${Date.now()}`,
      producer_id: token.id,
      title: body.title,
      description: body.description,
      budget: body.budget,
      deadline: new Date(body.deadline),
      requirements: body.requirements || [],
      status: 'open',
      created_at: new Date(),
      contract_address: ENV.PROJECT_REGISTRY_ADDRESS || '', // Set contract address
      project_hash: projectHash,
      escrow_funded: false,
      escrow_transaction_hash: '',
      onChain: false, // Initially false, will be set to true when confirmed
      blockchain_data: {
        projectId: blockchainResult.projectId,
        transactionHash: blockchainResult.transactionHash,
        gasUsed: blockchainResult.gasUsed,
        confirmed: false
      }
    });

    await newProject.save();
    
    // Start tracking the blockchain transaction
    trackProjectCreation(
      newProject.id,
      blockchainResult.transactionHash,
      blockchainResult.projectId
    ).catch(error => console.error('Failed to track project creation:', error));

    return NextResponse.json({
      message: 'Project created successfully',
      project: newProject,
      blockchain: {
        projectId: blockchainResult.projectId,
        transactionHash: blockchainResult.transactionHash
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
} 