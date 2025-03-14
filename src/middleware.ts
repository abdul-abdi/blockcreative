import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Extract wallet address from headers if present
  const walletAddress = request.headers.get('x-wallet-address');
  
  // Set wallet address in cookie if it's in the headers
  if (walletAddress) {
    response.cookies.set('walletAddress', walletAddress, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }
  
  return response;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}; 