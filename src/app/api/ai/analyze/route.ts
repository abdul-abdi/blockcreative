import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api-middleware';
import connectToDatabase from '@/lib/mongodb';
import { analyzeScript } from '@/lib/gemini';
import { Script } from '@/models';

/**
 * Analyzes a script with AI, with caching and error handling
 * POST /api/ai/analyze
 */
async function analyzeScriptHandler(
  req: NextRequest, 
  context: { params: any; token?: any; db?: any; user?: any }
) {
  const startTime = Date.now();
  const { user } = context;

  try {
    const body = await req.json();
    const { script_id, bypass_cache } = body;
    
    if (!script_id) {
      return NextResponse.json(
        { error: 'Script ID is required' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Find the script
    const script = await Script.findOne({ id: script_id });
    if (!script) {
      return NextResponse.json(
        { error: 'Script not found', script_id },
        { status: 404 }
      );
    }
    
    // Check if user has permission to analyze this script
    if ((!user || script.writer_id.toString() !== user.id) && (!user || user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'You do not have permission to analyze this script' },
        { status: 403 }
      );
    }
    
    // Use enhanced analyzeScript with caching
    const analysisResult = await analyzeScript(script.content, {
      scriptId: script_id,
      useCache: !bypass_cache,
      cacheTtlSecs: 3600 // Cache for 1 hour by default
    });
    
    // Update the script with analysis results
    script.ai_analysis = analysisResult;
    script.last_analyzed_at = new Date();
    await script.save();
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      message: 'Script analysis completed',
      analysis: analysisResult,
      processing_time_ms: processingTime
    });
  } catch (error) {
    console.error('Error analyzing script:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze script',
        message: error instanceof Error ? error.message : 'Unknown error',
        request_id: crypto.randomUUID()
      },
      { status: 500 }
    );
  }
}

export const POST = withApiMiddleware(analyzeScriptHandler, { 
  requireAuth: true, 
  connectDb: false, // We handle DB connection in the handler
  rateLimitType: 'ai' // Use AI-specific rate limits
});