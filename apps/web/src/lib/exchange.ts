// Minimal currency exchange utility with safe fallbacks

export type CurrencyCode = 'JPY' | 'USD';

// Base currency for product data
export const BASE_CURRENCY: CurrencyCode = 'JPY';

// Static fallback rates relative to JPY
// 1 JPY = rates[USD] USD
const FALLBACK_RATES: Record<CurrencyCode, number> = {
  JPY: 1,
  USD: 0.0091, // ~¥110 => $1 (approx) adjust as needed
};

// Optionally extend to fetch remote rates later
let cache: Record<CurrencyCode, number> | null = null;

export function getRate(to: CurrencyCode): number {
  if (cache && typeof cache[to] === 'number') return cache[to]!;
  return FALLBACK_RATES[to] ?? 1;
}

export function convertFromJPY(amountJPY: number, to: CurrencyCode): number {
  if (to === 'JPY') return amountJPY;
  const rate = getRate(to);
  return amountJPY * rate;
}
