import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api-middleware';

/**
 * GET /api/test - Test API endpoint
 * 
 * This endpoint is used to test the API middleware and database connection.
 * It returns the current server time and database connection status.
 */
export const GET = withApiMiddleware(async (
  request: NextRequest,
  { db }
) => {
  return NextResponse.json({
    message: 'API is working',
    time: new Date().toISOString(),
    dbConnected: !!db,
    usingMockDb: db && db !== true,
    mockData: db && db !== true ? {
      userCount: db.users ? 2 : 0,
      projectCount: db.projects ? 2 : 0,
      submissionCount: db.submissions ? 1 : 0
    } : null,
    systemInfo: {
      nodeVersion: process.version,
      nextVersion: process.env.NEXT_RUNTIME || 'N/A'
    }
  }, { status: 200 });
}, {
  requireAuth: false,
  connectDb: true
}); 