import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware for handling domain redirects and security headers
 */
export function middleware(request: NextRequest) {
  const { pathname, search, protocol, host } = request.nextUrl as any;
  const hostname = request.headers.get('host') || '';
  // Skip middleware for Next.js internals to avoid affecting static assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/static')) {
    return NextResponse.next();
  }
  
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
  
  // セキュリティヘッダーの追加（本番/HTTPS時のみ）
  const response = NextResponse.next();
  const isHttps = (protocol === 'https:' || hostname.endsWith('suptia.com'));
  
  if (isHttps) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');
  }
  
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
