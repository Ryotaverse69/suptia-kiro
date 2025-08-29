import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

/**
 * Enhanced validation schemas for API endpoints
 */

// Common validation patterns
const slugSchema = z.string()
  .min(1, "Slug is required")
  .max(100, "Slug too long")
  .regex(/^[a-z0-9-]+$/, "Invalid slug format");

const emailSchema = z.string()
  .email("Invalid email format")
  .max(254, "Email too long");

const nameSchema = z.string()
  .min(1, "Name is required")
  .max(100, "Name too long")
  .regex(/^[a-zA-Z0-9\s\-_.]+$/, "Invalid characters in name");

// Product query validation
export const ProductQuerySchema = z.object({
  slug: slugSchema,
});

// Enhanced search query validation
export const SearchQuerySchema = z.object({
  q: z.string()
    .min(1, "Search query is required")
    .max(200, "Search query too long")
    .transform(str => str.trim()),
  page: z.coerce.number()
    .int("Page must be an integer")
    .min(1, "Page must be at least 1")
    .max(100, "Page too high")
    .default(1),
  limit: z.coerce.number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(50, "Limit too high")
    .default(10),
  category: z.string()
    .max(50, "Category too long")
    .optional(),
  sortBy: z.enum(["relevance", "price", "rating", "name"])
    .default("relevance"),
  sortOrder: z.enum(["asc", "desc"])
    .default("desc"),
});

// Contact form validation
export const ContactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z.string()
    .min(1, "Subject is required")
    .max(200, "Subject too long"),
  message: z.string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message too long"),
  honeypot: z.string()
    .max(0, "Bot detected") // Honeypot field should be empty
    .optional(),
});

// Newsletter subscription validation
export const NewsletterSchema = z.object({
  email: emailSchema,
  preferences: z.array(z.enum(["supplements", "health", "research"]))
    .max(10, "Too many preferences")
    .optional(),
});

// Product review validation
export const ProductReviewSchema = z.object({
  productSlug: slugSchema,
  rating: z.number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  title: z.string()
    .min(1, "Review title is required")
    .max(100, "Review title too long"),
  content: z.string()
    .min(10, "Review must be at least 10 characters")
    .max(1000, "Review too long"),
  name: nameSchema,
  email: emailSchema,
  verified: z.boolean().default(false),
});

// API key validation (for internal APIs)
export const ApiKeySchema = z.object({
  key: z.string()
    .min(32, "API key too short")
    .max(128, "API key too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid API key format"),
});

/**
 * Validation middleware factory
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  source: 'query' | 'body' = 'query'
) {
  return function(
    handler: (req: NextRequest, data: T) => Promise<NextResponse>
  ) {
    return async (req: NextRequest) => {
      try {
        let rawData: unknown;

        if (source === 'query') {
          // Parse query parameters
          const url = new URL(req.url);
          rawData = Object.fromEntries(url.searchParams.entries());
        } else {
          // Parse JSON body
          try {
            rawData = await req.json();
          } catch (error) {
            return NextResponse.json(
              {
                error: "Invalid JSON",
                message: "Request body must be valid JSON",
              },
              { status: 400 }
            );
          }
        }

        // Validate data against schema
        const validatedData = schema.parse(rawData);

        // Call the handler with validated data
        return await handler(req, validatedData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            {
              error: "Validation failed",
              message: "Invalid input data",
              details: error.issues.map(err => ({
                field: err.path.join('.'),
                message: err.message,
                code: err.code,
              })),
            },
            { status: 400 }
          );
        }

        // Re-throw non-validation errors
        throw error;
      }
    };
  };
}

/**
 * Sanitization utilities
 */
export const sanitize = {
  /**
   * Sanitize slug for URL safety
   */
  slug: (input: string): string => {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
  },

  /**
   * Sanitize search query
   */
  searchQuery: (input: string): string => {
    return input
      .trim()
      .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
      .substring(0, 200);
  },

  /**
   * Sanitize HTML content (basic)
   */
  html: (input: string): string => {
    return input
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },

  /**
   * Sanitize email for logging
   */
  emailForLogging: (email: string): string => {
    const [local, domain] = email.split('@');
    if (!domain) return '[invalid-email]';
    
    const maskedLocal = local.length > 2 
      ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
      : local[0] + '*';
    
    return `${maskedLocal}@${domain}`;
  },
};

/**
 * Input validation for specific use cases
 */
export const validate = {
  /**
   * Validate and sanitize product slug
   */
  productSlug: (slug: string): { isValid: boolean; sanitized: string; errors?: string[] } => {
    const sanitized = sanitize.slug(slug);
    const result = slugSchema.safeParse(sanitized);
    
    return {
      isValid: result.success,
      sanitized,
      errors: result.success ? undefined : result.error.issues.map(e => e.message),
    };
  },

  /**
   * Validate email with additional checks
   */
  email: (email: string): { isValid: boolean; sanitized: string; errors?: string[] } => {
    const sanitized = email.toLowerCase().trim();
    const result = emailSchema.safeParse(sanitized);
    
    // Additional checks for common typos and disposable emails
    const disposableDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com'];
    const hasDisposableDomain = disposableDomains.some(domain => 
      sanitized.endsWith(`@${domain}`)
    );
    
    return {
      isValid: result.success && !hasDisposableDomain,
      sanitized,
      errors: result.success 
        ? (hasDisposableDomain ? ['Disposable email addresses are not allowed'] : undefined)
        : result.error.issues.map(e => e.message),
    };
  },

  /**
   * Validate search query with content filtering
   */
  searchQuery: (query: string): { isValid: boolean; sanitized: string; errors?: string[] } => {
    const sanitized = sanitize.searchQuery(query);
    
    // Check for potentially malicious content in original query
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:text\/html/i,
    ];
    
    const hasMaliciousContent = maliciousPatterns.some(pattern => 
      pattern.test(query) // Check original query, not sanitized
    );
    
    const errors: string[] = [];
    
    if (hasMaliciousContent) {
      errors.push('Query contains potentially malicious content');
    }
    if (sanitized.length === 0) {
      errors.push('Query cannot be empty');
    }
    if (query.trim().length > 200) { // Check original query length
      errors.push('Query is too long');
    }
    
    return {
      isValid: sanitized.length > 0 && query.trim().length <= 200 && !hasMaliciousContent,
      sanitized,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
};

// Export types for external use
export type ProductQuery = z.infer<typeof ProductQuerySchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type ContactForm = z.infer<typeof ContactFormSchema>;
export type Newsletter = z.infer<typeof NewsletterSchema>;
export type ProductReview = z.infer<typeof ProductReviewSchema>;