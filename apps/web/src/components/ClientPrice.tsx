'use client';

import { useLocale } from '@/contexts/LocaleContext';

interface ClientPriceProps {
  amount: number;
  className?: string;
  ariaLabelPrefix?: string;
}

// Renders a currency-formatted price using current locale/currency
export default function ClientPrice({
  amount,
  className = '',
  ariaLabelPrefix,
}: ClientPriceProps) {
  const { formatPrice, locale } = useLocale();
  const label = ariaLabelPrefix
    ? locale === 'ja'
      ? `${ariaLabelPrefix}${formatPrice(amount)}`
      : `${ariaLabelPrefix} ${formatPrice(amount)}`
    : undefined;
  return (
    <span className={className} aria-label={label}>
      {formatPrice(amount)}
    </span>
  );
}
