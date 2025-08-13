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
