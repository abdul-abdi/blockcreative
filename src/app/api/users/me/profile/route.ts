import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models';

// PUT /api/users/me/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    // Get wallet address from request headers
    const walletAddress = request.headers.get('x-wallet-address');
    if (!walletAddress) {
      return NextResponse.json({ error: 'Unauthorized - Missing wallet address' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

    // Normalize the wallet address to lowercase
    const normalizedWalletAddress = walletAddress.toLowerCase();
    console.log('Looking up user with normalized wallet address:', normalizedWalletAddress);

    // Find user by wallet address
    const user = await User.findOne({ address: normalizedWalletAddress });
    
    if (!user) {
      console.log('User not found with normalized wallet address:', normalizedWalletAddress);
      
      // Try additional lookup to debug the issue
      const allUsers = await User.find({}).limit(5);
      console.log('Sample users in database:', allUsers.map(u => ({ id: u.id, address: u.address })));
      
      // If user not found, check if we need to create one
      const newUser = await createUserIfNeeded(normalizedWalletAddress);
      if (!newUser) {
        return NextResponse.json({ error: 'User not found and could not be created' }, { status: 404 });
      }
      
      console.log('Created new user:', newUser.id);
      
      // Continue with the new user
      return handleProfileUpdate(newUser, request);
    }
    
    return handleProfileUpdate(user, request);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ 
      error: 'Failed to update profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to handle the profile update
async function handleProfileUpdate(user: any, request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Update profile data
    if (body.profile_data) {
      user.profile_data = {
        ...user.profile_data,
        ...body.profile_data
      };
    }
    
    // Update onboarding status if provided
    if (body.onboarding_step !== undefined) {
      user.onboarding_step = body.onboarding_step;
    }
    
    if (body.onboarding_completed !== undefined) {
      user.onboarding_completed = body.onboarding_completed;
    }
    
    // Save updated user
    await user.save();
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: user.profile_data,
      onboarding_completed: user.onboarding_completed,
      onboarding_step: user.onboarding_step
    }, { status: 200 });
  } catch (error) {
    console.error('Error in handleProfileUpdate:', error);
    throw error;
  }
}

// Helper function to create a user if needed
async function createUserIfNeeded(walletAddress: string) {
  try {
    // Get user role from localStorage
    const role = 'producer'; // Default to producer since this is producer onboarding
    
    // Create a new user
    const newUser = new User({
      address: walletAddress,
      role: role,
      onboarding_completed: false,
      onboarding_step: 0,
      profile_data: {}
    });
    
    await newUser.save();
    return newUser;
  } catch (error) {
    console.error('Error creating new user:', error);
    return null;
  }
}

// GET /api/users/me/profile - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    // Get wallet address from request headers
    const walletAddress = request.headers.get('x-wallet-address');
    if (!walletAddress) {
      return NextResponse.json({ error: 'Unauthorized - Missing wallet address' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

    // Normalize the wallet address to lowercase
    const normalizedWalletAddress = walletAddress.toLowerCase();

    // Find user by wallet address
    const user = await User.findOne({ address: normalizedWalletAddress });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      profile: user.profile_data || {},
      role: user.role,
      id: user.id,
      address: user.address,
      onboarding_completed: user.onboarding_completed,
      onboarding_step: user.onboarding_step
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 