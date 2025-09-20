import { render, screen } from '@testing-library/react';
import { ComparisonTable, type ComparisonProduct } from './ComparisonTable';

describe('ComparisonTable', () => {
  const products: ComparisonProduct[] = [
    {
      id: 'test-1',
      name: 'テストサプリメント',
      brand: 'Test Brand',
      category: 'ビタミンD',
      rating: 4.6,
      reviewCount: 120,
      lowestPrice: 1980,
      pricePerDay: 66,
      volume: '120粒',
      testing: '第三者検査済み',
      ingredients: ['ビタミンD3'],
      imageUrl: '/placeholders/product-placeholder.svg',
      sellers: [
        { site: 'Amazon', price: 1980, url: '#' },
        { site: '楽天', price: 2180, url: '#' },
      ],
    },
  ];

  it('renders product columns with pricing info', () => {
    render(<ComparisonTable products={products} />);

    expect(screen.getByText('テストサプリメント')).toBeInTheDocument();
    expect(screen.getByText(/Test Brand/)).toBeInTheDocument();
    expect(screen.getAllByText('¥1,980')[0]).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '最安値で購入' })
    ).toBeInTheDocument();
  });
});
