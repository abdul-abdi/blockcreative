import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models';

// POST /api/onboarding/complete - Mark onboarding as complete
export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Parse body early to get role information if available
    const body = await request.json().catch(() => ({}));
    const { role } = body;
    
    // Find user by wallet address
    let user = null;
    const walletAddress = 
      request.headers.get('x-wallet-address') || 
      request.cookies.get('walletAddress')?.value || 
      body.walletAddress;
    
    if (walletAddress) {
      console.log('Looking up user by wallet address:', walletAddress);
      const query = role ? { address: walletAddress, role } : { address: walletAddress };
      user = await User.findOne(query);
    }
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found', 
        message: 'Could not find user with the provided credentials'
      }, { status: 404 });
    }
    
    // Mark onboarding as complete
    user.onboarding_completed = true;
    user.onboarding_step = body.onboarding_step || 5; // Default to step 5 (complete)
    user.updated_at = new Date();
    
    await user.save();
    
    console.log(`Onboarding completed for user ${user.id}`);
    
    // Return success response
    const response = NextResponse.json({ 
      message: 'Onboarding completed successfully',
      user: {
        id: user.id,
        role: user.role,
        onboarding_completed: user.onboarding_completed
      }
    }, { status: 200 });
    
    return response;
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json({ 
      error: 'Failed to complete onboarding',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 