/**
 * Simple in-memory rate limiter for API routes
 * Limits requests based on IP address and optional custom identifiers
 */

interface RateLimiterOptions {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Maximum requests per window
  message?: string;  // Custom error message
}

interface RequestStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for request counts
const requestStore: RequestStore = {};

// Default options
const defaultOptions: RateLimiterOptions = {
  windowMs: 60000,  // 1 minute
  maxRequests: 30,  // 30 requests per minute
  message: 'Too many requests, please try again later'
};

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const key in requestStore) {
    if (requestStore[key].resetTime <= now) {
      delete requestStore[key];
    }
  }
}, 60000); // Run cleanup every minute

/**
 * Rate limiter middleware for Next.js API routes
 */
export function rateLimit(
  req: Request,
  options: Partial<RateLimiterOptions> = {}
): { limited: boolean; remaining: number; message?: string } {
  const opts = { ...defaultOptions, ...options };
  
  // Get IP address from headers or use fallback
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';
  
  // Get the path for more granular rate limiting
  const url = new URL(req.url);
  const path = url.pathname;
  
  // Create a unique key for this request source and endpoint
  const key = `${ip}:${path}`;
  
  const now = Date.now();
  
  // Initialize or update the request count record
  if (!requestStore[key] || requestStore[key].resetTime <= now) {
    requestStore[key] = {
      count: 1,
      resetTime: now + opts.windowMs
    };
    return { limited: false, remaining: opts.maxRequests - 1 };
  }
  
  // Increment request count
  requestStore[key].count++;
  
  // Check if rate limit is exceeded
  if (requestStore[key].count > opts.maxRequests) {
    return { 
      limited: true, 
      remaining: 0,
      message: opts.message
    };
  }
  
  // Return current status
  return { 
    limited: false, 
    remaining: opts.maxRequests - requestStore[key].count
  };
}

/**
 * Apply rate limiting with specific configurations for different API routes
 */
export function configureRateLimits() {
  return {
    // Frequent endpoints get stricter limits
    userMe: {
      windowMs: 10000,  // 10 seconds
      maxRequests: 5,   // 5 requests per 10 seconds
      message: 'Too many user requests, please try again shortly'
    },
    // Default for general API endpoints
    default: {
      windowMs: 60000,  // 1 minute
      maxRequests: 60   // 60 requests per minute
    },
    // More permissive for less frequent operations
    submission: {
      windowMs: 60000,  // 1 minute
      maxRequests: 20   // 20 requests per minute
    }
  };
} 