import { describe, it, expect } from 'vitest';
import { cleanUrl } from '../canonical';

describe('canonical.cleanUrl', () => {
  it('removes tracking parameters', () => {
    const url = 'https://suptia.com/products/x?utm_source=tw&gclid=abc&ref=foo&id=1';
    const cleaned = cleanUrl(url);
    expect(cleaned).toBe('https://suptia.com/products/x?id=1');
  });
});

