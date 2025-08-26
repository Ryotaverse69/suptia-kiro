import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Enhanced rate limiting with logging and security features
interface TokenBucket {
  tokens: number;
  lastRefill: number;
  capacity: number;
  refillRate: number; // tokens per second
  violations: number; // Track violations for logging
  firstViolation?: number; // Timestamp of first violation
}

interface RateLimitViolation {
  ipHash: string;
  route: string;
  timestamp: number;
  userAgent?: string;
  referer?: string;
  violationCount: number;
}

// In-memory store (can be replaced with Redis in production)
const buckets = new Map<string, TokenBucket>();
const violations: RateLimitViolation[] = [];

// Enhanced rate limit configuration (60 req/10 min/IP as per requirements)
const RATE_LIMITS = {
  api: { capacity: 60, refillRate: 0.1 }, // 60 requests, refill 1 per 10 seconds (6 per minute)
  search: { capacity: 30, refillRate: 0.05 }, // 30 requests, refill 1 per 20 seconds (3 per minute)
  contact: { capacity: 5, refillRate: 0.017 }, // 5 requests, refill 1 per 60 seconds (1 per minute)
  auth: { capacity: 10, refillRate: 0.033 }, // 10 requests, refill 1 per 30 seconds (2 per minute)
} as const;

/**
 * Get client IP address with enhanced security
 */
function getClientIP(req: NextRequest): string {
  // Check multiple headers for IP address
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");
  const cfConnectingIP = req.headers.get("cf-connecting-ip"); // Cloudflare
  const xClientIP = req.headers.get("x-client-ip");

  // Priority order: CF-Connecting-IP > X-Real-IP > X-Forwarded-For > X-Client-IP
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  if (realIP) {
    return realIP.trim();
  }

  if (forwarded) {
    // Take the first IP from the chain
    return forwarded.split(",")[0].trim();
  }

  if (xClientIP) {
    return xClientIP.trim();
  }

  // Fallback for development
  return req.ip || "127.0.0.1";
}

/**
 * Hash IP address for privacy-compliant logging
 */
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip + process.env.IP_HASH_SALT || 'default-salt').digest('hex').substring(0, 16);
}

/**
 * Log rate limit violation
 */
function logViolation(req: NextRequest, ipHash: string, route: string, violationCount: number): void {
  const violation: RateLimitViolation = {
    ipHash,
    route,
    timestamp: Date.now(),
    userAgent: req.headers.get("user-agent") || undefined,
    referer: req.headers.get("referer") || undefined,
    violationCount,
  };

  violations.push(violation);

  // Keep only last 1000 violations to prevent memory issues
  if (violations.length > 1000) {
    violations.splice(0, violations.length - 1000);
  }

  // Log to console in development, structured logging in production
  if (process.env.NODE_ENV === 'development') {
    console.warn(`Rate limit violation: ${route} from ${ipHash} (${violationCount} violations)`);
  } else {
    // In production, this would integrate with your logging service
    console.log(JSON.stringify({
      level: 'warn',
      message: 'Rate limit violation',
      ipHash,
      route,
      violationCount,
      timestamp: new Date().toISOString(),
      userAgent: violation.userAgent,
      referer: violation.referer,
    }));
  }
}

/**
 * Refill token bucket based on time elapsed
 */
function refillBucket(bucket: TokenBucket): void {
  const now = Date.now();
  const timePassed = (now - bucket.lastRefill) / 1000; // seconds
  const tokensToAdd = Math.floor(timePassed * bucket.refillRate);

  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }
}

/**
 * Attempt to consume a token from the bucket
 */
function consumeToken(
  key: string,
  config: { capacity: number; refillRate: number },
): { allowed: boolean; bucket: TokenBucket } {
  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = {
      tokens: config.capacity,
      lastRefill: Date.now(),
      capacity: config.capacity,
      refillRate: config.refillRate,
      violations: 0,
    };
    buckets.set(key, bucket);
  }

  refillBucket(bucket);

  if (bucket.tokens > 0) {
    bucket.tokens--;
    // Reset violation count on successful request
    bucket.violations = 0;
    bucket.firstViolation = undefined;
    return { allowed: true, bucket };
  }

  // Track violations
  bucket.violations++;
  if (!bucket.firstViolation) {
    bucket.firstViolation = Date.now();
  }

  return { allowed: false, bucket };
}

/**
 * Enhanced rate limiting middleware with logging
 */
export function withRateLimit(
  type: keyof typeof RATE_LIMITS,
  handler: (req: NextRequest) => Promise<NextResponse>,
) {
  return async (req: NextRequest) => {
    const clientIP = getClientIP(req);
    const ipHash = hashIP(clientIP);
    const route = req.nextUrl.pathname;
    const key = `${type}:${ipHash}`;
    const config = RATE_LIMITS[type];

    const { allowed, bucket } = consumeToken(key, config);

    if (!allowed) {
      // Log the violation
      logViolation(req, ipHash, route, bucket.violations);

      // Calculate retry after time
      const retryAfter = Math.ceil(1 / config.refillRate);

      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": config.capacity.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(Date.now() + retryAfter * 1000).toISOString(),
          },
        },
      );
    }

    // Add rate limit headers to successful responses
    const response = await handler(req);
    response.headers.set("X-RateLimit-Limit", config.capacity.toString());
    response.headers.set("X-RateLimit-Remaining", bucket.tokens.toString());
    response.headers.set("X-RateLimit-Reset", new Date(bucket.lastRefill + (config.capacity / config.refillRate) * 1000).toISOString());

    return response;
  };
}

/**
 * Get rate limit violations for monitoring
 */
export function getRateLimitViolations(limit: number = 100): RateLimitViolation[] {
  return violations.slice(-limit);
}

/**
 * Get current bucket status for monitoring
 */
export function getBucketStatus(): Array<{ key: string; tokens: number; violations: number }> {
  return Array.from(buckets.entries()).map(([key, bucket]) => ({
    key,
    tokens: bucket.tokens,
    violations: bucket.violations,
  }));
}

/**
 * Clear rate limit data (for testing or maintenance)
 */
export function clearRateLimitData(): void {
  buckets.clear();
  violations.length = 0;
}

// Cleanup old buckets periodically (prevent memory leaks)
const cleanup = () => {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour

  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.lastRefill > maxAge) {
      buckets.delete(key);
    }
  }

  // Clean old violations (keep only last 24 hours)
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const validViolations = violations.filter(v => v.timestamp > dayAgo);
  violations.length = 0;
  violations.push(...validViolations);
};

// Run cleanup every 5 minutes
setInterval(cleanup, 5 * 60 * 1000);

// Export types for external use
export type { RateLimitViolation, TokenBucket };