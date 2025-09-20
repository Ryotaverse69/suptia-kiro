import { describe, it, expect, beforeEach, vi } from 'vitest';

import { getSearchSuggestions, __internal } from '@/lib/search/suggestions';

vi.mock('@/lib/sanity/queries', () => ({
  fetchProductsForSearch: vi.fn(),
  fetchIngredientsForSuggestions: vi.fn(),
}));

import {
  fetchProductsForSearch,
  fetchIngredientsForSuggestions,
} from '@/lib/sanity/queries';

describe('search suggestions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    __internal.clearCache();
  });

  const productDoc = {
    _id: 'prod-1',
    name: 'ビタミンC プレミアム',
    brand: { name: 'Nature Made', _id: 'brand-1' },
    category: { name: 'ビタミン', slug: 'vitamins' },
    rating: 4.8,
    reviewCount: 200,
    targetGoals: ['免疫ケア'],
    mainIngredients: ['ビタミンC'],
  } as any;

  const ingredientDoc = {
    _id: 'ing-1',
    name: 'ビタミンC',
    category: 'ビタミン',
    popularityScore: 95,
  } as any;

  it('returns ranked suggestions when query is empty', async () => {
    (fetchProductsForSearch as any).mockResolvedValue([productDoc]);
    (fetchIngredientsForSuggestions as any).mockResolvedValue([ingredientDoc]);

    const suggestions = await getSearchSuggestions('');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].label).toBe('ビタミンC プレミアム');
  });

  it('filters suggestions by query text', async () => {
    (fetchProductsForSearch as any).mockResolvedValue([productDoc]);
    (fetchIngredientsForSuggestions as any).mockResolvedValue([ingredientDoc]);

    const suggestions = await getSearchSuggestions('nature');
    expect(suggestions.some(s => s.label === 'Nature Made')).toBe(true);
  });

  it('uses cache on subsequent calls', async () => {
    (fetchProductsForSearch as any).mockResolvedValue([productDoc]);
    (fetchIngredientsForSuggestions as any).mockResolvedValue([ingredientDoc]);

    await getSearchSuggestions('');
    await getSearchSuggestions('ビタミン');

    expect(fetchProductsForSearch).toHaveBeenCalledTimes(1);
    expect(fetchIngredientsForSuggestions).toHaveBeenCalledTimes(1);
  });

  it('returns trending suggestions when data fetch fails and query is empty', async () => {
    (fetchProductsForSearch as any).mockRejectedValue(
      new Error('network error')
    );
    (fetchIngredientsForSuggestions as any).mockRejectedValue(
      new Error('network error')
    );

    const suggestions = await getSearchSuggestions('');
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it('returns empty list when no candidates match query', async () => {
    (fetchProductsForSearch as any).mockResolvedValue([]);
    (fetchIngredientsForSuggestions as any).mockResolvedValue([]);

    const suggestions = await getSearchSuggestions('unknown');
    expect(suggestions).toHaveLength(0);
  });
});
