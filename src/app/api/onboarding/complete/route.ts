import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models';
import { getToken } from 'next-auth/jwt';

// POST /api/onboarding/complete - Mark onboarding as complete
export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Get authentication via multiple methods
    const token = await getToken({ req: request as any });
    
    // Try to find user first by token
    let user = null;
    if (token && token.id) {
      console.log('Looking up user by token ID:', token.id);
      user = await User.findOne({ id: token.id });
    }
    
    // If no user found by token, try wallet address from headers or cookies
    if (!user) {
      const walletAddress = request.headers.get('x-wallet-address') || 
                           request.cookies.get('walletAddress')?.value;
      
      if (walletAddress) {
        console.log('Looking up user by wallet address:', walletAddress);
        user = await User.findOne({ address: walletAddress });
      }
    }
    
    // If still no user, try to get role from request body and wallet from cookies
    if (!user) {
      try {
        const body = await request.json();
        const { role } = body;
        
        const walletAddress = request.cookies.get('walletAddress')?.value;
        
        if (role && walletAddress) {
          console.log(`Looking up ${role} by wallet address:`, walletAddress);
          user = await User.findOne({ 
            address: walletAddress,
            role: role
          });
        }
      } catch (err) {
        console.error('Error parsing request body:', err);
      }
    }
    
    // If we still don't have a user, we can't proceed
    if (!user) {
      console.log('User not found for onboarding completion');
      return NextResponse.json({ 
        error: 'User not found. Please complete onboarding steps first.' 
      }, { status: 404 });
    }
    
    // Update user to mark onboarding as complete
    user.onboarding_completed = true;
    user.onboarding_step = 5; // Completed all steps
    
    await user.save();
    
    // Create response with cookies for persistence
    const response = NextResponse.json({
      message: 'Onboarding completed successfully',
      user: {
        id: user.id,
        role: user.role,
        onboarding_completed: user.onboarding_completed,
        onboarding_step: user.onboarding_step
      }
    }, { status: 200 });
    
    // Set cookies for persistent authentication
    response.cookies.set('userRole', user.role, { 
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax'
    });
    
    response.cookies.set('onboardingCompleted', 'true', {
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
    console.error('Error completing onboarding:', error);
    return NextResponse.json({ 
      error: 'Failed to complete onboarding',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 