import { render, screen } from '@testing-library/react';
import { PopularComparisonsSection } from '../sections/PopularComparisons';
import { LocaleProvider } from '@/contexts/LocaleContext';

const products = Array.from({ length: 4 }).map((_, index) => ({
  id: `product-${index}`,
  name: `テストプロダクト ${index + 1}`,
  brand: 'Test Brand',
  mainIngredients: ['ビタミンC', '亜鉛'],
  lowestPrice: 3200 + index * 100,
  rating: 4.3,
  reviewCount: 120,
  imageUrl: '/placeholders/product-placeholder.svg',
}));

describe('PopularComparisonsSection', () => {
  it('renders product cards and CTA', () => {
    render(
      <LocaleProvider>
        <PopularComparisonsSection products={products} />
      </LocaleProvider>
    );

    expect(
      screen.getByRole('heading', { name: '人気の比較' })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: /テストプロダクト/ })
    ).toHaveLength(4);
    expect(screen.getByRole('link', { name: 'すべて見る' })).toHaveAttribute(
      'href',
      '/compare'
    );
  });
});
