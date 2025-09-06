import { render, screen } from '@testing-library/react';
import { LocaleProvider, useLocale } from '@/contexts/LocaleContext';

function PriceProbe({ amount }: { amount: number }) {
  const { formatPrice, setLocale, setCurrency } = useLocale();
  // Switch to en/USD to verify conversion/formatting
  setLocale('en');
  setCurrency('USD');
  return <div>{formatPrice(amount)}</div>;
}

describe('LocaleContext formatPrice', () => {
  it('formats JPY by default (ja/JPY)', () => {
    function Probe() {
      const { formatPrice } = useLocale();
      return <div>{formatPrice(2980)}</div>;
    }
    render(
      <LocaleProvider initialLocale='ja'>
        <Probe />
      </LocaleProvider>
    );
    // Should display like ¥2,980 in Japanese locale
    expect(screen.getByText(/¥\s?2,980/)).toBeInTheDocument();
  });

  it('converts from JPY to USD when currency is USD', () => {
    render(
      <LocaleProvider initialLocale='ja'>
        <PriceProbe amount={1000} />
      </LocaleProvider>
    );
    // Using fallback rate ~0.0091 -> about $9.10
    expect(screen.getByText(/\$\s?9\.1\d/)).toBeInTheDocument();
  });
});
