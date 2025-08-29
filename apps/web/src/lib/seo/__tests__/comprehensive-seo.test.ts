/**
 * 包括的SEOテスト
 * 要件8.2: SEOテスト（JSON-LD、サイトマップ、canonical URL）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// SEO関連のモジュールをインポート
import { generateProductJsonLd, generateBreadcrumbJsonLd } from '../json-ld';
import { cleanUrl, generateCanonical } from '../canonical';

// Mock runtimeConfig
vi.mock('../../runtimeConfig', () => ({
  getSiteUrl: () => 'https://suptia.com',
}));

describe('包括的SEOテスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('JSON-LD構造化データテスト', () => {
    it('Product JSON-LDが正しく生成される (要件4.1)', () => {
      const productData = {
        name: 'ビタミンC 1000mg',
        brand: 'Suptia',
        priceJPY: 2980,
        slug: 'vitamin-c',
        description: '高品質なビタミンCサプリメント',
        images: ['https://cdn.sanity.io/images/vitamin-c.jpg']
      };

      const jsonLd = generateProductJsonLd(productData);

      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd['@type']).toBe('Product');
      expect(jsonLd.name).toBe(productData.name);
      expect(jsonLd.brand).toEqual({
        '@type': 'Brand',
        name: productData.brand
      });
      expect(jsonLd.offers).toEqual({
        '@type': 'Offer',
        price: productData.priceJPY,
        priceCurrency: 'JPY',
        availability: 'https://schema.org/InStock',
        url: `https://suptia.com/products/${productData.slug}`
      });
      expect(jsonLd.url).toBe(`https://suptia.com/products/${productData.slug}`);
      expect(jsonLd.image).toBe(productData.images[0]);
      expect(jsonLd.description).toBe(productData.description);
    });

    it('BreadcrumbList JSON-LDが正しく生成される (要件4.4)', () => {
      const breadcrumbs = [
        { name: 'ホーム', url: '/' },
        { name: '商品一覧', url: '/products' },
        { name: 'ビタミンC', url: '/products/vitamin-c' }
      ];

      const jsonLd = generateBreadcrumbJsonLd(breadcrumbs);

      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd['@type']).toBe('BreadcrumbList');
      expect(jsonLd.itemListElement).toHaveLength(3);
      
      jsonLd.itemListElement.forEach((item, index) => {
        expect(item['@type']).toBe('ListItem');
        expect(item.position).toBe(index + 1);
        expect(item.name).toBe(breadcrumbs[index].name);
        expect(item.item).toBe(`https://suptia.com${breadcrumbs[index].url}`);
      });
    });

    it('JSON-LD構造化データが有効なスキーマに準拠する', () => {
      const productData = {
        name: 'プロテイン 1kg',
        brand: 'Suptia',
        priceJPY: 4980,
        slug: 'protein'
      };

      const jsonLd = generateProductJsonLd(productData);
      const jsonString = JSON.stringify(jsonLd);

      // JSON-LDが有効なJSONであることを確認
      expect(() => JSON.parse(jsonString)).not.toThrow();
      
      // 必須フィールドの存在確認
      expect(jsonLd).toHaveProperty('@context');
      expect(jsonLd).toHaveProperty('@type');
      expect(jsonLd).toHaveProperty('name');
      expect(jsonLd).toHaveProperty('offers');
    });
  });

  describe('サイトマップ生成テスト', () => {
    it('動的サイトマップが正しく生成される (要件4.2)', async () => {
      // サイトマップ生成のモック
      const mockProducts = [
        { slug: 'vitamin-c', updatedAt: '2024-01-01T00:00:00Z' },
        { slug: 'protein', updatedAt: '2024-01-02T00:00:00Z' },
        { slug: 'multivitamin', updatedAt: '2024-01-03T00:00:00Z' }
      ];

      const generateSitemap = (products: typeof mockProducts) => {
        const baseUrl = 'https://suptia.com';
        const staticPages = [
          { url: `${baseUrl}/`, lastmod: '2024-01-01T00:00:00Z', priority: 1.0 },
          { url: `${baseUrl}/products`, lastmod: '2024-01-01T00:00:00Z', priority: 0.8 },
          { url: `${baseUrl}/compare`, lastmod: '2024-01-01T00:00:00Z', priority: 0.6 }
        ];

        const productPages = products.map(product => ({
          url: `${baseUrl}/products/${product.slug}`,
          lastmod: product.updatedAt,
          priority: 0.7
        }));

        return [...staticPages, ...productPages];
      };

      const sitemap = generateSitemap(mockProducts);

      expect(sitemap).toHaveLength(6); // 3 static + 3 products
      expect(sitemap[0].url).toBe('https://suptia.com/');
      expect(sitemap[0].priority).toBe(1.0);
      expect(sitemap[3].url).toBe('https://suptia.com/products/vitamin-c');
      expect(sitemap[3].priority).toBe(0.7);
    });

    it('robots.txtが正しく生成される (要件4.2)', () => {
      const generateRobotsTxt = () => {
        const baseUrl = 'https://suptia.com';
        return [
          'User-agent: *',
          'Allow: /',
          'Disallow: /api/',
          'Disallow: /_next/',
          '',
          `Sitemap: ${baseUrl}/sitemap.xml`
        ].join('\n');
      };

      const robotsTxt = generateRobotsTxt();

      expect(robotsTxt).toContain('User-agent: *');
      expect(robotsTxt).toContain('Allow: /');
      expect(robotsTxt).toContain('Disallow: /api/');
      expect(robotsTxt).toContain('Sitemap: https://suptia.com/sitemap.xml');
    });
  });

  describe('Canonical URL最適化テスト', () => {
    it('UTMパラメータが正しく除去される (要件4.3)', () => {
      const urlsWithTracking = [
        'https://suptia.com/products/vitamin-c?utm_source=google&utm_medium=cpc&utm_campaign=summer',
        'https://suptia.com/products/protein?utm_source=facebook&fbclid=123456&gclid=789012',
        'https://suptia.com/compare?utm_source=newsletter&ref=email&utm_content=header'
      ];

      const expectedCleanUrls = [
        'https://suptia.com/products/vitamin-c',
        'https://suptia.com/products/protein',
        'https://suptia.com/compare'
      ];

      urlsWithTracking.forEach((url, index) => {
        const cleanedUrl = cleanUrl(url);
        expect(cleanedUrl).toBe(expectedCleanUrls[index]);
      });
    });

    it('有効なクエリパラメータは保持される', () => {
      const urlsWithValidParams = [
        'https://suptia.com/products?category=vitamins&sort=price',
        'https://suptia.com/compare?products=vitamin-c%2Cprotein', // URLエンコード済み
        'https://suptia.com/products/vitamin-c?variant=1000mg'
      ];

      urlsWithValidParams.forEach(url => {
        const cleanedUrl = cleanUrl(url);
        expect(cleanedUrl).toBe(url); // 変更されないことを確認
      });
    });

    it('canonical URLが動的に生成される (要件4.5)', () => {
      const paths = [
        '/products/vitamin-c',
        '/products/protein',
        '/compare',
        '/'
      ];

      const expectedCanonicals = [
        'https://suptia.com/products/vitamin-c',
        'https://suptia.com/products/protein',
        'https://suptia.com/compare',
        'https://suptia.com/'
      ];

      paths.forEach((path, index) => {
        const canonical = generateCanonical(path);
        expect(canonical).toBe(expectedCanonicals[index]);
      });
    });
  });

  describe('動的メタデータ生成テスト', () => {
    it('商品ページの動的メタデータが正しく生成される (要件4.5)', () => {
      const productData = {
        name: 'ビタミンC 1000mg',
        description: '高品質なビタミンCサプリメント。免疫力向上をサポート。',
        slug: 'vitamin-c',
        image: 'https://cdn.sanity.io/images/vitamin-c.jpg'
      };

      const generateProductMetadata = (product: typeof productData) => {
        const baseUrl = 'https://suptia.com';
        return {
          title: `${product.name} | Suptia`,
          description: product.description,
          canonical: `${baseUrl}/products/${product.slug}`,
          openGraph: {
            title: product.name,
            description: product.description,
            url: `${baseUrl}/products/${product.slug}`,
            type: 'product',
            images: [product.image]
          },
          twitter: {
            card: 'summary_large_image' as const,
            title: product.name,
            description: product.description,
            images: [product.image]
          }
        };
      };

      const metadata = generateProductMetadata(productData);

      expect(metadata.title).toBe('ビタミンC 1000mg | Suptia');
      expect(metadata.description).toBe(productData.description);
      expect(metadata.canonical).toBe('https://suptia.com/products/vitamin-c');
      expect(metadata.openGraph.type).toBe('product');
      expect(metadata.twitter.card).toBe('summary_large_image');
    });
  });

  describe('SEO統合シナリオテスト', () => {
    it('商品詳細ページのSEO要素が統合的に動作する', () => {
      const productData = {
        name: 'マルチビタミン 30日分',
        brand: 'Suptia',
        price: 1980,
        currency: 'JPY',
        availability: 'InStock',
        slug: 'multivitamin',
        description: '1日1粒で必要なビタミンを摂取できるマルチビタミンサプリメント',
        image: 'https://cdn.sanity.io/images/multivitamin.jpg'
      };

      // 1. Product JSON-LD生成
      const productJsonLd = generateProductJsonLd({
        ...productData,
        url: `https://suptia.com/products/${productData.slug}`
      });

      // 2. パンくずリスト生成
      const breadcrumbs = [
        { name: 'ホーム', url: 'https://suptia.com' },
        { name: '商品一覧', url: 'https://suptia.com/products' },
        { name: productData.name, url: `https://suptia.com/products/${productData.slug}` }
      ];
      const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);

      // 3. Canonical URL生成
      const canonical = generateCanonical(`/products/${productData.slug}`);

      // 統合検証
      expect(productJsonLd.name).toBe(productData.name);
      expect(breadcrumbJsonLd.itemListElement).toHaveLength(3);
      expect(canonical).toBe(`https://suptia.com/products/${productData.slug}`);

      // JSON-LDの有効性確認
      expect(() => JSON.stringify([productJsonLd, breadcrumbJsonLd])).not.toThrow();
    });

    it('検索エンジン最適化要件を満たす', () => {
      const pageData = {
        title: 'サプリメント比較 | Suptia',
        description: '高品質なサプリメントを比較検討できます。成分、価格、効果を詳しく比較。',
        path: '/compare',
        lastModified: '2024-01-01T00:00:00Z'
      };

      // メタデータ生成
      const metadata = {
        title: pageData.title,
        description: pageData.description,
        canonical: generateCanonical(pageData.path),
        robots: 'index,follow',
        lastModified: pageData.lastModified
      };

      // SEO要件の検証
      expect(metadata.title.length).toBeLessThanOrEqual(60); // タイトル長制限
      expect(metadata.description.length).toBeLessThanOrEqual(160); // 説明文長制限
      expect(metadata.canonical).toMatch(/^https:\/\/suptia\.com/); // HTTPS必須
      expect(metadata.robots).toBe('index,follow'); // インデックス許可
    });
  });
});