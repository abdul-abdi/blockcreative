/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
  reactStrictMode: true,
  // Temporarily keep console logs for debugging authentication issues on Vercel
  compiler: {
    // Keep console logs in production for troubleshooting auth issues
    removeConsole: false, // Will change back to process.env.NODE_ENV === 'production' after fixing auth
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    optimizePackageImports: ['@heroicons/react', 'framer-motion'],
  },
  // Transpile problematic packages
  transpilePackages: ['ethers', 'web3', 'wagmi', 'viem'],
  // App Icon configuration
  webpack(config) {
    // Add AppKit required externals
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    // Handle ethers.js and other problematic dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      zlib: require.resolve('browserify-zlib'),
      path: require.resolve('path-browserify'),
    };
    
    return config;
  },
  // Important for auth cookies to work properly in Vercel
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 