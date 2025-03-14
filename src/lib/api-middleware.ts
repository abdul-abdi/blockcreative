import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectToDatabase from './mongodb';
import mockDbService from './mock-db';
import { rateLimit, configureRateLimits } from './rateLimit';

// Define API handler type
type ApiHandler = (
  req: NextRequest,
  context: { params: any; token?: any; db?: any }
) => Promise<NextResponse>;

// Configure rate limits for different endpoint types
const rateLimits = configureRateLimits();

/**
 * API middleware to handle authentication, database connection, and error handling
 * @param handler The API route handler function
 * @param options Options for the middleware
 * @returns The wrapped handler function
 */
export function withApiMiddleware(
  handler: ApiHandler,
  options: {
    requireAuth?: boolean;
    requireRoles?: ('writer' | 'producer' | 'admin')[];
    connectDb?: boolean;
    rateLimitType?: 'default' | 'userMe' | 'submission';
  } = {
    requireAuth: true,
    connectDb: true,
    rateLimitType: 'default'
  }
) {
  return async function (req: NextRequest, { params }: { params: any }) {
    try {
      // Apply rate limiting based on endpoint type
      const rateLimitType = options.rateLimitType || 'default';
      const rateLimitOptions = rateLimits[rateLimitType];
      const rateLimitResult = rateLimit(req, rateLimitOptions);
      
      // Check if rate limit is exceeded
      if (rateLimitResult.limited) {
        return NextResponse.json({ 
          error: 'Rate limit exceeded', 
          message: rateLimitResult.message 
        }, { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitOptions.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Math.floor(Date.now() / 1000) + Math.floor(rateLimitOptions.windowMs / 1000)).toString(),
          }
        });
      }
      
      // Handle authentication if required
      let token = null;
      if (options.requireAuth) {
        token = await getToken({ req: req as any });
        if (!token) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check role requirements if specified
        if (options.requireRoles && options.requireRoles.length > 0) {
          if (!token.role || !options.requireRoles.includes(token.role as any)) {
            return NextResponse.json({
              error: `Access denied. Required role: ${options.requireRoles.join(' or ')}`
            }, { status: 403 });
          }
        }
      }

      // Connect to database if needed
      let db = null;
      if (options.connectDb) {
        try {
          await connectToDatabase();
          // In a real app, you would use Mongoose models directly
          // For now, we'll just set db to true to indicate successful connection
          db = true;
        } catch (error) {
          console.warn('Using mock database service due to connection error:', error);
          // Use mock database service when MongoDB connection fails
          db = mockDbService;
        }
      }

      // Call the handler with authenticated token and database
      const response = await handler(req, { params, token, db });
      
      // Add rate limit headers to the response
      response.headers.set('X-RateLimit-Limit', rateLimitOptions.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', (Math.floor(Date.now() / 1000) + Math.floor(rateLimitOptions.windowMs / 1000)).toString());

      return response;
    } catch (error) {
      console.error('API Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      return NextResponse.json({
        error: 'Internal Server Error',
        message: errorMessage
      }, { status: 500 });
    }
  };
}

/**
 * Validate request body against a schema
 * @param body Request body
 * @param requiredFields Array of required field names
 * @returns Object with validation result
 */
export function validateRequestBody(body: any, requiredFields: string[]) {
  const missingFields = requiredFields.filter(field => 
    body[field] === undefined || body[field] === null || body[field] === ''
  );
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`,
    };
  }
  
  return { valid: true };
} 