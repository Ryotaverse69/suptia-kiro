import { NextResponse } from 'next/server';
import { env } from '@/lib/env-validation';

export function GET() {
  const baseUrl = env.site.url;
  const body = [
    `User-agent: *`,
    `Allow: /`,
    `Sitemap: ${baseUrl}/sitemap.xml`,
  ].join('\n');

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

