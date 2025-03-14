import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Script, User } from '@/models';
import { getToken } from 'next-auth/jwt';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// GET /api/scripts - Get all scripts or filtered list
export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const writer_id = searchParams.get('writer_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Authentication (optional for public scripts)
    const token = await getToken({ req: request as any });

    // Build filter
    let filter: any = {};
    
    // If writer_id is provided, filter by writer
    if (writer_id) {
      filter.writer_id = writer_id;
    }
    
    // If status is provided, filter by status
    if (status) {
      filter.status = status;
    }
    
    // If user is authenticated and requesting their own scripts, show all
    // Otherwise, only show submitted or sold scripts (not drafts)
    if (!token || (writer_id && writer_id !== token.id)) {
      filter.status = { $in: ['submitted', 'sold'] };
    }

    // Get scripts count for pagination
    const total = await Script.countDocuments(filter);

    // Get scripts
    const scripts = await Script.find(filter)
      .select('-__v')
      .skip(skip)
      .limit(limit)
      .sort({ created_at: -1 });

    return NextResponse.json({
      scripts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching scripts:', error);
    return NextResponse.json({ error: 'Failed to fetch scripts' }, { status: 500 });
  }
}

// POST /api/scripts - Create a new script
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only writers can create scripts
    if (token.role !== 'writer') {
      return NextResponse.json({ 
        error: 'Only writers can create scripts' 
      }, { status: 403 });
    }

    // Connect to the database
    await connectToDatabase();

    // Parse request body
    const body = await request.json();
    const { title, content } = body;

    // Validate request
    if (!title || !content) {
      return NextResponse.json({ 
        error: 'Title and content are required' 
      }, { status: 400 });
    }

    // Generate script hash for blockchain
    const scriptHash = crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');

    // Create script
    const script = new Script({
      id: `script_${uuidv4()}`,
      writer_id: token.id,
      title,
      content,
      created_at: new Date(),
      updated_at: new Date(),
      script_hash: scriptHash,
      status: 'draft',
      nft_token_id: null,
      nft_contract_address: null
    });

    await script.save();

    return NextResponse.json({
      message: 'Script created successfully',
      script: {
        id: script.id,
        title: script.title,
        writer_id: script.writer_id,
        created_at: script.created_at,
        status: script.status,
        script_hash: script.script_hash
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating script:', error);
    return NextResponse.json({ error: 'Failed to create script' }, { status: 500 });
  }
} 