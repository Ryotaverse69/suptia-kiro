import { render, screen, fireEvent } from '@testing-library/react';

import { PriceTrends } from './PriceTrends';

describe('PriceTrends', () => {
  it('renders fallback categories when none provided', () => {
    render(<PriceTrends />);
    expect(
      screen.getByRole('button', { name: 'ビタミンD' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'プロテイン' })
    ).toBeInTheDocument();
  });

  it('switches category when button clicked', () => {
    const categories = [
      {
        key: 'custom-1',
        label: 'テストカテゴリA',
        description: 'テストAの説明',
        data: [
          { month: '2024-01', price: 1000 },
          { month: '2024-02', price: 1100 },
        ],
      },
      {
        key: 'custom-2',
        label: 'テストカテゴリB',
        description: 'テストBの説明',
        data: [
          { month: '2024-01', price: 2000 },
          { month: '2024-02', price: 2100 },
        ],
      },
    ];

    render(<PriceTrends categories={categories} />);

    expect(screen.getByText('テストAの説明')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'テストカテゴリB' }));
    expect(screen.getByText('テストBの説明')).toBeInTheDocument();
  });
});
