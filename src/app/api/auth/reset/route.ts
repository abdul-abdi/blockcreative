import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('Auth reset API called', {
    cookies: request.cookies.getAll().map(c => c.name),
    source: request.nextUrl.searchParams.get('source') || 'unknown'
  });
  
  // Add timestamp to prevent caching issues
  const timestamp = Date.now();
  const response = NextResponse.redirect(new URL(`/?ts=${timestamp}`, request.url));
  
  // Get all cookie names to clear everything
  const allCookies = request.cookies.getAll();
  
  // Clear all cookies
  for (const cookie of allCookies) {
    // Basic clearing
    response.cookies.set(cookie.name, '', { 
      path: '/',
      maxAge: 0
    });
    
    // Also try with httpOnly flag as the persistent cookie likely has this
    response.cookies.set(cookie.name, '', { 
      path: '/',
      maxAge: 0,
      httpOnly: true
    });
  }
  
  // Explicitly clear auth-related cookies to be extra sure
  const authCookies = [
    // User data
    'userRole',
    'walletAddress',
    'onboardingCompleted',
    'userName',
    
    // JWT tokens
    'token',
    'refreshToken',
    'jwt',
    
    // NextAuth tokens
    'next-auth.session-token',
    'next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.session-token',
    '__Secure-next-auth.csrf-token',
    '__Host-next-auth.csrf-token',
    
    // AppKit related
    'appkit.session',
    'wagmi.store',
    
    // Session tracking
    'authErrorCount',
    'routeHistory'
  ];
  
  // Ensure all auth cookies are cleared with various security settings
  authCookies.forEach(name => {
    // Clear with basic settings
    response.cookies.set(name, '', { 
      path: '/',
      maxAge: 0
    });
    
    // Also clear with httpOnly flag (crucial for JWT tokens set by the server)
    response.cookies.set(name, '', { 
      path: '/',
      maxAge: 0,
      httpOnly: true
    });
    
    // Also clear secure versions
    response.cookies.set(name, '', { 
      path: '/',
      maxAge: 0,
      secure: true,
      sameSite: 'lax',
      httpOnly: true
    });
    
    // Clear with strict same-site
    response.cookies.set(name, '', { 
      path: '/',
      maxAge: 0,
      secure: true,
      sameSite: 'strict',
      httpOnly: true
    });
    
    // Also clear with different domains
    const host = request.headers.get('host') || '';
    const domain = host.split(':')[0];
    
    if (domain && domain !== 'localhost') {
      // For custom domains
      response.cookies.set(name, '', { 
        path: '/',
        maxAge: 0,
        domain,
        httpOnly: true
      });
      
      // Also try with dot prefix for subdomain coverage
      response.cookies.set(name, '', { 
        path: '/',
        maxAge: 0,
        domain: '.' + domain,
        httpOnly: true
      });
    }
  });
  
  // Add a specific rewrite and clear for JWT token cookie that's causing problems
  ['token', 'jwt'].forEach(tokenName => {
    // First invalidate by setting an invalid token content
    response.cookies.set(tokenName, 'INVALID-TOKEN', { 
      path: '/',
      maxAge: 1,  // Set to expire in 1 second
      httpOnly: true
    });
    
    // Then clear it properly with all possible combinations
    const allPaths = ['/', '/api', '/auth', '/api/auth', '/api/users'];
    
    for (const path of allPaths) {
      // Basic version
      response.cookies.set(tokenName, '', { 
        path,
        maxAge: 0,
        httpOnly: true
      });
      
      // Secure version
      response.cookies.set(tokenName, '', { 
        path,
        maxAge: 0,
        httpOnly: true,
        secure: true
      });
    }
  });
  
  // Add headers to prevent caching
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Clear-Site-Data', '"cookies", "storage"');
  
  console.log('Auth reset completed, redirecting to home page');
  
  return response;
} 