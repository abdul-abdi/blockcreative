import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models';
import { getToken } from 'next-auth/jwt';
import { v4 as uuidv4 } from 'uuid';

// POST /api/onboarding/producer - Complete producer onboarding
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
          console.log('Creating new producer with wallet address:', walletAddress);
          
          // Extract data from request to use for initial profile
          const body = await request.json().catch(() => ({}));
          const initialProfileData = {
            name: body.name || 'Producer User',
            bio: body.bio || '',
            avatar: body.avatar || '',
            website: body.company_website || '',
            company: body.company_name || 'Production Company',
            team_size: body.team_size || '',
            budget_range: body.budget_range || '',
            industry: body.industry || 'Entertainment',
            location: body.location || '',
            phone: body.phone || '',
            social: body.social || { twitter: '', linkedin: '', instagram: '' }
          };
          
          user = new User({
            id: `user_${uuidv4()}`,
            address: walletAddress,
            role: 'producer', // Setting role directly since we're in producer onboarding
            created_at: new Date(),
            profile_data: initialProfileData,
            onboarding_completed: false,
            onboarding_step: 1
          });
          await user.save();
          console.log('New producer user created with ID:', user.id);
          
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
    if (user.role !== 'producer') {
      console.log('Role conflict - user is a', user.role, 'trying to onboard as a producer');
      return NextResponse.json({ 
        error: 'Role conflict', 
        message: `Your account is registered as a ${user.role}. You cannot onboard as a producer.`
      }, { status: 403 });
    }
    
    // Parse request body
    const body = await request.json();
    const { 
      name, 
      bio, 
      avatar, 
      company_name,
      company_website,
      social,
      team_size,
      budget_range,
      industry,
      location,
      phone 
    } = body;

    // Validate required fields
    if (!name || !bio || !company_name) {
      return NextResponse.json({ 
        error: 'Name, bio, and company name are required for producer onboarding' 
      }, { status: 400 });
    }

    // Update user with producer role and profile data
    user.role = 'producer';
    user.profile_data = {
      name,
      bio,
      avatar: avatar || '',
      website: company_website || '',
      company: company_name,
      team_size: team_size || '',
      budget_range: budget_range || '',
      industry: industry || 'Entertainment',
      location: location || '',
      phone: phone || '',
      social: social || {}
    };

    await user.save();
    
    console.log('Producer profile data saved:', user.profile_data);
    
    // Store information in cookies for persistence across sessions
    const response = NextResponse.json({
      message: 'Producer onboarding completed successfully',
      user: {
        id: user.id,
        address: user.address,
        role: user.role,
        profile_data: user.profile_data
      }
    }, { status: 200 });
    
    // Set cookies for persistent authentication
    response.cookies.set('userRole', 'producer', { 
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
    console.error('Error in producer onboarding:', error);
    return NextResponse.json({ error: 'Failed to complete producer onboarding' }, { status: 500 });
  }
} 