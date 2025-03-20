/**
 * Simple in-memory rate limiter for API routes
 * Limits requests based on IP address and optional custom identifiers
 */

import { NextRequest } from 'next/server';

// In-memory store for rate limiting
// In production, consider using Redis or another distributed store
const rateLimitStore: {
  [key: string]: {
    count: number;
    resetTime: number;
  };
} = {};

// Automatic cleanup of expired rate limit entries
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime <= now) {
      delete rateLimitStore[key];
    }
  });
}, 60000); // Clean up every minute

// Configure rate limits for different endpoint types
export function configureRateLimits() {
  return {
    // For user/me endpoint (called frequently)
    userMe: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 requests per minute
      message: 'Too many requests to user profile, please try again later.'
    },
    // For default API endpoints
    default: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 requests per minute
    },
    // For submission-related endpoints (more intensive)
    submission: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5, // 5 requests per minute
    },
    // For authentication endpoints
    auth: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 15, // 15 requests per minute
      message: 'Too many authentication attempts, please wait before trying again.'
    },
    // For AI analysis endpoints (resource intensive)
    ai: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 3, // 3 requests per minute
      message: 'AI analysis request limit reached. Please wait before requesting more analyses.'
    },
    // For blockchain endpoints (very resource intensive)
    blockchain: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 10, // 10 requests per 5 minutes
      message: 'Blockchain transaction limit reached. Please wait before making more transactions.'
    }
  };
}

// Get client IP address from request
function getClientIp(req: NextRequest): string {
  // Try to get IP from Vercel headers
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    // Get first IP if multiple are present
    return forwarded.split(',')[0].trim();
  }
  
  // Fallback to CloudFlare headers
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp;
  }
  
  // Fallback to remote address
  return '127.0.0.1'; // Default for local development
}

/**
 * Rate limit middleware for API routes
 * @param req Next.js request object
 * @param options Rate limit options
 * @returns Rate limit result
 */
export function rateLimit(req: NextRequest, options: { 
  windowMs: number; 
  maxRequests: number;
  message?: string;
}) {
  // Get IP and route path for the rate limit key
  const ip = getClientIp(req);
  const path = new URL(req.url).pathname;
  
  // Allow bypass with API key for internal services
  const apiKey = req.headers.get('x-api-key');
  if (apiKey && apiKey === process.env.INTERNAL_API_KEY) {
    return { limited: false, remaining: options.maxRequests };
  }
  
  // Create a key for this specific client and route
  const key = `${ip}:${path}`;
  const now = Date.now();
  
  // Initialize or update rate limit entry
  if (!rateLimitStore[key] || rateLimitStore[key].resetTime <= now) {
    rateLimitStore[key] = {
      count: 1,
      resetTime: now + options.windowMs
    };
    return { limited: false, remaining: options.maxRequests - 1 };
  }
  
  // Increment counter and check if limit exceeded
  rateLimitStore[key].count += 1;
  
  if (rateLimitStore[key].count > options.maxRequests) {
    const resetInSeconds = Math.ceil((rateLimitStore[key].resetTime - now) / 1000);
    return {
      limited: true,
      remaining: 0,
      message: options.message || `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`
    };
  }
  
  return {
    limited: false,
    remaining: options.maxRequests - rateLimitStore[key].count
  };
}

export default rateLimit; 