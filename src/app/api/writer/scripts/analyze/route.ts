import { NextRequest, NextResponse } from 'next/server';
import { analyzeScript, AIScriptAnalysis } from '@/lib/ai';
import { getToken } from 'next-auth/jwt';
import { withApiMiddleware } from '@/lib/api-middleware';
import connectToDatabase from '@/lib/mongodb';
import { Project, Script } from '@/models';

/**
 * POST /api/writer/scripts/analyze - Analyze a script for a writer
 * 
 * This endpoint allows writers to analyze their scripts using AI.
 * It can accept either direct script content or a script ID.
 * 
 * Request body options:
 * 1. Content-based analysis:
 *    { content, projectId, title, logline, synopsis, genre, targetAudience }
 * 
 * 2. Script ID-based analysis:
 *    { script_id, bypass_cache }
 */
const analyzeScriptHandler = async (
  request: NextRequest,
  context: { params: any; token?: any; db?: any; user?: any; }
) => {
  const startTime = Date.now();
  try {
    // Parse request body
    const body = await request.json();
    const { 
      content, 
      projectId, 
      title, 
      logline, 
      synopsis, 
      genre, 
      targetAudience,
      script_id,
      bypass_cache 
    } = body;
    
    // Handle script ID-based analysis (from /api/ai/analyze)
    if (script_id) {
      await connectToDatabase();
      
      // Find the script
      const script = await Script.findOne({ id: script_id });
      if (!script) {
        return NextResponse.json({ 
          error: 'Script not found',
          script_id 
        }, { status: 404 });
      }
      
      // Check if user has permission to analyze this script
      if (context.user && script.writer_id.toString() !== context.user.id && context.user.role !== 'admin') {
        return NextResponse.json({ 
          error: 'You do not have permission to analyze this script' 
        }, { status: 403 });
      }
      
      // Use AI to analyze script with caching
      const analysisResult = await analyzeScript(script.content, [
        `Script ID: ${script_id}`,
        ...(script.title ? [`Title: ${script.title}`] : [])
      ]);
      
      if (!analysisResult.success) {
        return NextResponse.json({ 
          error: 'Failed to analyze script',
          message: analysisResult.error 
        }, { status: 500 });
      }
      
      // Update the script with analysis results
      script.ai_analysis = analysisResult.result;
      script.last_analyzed_at = new Date();
      await script.save();
      
      // Calculate processing time
      const processingTime = Date.now() - startTime;
      
      return NextResponse.json({
        success: true,
        message: 'Script analysis completed',
        result: analysisResult.result,
        processing_time_ms: processingTime
      }, { status: 200 });
    }
    
    // Handle content-based analysis
    if (!content) {
      return NextResponse.json({ 
        error: 'Script content is required when not using script_id' 
      }, { status: 400 });
    }
    
    // Prepare analysis context
    const analysisContext: string[] = [];
    
    // If a project ID is provided, fetch project requirements
    if (projectId) {
      try {
        await connectToDatabase();
        const project = await Project.findOne({ id: projectId });
        
        if (project) {
          analysisContext.push(`Project: ${project.title}`);
          
          if (project.genre) {
            analysisContext.push(`Genre: ${project.genre}`);
          }
          
          // Add project requirements if available
          if (project.requirements) {
            analysisContext.push(`Requirements:`);
            if (Array.isArray(project.requirements)) {
              project.requirements.forEach((req: string) => {
                analysisContext.push(`- ${req}`);
              });
            } else if (typeof project.requirements === 'string') {
              analysisContext.push(`- ${project.requirements}`);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching project details:', error);
        // Continue without project details if there's an error
      }
    }
    
    // Add script metadata to context
    if (title) analysisContext.push(`Title: ${title}`);
    if (logline) analysisContext.push(`Logline: ${logline}`);
    if (synopsis) analysisContext.push(`Synopsis: ${synopsis}`);
    if (genre) analysisContext.push(`Genre: ${genre}`);
    if (targetAudience) analysisContext.push(`Target Audience: ${targetAudience}`);
    
    // Limit the content size to 15000 characters for Gemini API free tier
    const truncatedContent = content.substring(0, 15000);
    
    // Analyze script with optimized context
    try {
      const analysis = await analyzeScript(truncatedContent, analysisContext);
      
      if (!analysis.success) {
        // Enhance error handling with specific messages for common Gemini API errors
        if (analysis.error && typeof analysis.error === 'string') {
          if (analysis.error.includes('GoogleGenerativeAI') || 
              analysis.error.includes('gemini') || 
              analysis.error.includes('Error fetching from https://generativelanguage.googleapis.com')) {
            console.error('Gemini API configuration error:', analysis.error);
            return NextResponse.json({ 
              error: 'AI service unavailable',
              message: 'The AI analysis service is currently unavailable. Please try again later or use the fallback analysis.',
              details: process.env.NODE_ENV === 'development' ? analysis.error : undefined
            }, { status: 503 }); // Service Unavailable
          }
          
          if (analysis.error.includes('404 Not Found') || analysis.error.includes('not found for API version')) {
            console.error('Gemini model not found:', analysis.error);
            return NextResponse.json({ 
              error: 'AI model not found',
              message: 'The required AI model is not available. Please use the fallback analysis or contact support.',
              details: process.env.NODE_ENV === 'development' ? analysis.error : undefined
            }, { status: 404 });
          }
        }
        
        return NextResponse.json({ 
          error: 'Failed to analyze script',
          message: analysis.error 
        }, { status: 500 });
      }
      
      // Calculate processing time
      const processingTime = Date.now() - startTime;
      
      return NextResponse.json({
        success: true,
        result: analysis.result,
        processing_time_ms: processingTime
      }, { status: 200 });
    } catch (error) {
      console.error('Error analyzing script:', error);
      
      // Enhanced error handling for specific error types
      if (error instanceof Error) {
        const errorMsg = error.message;
        
        if (errorMsg.includes('GoogleGenerativeAI') || 
            errorMsg.includes('gemini') || 
            errorMsg.includes('Error fetching from https://generativelanguage.googleapis.com')) {
          return NextResponse.json({ 
            error: 'AI service error',
            message: 'The AI analysis service is experiencing technical difficulties. Please try again later or use the fallback analysis.',
            details: process.env.NODE_ENV === 'development' ? errorMsg : undefined
          }, { status: 503 });
        }
        
        if (errorMsg.includes('404 Not Found') || errorMsg.includes('not found for API version')) {
          return NextResponse.json({ 
            error: 'AI model not found',
            message: 'The required AI model is not available. Please use the fallback analysis or contact support.',
            details: process.env.NODE_ENV === 'development' ? errorMsg : undefined
          }, { status: 404 });
        }
      }
      
      // Generic error response
      return NextResponse.json({ 
        error: 'Failed to analyze script',
        message: error instanceof Error ? error.message : 'Unknown error',
        request_id: crypto.randomUUID()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error analyzing script:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze script',
      message: error instanceof Error ? error.message : 'Unknown error',
      request_id: crypto.randomUUID()
    }, { status: 500 });
  }
};

// Export handler with API middleware
export const POST = withApiMiddleware(analyzeScriptHandler, {
  requireAuth: false,
  connectDb: false // We connect manually only if needed
}); 