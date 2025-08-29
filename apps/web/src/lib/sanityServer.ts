import "server-only";
import { createClient } from "@sanity/client";
import { createServerClientConfig } from "./security/token-protection";
import { CACHE_TAGS } from "./cache-invalidation";

// Server-side client with secure token handling
export const sanityServer = createClient(createServerClientConfig());

/**
 * Enhanced Sanity client with cache tagging support
 * キャッシュタグサポート付きの拡張Sanityクライアント
 */
export const sanityServerWithCache = {
  /**
   * Fetch products with cache tagging
   * キャッシュタグ付きで商品を取得
   */
  async fetchProducts(query: string, params?: Record<string, any>) {
    const result = await sanityServer.fetch(query, params, {
      next: {
        tags: [CACHE_TAGS.PRODUCTS, CACHE_TAGS.PRODUCT_LIST],
        revalidate: 1800, // 30 minutes
      },
    });
    return result;
  },

  /**
   * Fetch single product with cache tagging
   * キャッシュタグ付きで単一商品を取得
   */
  async fetchProduct(query: string, params?: Record<string, any>) {
    const result = await sanityServer.fetch(query, params, {
      next: {
        tags: [CACHE_TAGS.PRODUCTS, CACHE_TAGS.PRODUCT_DETAIL],
        revalidate: 600, // 10 minutes
      },
    });
    return result;
  },

  /**
   * Generic fetch with custom cache options
   * カスタムキャッシュオプション付きの汎用fetch
   */
  async fetchWithCache(
    query: string, 
    params?: Record<string, any>,
    cacheOptions?: {
      tags?: string[];
      revalidate?: number;
    }
  ) {
    const result = await sanityServer.fetch(query, params, {
      next: cacheOptions,
    });
    return result;
  },
};
