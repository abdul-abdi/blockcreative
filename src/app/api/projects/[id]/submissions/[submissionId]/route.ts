import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Project, Submission } from '@/models';
import { getToken } from 'next-auth/jwt';
import { analyzeScript } from '@/lib/ai';

// Utility function to extract IDs from URL
function extractIdsFromUrl(url: string): { projectId: string; submissionId: string } {
  const pathParts = url.split('/');
  const projectsIndex = pathParts.indexOf('projects');
  const submissionsIndex = pathParts.indexOf('submissions');
  
  return {
    projectId: projectsIndex >= 0 ? pathParts[projectsIndex + 1] : '',
    submissionId: submissionsIndex >= 0 ? pathParts[submissionsIndex + 1] : ''
  };
}

// GET /api/projects/[id]/submissions/[submissionId] - Get specific submission
export async function GET(request: NextRequest) {
  try {
    // Extract IDs from URL
    const { projectId, submissionId } = extractIdsFromUrl(request.url);
    
    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

    // Get submission
    const submission = await Submission.findOne({ 
      id: submissionId,
      project_id: projectId
    }).select('-__v');
    
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Get project
    const project = await Project.findOne({ id: projectId });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user has permission to view this submission
    const isWriter = submission.writer_id === token.id;
    const isProducer = project.producer_id === token.id;
    const isAdmin = token.role === 'admin';

    if (!isWriter && !isProducer && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ submission }, { status: 200 });
  } catch (error) {
    console.error(`Error fetching submission:`, error);
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 });
  }
}

// PUT /api/projects/[id]/submissions/[submissionId] - Update submission
export async function PUT(request: NextRequest) {
  try {
    // Extract IDs from URL
    const { projectId, submissionId } = extractIdsFromUrl(request.url);
    
    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

    // Get submission
    const submission = await Submission.findOne({ 
      id: submissionId,
      project_id: projectId
    });
    
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Get project
    const project = await Project.findOne({ id: projectId });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    
    // Writers can update their own submissions' content and title
    if (token.role === 'writer' && submission.writer_id === token.id) {
      // Only allow updates if submission is still pending
      if (submission.status !== 'pending') {
        return NextResponse.json({ 
          error: 'Cannot update submission that is not in pending status' 
        }, { status: 400 });
      }
      
      // Update allowed fields for writers
      if (body.title) submission.title = body.title;
      if (body.content) {
        submission.content = body.content;
        
        // Re-analyze script with AI if content changed
        try {
          submission.analysis = await analyzeScript(body.content, project.requirements);
        } catch (error) {
          console.error('Error analyzing updated script:', error);
          // Continue without updating analysis if it fails
        }
      }
    } 
    // Producers can update submission status
    else if ((token.role === 'producer' && project.producer_id === token.id) || token.role === 'admin') {
      if (body.status) {
        const validStatuses = ['pending', 'approved', 'rejected'];
        if (!validStatuses.includes(body.status)) {
          return NextResponse.json({ 
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
          }, { status: 400 });
        }
        
        submission.status = body.status;
        
        // Add feedback if provided
        if (body.feedback) {
          submission.feedback = body.feedback;
        }
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Update timestamp
    submission.updated_at = new Date();
    
    // Save updated submission
    await submission.save();
    
    return NextResponse.json({ 
      message: 'Submission updated successfully',
      submission 
    }, { status: 200 });
  } catch (error) {
    console.error(`Error updating submission:`, error);
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/submissions/[submissionId] - Delete submission
export async function DELETE(request: NextRequest) {
  try {
    // Extract IDs from URL
    const { projectId, submissionId } = extractIdsFromUrl(request.url);
    
    // Check authentication
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

    // Get submission
    const submission = await Submission.findOne({ 
      id: submissionId,
      project_id: projectId
    });
    
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Check if user has permission to delete this submission
    const isWriter = submission.writer_id === token.id;
    const isAdmin = token.role === 'admin';

    if (!isWriter && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Writers can only delete their own pending submissions
    if (isWriter && submission.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Cannot delete submission that is not in pending status' 
      }, { status: 400 });
    }

    // Delete submission
    await Submission.deleteOne({ id: submissionId });
    
    return NextResponse.json({ 
      message: 'Submission deleted successfully' 
    }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting submission:`, error);
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 });
  }
} 