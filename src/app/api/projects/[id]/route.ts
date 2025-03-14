import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Project, User } from '@/models';
import { getToken } from 'next-auth/jwt';

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
    
    // Connect to the database
    await connectToDatabase();

    // Get project by ID
    const project = await Project.findOne({ id }).select('-__v');
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

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
    
    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();
    
    // Get project
    const project = await Project.findOne({ id });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Check if user is the project owner or admin
    if (project.producer_id !== token.id && token.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Update allowed fields
    const allowedFields = ['title', 'description', 'requirements', 'status'];
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        project[field] = body[field];
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

// DELETE /api/projects/[id] - Delete project (admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Extract the id from the URL
    const id = getProjectIdFromUrl(request.url);
    
    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();
    
    // Get project
    const project = await Project.findOne({ id });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Check if user is the project owner or admin
    if (project.producer_id !== token.id && token.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Only allow deletion if project has no submissions
    // This would require checking the submissions collection
    // For now, we'll just delete the project
    
    await Project.deleteOne({ id });
    
    return NextResponse.json({ 
      message: 'Project deleted successfully' 
    }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting project:`, error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
} 