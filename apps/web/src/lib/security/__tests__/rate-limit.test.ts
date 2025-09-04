import { describe, it, expect } from 'vitest';
import { withRateLimit } from '../rate-limit';
import { NextRequest, NextResponse } from 'next/server';

function makeReq(url = 'http://localhost/api/test', headers: Record<string,string> = {}) {
  const req = new NextRequest(new Request(url, { headers }));
  return req as NextRequest;
}

describe('withRateLimit', () => {
  it('allows a single request and sets rate limit headers', async () => {
    const handler = withRateLimit(async () => NextResponse.json({ ok: true }));
    const res = await handler(makeReq());
    expect(res.status).toBe(200);
    expect(res.headers.get('X-RateLimit-Limit')).toBeDefined();
    expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined();
  });
});

