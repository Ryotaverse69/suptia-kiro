import { render, screen } from '@testing-library/react';
import ClientPrice from '@/components/ClientPrice';
import { LocaleProvider, useLocale } from '@/contexts/LocaleContext';

function USDWrapper({ children }: { children: React.ReactNode }) {
  const { setLocale, setCurrency } = useLocale();
  setLocale('en');
  setCurrency('USD');
  return <>{children}</>;
}

describe('ClientPrice', () => {
  it('renders price in JPY by default', () => {
    render(
      <LocaleProvider initialLocale='ja'>
        <ClientPrice amount={1980} />
      </LocaleProvider>
    );
    expect(screen.getByText(/¥\s?1,980/)).toBeInTheDocument();
  });

  it('renders converted price in USD when currency is USD', () => {
    render(
      <LocaleProvider initialLocale='ja'>
        <USDWrapper>
          <ClientPrice amount={2000} />
        </USDWrapper>
      </LocaleProvider>
    );
    // 2000 JPY ~ $18.2 (approx with fallback rate)
    expect(screen.getByText(/\$\s?18\.\d/)).toBeInTheDocument();
  });
});
