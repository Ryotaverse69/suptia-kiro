import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import SearchPageClient from './SearchPageClient';
import type { ResultProduct } from '@/components/search/ResultCard';

describe('SearchPageClient', () => {
  const originalFetch = global.fetch;
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ results: products }),
    } as Response);
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    fetchMock.mockReset();
    global.fetch = originalFetch;
  });

  const products: ResultProduct[] = [
    {
      id: '1',
      name: 'ビタミンD サプリ',
      brand: 'Brand A',
      category: 'ビタミンD',
      rating: 4.6,
      reviewCount: 100,
      priceRange: [1980, 2180],
      sellers: [
        { site: 'Amazon', price: 1980, url: '#' },
        { site: '楽天', price: 2180, url: '#' },
      ],
      mainIngredients: ['ビタミンD3'],
      imageUrl: '/placeholders/product-placeholder.svg',
    },
    {
      id: '2',
      name: 'オメガ3 サプリ',
      brand: 'Brand B',
      category: 'オメガ3',
      rating: 4.2,
      reviewCount: 80,
      priceRange: [2980, 3180],
      sellers: [
        { site: 'Amazon', price: 2980, url: '#' },
        { site: '楽天', price: 3180, url: '#' },
      ],
      mainIngredients: ['EPA'],
      imageUrl: '/placeholders/product-placeholder.svg',
    },
  ];

  it('filters products by category', async () => {
    render(<SearchPageClient initialProducts={products} />);

    expect(screen.getByText('ビタミンD サプリ')).toBeInTheDocument();
    expect(screen.getByText('オメガ3 サプリ')).toBeInTheDocument();

    const categoryCheckbox = screen.getByLabelText('ビタミンD');
    await act(async () => {
      fireEvent.click(categoryCheckbox);
    });

    expect(screen.getByText('ビタミンD サプリ')).toBeInTheDocument();
    expect(screen.queryByText('オメガ3 サプリ')).not.toBeInTheDocument();
  });
});
