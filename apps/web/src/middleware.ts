import { NextResponse, NextRequest } from "next/server";

// Generate a per-request nonce and attach CSP header in production
export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Generate a cryptographically-strong nonce
  const nonce = crypto.randomUUID().replace(/-/g, "");

  // Propagate the nonce to the application via request header
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  // Recreate response with modified request headers
  const nextRes = NextResponse.next({ request: { headers: requestHeaders } });

  // Expose nonce for debugging/usage if needed
  nextRes.headers.set("x-nonce", nonce);

  // Attach strict CSP in production with nonce; dev is handled by next.config.mjs
  if (process.env.NODE_ENV === "production") {
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`, // Strict: no unsafe-inline, only nonce
      "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
      "img-src 'self' https://cdn.sanity.io data:",
      "connect-src 'self' https://*.sanity.io",
      "font-src 'self' data:",
      "upgrade-insecure-requests",
      // GA4 support (commented - uncomment when needed):
      // `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com`,
      // "connect-src 'self' https://*.sanity.io https://www.google-analytics.com https://analytics.google.com",
    ].join("; ");

    nextRes.headers.set("Content-Security-Policy", csp);
  }

  // Apply additional security headers at request level
  nextRes.headers.set("X-Content-Type-Options", "nosniff");
  nextRes.headers.set("X-Frame-Options", "DENY");
  nextRes.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  nextRes.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return nextRes;
}

export const config = {
  matcher: ["/:path*"],
};
