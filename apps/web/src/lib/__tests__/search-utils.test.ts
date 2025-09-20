import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/sanity/queries', () => ({ fetchProductsForSearch: vi.fn() }));

import type { ResultProduct } from '@/components/search/ResultCard';
import { __internal, type SearchFiltersInput } from '@/lib/search';

const baseProduct: ResultProduct = {
  id: 'prod-1',
  name: 'ビタミンC サプリメント',
  brand: 'Nature Made',
  category: 'ビタミン',
  rating: 4.6,
  reviewCount: 240,
  priceRange: [1200, 1500],
  sellers: [{ site: '公式', price: 1200, url: '#', currency: 'JPY' }],
  mainIngredients: ['ビタミンC'],
  imageUrl: '/placeholders/product-placeholder.svg',
  description: 'テスト',
  servingsPerContainer: 60,
  servingsPerDay: 2,
  thirdPartyTested: true,
  form: 'tablet',
  popularityScore: 1200,
  isInStock: true,
  isOnSale: true,
  updatedAt: Date.now(),
  targetGoals: ['免疫ケア'],
};

describe('productMatchesFilters', () => {
  const { productMatchesFilters, buildSellers } = __internal;

  it('matches when filters are empty', () => {
    const matches = productMatchesFilters(baseProduct, {}, '');
    expect(matches).toBe(true);
  });

  it('respects search term and category/brand filters', () => {
    const filters: SearchFiltersInput = {
      searchTerm: 'nature',
      categories: ['ビタミン'],
      brands: ['Nature'],
      ingredients: ['ビタミンC'],
      goals: ['免疫'],
      minPrice: 1000,
      maxPrice: 1500,
      rating: 4,
      inStockOnly: true,
      onSale: true,
    };

    const matches = productMatchesFilters(baseProduct, filters, 'nature');
    expect(matches).toBe(true);

    const failsQuery = productMatchesFilters(baseProduct, filters, 'タンパク');
    expect(failsQuery).toBe(false);

    const failsPrice = productMatchesFilters(
      {
        ...baseProduct,
        sellers: [{ site: '公式', price: 800, url: '#', currency: 'JPY' }],
      },
      filters,
      'nature'
    );
    expect(failsPrice).toBe(false);
  });

  it('builds sellers with currency conversion fallback', () => {
    const sellers = buildSellers({
      _id: 'test',
      name: 'テスト商品',
      brand: { name: 'ブランド' },
      prices: [
        {
          store: 'USDショップ',
          price: 10,
          currency: 'USD',
          inStock: true,
          onSale: false,
          lastUpdated: '2024-01-01',
        },
      ],
    } as any);

    expect(sellers).toHaveLength(1);
    expect(sellers[0].site).toBe('USDショップ');
    expect(typeof sellers[0].price).toBe('number');
  });
});
