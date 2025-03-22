import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to enhance request handling across environments
 * Handles header management and debugging
 */
export async function middleware(request: NextRequest) {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const shouldLog = !isProduction || process.env.DEBUG_AUTH === 'true';
    
    // Clone the response to add headers
    const response = NextResponse.next();
    
    // Get wallet address and user role from cookies or headers
    const walletAddress = request.cookies.get('walletAddress')?.value || 
                         request.headers.get('x-wallet-address');
    const userRole = request.cookies.get('userRole')?.value;
    
    // Set upstream headers to pass authentication details
    if (walletAddress) {
      response.headers.set('x-wallet-address', walletAddress);
    }
    
    if (userRole) {
      response.headers.set('x-user-role', userRole);
    }
    
    // Log auth details if needed
    if (shouldLog) {
      console.log('----- Debug Middleware -----');
      console.log('Path:', request.nextUrl.pathname);
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Wallet address exists:', !!walletAddress);
      console.log('User role exists:', !!userRole);
      console.log('Cookies present:', request.cookies.size > 0);
      
      if (request.cookies.size > 0) {
        console.log('Cookie names:', Array.from(request.cookies.getAll(), cookie => cookie.name).join(', '));
      }
      
      console.log('--------------------------');
    }
    
    // Add CORS headers for Vercel deployments if needed
    if (isProduction) {
      const allowedOrigins = [
        process.env.NEXT_PUBLIC_APP_URL,
        'https://blockcreative.vercel.app'
      ].filter(Boolean);
      
      const origin = request.headers.get('origin');
      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-wallet-address, x-user-role');
      }
    }
    
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    // Always allow the request to continue even if there's an error
    return NextResponse.next();
  }
}

// Configure paths for the middleware to run on
export const config = {
  matcher: [
    // Auth-related paths
    '/signin',
    '/signup',
    // Dashboard paths
    '/writer/:path*', 
    '/producer/:path*',
    // API paths
    '/api/users/:path*',
    '/api/onboarding/:path*',
    '/api/projects/:path*',
    '/api/blockchain/:path*',
    // Writer API paths except scripts/analyze
    '/api/writer/dashboard/:path*',
    '/api/writer/profile/:path*',
    '/api/writer/settings/:path*',
    '/api/writer/submissions/:path*',
    // Don't include '/api/writer/scripts/analyze' to allow public access
    '/api/submissions/:path*'
  ]
}; 