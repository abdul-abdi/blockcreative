import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api-middleware';
import connectToDatabase from '@/lib/mongodb';
import { generateSynopsis } from '@/lib/gemini';
import { Script } from '@/models';

/**
 * Generates a synopsis for a script using AI
 * POST /api/ai/synopsis
 * 
 * Request body:
 * {
 *   script_id: string,
 *   bypass_cache?: boolean
 * }
 */
async function generateSynopsisHandler(
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
    
    // Check if user has permission to generate synopsis for this script
    if ((!user || script.writer_id.toString() !== user.id) && (!user || user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'You do not have permission to generate synopsis for this script' },
        { status: 403 }
      );
    }
    
    // Generate synopsis using Gemini API
    const synopsisResponse = await generateSynopsis(script.content, {
      scriptId: script_id,
      useCache: !bypass_cache,
      existingTitle: script.title
    });
    
    if (!synopsisResponse.success || !synopsisResponse.result) {
      return NextResponse.json(
        { 
          error: 'Failed to generate synopsis',
          message: synopsisResponse.error || 'Unknown error'
        },
        { status: 500 }
      );
    }
    
    // Update the script with synopsis results
    script.ai_synopsis = {
      logline: synopsisResponse.result.logline,
      synopsis: synopsisResponse.result.synopsis,
      tone: synopsisResponse.result.tone,
      themes: synopsisResponse.result.themes,
      title_suggestion: synopsisResponse.result.title_suggestion,
      target_audience: synopsisResponse.result.target_audience,
      generated_at: new Date()
    };
    script.last_synopsis_at = new Date();
    await script.save();
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      message: 'Synopsis generation completed',
      synopsis: script.ai_synopsis,
      processing_time_ms: processingTime
    });
  } catch (error) {
    console.error('Error generating synopsis:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate synopsis',
        message: error instanceof Error ? error.message : 'Unknown error',
        request_id: crypto.randomUUID()
      },
      { status: 500 }
    );
  }
}

export const POST = withApiMiddleware(generateSynopsisHandler, { 
  requireAuth: true, 
  connectDb: false, // We handle DB connection in the handler
  rateLimitType: 'ai' // Use AI-specific rate limits
});