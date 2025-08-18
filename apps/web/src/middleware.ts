import { NextResponse, NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/security/rate-limit";

// Generate a per-request nonce and attach strict CSP header in production
export function middleware(req: NextRequest) {
  // レート制限チェック（APIルートのみ）
  const ip =
    req.ip ||
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const route = req.nextUrl.pathname;
  const userAgent = req.headers.get("user-agent") || undefined;
  let rateLimitResult: any = null;

  if (route.startsWith("/api/")) {
    rateLimitResult = checkRateLimit(ip, route, userAgent);

    if (!rateLimitResult.success) {
      // 429 Too Many Requests レスポンスを返す
      const response = NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message:
              "リクエスト制限に達しました。しばらく時間をおいてから再試行してください。",
            details: {
              limit: rateLimitResult.limit,
              resetTime: rateLimitResult.resetTime,
            },
          },
          meta: {
            timestamp: new Date().toISOString(),
            rateLimit: {
              limit: rateLimitResult.limit,
              remaining: rateLimitResult.remaining,
              resetTime: rateLimitResult.resetTime,
            },
          },
        },
        { status: 429 },
      );

      // Retry-After ヘッダーを設定
      if (rateLimitResult.retryAfter) {
        response.headers.set(
          "Retry-After",
          rateLimitResult.retryAfter.toString(),
        );
      }

      // レート制限情報をヘッダーに追加
      response.headers.set(
        "X-RateLimit-Limit",
        rateLimitResult.limit.toString(),
      );
      response.headers.set(
        "X-RateLimit-Remaining",
        rateLimitResult.remaining.toString(),
      );
      response.headers.set(
        "X-RateLimit-Reset",
        rateLimitResult.resetTime.toString(),
      );

      return response;
    }
  }

  // Generate a cryptographically-strong nonce
  const nonce = crypto.randomUUID().replace(/-/g, "");

  // Propagate the nonce to the application via request header
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  // Recreate response with modified request headers
  const nextRes = NextResponse.next({ request: { headers: requestHeaders } });

  // Expose nonce for debugging/usage if needed
  nextRes.headers.set("x-nonce", nonce);

  // APIルートの場合はレート制限情報も追加（成功時のみ）
  if (route.startsWith("/api/") && rateLimitResult) {
    nextRes.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
    nextRes.headers.set(
      "X-RateLimit-Remaining",
      rateLimitResult.remaining.toString(),
    );
    nextRes.headers.set(
      "X-RateLimit-Reset",
      rateLimitResult.resetTime.toString(),
    );
  }

  // Apply strict CSP in production (development CSP is handled by next.config.js)
  if (process.env.NODE_ENV === "production") {
    // Strict CSP configuration as per requirements
    const csp = [
      "default-src 'self'",
      // Strict script policy - no unsafe-inline, only self and nonce
      `script-src 'self' 'nonce-${nonce}'`,
      // GA4 support (commented configuration - uncomment when GA4 is needed)
      // For GA4, replace the above script-src with:
      // `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google-analytics.com`,
      // and add to connect-src: https://www.google-analytics.com https://analytics.google.com
      "style-src 'self' 'unsafe-inline'", // Allow inline styles for CSS-in-JS frameworks
      "img-src 'self' https://cdn.sanity.io data:", // Sanity CDN + data URIs
      "connect-src 'self' https://*.sanity.io", // Sanity API endpoints
      "font-src 'self' data:", // Self-hosted fonts + data URIs
      "object-src 'none'", // Prevent object/embed/applet execution
      "base-uri 'self'", // Restrict base tag to prevent injection
      "form-action 'self'", // Restrict form submissions to same origin
      "frame-ancestors 'none'", // Prevent framing (defense in depth with X-Frame-Options)
      "upgrade-insecure-requests", // Force HTTPS
    ].join("; ");

    nextRes.headers.set("Content-Security-Policy", csp);
  }

  // Apply additional security headers at request level
  nextRes.headers.set("X-Content-Type-Options", "nosniff");
  nextRes.headers.set("X-Frame-Options", "DENY");
  nextRes.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  nextRes.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), magnetometer=(), gyroscope=(), accelerometer=()",
  );

  return nextRes;
}

export const config = {
  matcher: ["/:path*"],
};
