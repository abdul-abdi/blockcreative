import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Project, User, Submission } from '@/models';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Debug endpoint to inspect MongoDB data
export async function GET(request: NextRequest) {
  try {
    // Check authentication via wallet address
    const walletAddress = request.headers.get('x-wallet-address');
    if (!walletAddress) {
      return NextResponse.json({ error: 'Unauthorized - wallet address required' }, { status: 401 });
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Special admin options
    const listProducers = request.nextUrl.searchParams.get('list_producers') === 'true';
    if (listProducers) {
      const producers = await User.find({ role: 'producer' }).select('id address role profile_data');
      return NextResponse.json({
        producers: producers.map(p => ({
          id: p.id,
          _id: p._id.toString(),
          address: p.address,
          company: p.profile_data?.company_name || 'Unknown'
        }))
      }, { status: 200 });
    }
    
    // Check if create_user is requested
    const createUser = request.nextUrl.searchParams.get('create_user') === 'true';
    if (createUser) {
      // Check if user already exists
      let user = await User.findOne({ address: walletAddress.toLowerCase() });
      
      if (!user) {
        // Create new user with role producer
        const newUser = new User({
          id: `user_${Date.now()}`,
          address: walletAddress.toLowerCase(),
          role: 'producer',
          onboarding_completed: true,
          profile_data: {
            name: `Producer ${walletAddress.substring(0, 6)}`,
            company_name: 'BlockCreative'
          },
          created_at: new Date(),
          updated_at: new Date()
        });
        
        await newUser.save();
        
        return NextResponse.json({
          message: 'User created successfully',
          user: {
            id: newUser.id,
            _id: newUser._id.toString(),
            address: newUser.address,
            role: newUser.role
          }
        });
      } else {
        return NextResponse.json({
          message: 'User already exists',
          user: {
            id: user.id,
            _id: user._id.toString(),
            address: user.address,
            role: user.role
          }
        });
      }
    }
    
    // Check if this is a fix request
    const fix = request.nextUrl.searchParams.get('fix') === 'true';
    const fixForUser = request.nextUrl.searchParams.get('fix_for_user');

    // Find the user by wallet address or specified user ID
    let user;
    if (fixForUser) {
      user = await User.findOne({ id: fixForUser });
      if (!user) {
        user = await User.findOne({ _id: fixForUser });
      }
    } else {
      user = await User.findOne({ 
        address: walletAddress.toLowerCase()
      });
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Log the user details
    console.log('Debug: User found', {
      id: user.id,
      _id: user._id,
      address: user.address,
      role: user.role
    });

    // Find all projects regardless of producer to check schema
    const sampleProjects = await Project.find().limit(5);
    console.log('Debug: Sample projects', JSON.stringify(sampleProjects, null, 2));

    // Find projects for this producer with various queries to see which works
    const projectsByProducerId = await Project.find({ producer_id: user.id }).limit(10);
    const projectsByProducerObjectId = await Project.find({ producer: user._id }).limit(10);
    const projectsByAddress = await Project.find({ 
      $or: [
        { producer_address: user.address.toLowerCase() },
        { producer_wallet: user.address.toLowerCase() }
      ]
    }).limit(10);
    
    // Find all submissions to check schema
    const sampleSubmissions = await Submission.find().limit(5);
    
    // If fix is requested, associate projects with this user
    let fixResults = null;
    if (fix && user.role === 'producer') {
      fixResults = {
        updated: 0,
        errors: 0,
        messages: [] as string[]
      };
      
      try {
        // Find the MongoDB collection directly
        const conn = mongoose.connection;
        const projectsCollection = conn.collection('projects');
        
        // If fixForUser is specified, repair all projects for that user
        if (fixForUser) {
          // Get all projects
          const projectsToFix = await projectsCollection.find().toArray();
          fixResults.messages.push(`Checking ${projectsToFix.length} projects for repair`);
          
          // Update a random sample of 5 projects (for testing)
          const projectsToUpdate = projectsToFix.slice(0, 5);
          
          for (const project of projectsToUpdate) {
            try {
              // Update the project with producer & producer_id fields
              await projectsCollection.updateOne(
                { _id: project._id },
                { 
                  $set: {
                    producer: user._id,
                    producer_id: user.id,
                    producer_address: user.address.toLowerCase(),
                    producer_wallet: user.address.toLowerCase()
                  }
                }
              );
              
              fixResults.updated++;
              fixResults.messages.push(`Updated project: ${project.title || 'Untitled'} (${project._id})`);
            } catch (err: any) {
              fixResults.errors++;
              fixResults.messages.push(`Error updating project ${project._id}: ${err.message}`);
            }
          }
        } else {
          // First, look for any projects matching this producer's address
          const projectsToFix = await projectsCollection.find({
            $or: [
              { producer_address: user.address.toLowerCase() },
              { producer_wallet: user.address.toLowerCase() }
            ]
          }).toArray();
          
          fixResults.messages.push(`Found ${projectsToFix.length} projects to fix`);
          
          if (projectsToFix.length > 0) {
            for (const project of projectsToFix) {
              try {
                // Update the project with producer & producer_id fields
                await projectsCollection.updateOne(
                  { _id: project._id },
                  { 
                    $set: {
                      producer: user._id,
                      producer_id: user.id
                    }
                  }
                );
                
                fixResults.updated++;
                fixResults.messages.push(`Updated project: ${project.title || 'Untitled'} (${project._id})`);
              } catch (err: any) {
                fixResults.errors++;
                fixResults.messages.push(`Error updating project ${project._id}: ${err.message}`);
              }
            }
          }
        }
      } catch (err: any) {
        fixResults.messages.push(`Error in fix operation: ${err.message}`);
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        _id: user._id.toString(),
        address: user.address,
        role: user.role
      },
      projectCounts: {
        byProducerId: projectsByProducerId.length,
        byProducerObjectId: projectsByProducerObjectId.length,
        byAddress: projectsByAddress.length
      },
      sampleProjects: sampleProjects.map(p => ({
        id: p._id.toString(),
        projectId: p.projectId,
        _id: p._id.toString(),
        producer: typeof p.producer === 'object' ? p.producer.toString() : p.producer,
        producer_id: p.producer_id || 'not_set',
        title: p.title
      })),
      sampleSubmissions: sampleSubmissions.map(s => ({
        id: s.id,
        _id: s._id.toString(),
        project_id: s.project_id,
        writer_id: s.writer_id
      })),
      fixResults
    }, { status: 200 });
  } catch (error) {
    console.error('Error in MongoDB debug endpoint:', error);
    return NextResponse.json({ error: 'Failed to debug MongoDB data' }, { status: 500 });
  }
} 