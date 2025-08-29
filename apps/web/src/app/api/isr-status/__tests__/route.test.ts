import { describe, it, expect, vi } from 'vitest';
import { GET } from '../route';

// Mock the cache invalidation module
vi.mock('@/lib/cache-invalidation', () => ({
  getISRStatus: vi.fn(() => ({
    config: {
      PRODUCT_DETAIL: 600,
      PRODUCT_LIST: 1800,
      STATIC_PAGES: 3600,
      COMPARE_PAGES: 3600,
    },
    tags: {
      PRODUCTS: 'products',
      PRODUCT_DETAIL: 'product-detail',
      PRODUCT_LIST: 'product-list',
      COMPARE: 'compare',
    },
    environment: 'test',
    timestamp: '2025-01-01T00:00:00.000Z',
  })),
}));

describe('/api/isr-status', () => {
  describe('GET', () => {
    it('should return ISR status information', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('config');
      expect(data.data).toHaveProperty('tags');
      expect(data.data).toHaveProperty('environment');
      expect(data.data).toHaveProperty('timestamp');
    });

    it('should include page-specific ISR configuration', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.pages).toHaveProperty('/');
      expect(data.pages).toHaveProperty('/products/[slug]');
      expect(data.pages).toHaveProperty('/compare');

      // Verify revalidation times
      expect(data.pages['/'].revalidate).toBe(1800); // 30 minutes
      expect(data.pages['/products/[slug]'].revalidate).toBe(600); // 10 minutes
      expect(data.pages['/compare'].revalidate).toBe(3600); // 1 hour
    });

    it('should include descriptive information for each page', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.pages['/'].description).toContain('Product listing page');
      expect(data.pages['/products/[slug]'].description).toContain('Product detail pages');
      expect(data.pages['/compare'].description).toContain('Compare page');
    });
  });
});