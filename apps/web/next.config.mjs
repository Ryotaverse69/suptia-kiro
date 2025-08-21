/** @type {import('next').NextConfig} */

// CSP helper for development/production
function buildCSP(isDev = false) {
  const policies = [
    "default-src 'self'",
    "img-src 'self' https://cdn.sanity.io data:",
    "connect-src 'self' https://*.sanity.io",
    "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
    "font-src 'self' data:",
    "script-src 'self'" + (isDev ? " 'unsafe-eval'" : ""), // Next.js dev needs unsafe-eval
    "upgrade-insecure-requests",
  ];

  return policies.join("; ");
}

const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@/components', '@/lib'],
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk for stable dependencies
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk for shared code
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Compare feature chunk
          compare: {
            name: 'compare',
            chunks: 'all',
            test: /[\\/]components[\\/]compare[\\/]/,
            priority: 30,
          },
        },
      };
    }
    
    return config;
  },
  async headers() {
    const isDev = process.env.NODE_ENV === "development";

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: buildCSP(isDev),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
