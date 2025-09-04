import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware for handling domain redirects and security headers
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // レガシードメインから新ドメインへのリダイレクト
  if (hostname.includes('suptia-kiro.vercel.app')) {
    const redirectUrl = new URL(`https://suptia.com${pathname}${search}`);
    return NextResponse.redirect(redirectUrl, 301);
  }
  
  // www サブドメインから apex ドメインへのリダイレクト
  if (hostname === 'www.suptia.com') {
    const redirectUrl = new URL(`https://suptia.com${pathname}${search}`);
    return NextResponse.redirect(redirectUrl, 301);
  }
  
  // セキュリティヘッダーの追加
  const response = NextResponse.next();
  
  // HSTS (HTTP Strict Transport Security)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );
  
  // X-Frame-Options
  response.headers.set('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // X-XSS-Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths to ensure domain redirects work
     */
    '/(.*)',
  ],
};