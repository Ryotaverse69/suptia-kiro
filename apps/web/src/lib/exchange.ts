export type CurrencyCode = 'JPY' | 'USD';

export const BASE_CURRENCY: CurrencyCode = 'JPY';
const FALLBACK_RATES: Record<CurrencyCode, number> = {
  JPY: 1,
  USD: 0.0091,
};

const TTL_MS = 1000 * 60 * 60; // 1 hour
const EXCHANGE_ENDPOINT = process.env.NEXT_PUBLIC_EXCHANGE_RATES_URL;

let cache: { fetchedAt: number; rates: Record<CurrencyCode, number> } | null =
  null;

function ensureCache(initial?: Record<CurrencyCode, number>) {
  if (!cache) {
    cache = { fetchedAt: 0, rates: initial ?? { ...FALLBACK_RATES } };
  }
  return cache;
}

export function getRates(): Record<CurrencyCode, number> {
  const current = ensureCache().rates;
  return { ...current };
}

export function getRate(to: CurrencyCode): number {
  const current = ensureCache().rates;
  return current[to] ?? 1;
}

export async function refreshRates(
  options: { force?: boolean } = {}
): Promise<Record<CurrencyCode, number>> {
  const { force = false } = options;
  const now = Date.now();
  const current = ensureCache();

  if (!force && now - current.fetchedAt < TTL_MS) {
    return { ...current.rates };
  }

  const endpoint = EXCHANGE_ENDPOINT || 'https://open.er-api.com/v6/latest/JPY';

  try {
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(
        `Exchange rate fetch failed with status ${response.status}`
      );
    }
    const json = await response.json();
    const rateFromJson = (() => {
      if (json?.rates?.USD) return Number(json.rates.USD);
      if (json?.data?.rates?.USD) return Number(json.data.rates.USD);
      if (json?.USD) return Number(json.USD);
      return undefined;
    })();

    if (
      typeof rateFromJson === 'number' &&
      Number.isFinite(rateFromJson) &&
      rateFromJson > 0
    ) {
      current.rates = { ...FALLBACK_RATES, USD: rateFromJson };
      current.fetchedAt = now;
      return { ...current.rates };
    }
    throw new Error('Exchange rate response missing USD rate');
  } catch (error) {
    console.warn('Falling back to static exchange rates', error);
    current.rates = { ...FALLBACK_RATES };
    current.fetchedAt = now;
    return { ...current.rates };
  }
}

export function convertFromJPY(amountJPY: number, to: CurrencyCode): number {
  if (to === 'JPY') return amountJPY;
  const rate = getRate(to);
  return amountJPY * rate;
}

export function convertToJPY(amount: number, from: CurrencyCode): number {
  if (from === 'JPY') return amount;
  const rate = getRate(from);
  if (rate === 0) return amount;
  return amount / rate;
}

export const __internal = {
  setRatesForTesting(rates: Record<CurrencyCode, number>) {
    cache = { fetchedAt: Date.now(), rates: { ...rates } };
  },
  clearCache() {
    cache = null;
  },
};
