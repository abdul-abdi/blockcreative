# Rate Limiting Implementation

## Overview

This implementation addresses excessive API calls in the application, particularly to the `/api/users/me` endpoint. The solution provides:

1. Rate limiting for API requests based on IP address and endpoint type
2. Client-side data caching using SWR to minimize redundant requests
3. Cache-control headers to leverage browser caching

## Components

### 1. Server-Side Rate Limiting (`src/lib/rateLimit.ts`)

An in-memory rate limiter that tracks requests based on IP address and route path:

- Configurable time windows and request limits for different endpoints
- Automatic cleanup of expired records
- Response headers showing rate limit status

### 2. API Middleware Integration (`src/lib/api-middleware.ts`)

The rate limiter is integrated into the existing API middleware:

- Different rate limits for different endpoint types
- Consistent 429 responses when limits are exceeded
- Rate limit headers added to all responses

### 3. Client-Side Caching with SWR (`src/lib/hooks/useUser.ts`)

A custom React hook that:

- Fetches and caches user data
- Implements configurable revalidation intervals
- Provides stale-while-revalidate functionality
- Maintains cache between component mounts

## Usage

### API Rate Limiting

The rate limiter is applied automatically to all API routes wrapped with the `withApiMiddleware` function:

```typescript
// Example API route using rate limiting
export const GET = withApiMiddleware(
  async ({ auth, db }) => {
    // Your handler implementation
    return Response.json({ data: "..." });
  },
  { rateLimit: 'userMe' }  // Specify rate limit type
);
```

Rate limit types and their configurations are defined in `src/lib/api-middleware.ts`.

### Client-Side Data Fetching

```typescript
import { useUser } from '@/lib/hooks/useUser';

function YourComponent() {
  const { user, error, isLoading } = useUser();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading user data</div>;
  
  return <div>Hello, {user?.profile_data?.name}</div>;
}
```

## Rate Limit Configurations

- **Default**: 30 requests per minute (0.5 per second)
- **User Me Endpoint**: 10 requests per minute (0.17 per second)
- **Auth Endpoints**: 20 requests per minute (0.33 per second)

## Browser Cache Control

The `/api/users/me` endpoint includes cache-control headers:

```
Cache-Control: private, max-age=10
```

This instructs browsers to cache the response for 10 seconds, further reducing unnecessary requests.

## Recommendations

1. **Monitor Usage**: Regularly review logs for rate limit exceeded messages
2. **Adjust Limits**: Tune rate limits based on real-world usage patterns
3. **Consider Persistence**: For high-traffic applications, consider Redis-based rate limiting

## Future Improvements

- Persistence layer for rate limiting across server instances
- User-specific rate limiting based on authentication
- More granular rate limit configurations per endpoint 