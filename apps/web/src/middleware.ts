import { NextResponse, NextRequest } from 'next/server';

function generateNonce(): string {
  // Use Web Crypto API in middleware (Edge runtime compatible)
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // Base64-url encode
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const nonce = generateNonce();
  res.headers.set('x-nonce', nonce);

  // Strict CSP with dynamic nonce for inline scripts (JSON-LD etc.)
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "script-src-attr 'none'",
    // Allow Google Fonts stylesheets
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' https://cdn.sanity.io https://images.unsplash.com data:",
    "connect-src 'self' https://*.sanity.io",
    // Allow Google Fonts font files
    "font-src 'self' data: https://fonts.gstatic.com",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ].join('; ');

  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return res;
}

export const config = {
  matcher: '/:path*',
};
