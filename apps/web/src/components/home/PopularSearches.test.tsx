import { render, screen } from '@testing-library/react';

import { PopularSearches } from './PopularSearches';

describe('PopularSearches', () => {
  it('renders fallback categories when no data is provided', () => {
    render(<PopularSearches />);

    expect(screen.getByText('ビタミンD')).toBeInTheDocument();
    expect(screen.getByText('プロテイン')).toBeInTheDocument();
  });

  it('renders supplied categories', () => {
    render(
      <PopularSearches
        categories={[
          {
            name: 'テストカテゴリ',
            href: '/search?q=test',
            productCount: 10,
            averagePrice: 1234,
            imageUrl: '/placeholders/product-placeholder.svg',
          },
        ]}
      />
    );

    expect(screen.getByText('テストカテゴリ')).toBeInTheDocument();
    expect(screen.getByText('10商品 平均価格 ¥1,234')).toBeInTheDocument();
  });
});
