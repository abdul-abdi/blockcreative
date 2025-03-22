import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Project, User } from '@/models';
import mongoose from 'mongoose';

interface MigrationResult {
  projectId: string;
  status?: string;
  error?: string;
  producer?: {
    id: string;
    address: string;
  };
}

// Migration endpoint to fix project references
export async function GET(request: NextRequest) {
  try {
    // Only allow admin access by checking a special header
    const adminSecret = request.headers.get('x-admin-secret');
    if (adminSecret !== process.env.ADMIN_SECRET && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

    // Get the database and schema directly to bypass model validation initially
    const conn = mongoose.connection;
    const projects = await conn.collection('projects').find({}).toArray();
    
    console.log(`Found ${projects.length} raw projects to migrate`);
    if (projects.length === 0) {
      return NextResponse.json({
        message: 'No projects found to migrate',
        results: { total: 0, updated: 0, failed: 0, notNeeded: 0, details: [] }
      }, { status: 200 });
    }
    
    // Log first project for debugging
    console.log('Sample project:', JSON.stringify(projects[0], null, 2));

    // Track success and failures
    const results = {
      total: projects.length,
      updated: 0,
      failed: 0,
      notNeeded: 0,
      details: [] as MigrationResult[]
    };

    // Process each project
    for (const project of projects) {
      try {
        // Use _id or projectId or id for identification
        const projectId = project.projectId || project.id || project._id?.toString() || 'unknown';
        console.log(`Processing project: ${projectId}`);
        
        // Prepare updates object
        const updates: Record<string, any> = {};
        let needsUpdate = false;

        // Find producer user from existing reference
        let producerUser = null;
        
        if (project.producer) {
          try {
            // Try to find by ObjectId
            producerUser = await User.findById(project.producer);
          } catch (e) {
            console.log(`Could not find producer by _id: ${project.producer}`);
          }
        }
        
        if (!producerUser && project.producer_id) {
          producerUser = await User.findOne({ id: project.producer_id });
        }
        
        if (!producerUser && (project.producer_address || project.producer_wallet)) {
          const address = project.producer_address || project.producer_wallet;
          producerUser = await User.findOne({ address: address.toLowerCase() });
        }

        if (producerUser) {
          // Set producer fields
          updates.producer = producerUser._id;
          updates.producer_id = producerUser.id;
          updates.producer_address = producerUser.address.toLowerCase();
          updates.producer_wallet = producerUser.address.toLowerCase();
          needsUpdate = true;
        } else {
          // If we can't find a producer, use a default one for migration
          const defaultProducer = await User.findOne({ role: 'producer' });
          if (!defaultProducer) {
            results.details.push({
              projectId,
              error: 'No producer found and no default producer available'
            });
            results.failed++;
            continue;
          }
          
          updates.producer = defaultProducer._id;
          updates.producer_id = defaultProducer.id;
          updates.producer_address = defaultProducer.address.toLowerCase();
          updates.producer_wallet = defaultProducer.address.toLowerCase();
          needsUpdate = true;
        }

        // Fix requirements if it's an array
        if (Array.isArray(project.requirements)) {
          updates.requirements = project.requirements.join(', ');
          needsUpdate = true;
        } else if (!project.requirements) {
          updates.requirements = '';
          needsUpdate = true;
        }

        // Fix status if needed
        if (project.status === 'open') {
          updates.status = 'published'; // Map 'open' to 'published'
          needsUpdate = true;
        } else if (!['draft', 'published', 'funded', 'completed', 'cancelled', 'open'].includes(project.status)) {
          updates.status = 'draft';
          needsUpdate = true;
        }
        
        // Ensure projectId exists
        if (!project.projectId) {
          updates.projectId = `project_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
          needsUpdate = true;
        }

        if (!needsUpdate) {
          results.notNeeded++;
          continue;
        }

        // Update the project using the raw collection to bypass validation
        await conn.collection('projects').updateOne(
          { _id: project._id },
          { $set: updates }
        );
        
        results.updated++;
        results.details.push({
          projectId,
          status: 'updated',
          producer: producerUser ? {
            id: producerUser.id,
            address: producerUser.address
          } : undefined
        });
      } catch (error) {
        console.error(`Error updating project:`, error);
        results.failed++;
        results.details.push({
          projectId: 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: 'Migration completed',
      results
    }, { status: 200 });
  } catch (error) {
    console.error('Error in migration script:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 