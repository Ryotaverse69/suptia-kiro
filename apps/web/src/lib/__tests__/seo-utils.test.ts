import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  buildCanonicalUrl,
  buildBreadcrumbJsonLd,
  buildItemListJsonLd,
  buildProductJsonLd,
  buildOgImageUrl,
} from '@/lib/utils/seo';

const originalEnv = { ...process.env };

describe('seo utility helpers', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('builds canonical URLs relative to site URL', () => {
    expect(buildCanonicalUrl('/search')).toBe('https://example.com/search');
    expect(buildCanonicalUrl('https://other.com/page')).toBe(
      'https://other.com/page'
    );
  });

  it('creates breadcrumb JSON-LD with absolute URLs', () => {
    const jsonLd = buildBreadcrumbJsonLd([
      { name: 'ホーム', url: '/' },
      { name: '検索', url: '/search' },
    ]);

    expect(jsonLd['@type']).toBe('BreadcrumbList');
    expect(jsonLd.itemListElement[0].item).toBe('https://example.com/');
    expect(jsonLd.itemListElement[1].item).toBe('https://example.com/search');
  });

  it('creates item list JSON-LD entries', () => {
    const jsonLd = buildItemListJsonLd({
      name: 'テスト',
      description: '一覧',
      items: [
        {
          id: 'prod-1',
          name: '商品A',
          url: '/products/a',
          brand: 'ブランドA',
          price: 1200,
        },
        {
          id: 'prod-2',
          name: '商品B',
          url: '/products/b',
          brand: 'ブランドB',
          price: 1500,
          priceHigh: 1800,
        },
      ],
    });

    expect(jsonLd.itemListElement).toHaveLength(2);
    expect(jsonLd.itemListElement[0].item['@type']).toBe('Product');
    expect(jsonLd.itemListElement[1].item.offers.highPrice).toBe(1800);
  });

  it('builds product JSON-LD with fallback image and availability', () => {
    const jsonLd = buildProductJsonLd({
      id: 'prod-1',
      name: '商品A',
      price: 2200,
      priceCurrency: 'JPY',
    });

    expect(jsonLd['@id']).toBe('https://example.com/products/prod-1');
    expect(jsonLd.offers.url).toBe('https://example.com/products/prod-1');
    expect(jsonLd.image).toBe(
      'https://example.com/placeholders/product-placeholder.svg'
    );
    expect(jsonLd.offers.availability).toBe('https://schema.org/InStock');
  });

  it('returns absolute OG image URL', () => {
    expect(buildOgImageUrl('/og.png')).toBe('https://example.com/og.png');
  });
});
