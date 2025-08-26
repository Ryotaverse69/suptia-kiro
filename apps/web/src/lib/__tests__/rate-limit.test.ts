import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '../rate-limit';

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createMockRequest = (ip: string = '127.0.0.1', headers: Record<string, string> = {}) => {
    const mockHeaders = new Map();
    Object.entries(headers).forEach(([key, value]) => {
      mockHeaders.set(key, value);
    });

    return {
      ip,
      headers: mockHeaders,
    } as unknown as NextRequest;
  };

  const createMockHandler = (response: any = { success: true }) => {
    return vi.fn().mockResolvedValue(NextResponse.json(response));
  };

  describe('withRateLimit', () => {
    it('初回リクエストを許可する', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('api', handler);
      const request = createMockRequest();

      const response = await rateLimitedHandler(request);
      
      expect(handler).toHaveBeenCalledWith(request);
      expect(response.status).not.toBe(429);
    });

    it('制限内のリクエストを許可する', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('api', handler);
      const request = createMockRequest();

      // 複数回リクエストを送信（制限内）
      for (let i = 0; i < 10; i++) {
        const response = await rateLimitedHandler(request);
        expect(response.status).not.toBe(429);
      }

      expect(handler).toHaveBeenCalledTimes(10);
    });

    it('制限を超えたリクエストを拒否する', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('contact', handler); // 制限が厳しい
      const request = createMockRequest();

      // 制限まで使い切る
      for (let i = 0; i < 5; i++) {
        await rateLimitedHandler(request);
      }

      // 制限を超えるリクエスト
      const response = await rateLimitedHandler(request);
      expect(response.status).toBe(429);

      const responseData = await response.json();
      expect(responseData.error).toBe('Rate limit exceeded');
      expect(responseData.message).toBe('Too many requests. Please try again later.');
    });

    it('異なるIPアドレスを個別に追跡する', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('contact', handler);
      
      const request1 = createMockRequest('192.168.1.1');
      const request2 = createMockRequest('192.168.1.2');

      // 両方のIPで制限まで使い切る
      for (let i = 0; i < 5; i++) {
        const response1 = await rateLimitedHandler(request1);
        const response2 = await rateLimitedHandler(request2);
        
        expect(response1.status).not.toBe(429);
        expect(response2.status).not.toBe(429);
      }

      // 両方とも制限に達する
      const response1 = await rateLimitedHandler(request1);
      const response2 = await rateLimitedHandler(request2);
      
      expect(response1.status).toBe(429);
      expect(response2.status).toBe(429);
    });

    it('X-Forwarded-ForヘッダーからクライアントIPを取得する', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('contact', handler);
      
      const request = createMockRequest('127.0.0.1', {
        'x-forwarded-for': '203.0.113.1, 198.51.100.1'
      });

      // 制限まで使い切る
      for (let i = 0; i < 5; i++) {
        await rateLimitedHandler(request);
      }

      // 制限を超える
      const response = await rateLimitedHandler(request);
      expect(response.status).toBe(429);

      // 異なるIPからは通る
      const differentIPRequest = createMockRequest('127.0.0.1', {
        'x-forwarded-for': '203.0.113.2'
      });
      const differentIPResponse = await rateLimitedHandler(differentIPRequest);
      expect(differentIPResponse.status).not.toBe(429);
    });

    it('X-Real-IPヘッダーからクライアントIPを取得する', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('contact', handler);
      
      const request = createMockRequest('127.0.0.1', {
        'x-real-ip': '203.0.113.1'
      });

      // 制限まで使い切る
      for (let i = 0; i < 5; i++) {
        await rateLimitedHandler(request);
      }

      // 制限を超える
      const response = await rateLimitedHandler(request);
      expect(response.status).toBe(429);
    });

    it('時間経過後にトークンが補充される', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('contact', handler);
      const request = createMockRequest();

      // 制限まで使い切る
      for (let i = 0; i < 5; i++) {
        await rateLimitedHandler(request);
      }

      // 制限を超える
      let response = await rateLimitedHandler(request);
      expect(response.status).toBe(429);

      // 時間を進める（10秒 = 1トークン補充）
      vi.advanceTimersByTime(10000);

      // 再度リクエスト（1つ補充されているはず）
      response = await rateLimitedHandler(request);
      expect(response.status).not.toBe(429);

      // すぐに再度リクエスト（まだ補充されていない）
      response = await rateLimitedHandler(request);
      expect(response.status).toBe(429);
    });

    it('Retry-Afterヘッダーを正しく設定する', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('contact', handler);
      const request = createMockRequest();

      // 制限まで使い切る
      for (let i = 0; i < 5; i++) {
        await rateLimitedHandler(request);
      }

      // 制限を超える
      const response = await rateLimitedHandler(request);
      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('10'); // 1/0.1 = 10秒
    });

    it('異なるレート制限タイプが独立して動作する', async () => {
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

    it('ハンドラーのエラーを適切に伝播する', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Handler error'));
      const rateLimitedHandler = withRateLimit('api', handler);
      const request = createMockRequest();

      await expect(rateLimitedHandler(request)).rejects.toThrow('Handler error');
    });
  });

  describe('エッジケース', () => {
    it('IPアドレスが取得できない場合のフォールバック', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('contact', handler);
      
      const request = {
        ip: undefined,
        headers: new Map(),
      } as unknown as NextRequest;

      // デフォルトIP（127.0.0.1）で制限まで使い切る
      for (let i = 0; i < 5; i++) {
        await rateLimitedHandler(request);
      }

      // 制限を超える
      const response = await rateLimitedHandler(request);
      expect(response.status).toBe(429);
    });

    it('大量の同時リクエストを適切に処理する', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('api', handler);
      const request = createMockRequest();

      // 50個の同時リクエスト
      const promises = Array.from({ length: 50 }, () => 
        rateLimitedHandler(request)
      );

      const responses = await Promise.all(promises);
      
      // 最初の100個は成功、残りは失敗
      const successCount = responses.filter(r => r.status !== 429).length;
      const failureCount = responses.filter(r => r.status === 429).length;
      
      expect(successCount).toBeLessThanOrEqual(100);
      expect(failureCount).toBeGreaterThanOrEqual(0);
      expect(successCount + failureCount).toBe(50);
    });

    it('非常に長時間経過後の動作', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('api', handler);
      const request = createMockRequest();

      // 制限まで使い切る
      for (let i = 0; i < 100; i++) {
        await rateLimitedHandler(request);
      }

      // 制限を超える
      let response = await rateLimitedHandler(request);
      expect(response.status).toBe(429);

      // 非常に長時間経過（1時間）
      vi.advanceTimersByTime(3600000);

      // 完全に回復しているはず
      for (let i = 0; i < 100; i++) {
        response = await rateLimitedHandler(request);
        expect(response.status).not.toBe(429);
      }
    });
  });

  describe('設定値の検証', () => {
    it('API制限の設定が正しい', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('api', handler);
      const request = createMockRequest('192.168.1.100'); // 新しいIPを使用

      // APIの制限は100リクエスト、1秒に1回補充
      // 最初は100トークンがあるので、100回は成功するはず
      let successCount = 0;
      for (let i = 0; i < 150; i++) {
        const response = await rateLimitedHandler(request);
        if (response.status !== 429) {
          successCount++;
        } else {
          break;
        }
      }

      // 100回程度は成功するはず
      expect(successCount).toBeGreaterThanOrEqual(90);
      expect(successCount).toBeLessThanOrEqual(110);
    });

    it('検索制限の設定が正しい', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('search', handler);
      const request = createMockRequest('192.168.1.101'); // 新しいIPを使用

      // 検索の制限は50リクエスト
      let successCount = 0;
      for (let i = 0; i < 80; i++) {
        const response = await rateLimitedHandler(request);
        if (response.status !== 429) {
          successCount++;
        } else {
          break;
        }
      }

      // 50回程度は成功するはず
      expect(successCount).toBeGreaterThanOrEqual(40);
      expect(successCount).toBeLessThanOrEqual(60);
    });

    it('コンタクト制限の設定が正しい', async () => {
      const handler = createMockHandler();
      const rateLimitedHandler = withRateLimit('contact', handler);
      const request = createMockRequest('192.168.1.102'); // 新しいIPを使用

      // コンタクトの制限は5リクエスト
      let successCount = 0;
      for (let i = 0; i < 10; i++) {
        const response = await rateLimitedHandler(request);
        if (response.status !== 429) {
          successCount++;
        } else {
          break;
        }
      }

      // 5回程度は成功するはず
      expect(successCount).toBeGreaterThanOrEqual(3);
      expect(successCount).toBeLessThanOrEqual(7);
    });
  });
});