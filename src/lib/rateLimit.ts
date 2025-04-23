/**
 * Simple in-memory rate limiter for API routes
 * Limits requests based on IP address and optional custom identifiers
 */

import { NextRequest } from 'next/server';

// Define rate limit types
export type RateLimitType = 'default' | 'strict' | 'userMe' | 'auth' | 'ai' | 'blockchain';

// Define rate limit configuration interface
export interface RateLimitConfig {
  windowMs: number;
  limit: number;
  message?: string;
}

// Define rate limit result interface
export interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfter?: number;
  message?: string;
}

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
export function configureRateLimits(customLimits?: Record<string, RateLimitConfig>) {
  // Default rate limits
  const defaults = {
    // For user/me endpoint (called frequently)
    userMe: {
      windowMs: 60 * 1000, // 1 minute
      limit: 120, // 120 requests per minute
      message: 'Too many requests to user profile, please try again later.'
    },
    // For default API endpoints
    default: {
      windowMs: 60 * 1000, // 1 minute
      limit: 60, // 60 requests per minute
    },
    // For more restrictive endpoints
    strict: {
      windowMs: 60 * 1000, // 1 minute
      limit: 20, // 20 requests per minute
    },
    // For authentication endpoints
    auth: {
      windowMs: 60 * 1000, // 1 minute
      limit: 20, // 20 requests per minute
      message: 'Too many authentication attempts, please wait before trying again.'
    },
    // For AI-related endpoints
    ai: {
      windowMs: 60 * 1000, // 1 minute
      limit: 10, // 10 requests per minute
      message: 'Too many AI requests, please try again later.'
    },
    // For blockchain-related endpoints
    blockchain: {
      windowMs: 60 * 1000, // 1 minute
      limit: 15, // 15 requests per minute
      message: 'Too many blockchain requests, please try again later.'
    }
  };

  return { ...defaults, ...customLimits };
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
export async function rateLimit(
  req: NextRequest,
  options: RateLimitConfig
): Promise<RateLimitResult> {
  // Get IP and route path for the rate limit key
  const ip = getClientIp(req);
  const path = new URL(req.url).pathname;

  // Allow bypass with API key for internal services
  const apiKey = req.headers.get('x-api-key');
  if (apiKey && apiKey === process.env.INTERNAL_API_KEY) {
    return { success: true, remaining: options.limit };
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
    return { success: true, remaining: options.limit - 1 };
  }

  // Increment counter and check if limit exceeded
  rateLimitStore[key].count += 1;

  if (rateLimitStore[key].count > options.limit) {
    const retryAfter = Math.ceil((rateLimitStore[key].resetTime - now) / 1000);
    return {
      success: false,
      remaining: 0,
      retryAfter,
      message: options.message || `Rate limit exceeded. Try again in ${retryAfter} seconds.`
    };
  }

  return {
    success: true,
    remaining: options.limit - rateLimitStore[key].count
  };
}

export default rateLimit;