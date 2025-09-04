import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Sliding window rate limit: 60 requests / 10 minutes / IP
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 60;

type Entry = number[]; // array of timestamps (ms)
const store = new Map<string, Entry>();

function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return (req.ip as string) || '127.0.0.1';
}

export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
) {
  return async (req: NextRequest) => {
    const ip = getClientIP(req);
    const key = ip;
    const now = Date.now();
    const windowStart = now - WINDOW_MS;

    const arr = store.get(key) || [];
    // prune old
    const recent = arr.filter((t) => t > windowStart);
    recent.push(now);
    store.set(key, recent);

    const remaining = Math.max(0, MAX_REQUESTS - recent.length);

    if (recent.length > MAX_REQUESTS) {
      const oldest = recent[0];
      const retryAfterSec = Math.ceil((WINDOW_MS - (now - oldest)) / 1000);

      console.warn('[RATE_LIMIT] Blocked', {
        ipHash: hashIP(ip),
        route: req.nextUrl.pathname,
        count: recent.length,
        windowMs: WINDOW_MS,
        retryAfterSec,
        ts: new Date().toISOString(),
      });

      return NextResponse.json(
        { error: 'Too Many Requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSec),
            'X-RateLimit-Limit': String(MAX_REQUESTS),
            'X-RateLimit-Remaining': '0',
          },
        },
      );
    }

    const resp = await handler(req);
    resp.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS));
    resp.headers.set('X-RateLimit-Remaining', String(remaining));
    return resp;
  };
}

