/**
 * ISR（Incremental Static Regeneration）設定とキャッシュ戦略
 * Requirements: 32.2, 32.4 - ISR設定とキャッシュ戦略
 */

// ISR再検証時間の定数定義
export const REVALIDATE_TIMES = {
  // 商品詳細ページ: 1時間
  PRODUCT: parseInt(process.env.PRODUCT_REVALIDATE_TIME || '3600', 10),
  // 検索結果・一覧ページ: 10分
  LISTING: parseInt(process.env.LISTING_REVALIDATE_TIME || '600', 10),
  // 成分詳細ページ: 1時間
  INGREDIENT: parseInt(process.env.PRODUCT_REVALIDATE_TIME || '3600', 10),
  // ホームページ: 5分
  HOME: 300,
  // 静的ページ: 1日
  STATIC: 86400,
} as const;

// キャッシュタグの定義
export const CACHE_TAGS = {
  PRODUCTS: 'products',
  INGREDIENTS: 'ingredients',
  BRANDS: 'brands',
  CATEGORIES: 'categories',
  SEARCH: 'search',
  POPULAR: 'popular',
} as const;

/**
 * ページタイプに基づいて適切な再検証時間を取得
 */
export function getRevalidateTime(
  pageType: keyof typeof REVALIDATE_TIMES
): number {
  return REVALIDATE_TIMES[pageType];
}

/**
 * Sanity Webhookによる再検証のためのパス生成
 */
export function getRevalidationPaths(
  documentType: string,
  slug?: string
): string[] {
  const paths: string[] = [];

  switch (documentType) {
    case 'product':
      if (slug) {
        paths.push(`/products/${slug}`);
      }
      // 商品が更新された場合、関連する検索結果も再検証
      paths.push('/search');
      paths.push('/');
      break;

    case 'ingredient':
      if (slug) {
        paths.push(`/ingredients/${slug}`);
      }
      // 成分が更新された場合、関連する商品ページも再検証
      paths.push('/');
      break;

    case 'brand':
      // ブランドが更新された場合、関連する商品ページを再検証
      paths.push('/search');
      paths.push('/');
      break;

    default:
      // その他の更新の場合はホームページのみ再検証
      paths.push('/');
      break;
  }

  return paths;
}

/**
 * キャッシュヘッダーの生成
 */
export function getCacheHeaders(pageType: keyof typeof REVALIDATE_TIMES) {
  const revalidateTime = getRevalidateTime(pageType);

  return {
    'Cache-Control': `s-maxage=${revalidateTime}, stale-while-revalidate=${revalidateTime * 2}`,
    'CDN-Cache-Control': `max-age=${revalidateTime}`,
    'Vercel-CDN-Cache-Control': `max-age=${revalidateTime}`,
  };
}

/**
 * 条件付き再検証の判定
 */
export function shouldRevalidate(
  lastModified: string,
  pageType: keyof typeof REVALIDATE_TIMES
): boolean {
  const revalidateTime = getRevalidateTime(pageType);
  const lastModifiedTime = new Date(lastModified).getTime();
  const now = Date.now();

  return now - lastModifiedTime > revalidateTime * 1000;
}

/**
 * 本番環境でのキャッシュ最適化設定
 */
export const CACHE_CONFIG = {
  // 静的アセット
  static: {
    maxAge: 31536000, // 1年
    immutable: true,
  },
  // API レスポンス
  api: {
    maxAge: 60, // 1分
    staleWhileRevalidate: 300, // 5分
  },
  // 画像
  images: {
    maxAge: 86400, // 1日
    staleWhileRevalidate: 604800, // 1週間
  },
  // フォント
  fonts: {
    maxAge: 31536000, // 1年
    immutable: true,
  },
} as const;
