import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { clearRateLimitData } from "@/lib/security/rate-limit";

// モックのNextRequestを作成するヘルパー
function createMockRequest(
  url: string,
  options: {
    ip?: string;
    userAgent?: string;
    method?: string;
  } = {},
): NextRequest {
  const request = new NextRequest(url, {
    method: options.method || "GET",
    headers: {
      "user-agent": options.userAgent || "test-agent",
      "x-forwarded-for": options.ip || "192.168.1.1",
    },
  });

  // IPアドレスをモック
  Object.defineProperty(request, "ip", {
    value: options.ip || "192.168.1.1",
    writable: false,
  });

  return request;
}

describe("Rate Limit Integration", () => {
  beforeEach(() => {
    clearRateLimitData();
  });

  describe("Middleware Rate Limiting", () => {
    it("should allow requests within rate limit", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/products/search?query=test",
      );

      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("X-RateLimit-Limit")).toBe("60");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("59");
      expect(response.headers.get("X-RateLimit-Reset")).toBeTruthy();
    });

    it("should block requests when rate limit exceeded", async () => {
      const ip = "192.168.1.100";
      const url = "http://localhost:3000/api/products/search?query=test";

      // 制限まで60回リクエスト
      for (let i = 0; i < 60; i++) {
        const request = createMockRequest(url, { ip });
        const response = await middleware(request);
        expect(response.status).toBe(200);
      }

      // 61回目は拒否される
      const request = createMockRequest(url, { ip });
      const response = await middleware(request);

      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBeTruthy();
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");

      // レスポンスボディを確認
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(body.error.message).toContain("リクエスト制限に達しました");
    });

    it("should handle different IPs independently", async () => {
      const ip1 = "192.168.1.1";
      const ip2 = "192.168.1.2";
      const url = "http://localhost:3000/api/products/search?query=test";

      // IP1で制限まで使用
      for (let i = 0; i < 60; i++) {
        const request = createMockRequest(url, { ip: ip1 });
        await middleware(request);
      }

      // IP1は拒否される
      const request1 = createMockRequest(url, { ip: ip1 });
      const response1 = await middleware(request1);
      expect(response1.status).toBe(429);

      // IP2は許可される
      const request2 = createMockRequest(url, { ip: ip2 });
      const response2 = await middleware(request2);
      expect(response2.status).toBe(200);
      expect(response2.headers.get("X-RateLimit-Remaining")).toBe("59");
    });

    it("should handle different routes independently", async () => {
      const ip = "192.168.1.1";
      const url1 = "http://localhost:3000/api/products/search?query=test";
      const url2 = "http://localhost:3000/api/products/details?id=123";

      // route1で制限まで使用
      for (let i = 0; i < 60; i++) {
        const request = createMockRequest(url1, { ip });
        await middleware(request);
      }

      // route1は拒否される
      const request1 = createMockRequest(url1, { ip });
      const response1 = await middleware(request1);
      expect(response1.status).toBe(429);

      // route2は許可される
      const request2 = createMockRequest(url2, { ip });
      const response2 = await middleware(request2);
      expect(response2.status).toBe(200);
      expect(response2.headers.get("X-RateLimit-Remaining")).toBe("59");
    });

    it("should not apply rate limiting to non-API routes", async () => {
      const request = createMockRequest(
        "http://localhost:3000/products/test-product",
      );

      const response = await middleware(request);

      expect(response.status).toBe(200);
      // 非APIルートではレート制限ヘッダーは設定されない
      expect(response.headers.get("X-RateLimit-Limit")).toBeNull();
    });

    it("should include security headers", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/products/search?query=test",
      );

      const response = await middleware(request);

      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("X-Frame-Options")).toBe("DENY");
      expect(response.headers.get("Referrer-Policy")).toBe(
        "strict-origin-when-cross-origin",
      );
      expect(response.headers.get("Permissions-Policy")).toContain("camera=()");
    });

    it("should set CSP headers in production", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      try {
        const request = createMockRequest(
          "http://localhost:3000/api/products/search?query=test",
        );

        const response = await middleware(request);

        const csp = response.headers.get("Content-Security-Policy");
        expect(csp).toBeTruthy();
        expect(csp).toContain("default-src 'self'");
        expect(csp).toContain("script-src 'self'");
        expect(csp).toContain("upgrade-insecure-requests");
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it("should generate unique nonce for each request", async () => {
      const request1 = createMockRequest(
        "http://localhost:3000/api/products/search?query=test",
      );
      const request2 = createMockRequest(
        "http://localhost:3000/api/products/search?query=test",
      );

      const response1 = await middleware(request1);
      const response2 = await middleware(request2);

      const nonce1 = response1.headers.get("x-nonce");
      const nonce2 = response2.headers.get("x-nonce");

      expect(nonce1).toBeTruthy();
      expect(nonce2).toBeTruthy();
      expect(nonce1).not.toBe(nonce2);
    });

    it("should handle missing IP gracefully", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/products/search?query=test",
        { ip: undefined },
      );

      // IPが取得できない場合でも動作する
      const response = await middleware(request);
      expect(response.status).toBe(200);
      expect(response.headers.get("X-RateLimit-Limit")).toBe("60");
    });

    it("should log rate limit violations", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const ip = "192.168.1.200";
      const url = "http://localhost:3000/api/products/search?query=test";
      const userAgent = "test-browser/1.0";

      // 制限まで使用
      for (let i = 0; i < 60; i++) {
        const request = createMockRequest(url, { ip, userAgent });
        await middleware(request);
      }

      // 違反を発生させる
      const request = createMockRequest(url, { ip, userAgent });
      await middleware(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Rate limit violation:",
        expect.objectContaining({
          ipHash: expect.any(String),
          route: "/api/products/search",
          requestCount: 61,
          limit: 60,
          userAgent,
        }),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed URLs gracefully", async () => {
      // 不正なURLでもエラーにならないことを確認
      const request = createMockRequest(
        "http://localhost:3000/api/products/search?query=test%",
      );

      const response = await middleware(request);
      expect(response.status).toBe(200);
    });

    it("should handle very long user agents", async () => {
      const longUserAgent = "a".repeat(1000);
      const request = createMockRequest(
        "http://localhost:3000/api/products/search?query=test",
        { userAgent: longUserAgent },
      );

      const response = await middleware(request);
      expect(response.status).toBe(200);
    });
  });
});
