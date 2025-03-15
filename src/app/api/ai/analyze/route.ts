import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import connectToDatabase from '@/lib/mongodb';
import { analyzeScript } from '@/lib/gemini';
import { Script } from '@/models';

// POST /api/ai/analyze - Analyze a script with Gemini
export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { script_id } = await req.json();
    
    if (!script_id) {
      return NextResponse.json(
        { error: 'Script ID is required' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Find the script
    const script = await Script.findById(script_id);
    if (!script) {
      return NextResponse.json(
        { error: 'Script not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to analyze this script
    if (script.writer_id.toString() !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You do not have permission to analyze this script' },
        { status: 403 }
      );
    }
    
    // Analyze the script with Gemini
    const analysisResult = await analyzeScript(script.content);
    
    // Update the script with analysis results
    script.ai_analysis = analysisResult;
    script.last_analyzed_at = new Date();
    await script.save();
    
    return NextResponse.json({
      message: 'Script analysis completed',
      analysis: analysisResult
    });
  } catch (error) {
    console.error('Error analyzing script:', error);
    return NextResponse.json(
      { error: 'Failed to analyze script' },
      { status: 500 }
    );
  }
}, { requiredRole: ['writer', 'producer', 'admin'] });