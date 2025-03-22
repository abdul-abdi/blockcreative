import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from './mongodb';
import mockDbService from './mock-db';
import { rateLimit, configureRateLimits, RateLimitType } from './rateLimit';

// Define API handler type
type ApiHandler = (
  req: NextRequest,
  context: { params: any; token?: any; db?: any; user?: any }
) => Promise<NextResponse>;

// Configure rate limits for different API routes
const rateLimits = configureRateLimits();

/**
 * API middleware wrapper to handle common API tasks:
 * - Authentication verification
 * - Database connections
 * - Rate limiting
 * - Error handling
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
    // Initialize context for handler
    let token = null;
    let user = null;
    let db = null;
    
    try {
      // Apply rate limiting
      const limitType = options.rateLimitType || 'default';
      const config = rateLimits[limitType as keyof typeof rateLimits];
      const rateLimitResult = await rateLimit(req, config);
      
      if (!rateLimitResult.success) {
        console.warn(`Rate limit exceeded for ${req.url}`);
        return NextResponse.json({ 
          error: 'Too many requests', 
          message: 'Please try again later'
        }, { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
          }
        });
      }
      
      // If auth is required, check for wallet address
      if (options.requireAuth) {
        // Log more details in development or when debugging is enabled
        if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_AUTH === 'true') {
          console.log('API Auth Debug:');
          console.log('- Environment:', process.env.NODE_ENV);
          console.log('- Auth Required:', options.requireAuth);
          console.log('- Cookies Present:', req.cookies.size > 0);
          if (req.cookies.size > 0) {
            // Use getAll() to safely access cookies in Next.js RequestCookies
            const cookieNames = Array.from(req.cookies.getAll(), cookie => cookie.name);
            console.log('- Cookies:', cookieNames);
          }
        }
        
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
        
        // Check for required roles if specified
        if (options.requireRoles && options.requireRoles.length > 0) {
          const userRole = user?.role || token?.role;
          
          if (!userRole || !options.requireRoles.includes(userRole as any)) {
            return NextResponse.json({ 
              error: 'Forbidden', 
              message: `Access denied. Required role: ${options.requireRoles.join(' or ')}` 
            }, { status: 403 });
          }
        }
      }

      // Connect to the database if required
      if (options.connectDb) {
        try {
          // For production, use real database
          if (process.env.NODE_ENV === 'production' || process.env.MONGODB_URI) {
            await connectToDatabase();
            db = true;
          } 
          // For development without MongoDB, use mock database
          else {
            db = mockDbService;
          }
        } catch (dbError) {
          console.error('Database connection error:', dbError);
          return NextResponse.json({ 
            error: 'Database error', 
            message: 'Failed to connect to the database'
          }, { status: 503 });
        }
      }

      // Call the original handler with the context
      return await handler(req, { params, token, db, user });
    } catch (error) {
      console.error('API middleware error:', error);
      
      // Return an appropriate error response
      return NextResponse.json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
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