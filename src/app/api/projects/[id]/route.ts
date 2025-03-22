import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Project, User } from '@/models';

// Utility function to extract project ID from URL
function getProjectIdFromUrl(url: string): string {
  const pathParts = url.split('/');
  // Find the index of 'projects' and get the next part
  const projectsIndex = pathParts.indexOf('projects');
  return projectsIndex >= 0 ? pathParts[projectsIndex + 1] : '';
}

// GET /api/projects/[id] - Get specific project details
export async function GET(request: NextRequest) {
  try {
    // Extract the id from the URL
    const id = getProjectIdFromUrl(request.url);
    console.log(`Fetching project with ID: ${id}`);
    
    // Connect to the database
    await connectToDatabase();

    // Build query conditions to check multiple ID formats
    const queryConditions: Record<string, any>[] = [
      { id: id },
      { projectId: id }
    ];
    
    // Only add _id condition if it's a valid ObjectId
    const mongoose = await import('mongoose');
    if (mongoose.isValidObjectId(id)) {
      queryConditions.push({ _id: id });
    }
    
    console.log('Project query conditions:', JSON.stringify(queryConditions));
    
    // Get project by ID with multiple possible ID fields
    const project = await Project.findOne({ 
      $or: queryConditions 
    }).select('-__v');
    
    if (!project) {
      console.log(`Project not found with ID: ${id}`);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    console.log(`Found project: ${project.title}, ID: ${project.id}`);
    return NextResponse.json({ project }, { status: 200 });
  } catch (error) {
    console.error(`Error fetching project:`, error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

// PUT /api/projects/[id] - Update project details
export async function PUT(request: NextRequest) {
  try {
    // Extract the id from the URL
    const id = getProjectIdFromUrl(request.url);
    
    // Check authentication via wallet address
    const walletAddress = request.headers.get('x-wallet-address');
    if (!walletAddress) {
      return NextResponse.json({ error: 'Unauthorized - wallet address required' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();
    
    // Get the user by wallet address
    const user = await User.findOne({ address: walletAddress.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get project
    const project = await Project.findOne({ id });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Check if user is the project owner or admin
    if (project.producer_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - you do not have permission to update this project' }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Update allowed fields
    const allowedFields = [
      'title', 
      'description', 
      'requirements', 
      'status',
      'budget',
      'deadline',
      'genre',
      'type'
    ];
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        // Special handling for deadline to convert to Date
        if (field === 'deadline' && body[field]) {
          project[field] = new Date(body[field]);
        } else {
          project[field] = body[field];
        }
      }
    });
    
    // Save updated project
    await project.save();
    
    return NextResponse.json({ 
      message: 'Project updated successfully',
      project 
    }, { status: 200 });
  } catch (error) {
    console.error(`Error updating project:`, error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(request: NextRequest) {
  try {
    // Extract the id from the URL
    const id = getProjectIdFromUrl(request.url);
    
    // Check authentication via wallet address
    const walletAddress = request.headers.get('x-wallet-address');
    if (!walletAddress) {
      return NextResponse.json({ error: 'Unauthorized - wallet address required' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();
    
    // Get the user by wallet address
    const user = await User.findOne({ address: walletAddress.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get project
    const project = await Project.findOne({ id });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Check if user is the project owner or admin
    if (project.producer_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - you do not have permission to delete this project' }, { status: 403 });
    }
    
    // Only allow deletion if project has no submissions or is in draft status
    // This check could be enhanced based on application requirements
    
    await Project.deleteOne({ id });
    
    return NextResponse.json({ 
      message: 'Project deleted successfully' 
    }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting project:`, error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
} 