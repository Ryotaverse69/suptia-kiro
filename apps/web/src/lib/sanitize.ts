// XSS protection and content sanitization utilities

// Allowed block types for Portable Text
export const ALLOWED_BLOCK_TYPES = ["block", "image", "break"] as const;

// Allowed marks for Portable Text
export const ALLOWED_MARKS = ["strong", "em", "code", "underline"] as const;

// Allowed styles for blocks
export const ALLOWED_STYLES = [
  "normal",
  "h1",
  "h2",
  "h3",
  "h4",
  "blockquote",
] as const;

// Sanitize Portable Text content
export function sanitizePortableText(blocks: any[]): any[] {
  if (!Array.isArray(blocks)) {
    return [];
  }

  return blocks
    .filter((block) => {
      // Only allow whitelisted block types
      return block && ALLOWED_BLOCK_TYPES.includes(block._type);
    })
    .map((block) => {
      if (block._type === "block") {
        return {
          ...block,
          style: ALLOWED_STYLES.includes(block.style) ? block.style : "normal",
          children: Array.isArray(block.children)
            ? block.children.map(sanitizeSpan)
            : [],
          markDefs: [], // Remove all mark definitions to prevent link injection
        };
      }

      if (block._type === "image") {
        return {
          _type: "image",
          _key: block._key,
          asset: block.asset,
          alt: typeof block.alt === "string" ? block.alt.substring(0, 200) : "",
        };
      }

      return block;
    });
}

function sanitizeSpan(span: any): any {
  if (!span || typeof span !== "object") {
    return { _type: "span", text: "" };
  }

  return {
    _type: "span",
    _key: span._key,
    text: typeof span.text === "string" ? span.text : "",
    marks: Array.isArray(span.marks)
      ? span.marks.filter((mark: any) => ALLOWED_MARKS.includes(mark))
      : [],
  };
}

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
