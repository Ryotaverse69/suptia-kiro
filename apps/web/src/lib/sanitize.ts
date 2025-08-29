// XSS protection and content sanitization utilities

// 新しいPortable Textサニタイザーを使用することを推奨
// 詳細な実装は lib/content/portable-text-sanitizer.ts を参照
import { 
  sanitizePortableText as newSanitizePortableText,
  ALLOWED_BLOCK_TYPES,
  ALLOWED_MARKS,
  ALLOWED_STYLES
} from './content/portable-text-sanitizer';

// 後方互換性のためのレガシー関数（非推奨）
// @deprecated 新しい lib/content/portable-text-sanitizer.ts を使用してください
export function sanitizePortableText(blocks: any[]): any[] {
  console.warn('sanitizePortableText is deprecated. Use lib/content/portable-text-sanitizer.ts instead');
  return newSanitizePortableText(blocks);
}

// 後方互換性のための定数エクスポート
export { ALLOWED_BLOCK_TYPES, ALLOWED_MARKS, ALLOWED_STYLES };

// Slug utilities with validation
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length > 0 && slug.length <= 100;
}

export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove invalid characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length
}

// Generate unique slug with suffix if needed
export function generateUniqueSlug(
  baseSlug: string,
  existingSlugs: string[],
): string {
  const normalized = normalizeSlug(baseSlug);

  if (!existingSlugs.includes(normalized)) {
    return normalized;
  }

  let counter = 1;
  let uniqueSlug = `${normalized}-${counter}`;

  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${normalized}-${counter}`;
  }

  return uniqueSlug;
}

// HTML sanitization for user input
export function sanitizeHTML(input: string): string {
  return input.replace(/[<>\"'&]/g, (match) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "&": "&amp;",
    };
    return entities[match] || match;
  });
}
