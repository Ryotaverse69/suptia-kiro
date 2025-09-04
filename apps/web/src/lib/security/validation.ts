import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// Re-export common patterns, keeping security-related schemas here
export const IdSchema = z.object({ id: z.string().min(1).max(64) });
export const PaginationSchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
  offset: z.coerce.number().min(0).default(0),
});

export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (req: NextRequest, data: T) => Promise<NextResponse>,
) {
  return async (req: NextRequest) => {
    try {
      const data = req.method === 'GET'
        ? Object.fromEntries(new URL(req.url).searchParams.entries())
        : await req.json();

      const parsed = schema.parse(data);
      return await handler(req, parsed);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
      }
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
  };
}

