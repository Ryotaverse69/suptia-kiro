import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

// Common validation schemas
export const ProductQuerySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Invalid slug format"),
});

export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(200).optional(),
  category: z.enum(["vitamin", "mineral", "herb", "amino", "other"]).optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
  offset: z.coerce.number().min(0).default(0),
});

export const ContactFormSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  message: z.string().min(10).max(1000),
});

// Validation middleware wrapper
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (req: NextRequest, data: T) => Promise<NextResponse>,
) {
  return async (req: NextRequest) => {
    try {
      let data: unknown;

      if (req.method === "GET") {
        // Parse URL search params
        const url = new URL(req.url);
        data = Object.fromEntries(url.searchParams.entries());
      } else {
        // Parse JSON body
        data = await req.json();
      }

      const validatedData = schema.parse(data);
      return await handler(req, validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: error.issues.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
          { status: 400 },
        );
      }

      // Don't expose internal errors
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
  };
}

// Input sanitization utilities
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 100);
}

export function sanitizeSearchQuery(input: string): string {
  return input
    .trim()
    .replace(/[<>\"'&]/g, "") // Remove potential XSS characters
    .substring(0, 200);
}
