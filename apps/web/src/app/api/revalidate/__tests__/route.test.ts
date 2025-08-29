import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../route';

// Mock dependencies
vi.mock('@/lib/cache-invalidation', () => ({
  CacheInvalidationStrategy: {
    onProductChange: vi.fn(),
    onBulkProductUpdate: vi.fn(),
    onSiteContentUpdate: vi.fn(),
    manualRefresh: vi.fn(),
  },
}));

// Mock headers function
vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: vi.fn((key: string) => key === 'x-webhook-secret' ? 'test-secret' : null),
  })),
}));

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  vi.clearAllMocks();
  process.env = {
    ...originalEnv,
    SANITY_WEBHOOK_SECRET: 'test-secret',
    REVALIDATE_SECRET: 'revalidate-secret',
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('/api/revalidate', () => {
  describe('POST (Webhook)', () => {
    it('should handle product update webhook', async () => {
      const request = new NextRequest('http://localhost:3000/api/revalidate', {
        method: 'POST',
        body: JSON.stringify({
          _type: 'product',
          slug: { current: 'test-product' },
          action: 'update',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Cache invalidated successfully');
    });

    it('should handle product deletion webhook', async () => {
      const request = new NextRequest('http://localhost:3000/api/revalidate', {
        method: 'POST',
        body: JSON.stringify({
          _type: 'product',
          action: 'delete',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject unauthorized requests', async () => {
      // Temporarily change environment variable
      const originalSecret = process.env.SANITY_WEBHOOK_SECRET;
      process.env.SANITY_WEBHOOK_SECRET = 'correct-secret';

      const request = new NextRequest('http://localhost:3000/api/revalidate', {
        method: 'POST',
        body: JSON.stringify({
          _type: 'product',
          slug: { current: 'test-product' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');

      // Restore original
      process.env.SANITY_WEBHOOK_SECRET = originalSecret;
    });
  });

  describe('GET (Manual Revalidation)', () => {
    it('should handle manual revalidation with path', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/revalidate?secret=revalidate-secret&path=/products/test'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Revalidated /products/test');
    });

    it('should handle manual revalidation without path', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/revalidate?secret=revalidate-secret'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Revalidated all pages');
    });

    it('should reject invalid secret', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/revalidate?secret=wrong-secret'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid secret');
    });
  });
});