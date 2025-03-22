import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models';
import { v4 as uuidv4 } from 'uuid';

// GET /api/users - Get all users or filtered list
export async function GET(request: NextRequest) {
  try {
    // Check authentication via wallet address
    const walletAddress = request.headers.get('x-wallet-address') || 
                          request.cookies.get('walletAddress')?.value;
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();
    
    // Verify user exists with this wallet address
    const authUser = await User.findOne({ address: walletAddress });
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = {};
    if (role) {
      filter.role = role;
    }

    // Get users count for pagination
    const total = await User.countDocuments(filter);

    // Get filtered users
    const users = await User.find(filter)
      .select('-__v')
      .skip(skip)
      .limit(limit)
      .sort({ created_at: -1 });

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();

    // Parse request body
    const { appkitId, walletAddress, email, role, profile_data } = await request.json();

    // Ensure we have a wallet address
    if (!walletAddress) {
      return NextResponse.json({ 
        error: 'Wallet address is required' 
      }, { status: 400 });
    }
    
    // Normalize wallet address to lowercase
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Check if user already exists with this wallet address
    const existingUser = await User.findOne({ address: normalizedAddress });
    
    if (existingUser) {
      // If user exists with different role than requested, return error
      if (existingUser.role !== role) {
        return NextResponse.json({ 
          error: 'User already exists with a different role',
          message: `This wallet is already registered as a ${existingUser.role}`
        }, { status: 409 }); // Conflict
      }
      
      // If user exists with same role, update AppKit ID if not already set
      if (!existingUser.appkit_id && appkitId) {
        existingUser.appkit_id = appkitId;
        await existingUser.save();
        console.log(`Updated existing user ${existingUser.id} with AppKit ID ${appkitId}`);
      }
      
      return NextResponse.json({ 
        message: 'User already exists',
        user: {
          id: existingUser.id,
          address: existingUser.address,
          role: existingUser.role,
          profile_data: existingUser.profile_data,
          onboarding_completed: existingUser.onboarding_completed
        }
      }, { status: 200 });
    }
    
    // Log user creation
    console.log(`Creating new user with wallet address: ${normalizedAddress}, AppKit ID: ${appkitId || 'none'}`);
    
    // Generate a unique ID for the user
    const userId = uuidv4();
    
    // Set up default profile data based on role
    const defaultProfileData = role === 'writer' ? {
      name: '',
      bio: '',
      genres: [],
      profile_image: ''
    } : {
      company_name: '',
      company: '',
      bio: '',
      profile_image: ''
    };
    
    // Merge provided profile data with defaults
    const mergedProfileData = {
      ...defaultProfileData,
      ...(profile_data || {})
    };
    
    // Create a new user
    const newUser = new User({
      id: userId,
      appkit_id: appkitId,
      address: normalizedAddress,
      email,
      role,
      profile_data: mergedProfileData,
      onboarding_completed: false,
      onboarding_step: 0,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Save the user
    await newUser.save();
    
    return NextResponse.json({ 
      message: 'User created successfully',
      user: {
        id: newUser.id,
        address: newUser.address,
        role: newUser.role,
        profile_data: newUser.profile_data,
        onboarding_completed: newUser.onboarding_completed
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ 
      error: 'Failed to create user',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 