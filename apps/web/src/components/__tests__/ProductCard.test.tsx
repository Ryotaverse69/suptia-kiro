import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ProductCard from '../ProductCard';
import { LocaleProvider } from '@/contexts/LocaleContext';

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ blurDataURL: _blurDataURL, alt = '', ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={alt} />
  ),
}));

const renderProductCard = (
  overrides: Partial<ComponentProps<typeof ProductCard>> = {}
) => {
  return render(
    <LocaleProvider initialLocale='ja'>
      <ProductCard
        href='/products/demo-product'
        name='デモプロダクト'
        priceJPY={2980}
        servingsPerContainer={60}
        servingsPerDay={2}
        imageUrl='https://cdn.example.com/demo.jpg'
        imageAlt='デモ画像'
        costPerDay={99}
        {...overrides}
      />
    </LocaleProvider>
  );
};

describe('ProductCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders core product information', () => {
    renderProductCard();

    expect(
      screen.getByRole('link', { name: /デモプロダクト/ })
    ).toBeInTheDocument();
    expect(screen.getByText('デモプロダクト')).toBeInTheDocument();
    expect(screen.getByText('60回分')).toBeInTheDocument();
    expect(screen.getByText('1日2回')).toBeInTheDocument();
    expect(screen.getByText(/￥2,980/)).toBeInTheDocument();
  });

  it('shows cost per day when provided', () => {
    renderProductCard({ costPerDay: 120 });

    expect(screen.getByText('実効コスト/日')).toBeInTheDocument();
    expect(screen.getByText(/￥120/)).toBeInTheDocument();
  });

  it('hides cost per day when not provided', () => {
    renderProductCard({ costPerDay: undefined });

    expect(screen.queryByText('実効コスト/日')).not.toBeInTheDocument();
  });

  it('renders fallback visual when image is missing', () => {
    renderProductCard({ imageUrl: undefined });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('💊')).toBeInTheDocument();
  });

  it('links to the product detail page', () => {
    renderProductCard({ href: '/products/sample' });

    const link = screen.getByRole('link', { name: /デモプロダクト/ });
    expect(link).toHaveAttribute('href', '/products/sample');
  });
});
