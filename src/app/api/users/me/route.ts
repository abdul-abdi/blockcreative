import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models';
import { getToken } from 'next-auth/jwt';
import { withApiMiddleware } from '@/lib/api-middleware';
import { getSessionCookieName } from '@/lib/session-helper';

// GET /api/users/me - Get current user info
async function getUserHandler(request: NextRequest) {
  try {
    // Check authentication via NextAuth with more robust options
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production'
    });
    
    // Connect to the database
    await connectToDatabase();
    
    let user = null;
    let usedMethod = '';
    let identifier = '';
    
    // Enhanced debugging to help troubleshoot Vercel deployment
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_AUTH === 'true') {
      console.log('GET /api/users/me - Auth debug:');
      console.log('Token exists:', !!token);
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Cookie name:', getSessionCookieName());
      console.log('Headers:', Object.fromEntries(request.headers));
      console.log('Cookies present:', request.cookies.size > 0);
      if (request.cookies.size > 0) {
        const cookieNames = Array.from(request.cookies.getAll(), cookie => cookie.name);
        console.log('Cookie names:', cookieNames);
      }
    }
    
    // Try to get user from token
    if (token && token.id) {
      usedMethod = 'token';
      identifier = token.id;
      console.log('Fetching user by token id:', token.id);
      user = await User.findOne({ id: token.id }).select('-__v');
    }
    
    // If no user found by token id, try to use wallet address from header
    if (!user) {
      // Check for wallet address in headers (for direct wallet connections)
      const walletAddress = request.headers.get('x-wallet-address');
      
      if (walletAddress) {
        usedMethod = 'header';
        identifier = walletAddress;
        console.log('Fetching user by wallet address from header:', walletAddress);
        user = await User.findOne({ address: walletAddress }).select('-__v');
      }
      
      // If still no user, check cookies
      if (!user) {
        const cookieAddress = request.cookies.get('walletAddress')?.value;
        if (cookieAddress) {
          usedMethod = 'cookie';
          identifier = cookieAddress;
          console.log('Fetching user by wallet address from cookie:', cookieAddress);
          user = await User.findOne({ address: cookieAddress }).select('-__v');
        }
      }
    }
    
    if (!user) {
      console.log('User not found in database');
      
      // Return more helpful information for debugging
      const walletAddress = request.headers.get('x-wallet-address');
      const cookieAddress = request.cookies.get('walletAddress')?.value;
      
      const responseBody = { 
        error: 'User not found',
        detail: `No user found for the provided credentials`,
        lookup: {
          method: usedMethod || 'none',
          identifier: identifier || 'none',
          tokenId: token?.id || 'No token ID',
          headerAddress: walletAddress || 'No header address',
          cookieAddress: cookieAddress || 'No cookie address',
          env: process.env.NODE_ENV || 'unknown'
        }
      };
      
      console.log('User lookup failed with details:', responseBody);
      
      return NextResponse.json(responseBody, { status: 404 });
    }

    console.log('User found:', {
      id: user.id,
      role: user.role,
      onboarding_completed: user.onboarding_completed
    });
    
    // Set cache control headers to help reduce repeated requests
    // Use shorter cache times in production to prevent stale data issues
    const maxAge = process.env.NODE_ENV === 'production' ? 5 : 10;
    
    return NextResponse.json({ user }, { 
      status: 200,
      headers: {
        'Cache-Control': `private, max-age=${maxAge}`, // Cache for 5-10 seconds in the client
        'Vary': 'Cookie', // Ensure responses vary by cookie to prevent caching issues
      }
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user',
      message: error instanceof Error ? error.message : 'Unknown error',
      env: process.env.NODE_ENV
    }, { status: 500 });
  }
}

// PUT /api/users/me - Update current user
async function updateUserHandler(request: NextRequest) {
  try {
    // Check authentication via NextAuth
    const token = await getToken({ req: request as any });
    
    // Connect to the database
    await connectToDatabase();
    
    let user = null;
    let userIdentifier = '';
    
    // Try to get user from token
    if (token && token.id) {
      console.log('Finding user by token id:', token.id);
      user = await User.findOne({ id: token.id });
      userIdentifier = token.id;
    }
    
    // If no user found by token id, try to use wallet address from header
    if (!user) {
      // Check for wallet address in headers (for direct wallet connections)
      const walletAddress = request.headers.get('x-wallet-address');
      
      if (walletAddress) {
        console.log('Finding user by wallet address from header:', walletAddress);
        user = await User.findOne({ address: walletAddress });
        userIdentifier = walletAddress;
      }
      
      // If still no user, check cookies
      if (!user) {
        const cookieAddress = request.cookies.get('walletAddress')?.value;
        if (cookieAddress) {
          console.log('Finding user by wallet address from cookie:', cookieAddress);
          user = await User.findOne({ address: cookieAddress });
          userIdentifier = cookieAddress;
        }
      }
    }
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found', 
        identifier: userIdentifier || 'No identifier available',
        message: 'Could not find user with the provided credentials'
      }, { status: 404 });
    }
    
    // Parse the request body
    const { profile_data, role } = await request.json();
    console.log('Updating profile data for user:', user.id, 'with data:', JSON.stringify(profile_data));
    
    // If role is provided and different from current role, reject the request
    if (role && role !== user.role) {
      return NextResponse.json({ 
        error: 'Role change not allowed', 
        message: `You cannot change your role from ${user.role} to ${role}. Each wallet can only have one role.`
      }, { status: 403 });
    }
    
    // Merge the new profile data with existing data to preserve fields
    const updatedProfileData = {
      ...user.profile_data,
      ...profile_data
    };
    
    console.log('Merged profile data:', updatedProfileData);
    
    // Update user document
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { 
        $set: { 
          profile_data: updatedProfileData,
          // Also mark onboarding as completed if it wasn't already
          ...(user.onboarding_completed ? {} : { onboarding_completed: true })
        } 
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      console.error('Failed to update user:', user._id);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
    
    console.log('Updated user profile successfully:', updatedUser.id);
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'User updated successfully',
        user: updatedUser 
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({
      error: 'Failed to update user profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update the middleware options for better production handling
export const GET = withApiMiddleware(getUserHandler, {
  requireAuth: false, // Handle auth in the handler to support multiple auth methods
  connectDb: false, // Handle db connection in the handler
  rateLimitType: 'userMe' // Apply strict rate limits to this frequently called endpoint
});

export const PUT = withApiMiddleware(updateUserHandler, {
  requireAuth: false, // Handle auth in the handler
  connectDb: false, // Handle db connection in the handler
  rateLimitType: 'default' // Regular rate limits for PUT operations
}); 