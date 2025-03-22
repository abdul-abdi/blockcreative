import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User, Project } from '@/models';

// GET /api/debug/fix-producer-refs - Inspect and fix producer references in projects
export async function GET(request: NextRequest) {
  try {
    // Check authentication via wallet address header
    const walletAddress = request.headers.get('x-wallet-address');
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

    // Find the user with the provided wallet address
    const user = await User.findOne({ address: walletAddress.toLowerCase() });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is authorized (admin or producer)
    if (user.role !== 'admin' && user.role !== 'producer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get query parameters
    const dryRun = request.nextUrl.searchParams.get('dryRun') === 'true';
    const fix = request.nextUrl.searchParams.get('fix') === 'true';
    const targetWallet = request.nextUrl.searchParams.get('wallet') || walletAddress;

    // Normalize the wallet address (lowercase)
    const normalizedWallet = targetWallet.toLowerCase();

    // Find the target user
    const targetUser = await User.findOne({ address: normalizedWallet });
    
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Find all projects without producer_address or producer_wallet
    const incompleteProjects = await Project.find({
      $or: [
        { producer_address: { $exists: false } },
        { producer_address: null },
        { producer_wallet: { $exists: false } },
        { producer_wallet: null }
      ]
    });

    // If dryRun, just report findings
    if (dryRun) {
      return NextResponse.json({
        message: 'Dry run completed',
        incompleteProjectsCount: incompleteProjects.length,
        targetUser: {
          id: targetUser.id,
          address: targetUser.address,
          role: targetUser.role
        },
        sampleProjects: incompleteProjects.slice(0, 5)
      }, { status: 200 });
    }

    // If fix parameter is true, fix the producer references
    if (fix) {
      // Find projects with matching producer or producer_id 
      const matchingProjects = await Project.find({
        $or: [
          { producer: targetUser._id },
          { producer_id: targetUser.id }
        ]
      });

      const results = {
        updated: 0,
        errors: 0,
        details: [] as Array<{
          projectId: string;
          title: string;
          status: string;
          error?: string;
        }>
      };

      // Update each matching project
      for (const project of matchingProjects) {
        try {
          project.producer_address = normalizedWallet;
          project.producer_wallet = normalizedWallet;
          await project.save();
          results.updated++;
          results.details.push({
            projectId: project.id,
            title: project.title,
            status: 'updated'
          });
        } catch (error) {
          results.errors++;
          results.details.push({
            projectId: project.id,
            title: project.title,
            status: 'error',
            error: (error as Error).message
          });
        }
      }

      return NextResponse.json({
        message: 'Producer references fixed',
        results,
        targetUser: {
          id: targetUser.id,
          address: targetUser.address,
          role: targetUser.role
        }
      }, { status: 200 });
    }

    // Return information about incomplete projects
    return NextResponse.json({
      message: 'No actions performed',
      incompleteProjectsCount: incompleteProjects.length,
      help: 'Use ?fix=true to update producer references or ?dryRun=true to see what would be fixed'
    }, { status: 200 });
  } catch (error) {
    console.error('Error in fix-producer-refs:', error);
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: (error as Error).message
    }, { status: 500 });
  }
} 