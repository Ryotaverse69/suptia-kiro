import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkRateLimit,
  getRateLimitViolations,
  getRateLimitStats,
  clearRateLimitData,
} from "../rate-limit";

describe("Rate Limiting", () => {
  beforeEach(() => {
    clearRateLimitData();
    vi.clearAllMocks();
  });

  describe("checkRateLimit", () => {
    it("should allow requests within limit", () => {
      const result = checkRateLimit("192.168.1.1", "/api/test");

      expect(result.success).toBe(true);
      expect(result.limit).toBe(60);
      expect(result.remaining).toBe(59);
      expect(result.retryAfter).toBeUndefined();
    });

    it("should track multiple requests from same IP", () => {
      const ip = "192.168.1.1";
      const route = "/api/test";

      // 最初のリクエスト
      let result = checkRateLimit(ip, route);
      expect(result.remaining).toBe(59);

      // 2回目のリクエスト
      result = checkRateLimit(ip, route);
      expect(result.remaining).toBe(58);

      // 3回目のリクエスト
      result = checkRateLimit(ip, route);
      expect(result.remaining).toBe(57);
    });

    it("should block requests when limit exceeded", () => {
      const ip = "192.168.1.1";
      const route = "/api/test";

      // 制限まで60回リクエスト
      for (let i = 0; i < 60; i++) {
        const result = checkRateLimit(ip, route);
        expect(result.success).toBe(true);
      }

      // 61回目は拒否される
      const result = checkRateLimit(ip, route);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("should handle different IPs independently", () => {
      const ip1 = "192.168.1.1";
      const ip2 = "192.168.1.2";
      const route = "/api/test";

      // IP1で制限まで使用
      for (let i = 0; i < 60; i++) {
        checkRateLimit(ip1, route);
      }

      // IP1は拒否される
      const result1 = checkRateLimit(ip1, route);
      expect(result1.success).toBe(false);

      // IP2は許可される
      const result2 = checkRateLimit(ip2, route);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(59);
    });

    it("should handle different routes independently", () => {
      const ip = "192.168.1.1";
      const route1 = "/api/test1";
      const route2 = "/api/test2";

      // route1で制限まで使用
      for (let i = 0; i < 60; i++) {
        checkRateLimit(ip, route1);
      }

      // route1は拒否される
      const result1 = checkRateLimit(ip, route1);
      expect(result1.success).toBe(false);

      // route2は許可される
      const result2 = checkRateLimit(ip, route2);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(59);
    });

    it("should log violations with IP hash", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const ip = "192.168.1.1";
      const route = "/api/test";
      const userAgent = "Mozilla/5.0 Test Browser";

      // 制限まで使用
      for (let i = 0; i < 60; i++) {
        checkRateLimit(ip, route, userAgent);
      }

      // 違反を発生させる
      checkRateLimit(ip, route, userAgent);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Rate limit violation:",
        expect.objectContaining({
          ipHash: expect.any(String),
          route,
          requestCount: 61,
          limit: 60,
          userAgent,
        }),
      );

      const violations = getRateLimitViolations();
      expect(violations).toHaveLength(1);
      expect(violations[0]).toMatchObject({
        ipHash: expect.any(String),
        route,
        requestCount: 61,
        userAgent,
      });

      consoleSpy.mockRestore();
    });

    it("should reset window after expiration", async () => {
      const ip = "192.168.1.1";
      const route = "/api/test";

      // カスタム設定で短いウィンドウを使用
      const config = { windowMs: 100, maxRequests: 2 };

      // 制限まで使用
      checkRateLimit(ip, route, undefined, config);
      checkRateLimit(ip, route, undefined, config);

      // 3回目は拒否される
      let result = checkRateLimit(ip, route, undefined, config);
      expect(result.success).toBe(false);

      // ウィンドウが過ぎるまで待機
      await new Promise((resolve) => setTimeout(resolve, 150));

      // リセット後は許可される
      result = checkRateLimit(ip, route, undefined, config);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it("should handle custom configuration", () => {
      const ip = "192.168.1.1";
      const route = "/api/test";
      const config = {
        maxRequests: 5,
        windowMs: 60000,
        logIpHash: false,
        logRoute: false,
      };

      // カスタム制限まで使用
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(ip, route, undefined, config);
        expect(result.success).toBe(true);
        expect(result.limit).toBe(5);
      }

      // 6回目は拒否される
      const result = checkRateLimit(ip, route, undefined, config);
      expect(result.success).toBe(false);
      expect(result.limit).toBe(5);
    });
  });

  describe("getRateLimitStats", () => {
    it("should return correct statistics", () => {
      const ip1 = "192.168.1.1";
      const ip2 = "192.168.1.2";
      const route = "/api/test";

      // いくつかのリクエストを実行
      checkRateLimit(ip1, route);
      checkRateLimit(ip2, route);

      // 違反を発生させる
      for (let i = 0; i < 60; i++) {
        checkRateLimit(ip1, route);
      }

      const stats = getRateLimitStats();
      expect(stats.activeConnections).toBe(2);
      expect(stats.totalViolations).toBe(1);
      expect(stats.recentViolations).toBe(1);
    });
  });

  describe("IP hashing", () => {
    it("should hash different IPs to different values", () => {
      const ip1 = "192.168.1.1";
      const ip2 = "192.168.1.2";
      const route = "/api/test";

      // 違反を発生させてハッシュを記録
      for (let i = 0; i < 61; i++) {
        checkRateLimit(ip1, route);
        checkRateLimit(ip2, route);
      }

      const violations = getRateLimitViolations();
      const ip1Violations = violations.filter(
        (v) => v.ipHash === violations[0].ipHash,
      );
      const ip2Violations = violations.filter(
        (v) => v.ipHash === violations[1].ipHash,
      );

      expect(ip1Violations).toHaveLength(1);
      expect(ip2Violations).toHaveLength(1);
      expect(violations[0].ipHash).not.toBe(violations[1].ipHash);
    });

    it("should produce consistent hashes for same IP", () => {
      const ip = "192.168.1.1";
      const route = "/api/test";

      // 複数回違反を発生させる
      for (let i = 0; i < 62; i++) {
        checkRateLimit(ip, route);
      }

      const violations = getRateLimitViolations();
      expect(violations).toHaveLength(2);
      expect(violations[0].ipHash).toBe(violations[1].ipHash);
    });
  });

  describe("violation log management", () => {
    it("should limit violation log size", () => {
      const ip = "192.168.1.1";
      const route = "/api/test";

      // 大量の違反を発生させる（1000件を超える）
      for (let i = 0; i < 1100; i++) {
        // 制限まで使用してから違反
        for (let j = 0; j < 61; j++) {
          checkRateLimit(`${ip}.${i}`, route);
        }
      }

      const violations = getRateLimitViolations();
      expect(violations.length).toBeLessThanOrEqual(1000);
    });

    it("should return limited number of violations", () => {
      const ip = "192.168.1.1";
      const route = "/api/test";

      // 複数の違反を発生させる
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 61; j++) {
          checkRateLimit(`${ip}.${i}`, route);
        }
      }

      const limitedViolations = getRateLimitViolations(5);
      expect(limitedViolations).toHaveLength(5);
    });
  });
});
