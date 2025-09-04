/**
 * サイトマップ生成
 * 本番環境対応のSEO最適化
 */

import { MetadataRoute } from 'next';
import { env } from '@/lib/env-validation';

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
  
  // 動的ページ（商品ページなど）は別途生成
  // 本番環境では実際のデータから生成する
  const dynamicPages: MetadataRoute.Sitemap = [];
  
  // 成分カテゴリページ
  const ingredientCategories = [
    'vitamins',
    'minerals', 
    'herbs',
    'amino-acids',
    'probiotics',
    'omega-3',
  ];
  
  ingredientCategories.forEach(category => {
    dynamicPages.push({
      url: `${baseUrl}/ingredients/${category}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  });
  
  // 目的別ページ
  const purposes = [
    'fatigue-recovery',
    'immune-support',
    'beauty',
    'brain-health',
    'heart-health',
    'bone-health',
  ];
  
  purposes.forEach(purpose => {
    dynamicPages.push({
      url: `${baseUrl}/ingredients/purpose/${purpose}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  });
  
  return [...staticPages, ...dynamicPages];
}

/**
 * 商品サイトマップの生成（別ファイル）
 */
export async function generateProductSitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.site.url;
  
  // 本番環境では実際の商品データから生成
  // ここではサンプルデータを使用
  const sampleProducts = [
    {
      slug: 'vitamin-c-1000mg',
      lastModified: new Date('2024-01-15'),
    },
    {
      slug: 'vitamin-d3-2000iu',
      lastModified: new Date('2024-01-10'),
    },
    {
      slug: 'omega-3-fish-oil',
      lastModified: new Date('2024-01-12'),
    },
  ];
  
  return sampleProducts.map(product => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
}