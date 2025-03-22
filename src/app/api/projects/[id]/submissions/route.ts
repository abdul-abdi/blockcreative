import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Project, Submission, User } from '@/models';
import { getToken } from 'next-auth/jwt';
import { analyzeScript } from '@/lib/ai';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

// Utility function to extract project ID from URL
function getProjectIdFromUrl(url: string): string {
  const pathParts = url.split('/');
  const projectsIndex = pathParts.indexOf('projects');
  return projectsIndex >= 0 ? pathParts[projectsIndex + 1] : '';
}

// GET /api/projects/[id]/submissions - Get all submissions for a project
export async function GET(request: NextRequest) {
  try {
    // Extract the project ID from the URL
    const projectId = getProjectIdFromUrl(request.url);
    console.log('Fetching submissions for project ID:', projectId);
    
    // Connect to the database
    await connectToDatabase();
    
    // Check for wallet authentication via header
    const walletAddress = request.headers.get('x-wallet-address');
    let userId = null;
    let userRole = null;
    
    // First try wallet authentication if provided
    if (walletAddress) {
      const normalizedAddress = walletAddress.toLowerCase();
      const user = await User.findOne({ address: normalizedAddress });
      
      if (user) {
        userId = user.id;
        userRole = user.role;
        console.log(`Authenticated via wallet: ${normalizedAddress}, User ID: ${userId}, Role: ${userRole}`);
      } else {
        console.log(`User not found for wallet address: ${normalizedAddress}`);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    } else {
      // Fall back to token authentication
      const token = await getToken({ req: request as any });
      if (token) {
        userId = token.id;
        userRole = token.role;
        console.log(`Authenticated via token: User ID: ${userId}, Role: ${userRole}`);
      } else {
        console.log('No authentication provided');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    // Build query conditions for finding the project
    const queryConditions: Record<string, any>[] = [
      { id: projectId },
      { projectId: projectId }
    ];
    
    // Only add _id condition if it's a valid ObjectId
    if (mongoose.isValidObjectId(projectId)) {
      queryConditions.push({ _id: projectId });
    }
    
    console.log('Project query conditions:', JSON.stringify(queryConditions));
    
    // Find the project with multiple possible ID fields
    const project = await Project.findOne({
      $or: queryConditions
    });
    
    if (!project) {
      console.log(`Project not found with ID: ${projectId}`);
      return NextResponse.json({ 
        error: 'Project not found',
        submissions: [] 
      }, { status: 404 });
    }

    console.log(`Found project: ${project.title}, ID: ${project.id}, Producer: ${project.producer_id}`);

    // Check if user is the project owner, admin, or a writer with a submission
    const isProducer = project.producer_id === userId;
    const isAdmin = userRole === 'admin';
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // Create an array of project IDs to search for
    const projectIds = [
      projectId,
      project.id,
      project.projectId
    ].filter(Boolean); // Remove null/undefined entries
    
    // Add _id as string if it exists
    if (project._id) {
      projectIds.push(project._id.toString());
    }
    
    console.log('Searching for submissions with project IDs:', projectIds);
    
    // Build query to search for submissions with project IDs
    const query: any = {
      project_id: { $in: projectIds }
    };
    
    // If user is a writer, only show their submissions
    if (!isProducer && !isAdmin && userRole === 'writer') {
      query.writer_id = userId;
    }
    
    console.log('Submissions query:', JSON.stringify(query));
    
    // Count total submissions for pagination
    const total = await Submission.countDocuments(query);
    console.log(`Found ${total} submissions matching query`);
    
    // Get submissions with pagination
    const submissions = await Submission.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');
    
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
    console.error(`Error fetching submissions for project:`, error);
    return NextResponse.json({ 
      error: 'Failed to fetch submissions',
      details: error instanceof Error ? error.message : 'Unknown error',
      submissions: []
    }, { status: 500 });
  }
}

// POST /api/projects/[id]/submissions - Create a new submission
export async function POST(request: NextRequest) {
  try {
    // Extract the project ID from the URL
    const projectId = getProjectIdFromUrl(request.url);
    
    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only writers can submit scripts
    if (token.role !== 'writer') {
      return NextResponse.json({ error: 'Only writers can submit scripts' }, { status: 403 });
    }

    // Connect to the database
    await connectToDatabase();

    // Get project
    const project = await Project.findOne({ id: projectId });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if project is open for submissions
    if (project.status !== 'open') {
      return NextResponse.json({ error: 'Project is not open for submissions' }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // Check if user already has a submission for this project
    const existingSubmission = await Submission.findOne({
      project_id: projectId,
      writer_id: token.id
    });

    if (existingSubmission) {
      return NextResponse.json({ 
        error: 'You already have a submission for this project',
        submission_id: existingSubmission.id
      }, { status: 400 });
    }

    // Analyze script with AI
    let analysis = null;
    try {
      analysis = await analyzeScript(content, project.requirements);
    } catch (error) {
      console.error('Error analyzing script:', error);
      // Continue without analysis if it fails
    }

    // Create submission
    const submission = new Submission({
      id: uuidv4(),
      project_id: projectId,
      writer_id: token.id,
      title,
      content,
      analysis,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    });

    await submission.save();

    return NextResponse.json({
      message: 'Submission created successfully',
      submission
    }, { status: 201 });
  } catch (error) {
    console.error(`Error creating submission for project:`, error);
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
  }
} 