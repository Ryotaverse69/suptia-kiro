import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  ISR_CONFIG, 
  CACHE_TAGS, 
  getISRStatus,
  CacheInvalidationStrategy 
} from '../cache-invalidation';

// Mock Next.js cache functions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe('Cache Invalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ISR_CONFIG', () => {
    it('should have correct revalidation times', () => {
      expect(ISR_CONFIG.PRODUCT_DETAIL).toBe(600); // 10 minutes
      expect(ISR_CONFIG.PRODUCT_LIST).toBe(1800); // 30 minutes
      expect(ISR_CONFIG.STATIC_PAGES).toBe(3600); // 1 hour
      expect(ISR_CONFIG.COMPARE_PAGES).toBe(3600); // 1 hour
    });
  });

  describe('CACHE_TAGS', () => {
    it('should have all required cache tags', () => {
      expect(CACHE_TAGS.PRODUCTS).toBe('products');
      expect(CACHE_TAGS.PRODUCT_DETAIL).toBe('product-detail');
      expect(CACHE_TAGS.PRODUCT_LIST).toBe('product-list');
      expect(CACHE_TAGS.COMPARE).toBe('compare');
    });
  });

  describe('getISRStatus', () => {
    it('should return ISR status information', () => {
      const status = getISRStatus();
      
      expect(status).toHaveProperty('config');
      expect(status).toHaveProperty('tags');
      expect(status).toHaveProperty('environment');
      expect(status).toHaveProperty('timestamp');
      
      expect(status.config).toEqual(ISR_CONFIG);
      expect(status.tags).toEqual(CACHE_TAGS);
    });
  });

  describe('CacheInvalidationStrategy', () => {
    it('should have all required methods', () => {
      expect(typeof CacheInvalidationStrategy.onProductChange).toBe('function');
      expect(typeof CacheInvalidationStrategy.onBulkProductUpdate).toBe('function');
      expect(typeof CacheInvalidationStrategy.onSiteContentUpdate).toBe('function');
      expect(typeof CacheInvalidationStrategy.manualRefresh).toBe('function');
    });
  });
});

describe('ISR Configuration Requirements', () => {
  it('should meet requirement 7.1 - Product detail pages revalidate every 600 seconds', () => {
    expect(ISR_CONFIG.PRODUCT_DETAIL).toBe(600);
  });

  it('should meet requirement 7.2 - Different page types have appropriate ISR policies', () => {
    // Product detail: 10 minutes (most dynamic)
    expect(ISR_CONFIG.PRODUCT_DETAIL).toBe(600);
    
    // Product list: 30 minutes (moderately dynamic)
    expect(ISR_CONFIG.PRODUCT_LIST).toBe(1800);
    
    // Static/Compare pages: 1 hour (least dynamic)
    expect(ISR_CONFIG.STATIC_PAGES).toBe(3600);
    expect(ISR_CONFIG.COMPARE_PAGES).toBe(3600);
    
    // Verify hierarchy: detail < list < static
    expect(ISR_CONFIG.PRODUCT_DETAIL).toBeLessThan(ISR_CONFIG.PRODUCT_LIST);
    expect(ISR_CONFIG.PRODUCT_LIST).toBeLessThan(ISR_CONFIG.STATIC_PAGES);
  });

  it('should meet requirement 7.3 - Cache invalidation strategies are implemented', () => {
    expect(CacheInvalidationStrategy).toHaveProperty('onProductChange');
    expect(CacheInvalidationStrategy).toHaveProperty('onBulkProductUpdate');
    expect(CacheInvalidationStrategy).toHaveProperty('onSiteContentUpdate');
    expect(CacheInvalidationStrategy).toHaveProperty('manualRefresh');
  });
});