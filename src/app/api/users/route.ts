import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models';
import { getToken } from 'next-auth/jwt';

// GET /api/users - Get all users or filtered list
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

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

// POST /api/users - Create new user (typically from Reown)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const walletAddress = body.address || request.headers.get('x-wallet-address');
    const userRole = body.role || 'writer'; // Default to writer if no role specified
    
    if (!walletAddress) {
      return NextResponse.json({ 
        error: 'Wallet address is required',
        message: 'Please provide a wallet address to create a user'
      }, { status: 400 });
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Check if user already exists by wallet address
    const existingUser = await User.findOne({ address: walletAddress });
    if (existingUser) {
      console.log('User already exists with wallet address:', walletAddress);
      
      // Check if the user is trying to register with a different role
      if (existingUser.role !== userRole) {
        return NextResponse.json({ 
          error: 'Role conflict',
          message: `This wallet address is already registered as a ${existingUser.role}. You cannot switch roles.`
        }, { status: 403 });
      }
      
      return NextResponse.json({ 
        message: 'User already exists',
        user: existingUser 
      }, { status: 200 });
    }
    
    // Set up default profile data based on role
    const defaultProfileData = userRole === 'writer' 
      ? {
          name: body.profile_data?.name || 'Writer User',
          bio: body.profile_data?.bio || '',
          avatar: body.profile_data?.avatar || '',
          website: body.profile_data?.website || '',
          writing_experience: body.profile_data?.writing_experience || '',
          genres: body.profile_data?.genres || [],
          project_types: body.profile_data?.project_types || [],
          social: body.profile_data?.social || {
            twitter: '',
            linkedin: '',
            instagram: ''
          }
        }
      : {
          name: body.profile_data?.name || 'Producer User',
          bio: body.profile_data?.bio || '',
          avatar: body.profile_data?.avatar || '',
          website: body.profile_data?.website || '',
          company: body.profile_data?.company || 'Production Company',
          industry: body.profile_data?.industry || 'Entertainment',
          team_size: body.profile_data?.team_size || '',
          budget_range: body.profile_data?.budget_range || '',
          location: body.profile_data?.location || '',
          phone: body.profile_data?.phone || '',
          social: body.profile_data?.social || {
            twitter: '',
            linkedin: '',
            instagram: ''
          }
        };
    
    // Merge provided profile data with defaults
    const profileData = {
      ...defaultProfileData,
      ...(body.profile_data || {})
    };
    
    // Create new user with explicit onboarding status
    const newUser = new User({
      id: body.id || `user_${Date.now()}`,
      address: walletAddress,
      role: userRole,
      created_at: new Date(),
      profile_data: profileData,
      onboarding_completed: body.onboarding_completed === true ? true : false,
      onboarding_step: body.onboarding_step || 0
    });
    
    await newUser.save();
    
    console.log(`New ${userRole} created with address ${walletAddress}:`, {
      id: newUser.id,
      onboarding_completed: newUser.onboarding_completed,
      profile_fields: Object.keys(profileData)
    });
    
    return NextResponse.json({ 
      message: 'User created successfully',
      user: newUser 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ 
      error: 'Failed to create user',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 