import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models';
import { getToken } from 'next-auth/jwt';

// Utility function to extract user ID from URL
function getUserIdFromUrl(url: string): string {
  const pathParts = url.split('/');
  const usersIndex = pathParts.indexOf('users');
  return usersIndex >= 0 ? pathParts[usersIndex + 1] : '';
}

// GET /api/users/[id] - Get specific user details
export async function GET(request: NextRequest) {
  try {
    // Extract user ID from URL
    const id = getUserIdFromUrl(request.url);
    
    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

    // Get user by ID
    const user = await User.findOne({ id }).select('-__v');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error(`Error fetching user:`, error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update user information
export async function PUT(request: NextRequest) {
  try {
    // Extract user ID from URL
    const id = getUserIdFromUrl(request.url);
    
    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Make sure user can only update their own data unless they're admin
    if (token.id !== id && token.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Connect to the database
    await connectToDatabase();
    
    const body = await request.json();
    
    // Find user and update
    const user = await User.findOne({ id });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Update fields that can be changed
    if (body.profile_data) {
      user.profile_data = { 
        ...user.profile_data, 
        ...body.profile_data 
      };
    }
    
    if (body.onboarding_completed !== undefined) {
      user.onboarding_completed = body.onboarding_completed;
    }
    
    if (body.onboarding_step !== undefined) {
      user.onboarding_step = body.onboarding_step;
    }
    
    // Save updated user
    await user.save();
    
    return NextResponse.json({ 
      message: 'User updated successfully',
      user 
    }, { status: 200 });
  } catch (error) {
    console.error(`Error updating user:`, error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete user (admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Extract user ID from URL
    const id = getUserIdFromUrl(request.url);
    
    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token || token.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();
    
    // Delete user
    const result = await User.deleteOne({ id });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: 'User deleted successfully' 
    }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting user:`, error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
} 