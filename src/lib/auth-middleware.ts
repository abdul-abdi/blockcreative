import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectToDatabase from './mongodb';
import { User } from '@/models';

export interface AuthOptions {
  requiredRole?: 'writer' | 'producer' | 'admin' | string[];
  checkOnboarding?: boolean;
}

/**
 * Authentication middleware for API routes
 * @param handler The API route handler
 * @param options Authentication options
 */
export function withAuth(
  handler: (req: NextRequest, user: any) => Promise<NextResponse>,
  options: AuthOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Get token from NextAuth
      const token = await getToken({ req: req as any });
      let user = null;
      
      // Connect to the database
      await connectToDatabase();
      
      // Find the user from the token
      if (token && token.sub) {
        user = await User.findOne({ id: token.sub });
      }
      
      // If no user found via token, try wallet address
      if (!user) {
        const walletAddress = req.headers.get('x-wallet-address') || req.cookies.get('walletAddress')?.value;
        
        if (walletAddress) {
          console.log('Attempting to find user by wallet address:', walletAddress);
          user = await User.findOne({ address: walletAddress });
        }
      }
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized: User not found' },
          { status: 401 }
        );
      }
      
      // Check for required role
      if (options.requiredRole) {
        const roles = Array.isArray(options.requiredRole) 
          ? options.requiredRole 
          : [options.requiredRole];
          
        if (!roles.includes(user.role)) {
          return NextResponse.json(
            { error: 'Forbidden: Insufficient permissions' },
            { status: 403 }
          );
        }
      }
      
      // Check if onboarding is completed if required
      if (options.checkOnboarding && !user.onboarding_completed) {
        return NextResponse.json(
          { 
            error: 'Onboarding required', 
            onboardingStep: user.onboarding_step || 0 
          },
          { status: 428 }
        );
      }
      
      // All checks passed, proceed with the handler
      return handler(req, user);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Authentication middleware for pages
 * @param requiredRole Required role to access the page
 */
export function requireAuth(requiredRole?: 'writer' | 'producer' | 'admin' | string[]) {
  return async (req: NextRequest) => {
    // Paths that should bypass onboarding check
    const bypassOnboardingPaths = [
      '/writer/onboarding',
      '/producer/onboarding',
      '/signout',
      '/api',
      '/_next'
    ];
    
    // Check if current path should bypass onboarding
    const shouldBypassOnboarding = bypassOnboardingPaths.some(path => 
      req.nextUrl.pathname.startsWith(path)
    );
    
    const token = await getToken({ req: req as any });
    const isAuthenticated = !!token;
    
    if (!isAuthenticated) {
      // Redirect to sign in page
      const url = new URL('/signin', req.url);
      url.searchParams.set('callbackUrl', req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    
    if (requiredRole) {
      // Connect to database
      await connectToDatabase();
      
      // Find user
      const user = await User.findOne({ id: token.sub });
      
      if (!user) {
        // User not found, redirect to sign in
        const url = new URL('/signin', req.url);
        return NextResponse.redirect(url);
      }
      
      // Check role
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!roles.includes(user.role)) {
        // Insufficient permissions, redirect to appropriate dashboard
        const roleBasedRedirect = user.role === 'writer' 
          ? '/writer/dashboard' 
          : user.role === 'producer' 
            ? '/producer/dashboard' 
            : '/';
        
        const url = new URL(roleBasedRedirect, req.url);
        return NextResponse.redirect(url);
      }
      
      // Check if onboarding is completed
      if (!user.onboarding_completed && !shouldBypassOnboarding) {
        const onboardingUrl = user.role === 'writer' 
          ? '/writer/onboarding' 
          : '/producer/onboarding';
        
        const url = new URL(onboardingUrl, req.url);
        return NextResponse.redirect(url);
      }
    }
    
    // All checks passed, continue to the page
    return NextResponse.next();
  };
}

export default withAuth; 