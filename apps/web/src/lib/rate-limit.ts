import { NextRequest, NextResponse } from "next/server";

// Token bucket rate limiter
interface TokenBucket {
  tokens: number;
  lastRefill: number;
  capacity: number;
  refillRate: number; // tokens per second
}

// In-memory store (can be replaced with Redis)
const buckets = new Map<string, TokenBucket>();

// Rate limit configuration
const RATE_LIMITS = {
  api: { capacity: 100, refillRate: 1 }, // 100 requests, 1 per second
  search: { capacity: 50, refillRate: 0.5 }, // 50 requests, 0.5 per second
  contact: { capacity: 5, refillRate: 0.1 }, // 5 requests, 0.1 per second
} as const;

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  // Fallback for development
  return req.ip || "127.0.0.1";
}

function refillBucket(bucket: TokenBucket): void {
  const now = Date.now();
  const timePassed = (now - bucket.lastRefill) / 1000; // seconds
  const tokensToAdd = Math.floor(timePassed * bucket.refillRate);

  bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;
}

function consumeToken(
  key: string,
  config: { capacity: number; refillRate: number },
): boolean {
  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = {
      tokens: config.capacity,
      lastRefill: Date.now(),
      capacity: config.capacity,
      refillRate: config.refillRate,
    };
    buckets.set(key, bucket);
  }

  refillBucket(bucket);

  if (bucket.tokens > 0) {
    bucket.tokens--;
    return true;
  }

  return false;
}

export function withRateLimit(
  type: keyof typeof RATE_LIMITS,
  handler: (req: NextRequest) => Promise<NextResponse>,
) {
  return async (req: NextRequest) => {
    const clientIP = getClientIP(req);
    const key = `${type}:${clientIP}`;
    const config = RATE_LIMITS[type];

    if (!consumeToken(key, config)) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(1 / config.refillRate).toString(),
          },
        },
      );
    }

    return await handler(req);
  };
}

// Cleanup old buckets periodically (prevent memory leaks)
setInterval(
  () => {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [key, bucket] of buckets.entries()) {
      if (now - bucket.lastRefill > maxAge) {
        buckets.delete(key);
      }
    }
  },
  5 * 60 * 1000,
); // Run every 5 minutes
