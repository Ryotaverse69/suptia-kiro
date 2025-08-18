/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: [
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
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), magnetometer=(), gyroscope=(), accelerometer=()",
          },
          // Strict CSP configuration
          // Production CSP is handled by middleware.ts for nonce support
          // Development CSP (less strict for hot reload)
          ...(process.env.NODE_ENV === "development"
            ? [
                {
                  key: "Content-Security-Policy",
                  value: [
                    "default-src 'self'",
                    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Allow unsafe-eval for dev hot reload
                    "style-src 'self' 'unsafe-inline'",
                    "img-src 'self' https://cdn.sanity.io data:",
                    "connect-src 'self' https://*.sanity.io ws: wss:", // ws/wss for dev hot reload
                    "font-src 'self' data:",
                    "object-src 'none'",
                    "base-uri 'self'",
                    "form-action 'self'",
                    "frame-ancestors 'none'",
                    "upgrade-insecure-requests",
                  ].join("; "),
                },
              ]
            : []),
        ],
      },
    ];
  },
};

module.exports = nextConfig;
