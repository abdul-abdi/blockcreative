/**
 * Helper functions for session management to handle differences
 * between development and production environments
 */

/**
 * Returns the correct cookie name based on the current environment
 * In production, Next.js/Auth.js uses a different cookie name format with the __Secure prefix
 */
export const getSessionCookieName = (): string => {
  return process.env.NODE_ENV === 'production' 
    ? "__Secure-next-auth.session-token" 
    : "next-auth.session-token";
};

/**
 * Adds debugging information about the current authentication state
 * Only used during troubleshooting and should be removed in final production
 */
export const logAuthDebugInfo = (session: any, status: string): void => {
  console.log('Auth Debug Info:');
  console.log('- Environment:', process.env.NODE_ENV);
  console.log('- Auth Status:', status);
  console.log('- Session Exists:', !!session);
  console.log('- Cookie Name:', getSessionCookieName());
  
  if (session) {
    console.log('- User ID:', session.user?.id || 'Not available');
    console.log('- User Role:', session.user?.role || 'Not available');
  }
}; 