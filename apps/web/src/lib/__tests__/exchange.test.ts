import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  convertFromJPY,
  convertToJPY,
  refreshRates,
  getRate,
  __internal,
} from '@/lib/exchange';

describe('exchange utilities', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    __internal.clearCache();
  });

  afterEach(() => {
    __internal.clearCache();
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it('refreshes rates from remote endpoint and caches the response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rates: { USD: 0.01 } }),
    } as any);
    global.fetch = mockFetch;

    const first = await refreshRates({ force: true });
    expect(first.USD).toBe(0.01);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const second = await refreshRates();
    expect(second.USD).toBe(0.01);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to static rates when fetch fails', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('network error'));
    global.fetch = mockFetch;

    const rates = await refreshRates({ force: true });
    expect(rates.USD).toBeCloseTo(0.0091, 4);
    expect(mockFetch).toHaveBeenCalled();
  });

  it('converts between JPY and USD using cached rates', () => {
    __internal.setRatesForTesting({ JPY: 1, USD: 0.01 });

    expect(convertToJPY(10, 'USD')).toBeCloseTo(1000);
    expect(convertFromJPY(1000, 'USD')).toBeCloseTo(10);
    expect(getRate('USD')).toBe(0.01);
  });
});
