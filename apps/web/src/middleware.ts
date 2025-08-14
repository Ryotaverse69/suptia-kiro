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

  // Attach CSP only in production; dev is handled by next.config.mjs
  if (process.env.NODE_ENV === "production") {
    const csp = [
      "default-src 'self'",
      "img-src 'self' https://cdn.sanity.io data:",
      "connect-src 'self' https://*.sanity.io",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      // Allow only scripts with the generated nonce
      `script-src 'self' 'nonce-${nonce}'`,
      "upgrade-insecure-requests",
    ].join("; ");

    nextRes.headers.set("Content-Security-Policy", csp);
  }

  return nextRes;
}

export const config = {
  matcher: ["/:path*"],
};
