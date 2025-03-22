import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/ai - List available AI endpoints
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "BlockCreative AI API",
    endpoints: [
      {
        path: "/api/ai/synopsis",
        method: "POST",
        description: "Generate a synopsis for a script submitted to a project",
        parameters: {
          script_id: "ID of the script to generate synopsis for",
          bypass_cache: "Optional boolean to bypass cache"
        }
      },
      {
        path: "/api/writer/scripts/analyze",
        method: "POST",
        description: "Analyze a script for a specific project using AI",
        parameters: {
          content: "Script content (required)",
          projectId: "Project ID (required)",
          title: "Script title",
          logline: "Short logline",
          synopsis: "Full synopsis",
          genre: "Script genre",
          targetAudience: "Target audience"
        },
        documentation: "/api/README.md"
      }
    ],
    documentation: "/api/README.md"
  }, { status: 200 });
} 