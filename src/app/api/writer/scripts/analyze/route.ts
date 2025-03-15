import { NextRequest, NextResponse } from 'next/server';
import { analyzeScript } from '@/lib/ai';
import { withApiMiddleware, validateRequestBody } from '@/lib/api-middleware';

/**
 * POST /api/writer/scripts/analyze - Analyze a script for a writer
 * 
 * This endpoint allows writers to analyze their scripts using AI
 * without needing to submit them to a project first.
 */
export const POST = withApiMiddleware(async (
  request: NextRequest,
  { token }
) => {
  // Parse request body
  const body = await request.json();
  
  // Validate required fields
  const validation = validateRequestBody(body, ['content']);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  
  const { content, title, genrePrompt } = body;

  // Prepare optional context for analysis
  const analysisContext = [];
  if (title) {
    analysisContext.push(`Title: ${title}`);
  }
  if (genrePrompt) {
    analysisContext.push(`Genre/Context: ${genrePrompt}`);
  }

  try {
    // Call AI service to analyze script
    const analysis = await analyzeScript(content, analysisContext);

    if (!analysis.success) {
      return NextResponse.json({ 
        error: 'Failed to analyze script', 
        message: analysis.error 
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Script analyzed successfully',
      analysis: analysis.result
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Error analyzing script', 
      message: error.message 
    }, { status: 500 });
  }
}, {
  requireAuth: true,
  requireRoles: ['writer', 'producer', 'admin'],
  connectDb: false // No database connection needed for analysis
}); 