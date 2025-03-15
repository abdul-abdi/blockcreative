import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Project, Submission, User } from '@/models';
import { getToken } from 'next-auth/jwt';
import { analyzeScript } from '@/lib/ai';
import { v4 as uuidv4 } from 'uuid';

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
    
    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

    // Get project
    const project = await Project.findOne({ id: projectId });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user is the project owner, admin, or a writer with a submission
    const isProducer = project.producer_id === token.id;
    const isAdmin = token.role === 'admin';
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    let query: any = { project_id: projectId };
    
    // If user is a writer, only show their submissions
    if (!isProducer && !isAdmin && token.role === 'writer') {
      query.writer_id = token.id;
    }
    
    // Count total submissions for pagination
    const total = await Submission.countDocuments(query);
    
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
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
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