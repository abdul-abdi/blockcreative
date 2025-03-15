import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models';
import { getToken } from 'next-auth/jwt';

// PUT /api/users/me/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

    // Find user
    const user = await User.findOne({ id: token.id });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    
    // Update profile fields
    const allowedFields = [
      'name', 
      'bio', 
      'avatar', 
      'website', 
      'company',
      'social'
    ];
    
    // Create or update profile_data object
    user.profile_data = user.profile_data || {};
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        user.profile_data[field] = body[field];
      }
    });
    
    // Save updated user
    await user.save();
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: user.profile_data
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

// GET /api/users/me/profile - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

    // Find user
    const user = await User.findOne({ id: token.id });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      profile: user.profile_data || {},
      role: user.role,
      id: user.id,
      address: user.address
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
} 