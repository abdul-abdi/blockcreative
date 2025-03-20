import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Submission, Script, Project, User } from '@/models';
import { getToken } from 'next-auth/jwt';
import { v4 as uuidv4 } from 'uuid';
import { analyzeScript } from '@/lib/ai';
import crypto from 'crypto';

// GET /api/submissions - Get all submissions or filtered list
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

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
      filter.project_id = project_id;
      
      // If user is not the producer of this project, only show their own submissions
      if (token.role !== 'producer') {
        const project = await Project.findOne({ id: project_id });
        if (!project || project.producer_id !== token.id) {
          filter.writer_id = token.id;
        }
      }
    } else if (token.role === 'writer') {
      // Writers can only see their own submissions if not filtering by project
      filter.writer_id = token.id;
    } else if (token.role === 'producer') {
      // Producers can only see submissions to their projects if not filtering by project
      const producerProjects = await Project.find({ producer_id: token.id }).select('id');
      const projectIds = producerProjects.map(project => project.id);
      filter.project_id = { $in: projectIds };
    }
    
    // Additional filters
    if (writer_id && (token.role === 'producer' || writer_id === token.id)) {
      filter.writer_id = writer_id;
    }
    
    if (status) {
      filter.status = status;
    }

    // Get submissions count for pagination
    const total = await Submission.countDocuments(filter);

    // Get submissions
    const submissions = await Submission.find(filter)
      .select('-__v')
      .skip(skip)
      .limit(limit)
      .sort({ submitted_at: -1 });

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
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

// POST /api/submissions - Create a new submission
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only writers can submit scripts
    if (token.role !== 'writer') {
      return NextResponse.json({ 
        error: 'Only writers can submit scripts' 
      }, { status: 403 });
    }

    // Connect to the database
    await connectToDatabase();

    // Parse request body
    const body = await request.json();
    const { script_id, project_id, price } = body;

    // Validate request
    if (!script_id || !project_id) {
      return NextResponse.json({ 
        error: 'Script ID and Project ID are required' 
      }, { status: 400 });
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return NextResponse.json({ 
        error: 'Valid price is required' 
      }, { status: 400 });
    }

    // Check if script exists and belongs to the user
    const script = await Script.findOne({ id: script_id });
    if (!script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    if (script.writer_id !== token.id) {
      return NextResponse.json({ 
        error: 'You can only submit your own scripts' 
      }, { status: 403 });
    }

    // Check if project exists and is open
    const project = await Project.findOne({ id: project_id });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.status !== 'open') {
      return NextResponse.json({ 
        error: 'Project is not open for submissions' 
      }, { status: 400 });
    }

    // Check if user already submitted this script to this project
    const existingSubmission = await Submission.findOne({
      script_id,
      project_id
    });

    if (existingSubmission) {
      return NextResponse.json({ 
        error: 'You have already submitted this script to this project' 
      }, { status: 400 });
    }

    // Analyze script with AI
    let aiScore = null;
    try {
      // Get project requirements if any
      const requirements = project.requirements || [];
      
      // Run AI analysis
      const analysisResult = await analyzeScript(script.content, requirements);
      
      if (analysisResult.success && analysisResult.result) {
        aiScore = analysisResult.result;
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      // Continue without AI analysis if it fails
    }

    // Generate submission hash for blockchain
    const submissionData = {
      script_id,
      project_id,
      writer_id: token.id,
      price,
      timestamp: Date.now()
    };
    
    const submissionHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(submissionData))
      .digest('hex');

    // Create submission
    const submission = new Submission({
      id: `sub_${uuidv4()}`,
      script_id,
      project_id,
      writer_id: token.id,
      submitted_at: new Date(),
      price,
      status: 'pending',
      ai_score: aiScore,
      submission_hash: submissionHash,
      is_purchased: false,
      nft_minted: false,
      nft_token_id: null,
      nft_transfer_transaction: null
    });

    await submission.save();

    // Update script status to submitted
    script.status = 'submitted';
    await script.save();

    return NextResponse.json({
      message: 'Script submitted successfully',
      submission: {
        id: submission.id,
        script_id: submission.script_id,
        project_id: submission.project_id,
        submitted_at: submission.submitted_at,
        price: submission.price,
        status: submission.status,
        ai_score: submission.ai_score
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting script:', error);
    return NextResponse.json({ error: 'Failed to submit script' }, { status: 500 });
  }
} 