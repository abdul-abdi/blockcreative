import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models';
import { getToken } from 'next-auth/jwt';
import { v4 as uuidv4 } from 'uuid';

// Field validation functions
const validateRequiredFields = (data: any) => {
  const requiredFields = ['name', 'bio'];
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      message: `Required fields missing: ${missingFields.join(', ')}`
    };
  }
  
  return { valid: true };
};

// Sanitize and validate data
const sanitizeProfileData = (data: any) => {
  return {
    name: data.name?.trim() || '',
    bio: data.bio?.trim() || '',
    avatar: data.avatar || '',
    website: data.website || data.portfolio_url || '',
    writing_experience: data.writing_experience?.trim() || '',
    genres: Array.isArray(data.genres) ? data.genres.filter(Boolean) : [],
    project_types: Array.isArray(data.project_types) ? data.project_types.filter(Boolean) : [],
    social: {
      twitter: data.social?.twitter?.trim() || '',
      linkedin: data.social?.linkedin?.trim() || '',
      instagram: data.social?.instagram?.trim() || ''
    }
  };
};

// POST /api/onboarding/writer - Complete writer onboarding
export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Get request body for validation
    const body = await request.json().catch(() => ({}));
    
    // Validate required fields early
    const validation = validateRequiredFields(body);
    if (!validation.valid) {
      return NextResponse.json({ 
        error: validation.message 
      }, { status: 400 });
    }
    
    // Sanitize profile data
    const sanitizedProfileData = sanitizeProfileData(body);
    
    // Check authentication via multiple methods
    const token = await getToken({ req: request as any });
    
    // Try to find user by token first
    let user = null;
    if (token && token.id) {
      console.log('Looking up user by token ID:', token.id);
      user = await User.findOne({ id: token.id });
    }
    
    // If no user found by token, try wallet address from headers, cookies, or body
    if (!user) {
      // Check for wallet address in headers, cookies, or request body
      const walletAddress = 
        request.headers.get('x-wallet-address') || 
        request.cookies.get('walletAddress')?.value ||
        body.walletAddress;
      
      if (walletAddress) {
        console.log('Looking up user by wallet address:', walletAddress);
        user = await User.findOne({ address: walletAddress });
        
        // If still no user found but we have a wallet address, create a new user
        if (!user && walletAddress) {
          console.log('Creating new user with wallet address:', walletAddress);
          
          user = new User({
            id: `user_${uuidv4()}`,
            address: walletAddress,
            role: 'writer', // Setting role directly since we're in writer onboarding
            created_at: new Date(),
            profile_data: sanitizedProfileData,
            onboarding_completed: false,
            onboarding_step: 1
          });
          
          try {
            await user.save();
            console.log('New writer user created with ID:', user.id);
          } catch (saveError) {
            console.error('Error saving new user:', saveError);
            return NextResponse.json({ 
              error: 'Failed to create user account', 
              details: saveError instanceof Error ? saveError.message : 'Database error'
            }, { status: 500 });
          }
        }
      }
    }
    
    // If we still don't have a user, check AppKit authentication
    if (!user) {
      try {
        // Check for AppKit authentication signals
        const appKitSession = request.cookies.get('appkit.session')?.value;
        const userEmail = request.cookies.get('userEmail')?.value;
        
        if (appKitSession || userEmail) {
          // We have AppKit session indicators, but no user record yet
          console.log('Possible AppKit authentication detected');
          
          const walletAddress = body.walletAddress || request.headers.get('x-wallet-address');
          
          if (walletAddress) {
            // Create new user with AppKit authentication
            user = new User({
              id: `user_${uuidv4()}`,
              address: walletAddress,
              email: userEmail,
              role: 'writer',
              created_at: new Date(),
              profile_data: sanitizedProfileData,
              onboarding_completed: false,
              onboarding_step: 1
            });
            
            await user.save();
            console.log('New AppKit authenticated user created:', user.id);
          }
        }
      } catch (appKitError) {
        console.error('Error handling AppKit authentication:', appKitError);
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
    
    // Update user with writer profile data
    user.role = 'writer';
    user.profile_data = sanitizedProfileData;
    
    try {
      await user.save();
      console.log('Writer profile data saved successfully:', user.profile_data);
    } catch (updateError) {
      console.error('Error updating user profile:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update profile',
        details: updateError instanceof Error ? updateError.message : 'Database error'
      }, { status: 500 });
    }
    
    // Store information in cookies for persistence across sessions
    const response = NextResponse.json({
      message: 'Writer onboarding data saved successfully',
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