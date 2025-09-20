/**
 * サイトマップ生成
 * 本番環境対応のSEO最適化
 */

import { MetadataRoute } from 'next';
import { env } from '@/lib/env-validation';
import { MOCK_INGREDIENTS } from '@/lib/ingredient-data';
import { fetchProductsForSearch } from '@/lib/sanity/queries';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.site.url;
  const currentDate = new Date();

  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ingredients`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/diagnosis`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/legal/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/disclaimer`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const dynamicPages: MetadataRoute.Sitemap = [];

  MOCK_INGREDIENTS.forEach(ingredient => {
    dynamicPages.push({
      url: `${baseUrl}/ingredients/${ingredient.id}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  return [...staticPages, ...dynamicPages];
}

/**
 * 商品サイトマップの生成（別ファイル）
 */
export async function generateProductSitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.site.url;
  try {
    const products = await fetchProductsForSearch();
    if (products.length === 0) {
      return [];
    }

    return products.slice(0, 500).map(product => ({
      url: `${baseUrl}/products/${product.slug ?? product._id}`,
      lastModified: product._updatedAt
        ? new Date(product._updatedAt)
        : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Failed to build product sitemap', error);
    return [];
  }
}
