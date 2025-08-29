import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  withRateLimit,
  getRateLimitViolations,
  getBucketStatus,
  clearRateLimitData,
} from '../rate-limit';

describe('Enhanced Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    clearRateLimitData();
    
    // Mock environment variables
    process.env.IP_HASH_SALT = 'test-salt';
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.IP_HASH_SALT;
  });

  const createMockRequest = (ip: string = '127.0.0.1', path: string = '/api/test', headers: Record<string, string> = {}) => {
    const mockHeaders = new Map();
    mockHeaders.set('x-forwarded-for', ip);
    Object.entries(headers).forEach(([key, value]) => {
      mockHeaders.set(key, value);
    });

    return {
      ip,
      nextUrl: { pathname: path },
      headers: mockHeaders,
    } as unknown as NextRequest;
  };

  const createMockHandler = (response: any = { success: true }) => {
    return vi.fn().mockResolvedValue(NextResponse.json(response));
  };

  describe('Enhanced Rate Limiting (60 req/10 min)', () => {
    it('API制限を60リクエスト/10分で適用する', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('api', handler);
      const request = createMockRequest();

      // 60回まで成功するはず
      for (let i = 0; i < 60; i++) {
        const response = await rateLimitedHandler(request);
        expect(response.status).not.toBe(429);
      }

      // 61回目は失敗
      const response = await rateLimitedHandler(request);
      expect(response.status).toBe(429);
    });

    it('適切なRetry-Afterヘッダーを設定する', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('api', handler);
      const request = createMockRequest();

      // 制限まで使い切る
      for (let i = 0; i < 60; i++) {
        await rateLimitedHandler(request);
      }

      // 制限を超える
      const response = await rateLimitedHandler(request);
      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('10'); // 1/0.1 = 10秒
      expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('成功時にレート制限ヘッダーを追加する', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('api', handler);
      const request = createMockRequest();

      const response = await rateLimitedHandler(request);
      
      expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('59');
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
    });
  });

  describe('IP Address Handling', () => {
    it('X-Forwarded-ForヘッダーからクライアントIPを取得する', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('contact', handler);
      
      const request1 = createMockRequest('192.168.1.1');
      const request2 = createMockRequest('192.168.1.2');

      // 異なるIPは独立してカウントされる
      for (let i = 0; i < 5; i++) {
        const response1 = await rateLimitedHandler(request1);
        const response2 = await rateLimitedHandler(request2);
        
        expect(response1.status).not.toBe(429);
        expect(response2.status).not.toBe(429);
      }
    });

    it('CF-Connecting-IPヘッダーを優先する', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('contact', handler);
      
      const request = createMockRequest('192.168.1.1', '/api/test', {
        'cf-connecting-ip': '203.0.113.1',
        'x-real-ip': '198.51.100.1',
      });

      // CF-Connecting-IPが使用されるはず
      for (let i = 0; i < 5; i++) {
        await rateLimitedHandler(request);
      }

      const response = await rateLimitedHandler(request);
      expect(response.status).toBe(429);
    });

    it('X-Real-IPヘッダーをフォールバックとして使用する', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('contact', handler);
      
      const request = createMockRequest('192.168.1.1', '/api/test', {
        'x-real-ip': '198.51.100.1',
      });

      for (let i = 0; i < 5; i++) {
        await rateLimitedHandler(request);
      }

      const response = await rateLimitedHandler(request);
      expect(response.status).toBe(429);
    });
  });

  describe('Violation Logging', () => {
    it('レート制限違反をログに記録する', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('contact', handler);
      const request = createMockRequest('192.168.1.1', '/api/contact');

      // 制限まで使い切る
      for (let i = 0; i < 5; i++) {
        await rateLimitedHandler(request);
      }

      // 違反を発生させる
      await rateLimitedHandler(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit violation: /api/contact')
      );

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('違反情報を取得できる', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('contact', handler);
      const request = createMockRequest('192.168.1.1', '/api/contact', {
        'user-agent': 'Test Browser',
        'referer': 'https://example.com',
      });

      // 制限まで使い切る
      for (let i = 0; i < 5; i++) {
        await rateLimitedHandler(request);
      }

      // 違反を発生させる
      await rateLimitedHandler(request);

      const violations = getRateLimitViolations();
      expect(violations).toHaveLength(1);
      expect(violations[0]).toMatchObject({
        route: '/api/contact',
        violationCount: 1,
        userAgent: 'Test Browser',
        referer: 'https://example.com',
      });
      expect(violations[0].ipHash).toBeDefined();
      expect(violations[0].timestamp).toBeDefined();
    });

    it('バケット状況を監視できる', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('api', handler);
      const request = createMockRequest('192.168.1.1');

      // いくつかのリクエストを送信
      for (let i = 0; i < 10; i++) {
        await rateLimitedHandler(request);
      }

      const bucketStatus = getBucketStatus();
      expect(bucketStatus).toHaveLength(1);
      expect(bucketStatus[0].tokens).toBe(50); // 60 - 10 = 50
      expect(bucketStatus[0].violations).toBe(0);
    });
  });

  describe('Token Refill Mechanism', () => {
    it('時間経過後にトークンが補充される', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('api', handler);
      const request = createMockRequest();

      // 制限まで使い切る
      for (let i = 0; i < 60; i++) {
        await rateLimitedHandler(request);
      }

      // 制限を超える
      let response = await rateLimitedHandler(request);
      expect(response.status).toBe(429);

      // 10秒経過（1トークン補充）
      vi.advanceTimersByTime(10000);

      // 再度リクエスト（1つ補充されているはず）
      response = await rateLimitedHandler(request);
      expect(response.status).not.toBe(429);
    });

    it('長時間経過後に完全に回復する', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('api', handler);
      const request = createMockRequest();

      // 制限まで使い切る
      for (let i = 0; i < 60; i++) {
        await rateLimitedHandler(request);
      }

      // 10分経過（完全回復）
      vi.advanceTimersByTime(10 * 60 * 1000);

      // 再度60回成功するはず
      for (let i = 0; i < 60; i++) {
        const response = await rateLimitedHandler(request);
        expect(response.status).not.toBe(429);
      }
    });
  });

  describe('Different Rate Limit Types', () => {
    it('異なるタイプが独立して動作する', async () => {
      const handler = createMockHandler();
      const apiHandler = withRateLimit('api', handler);
      const contactHandler = withRateLimit('contact', handler);
      const request = createMockRequest();

      // contactの制限まで使い切る
      for (let i = 0; i < 5; i++) {
        await contactHandler(request);
      }

      // contactは制限に達する
      const contactResponse = await contactHandler(request);
      expect(contactResponse.status).toBe(429);

      // apiはまだ使える
      const apiResponse = await apiHandler(request);
      expect(apiResponse.status).not.toBe(429);
    });

    it('各タイプの制限値が正しく設定される', async () => {
      const handler = createMockHandler();
      
      // API: 60 requests
      const apiHandler = withRateLimit('api', handler);
      const apiRequest = createMockRequest('192.168.1.1');
      
      for (let i = 0; i < 60; i++) {
        const response = await apiHandler(apiRequest);
        expect(response.status).not.toBe(429);
      }
      
      const apiResponse = await apiHandler(apiRequest);
      expect(apiResponse.status).toBe(429);

      // Contact: 5 requests
      const contactHandler = withRateLimit('contact', handler);
      const contactRequest = createMockRequest('192.168.1.2');
      
      for (let i = 0; i < 5; i++) {
        const response = await contactHandler(contactRequest);
        expect(response.status).not.toBe(429);
      }
      
      const contactResponse = await contactHandler(contactRequest);
      expect(contactResponse.status).toBe(429);
    });
  });

  describe('Security Features', () => {
    it('IPアドレスをハッシュ化してプライバシーを保護する', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('contact', handler);
      const request = createMockRequest('192.168.1.1');

      // 制限まで使い切る
      for (let i = 0; i < 5; i++) {
        await rateLimitedHandler(request);
      }

      // 違反を発生させる
      await rateLimitedHandler(request);

      const violations = getRateLimitViolations();
      expect(violations[0].ipHash).not.toBe('192.168.1.1');
      expect(violations[0].ipHash).toMatch(/^[a-f0-9]{16}$/);
    });

    it('違反カウントを正確に追跡する', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('contact', handler);
      const request = createMockRequest();

      // 制限まで使い切る
      for (let i = 0; i < 5; i++) {
        await rateLimitedHandler(request);
      }

      // 複数回違反
      await rateLimitedHandler(request); // 1回目
      await rateLimitedHandler(request); // 2回目
      await rateLimitedHandler(request); // 3回目

      const violations = getRateLimitViolations();
      expect(violations).toHaveLength(3);
      expect(violations[0].violationCount).toBe(1);
      expect(violations[1].violationCount).toBe(2);
      expect(violations[2].violationCount).toBe(3);
    });

    it('成功時に違反カウントをリセットする', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('contact', handler);
      const request = createMockRequest();

      // 制限まで使い切る
      for (let i = 0; i < 5; i++) {
        await rateLimitedHandler(request);
      }

      // 違反を発生させる
      await rateLimitedHandler(request);

      // 時間経過でトークン補充
      vi.advanceTimersByTime(60000); // 1分

      // 成功リクエスト
      await rateLimitedHandler(request);

      // バケット状況確認
      const bucketStatus = getBucketStatus();
      expect(bucketStatus[0].violations).toBe(0);
    });
  });

  describe('Memory Management', () => {
    it('古いバケットをクリーンアップする', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('api', handler);
      
      // 複数のIPからリクエスト
      for (let i = 0; i < 10; i++) {
        const request = createMockRequest(`192.168.1.${i}`);
        await rateLimitedHandler(request);
      }

      expect(getBucketStatus()).toHaveLength(10);

      // 1時間経過
      vi.advanceTimersByTime(60 * 60 * 1000 + 1000);

      // クリーンアップを手動実行（通常は自動）
      clearRateLimitData();

      expect(getBucketStatus()).toHaveLength(0);
    });

    it('違反ログの数を制限する', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('contact', handler);

      // 大量の違反を生成
      for (let i = 0; i < 1100; i++) {
        const request = createMockRequest(`192.168.1.${i % 100}`, `/api/test${i}`);
        
        // 制限まで使い切る
        for (let j = 0; j < 5; j++) {
          await rateLimitedHandler(request);
        }
        
        // 違反を発生させる
        await rateLimitedHandler(request);
      }

      const violations = getRateLimitViolations();
      expect(violations.length).toBeLessThanOrEqual(1000);
    });
  });
});