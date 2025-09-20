import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSearchSuggestions } from '@/lib/search/suggestions';

const schema = z.object({
  q: z.string().optional(),
  limit: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const parsed = schema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams)
  );
  const { q = '', limit } = parsed.success
    ? parsed.data
    : { q: '', limit: undefined };
  const resolvedLimit = limit ? Math.max(1, Math.min(Number(limit), 12)) : 8;

  try {
    const suggestions = await getSearchSuggestions(q ?? '', resolvedLimit);
    return NextResponse.json(
      { suggestions },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Failed to build suggestions', error);
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }
}
