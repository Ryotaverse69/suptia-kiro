// 統一: 正準キーは NEXT_PUBLIC_SITE_URL
// 互換: 一時的に NEXT_PUBLIC_BASE_URL も読む（将来削除予定）
export const CONFIG = {
  SITE_URL:
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "http://localhost:3000",
  SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "demo",
  SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "public",
} as const;

export default CONFIG;

// Helper getters to resolve env at access-time (useful for tests)
export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "http://localhost:3000"
  );
}
