/**
 * Cache Invalidation Strategies for ISR
 * キャッシュ無効化戦略の実装
 */

import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * ISR Cache Configuration
 * ISRキャッシュ設定
 */
export const ISR_CONFIG = {
  // Product detail pages: 10 minutes
  PRODUCT_DETAIL: 600,
  // Product listing pages: 30 minutes  
  PRODUCT_LIST: 1800,
  // Static pages: 1 hour
  STATIC_PAGES: 3600,
  // Compare pages: 1 hour
  COMPARE_PAGES: 3600,
} as const;

/**
 * Cache Tags for targeted invalidation
 * 対象を絞ったキャッシュ無効化のためのタグ
 */
export const CACHE_TAGS = {
  PRODUCTS: 'products',
  PRODUCT_DETAIL: 'product-detail',
  PRODUCT_LIST: 'product-list',
  COMPARE: 'compare',
} as const;

/**
 * Invalidate product-related caches
 * 商品関連のキャッシュを無効化
 */
export async function invalidateProductCaches(productSlug?: string) {
  try {
    // Invalidate product list page
    revalidatePath('/');
    
    // Invalidate specific product page if slug provided
    if (productSlug) {
      revalidatePath(`/products/${productSlug}`);
    }
    
    // Invalidate compare page
    revalidatePath('/compare');
    
    console.log('Product caches invalidated successfully', { productSlug });
  } catch (error) {
    console.error('Failed to invalidate product caches:', error);
    throw error;
  }
}

/**
 * Invalidate all product pages
 * すべての商品ページのキャッシュを無効化
 */
export async function invalidateAllProductPages() {
  try {
    // Invalidate all product detail pages
    revalidatePath('/products/[slug]', 'page');
    
    // Invalidate product list
    revalidatePath('/');
    
    console.log('All product pages invalidated successfully');
  } catch (error) {
    console.error('Failed to invalidate all product pages:', error);
    throw error;
  }
}

/**
 * Invalidate specific page by path
 * パス指定でページキャッシュを無効化
 */
export async function invalidatePageCache(path: string) {
  try {
    revalidatePath(path);
    console.log(`Page cache invalidated: ${path}`);
  } catch (error) {
    console.error(`Failed to invalidate page cache: ${path}`, error);
    throw error;
  }
}

/**
 * Invalidate cache by tag
 * タグ指定でキャッシュを無効化
 */
export async function invalidateCacheByTag(tag: string) {
  try {
    revalidateTag(tag);
    console.log(`Cache invalidated by tag: ${tag}`);
  } catch (error) {
    console.error(`Failed to invalidate cache by tag: ${tag}`, error);
    throw error;
  }
}

/**
 * Cache invalidation strategy for content updates
 * コンテンツ更新時のキャッシュ無効化戦略
 */
export const CacheInvalidationStrategy = {
  /**
   * When a product is created/updated/deleted
   * 商品が作成/更新/削除された時
   */
  onProductChange: async (productSlug?: string) => {
    await invalidateProductCaches(productSlug);
  },

  /**
   * When multiple products are updated
   * 複数の商品が更新された時
   */
  onBulkProductUpdate: async () => {
    await invalidateAllProductPages();
  },

  /**
   * When site-wide content is updated
   * サイト全体のコンテンツが更新された時
   */
  onSiteContentUpdate: async () => {
    // Invalidate all pages
    revalidatePath('/', 'layout');
  },

  /**
   * Manual cache refresh
   * 手動キャッシュ更新
   */
  manualRefresh: async (paths: string[]) => {
    for (const path of paths) {
      await invalidatePageCache(path);
    }
  },
};

/**
 * ISR Status Check
 * ISRステータス確認
 */
export function getISRStatus() {
  return {
    config: ISR_CONFIG,
    tags: CACHE_TAGS,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  };
}