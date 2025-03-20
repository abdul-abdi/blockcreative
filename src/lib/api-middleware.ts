import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectToDatabase from './mongodb';
import mockDbService from './mock-db';
import { rateLimit, configureRateLimits } from './rateLimit';
import { getSessionCookieName } from './session-helper';

// Define API handler type
type ApiHandler = (
  req: NextRequest,
  context: { params: any; token?: any; db?: any; user?: any }
) => Promise<NextResponse>;

// Configure rate limits for different endpoint types
const rateLimits = configureRateLimits();

// Define supported rate limit types
type RateLimitType = 'default' | 'userMe' | 'submission' | 'auth' | 'ai' | 'blockchain';

/**
 * Enhanced API middleware to handle authentication, database connection, and error handling
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
    rateLimitType?: RateLimitType;
    skipRetryOnFailure?: boolean;
  } = {
    requireAuth: true,
    connectDb: true,
    rateLimitType: 'default',
    skipRetryOnFailure: false
  }
) {
  return async function (req: NextRequest, { params }: { params: any }) {
    try {
      // Request start time for performance tracking
      const requestStartTime = Date.now();
      
      // Apply rate limiting based on endpoint type
      const rateLimitType = options.rateLimitType || 'default';
      const rateLimitOptions = rateLimits[rateLimitType as keyof typeof rateLimits];
      const rateLimitResult = rateLimit(req, rateLimitOptions);
      
      // Check if rate limit is exceeded
      if (rateLimitResult.limited) {
        return NextResponse.json({ 
          error: 'Rate limit exceeded', 
          message: rateLimitResult.message,
          retryAfter: Math.ceil(rateLimitOptions.windowMs / 1000)
        }, { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitOptions.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Math.floor(Date.now() / 1000) + Math.floor(rateLimitOptions.windowMs / 1000)).toString(),
            'Retry-After': Math.ceil(rateLimitOptions.windowMs / 1000).toString()
          }
        });
      }
      
      // Handle authentication if required
      let token = null;
      let user = null;
      
      if (options.requireAuth) {
        // Get the session cookie name based on environment
        const cookieName = getSessionCookieName();
        
        // Log more details in development or when debugging is enabled
        if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_AUTH === 'true') {
          console.log('API Auth Debug:');
          console.log('- Environment:', process.env.NODE_ENV);
          console.log('- Cookie Name:', cookieName);
          console.log('- Auth Required:', options.requireAuth);
          console.log('- Cookies Present:', req.cookies.size > 0);
          if (req.cookies.size > 0) {
            // Use getAll() to safely access cookies in Next.js RequestCookies
            const cookieNames = Array.from(req.cookies.getAll(), cookie => cookie.name);
            console.log('- Cookies:', cookieNames);
          }
        }
        
        // More robust token retrieval with explicit options
        token = await getToken({ 
          req: req as any,
          secret: process.env.NEXTAUTH_SECRET,
          secureCookie: process.env.NODE_ENV === 'production'
        });
        
        // Try alternative authentication methods if token is not available
        if (!token) {
          // Check for wallet address in headers
          const walletAddress = req.headers.get('x-wallet-address');
          
          if (walletAddress) {
            // For development/debugging
            if (process.env.NODE_ENV !== 'production') {
              console.log('Using wallet address for authentication:', walletAddress);
            }
            
            // Connect to database to retrieve user by wallet address
            if (options.connectDb) {
              await connectToDatabase();
              const { User } = await import('@/models');
              user = await User.findOne({ address: walletAddress });
              
              if (user) {
                // Create a simplified token for the middleware
                token = {
                  id: user.id,
                  role: user.role,
                  address: walletAddress
                };
              }
            }
          }
          
          // If still no auth, check cookies as last resort
          if (!token) {
            const cookieAddress = req.cookies.get('walletAddress')?.value;
            
            if (cookieAddress) {
              // For development/debugging
              if (process.env.NODE_ENV !== 'production') {
                console.log('Using cookie wallet address for authentication:', cookieAddress);
              }
              
              // Connect to database to retrieve user by cookie wallet address
              if (options.connectDb) {
                await connectToDatabase();
                const { User } = await import('@/models');
                user = await User.findOne({ address: cookieAddress });
                
                if (user) {
                  // Create a simplified token for the middleware
                  token = {
                    id: user.id,
                    role: user.role,
                    address: cookieAddress
                  };
                }
              }
            }
          }
          
          // If still no authentication after all attempts
          if (!token) {
            // For debugging - log additional information
            if (process.env.NODE_ENV !== 'production') {
              console.log('No auth token found for request to:', req.url);
            }
            
            return NextResponse.json({ 
              error: 'Unauthorized', 
              message: 'Authentication required for this resource' 
            }, { 
              status: 401,
              headers: {
                'WWW-Authenticate': 'Bearer'
              }
            });
          }
        }

        // Check role requirements if specified
        if (options.requireRoles && options.requireRoles.length > 0) {
          if (!token.role || !options.requireRoles.includes(token.role as any)) {
            return NextResponse.json({
              error: 'Forbidden',
              message: `Access denied. Required role: ${options.requireRoles.join(' or ')}`
            }, { status: 403 });
          }
        }
      }

      // Connect to database if needed
      let db = null;
      if (options.connectDb) {
        try {
          await connectToDatabase();
          db = true;
          
          // If we have a token ID but no user object yet, fetch the user
          if (token?.id && !user) {
            const { User } = await import('@/models');
            user = await User.findOne({ id: token.id });
          }
        } catch (error) {
          console.warn('Using mock database service due to connection error:', error);
          // Use mock database service when MongoDB connection fails
          db = mockDbService;
        }
      }

      // Call the handler with authenticated token, user, and database
      const response = await handler(req, { params, token, db, user });
      
      // Calculate request duration for performance monitoring
      const requestDuration = Date.now() - requestStartTime;
      
      // Add performance and rate limit headers to the response
      response.headers.set('X-Response-Time', `${requestDuration}ms`);
      response.headers.set('X-RateLimit-Limit', rateLimitOptions.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', (Math.floor(Date.now() / 1000) + Math.floor(rateLimitOptions.windowMs / 1000)).toString());

      return response;
    } catch (error) {
      console.error('API Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      // Log detailed error information
      console.error({
        error: errorMessage,
        stack: errorStack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({
        error: 'Internal Server Error',
        message: errorMessage,
        requestId: crypto.randomUUID() // For tracking errors in logs
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