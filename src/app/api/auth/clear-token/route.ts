import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Debug logging to see what cookies are present
  console.log('Clear token API called', {
    cookies: request.cookies.getAll().map(c => c.name),
    token: request.cookies.get('token')?.value ? 'present' : 'not found',
    host: request.headers.get('host') || 'unknown'
  });

  // Create a response with a simple text message
  const response = NextResponse.json({ success: true, message: 'Auth token cleared' });
  
  // Target the specific JWT token cookie that's causing issues
  response.cookies.set('token', '', { 
    path: '/',
    maxAge: 0,
    httpOnly: true // Important: must match how it was set
  });
  
  // Try multiple variations to ensure we catch all possible forms
  const allPaths = ['/', '/api', '/api/auth', '/api/users', '/api/users/me'];
  const allDomains = [undefined, request.headers.get('host')?.split(':')[0] || undefined];
  
  for (const path of allPaths) {
    for (const domain of allDomains) {
      if (domain) {
        response.cookies.set('token', '', { 
          path,
          maxAge: 0,
          httpOnly: true,
          domain
        });
      } else {
        response.cookies.set('token', '', { 
          path,
          maxAge: 0,
          httpOnly: true
        });
      }
    }
  }
  
  // First try to overwrite the token with an invalid one
  response.cookies.set('token', 'INVALID-TOKEN', { 
    path: '/',
    maxAge: 1,
    httpOnly: true
  });
  
  // Then clear it properly
  response.cookies.set('token', '', { 
    path: '/',
    maxAge: 0,
    httpOnly: true
  });
  
  // Also try with different security settings
  response.cookies.set('token', '', { 
    path: '/',
    maxAge: 0,
    httpOnly: true, 
    secure: true,
    sameSite: 'strict'
  });
  
  response.cookies.set('token', '', { 
    path: '/',
    maxAge: 0,
    httpOnly: true, 
    secure: true,
    sameSite: 'lax'
  });
  
  // Try with explicit domain for localhost
  if (request.headers.get('host')?.includes('localhost')) {
    response.cookies.set('token', '', { 
      path: '/',
      maxAge: 0,
      httpOnly: true,
      domain: 'localhost'
    });
  }
  
  // Add cache prevention headers
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  
  console.log('Token clearing complete');
  
  return response;
}