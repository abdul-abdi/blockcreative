import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models';
import { getToken } from 'next-auth/jwt';
import { v4 as uuidv4 } from 'uuid';

// POST /api/onboarding/writer - Complete writer onboarding
export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Check authentication via multiple methods
    const token = await getToken({ req: request as any });
    
    // Try to find user by token first
    let user = null;
    if (token && token.id) {
      console.log('Looking up user by token ID:', token.id);
      user = await User.findOne({ id: token.id });
    }
    
    // If no user found by token, try wallet address
    if (!user) {
      // Check for wallet address in headers or cookies
      const walletAddress = request.headers.get('x-wallet-address') || 
                           request.cookies.get('walletAddress')?.value;
      
      if (walletAddress) {
        console.log('Looking up user by wallet address:', walletAddress);
        user = await User.findOne({ address: walletAddress });
        
        // If still no user found but we have a wallet address, create a new user
        if (!user && walletAddress) {
          console.log('Creating new user with wallet address:', walletAddress);
          
          // Extract data from request to use for initial profile
          const body = await request.json().catch(() => ({}));
          const initialProfileData = {
            name: body.name || 'Writer User',
            bio: body.bio || '',
            avatar: body.avatar || '',
            website: body.website || body.portfolio_url || '',
            writing_experience: body.writing_experience || '',
            genres: body.genres || [],
            project_types: body.project_types || [],
            social: body.social || { twitter: '', linkedin: '', instagram: '' }
          };
          
          user = new User({
            id: `user_${uuidv4()}`,
            address: walletAddress,
            role: 'writer', // Setting role directly since we're in writer onboarding
            created_at: new Date(),
            profile_data: initialProfileData,
            onboarding_completed: false,
            onboarding_step: 1
          });
          await user.save();
          console.log('New writer user created with ID:', user.id);
          
          // Re-parse the original request for the next steps
          request = new NextRequest(request);
        }
      }
    }
    
    // If we still don't have a user, we can't proceed
    if (!user) {
      console.log('No authentication found - cannot complete onboarding');
      return NextResponse.json({ 
        error: 'Authentication required. Please sign in or connect your wallet.' 
      }, { status: 401 });
    }
    
    // Check if user is trying to onboard with the wrong role
    if (user.role !== 'writer') {
      console.log('Role conflict - user is a', user.role, 'trying to onboard as a writer');
      return NextResponse.json({ 
        error: 'Role conflict', 
        message: `Your account is registered as a ${user.role}. You cannot onboard as a writer.`
      }, { status: 403 });
    }
    
    // Parse request body
    const body = await request.json();
    const { 
      name, 
      bio, 
      avatar, 
      website, 
      writing_experience,
      genres,
      project_types,
      social 
    } = body;

    // Validate required fields
    if (!name || !bio) {
      return NextResponse.json({ 
        error: 'Name and bio are required for writer onboarding' 
      }, { status: 400 });
    }

    // Update user with writer role and profile data
    user.role = 'writer';
    user.profile_data = {
      name,
      bio,
      avatar: avatar || '',
      website: website || '',
      writing_experience: writing_experience || '',
      genres: genres || [],
      project_types: project_types || [],
      social: social || {}
    };

    await user.save();
    
    console.log('Writer profile data saved successfully:', user.profile_data);
    
    // Store information in cookies for persistence across sessions
    const response = NextResponse.json({
      message: 'Writer onboarding completed successfully',
      user: {
        id: user.id,
        address: user.address,
        role: user.role,
        profile_data: user.profile_data
      }
    }, { status: 200 });
    
    // Set cookies for persistent authentication
    response.cookies.set('userRole', 'writer', { 
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax'
    });
    
    if (user.address) {
      response.cookies.set('walletAddress', user.address, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: 'lax'
      });
    }
    
    return response;
  } catch (error) {
    console.error('Error in writer onboarding:', error);
    return NextResponse.json({ 
      error: 'Failed to complete writer onboarding',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 