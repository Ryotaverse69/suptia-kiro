import { sanitizePortableText as baseSanitize, sanitizeHTML } from '@/lib/sanitize';

export { sanitizeHTML };

// Wrapper to emphasize strict allowlist for Portable Text
export function sanitizePortableText(blocks: any[]) {
  return baseSanitize(blocks);
}

