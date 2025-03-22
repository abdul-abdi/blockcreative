import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models';
import { withApiMiddleware } from '@/lib/api-middleware';
import { v4 as uuidv4 } from 'uuid';

// GET /api/users/me - Get current user info
export async function GET(request: NextRequest) {
  try {
    // Check for wallet address in headers or cookies
    const walletHeader = request.headers.get('x-wallet-address');
    const walletCookie = request.cookies.get('walletAddress')?.value;
    
    // Debugging
    console.log('Cookies present:', !!request.cookies.size);
    console.log('Cookie names:', Array.from(request.cookies.getAll()).map(c => c.name));
    
    // Handle wallet address from header or cookie
    const walletAddress = walletHeader || walletCookie;
    
    if (!walletAddress) {
      console.log('No wallet address provided');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Normalize wallet address to lowercase for case-insensitive matching
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Connect to database
    await connectToDatabase();
    console.log('Connected to database for user lookup');
    
    // Try to find user by wallet address (using normalized lowercase address)
    if (walletHeader) {
      console.log('Fetching user by wallet address (header):', normalizedAddress);
    }
    
    if (walletCookie) {
      console.log('Fetching user by wallet address (cookie):', normalizedAddress);
    }
    
    // Find user with case-insensitive address match
    let user = await User.findOne({ address: normalizedAddress });
    
    // If user not found, check if we should create one
    if (!user) {
      if (walletCookie) {
        console.log('User not found with wallet-cookie:', normalizedAddress);
      }
      if (walletHeader) {
        console.log('User not found with wallet-header:', normalizedAddress);
      }
      
      // Get role from cookie if available
      const roleCookie = request.cookies.get('userRole')?.value;
      if (roleCookie && ['writer', 'producer'].includes(roleCookie)) {
        console.log('Creating new user with role from cookie:', roleCookie);
        user = await createUser(normalizedAddress, roleCookie);
        
        if (!user) {
          return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }
        
        console.log('New user created with ID:', user.id);
      } else {
        // Check if this is for a writer dashboard
        const url = request.nextUrl.pathname;
        if (url.includes('/writer/')) {
          console.log('Writer dashboard detected, creating writer user');
          user = await createUser(normalizedAddress, 'writer');
          
          if (!user) {
            return NextResponse.json({ error: 'Failed to create writer user' }, { status: 500 });
          }
          
          console.log('New writer user created with ID:', user.id);
        } else if (url.includes('/producer/')) {
          console.log('Producer dashboard detected, creating producer user');
          user = await createUser(normalizedAddress, 'producer');
          
          if (!user) {
            return NextResponse.json({ error: 'Failed to create producer user' }, { status: 500 });
          }
          
          console.log('New producer user created with ID:', user.id);
        } else {
          return NextResponse.json({ error: 'User not found and role not specified' }, { status: 404 });
        }
      }
    }
    
    // Return the user data
    return NextResponse.json({ 
      user: {
        id: user.id,
        address: user.address,
        role: user.role,
        profile_data: user.profile_data,
        onboarding_completed: user.onboarding_completed,
        onboarding_step: user.onboarding_step,
        created_at: user.created_at
      } 
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}

// Helper function to create a user
async function createUser(walletAddress: string, role: string) {
  try {
    const userId = uuidv4();
    
    // Set default profile data based on role
    const defaultProfileData = role === 'writer' ? {
      name: '',
      bio: '',
      genres: []
    } : {
      company_name: '',
      bio: ''
    };
    
    // Create a new user
    const newUser = new User({
      id: userId,
      address: walletAddress.toLowerCase(),
      role,
      profile_data: defaultProfileData,
      onboarding_completed: false,
      onboarding_step: 0,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    await newUser.save();
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

// PUT /api/users/me - Update current user
async function updateUserHandler(request: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();
    
    let user = null;
    let userIdentifier = '';
    
    // Try to get user from wallet address in header
    const walletAddress = request.headers.get('x-wallet-address');
    if (walletAddress) {
      // Normalize wallet address to lowercase for consistent lookup
      const normalizedAddress = walletAddress.toLowerCase();
      console.log('Finding user by wallet address from header:', normalizedAddress);
      user = await User.findOne({ address: normalizedAddress });
      userIdentifier = normalizedAddress;
    }
    
    // If no user found by header, try cookie
    if (!user) {
      const cookieAddress = request.cookies.get('walletAddress')?.value;
      if (cookieAddress) {
        // Normalize wallet address to lowercase for consistent lookup
        const normalizedAddress = cookieAddress.toLowerCase();
        console.log('Finding user by wallet address from cookie:', normalizedAddress);
        user = await User.findOne({ address: normalizedAddress });
        userIdentifier = normalizedAddress;
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
    
    // Update profile data if provided
    if (profile_data) {
      // Merge with existing profile data to preserve fields not included in the update
      user.profile_data = {
        ...user.profile_data,
        ...profile_data
      };
    }
    
    // Update role if provided
    if (role && ['writer', 'producer', 'admin'].includes(role)) {
      user.role = role;
    }
    
    // Save the user
    user.updated_at = new Date();
    await user.save();
    
    return NextResponse.json({ 
      message: 'User updated successfully',
      user: {
        id: user.id,
        address: user.address,
        role: user.role,
        profile_data: user.profile_data
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ 
      error: 'Failed to update user',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const PUT = updateUserHandler; 