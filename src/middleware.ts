import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSessionCookieName } from './lib/session-helper';

/**
 * Vercel-specific middleware to debug authentication across environments
 * This is a non-blocking middleware that logs auth state but allows all requests
 */
export async function middleware(request: NextRequest) {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const shouldLog = process.env.DEBUG_AUTH === 'true';
    
    // Only log in development or when DEBUG_AUTH is true
    if (!isProduction || shouldLog) {
      const cookieName = getSessionCookieName();
      const token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: isProduction
      });
      
      // Log auth details to help diagnose issues
      console.log('----- Auth Debug Middleware -----');
      console.log('Path:', request.nextUrl.pathname);
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Auth cookie name:', cookieName);
      console.log('Token exists:', !!token);
      console.log('Cookies present:', request.cookies.size > 0);
      if (request.cookies.size > 0) {
        const cookieNames = Array.from(request.cookies.getAll(), cookie => cookie.name);
        console.log('Cookie names:', cookieNames);
      }
      console.log('---------------------------------');
    }
  } catch (error) {
    console.error('Middleware error:', error);
  }
  
  // Always allow the request to continue
  return NextResponse.next();
}

// Configure paths for the middleware to run on
export const config = {
  matcher: [
    // Auth-related paths
    '/signin',
    '/signup',
    '/api/auth/:path*',
    // Dashboard paths
    '/writer/:path*', 
    '/producer/:path*',
    // API paths
    '/api/users/:path*'
  ]
}; 