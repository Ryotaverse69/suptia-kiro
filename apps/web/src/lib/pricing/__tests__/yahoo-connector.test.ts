/**
 * Yahoo! Shopping Connector Unit Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { YahooConnector, createYahooConnector } from "../yahoo-connector";
import {
  MockYahooConnector,
  MockYahooConnectorWithErrors,
} from "../../../../mocks/yahoo-mock";

// グローバルfetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("YahooConnector", () => {
  let connector: YahooConnector;

  beforeEach(() => {
    connector = new YahooConnector({
      clientId: "test_client_id",
      clientSecret: "test_client_secret",
    });
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("searchProducts", () => {
    it("should search products with query", async () => {
      const mockResponse = {
        totalResultsAvailable: 1,
        totalResultsReturned: 1,
        firstResultPosition: 1,
        Result: {
          Hit: [
            {
              code: "test-product-1",
              name: "テストサプリメント",
              price: 1500,
              shipping: { code: 0, price: 300 },
              url: "https://shopping.yahoo.co.jp/products/test-product-1",
              image: { medium: "https://test.com/image.jpg" },
              inStock: true,
              review: { count: 50, rate: 4.2 },
              seller: { name: "テストストア" },
              category: { id: "24980", name: "サプリメント" },
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await connector.searchProducts({ query: "ビタミン" });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("テストサプリメント");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("query=%E3%83%93%E3%82%BF%E3%83%9F%E3%83%B3"),
        expect.any(Object),
      );
    });

    it("should handle search with filters", async () => {
      const mockResponse = {
        totalResultsAvailable: 0,
        totalResultsReturned: 0,
        firstResultPosition: 1,
        Result: { Hit: [] },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await connector.searchProducts({
        query: "プロテイン",
        categoryId: "24983",
        minPrice: 2000,
        maxPrice: 5000,
        sort: "price",
        results: 10,
        start: 1,
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("category_id=24983");
      expect(calledUrl).toContain("price_from=2000");
      expect(calledUrl).toContain("price_to=5000");
      expect(calledUrl).toContain("sort=price");
      expect(calledUrl).toContain("results=10");
      expect(calledUrl).toContain("start=1");
    });

    it("should handle API errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
      });

      await expect(connector.searchProducts({ query: "test" })).rejects.toThrow(
        "Yahoo!ショッピングAPI検索エラー",
      );
    });

    it("should handle network errors with retry", async () => {
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            totalResultsAvailable: 0,
            totalResultsReturned: 0,
            firstResultPosition: 1,
            Result: { Hit: [] },
          }),
        });

      const result = await connector.searchProducts({ query: "test" });
      expect(result).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should handle rate limiting with retry", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: "Too Many Requests",
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            totalResultsAvailable: 0,
            totalResultsReturned: 0,
            firstResultPosition: 1,
            Result: { Hit: [] },
          }),
        });

      const result = await connector.searchProducts({ query: "test" });
      expect(result).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("getProductDetails", () => {
    it("should get product details by code", async () => {
      const mockResponse = {
        totalResultsAvailable: 1,
        totalResultsReturned: 1,
        firstResultPosition: 1,
        Result: {
          Hit: [
            {
              code: "test-product-1",
              name: "テストサプリメント",
              price: 1500,
              shipping: { code: 0, price: 300 },
              url: "https://shopping.yahoo.co.jp/products/test-product-1",
              image: { medium: "https://test.com/image.jpg" },
              inStock: true,
              review: { count: 50, rate: 4.2 },
              seller: { name: "テストストア" },
              category: { id: "24980", name: "サプリメント" },
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await connector.getProductDetails("test-product-1");
      expect(result).not.toBeNull();
      expect(result?.code).toBe("test-product-1");
    });

    it("should return null for non-existent product", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          totalResultsAvailable: 0,
          totalResultsReturned: 0,
          firstResultPosition: 1,
          Result: { Hit: [] },
        }),
      });

      const result = await connector.getProductDetails("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("getShippingCost", () => {
    it("should return 0 for free shipping products", async () => {
      const mockResponse = {
        totalResultsAvailable: 1,
        totalResultsReturned: 1,
        firstResultPosition: 1,
        Result: {
          Hit: [
            {
              code: "test-product-1",
              name: "テスト",
              price: 1500,
              shipping: { code: 1 }, // 送料込み
              url: "https://test.com",
              image: { medium: "https://test.com/image.jpg" },
              inStock: true,
              review: { count: 0, rate: 0 },
              seller: { name: "テスト" },
              category: { id: "24980", name: "テスト" },
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await connector.getShippingCost(
        "test-product-1",
        "東京都",
      );
      expect(result).toBe(0);
    });

    it("should return shipping cost for paid shipping products", async () => {
      const mockResponse = {
        totalResultsAvailable: 1,
        totalResultsReturned: 1,
        firstResultPosition: 1,
        Result: {
          Hit: [
            {
              code: "test-product-1",
              name: "テスト",
              price: 1500,
              shipping: { code: 0, price: 300 }, // 送料別
              url: "https://test.com",
              image: { medium: "https://test.com/image.jpg" },
              inStock: true,
              review: { count: 0, rate: 0 },
              seller: { name: "テスト" },
              category: { id: "24980", name: "テスト" },
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await connector.getShippingCost(
        "test-product-1",
        "東京都",
      );
      expect(result).toBe(300);
    });

    it("should throw error for non-existent product", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          totalResultsAvailable: 0,
          totalResultsReturned: 0,
          firstResultPosition: 1,
          Result: { Hit: [] },
        }),
      });

      await expect(
        connector.getShippingCost("non-existent", "東京都"),
      ).rejects.toThrow("商品が見つかりません");
    });
  });

  describe("searchByGTIN", () => {
    it("should search products by GTIN", async () => {
      const mockResponse = {
        totalResultsAvailable: 1,
        totalResultsReturned: 1,
        firstResultPosition: 1,
        Result: {
          Hit: [
            {
              code: "test-product-1",
              name: "テストサプリメント",
              price: 1500,
              shipping: { code: 0, price: 300 },
              url: "https://test.com",
              image: { medium: "https://test.com/image.jpg" },
              inStock: true,
              review: { count: 50, rate: 4.2 },
              seller: { name: "テストストア" },
              category: { id: "24980", name: "サプリメント" },
              gtin: "4901234567890",
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await connector.searchByGTIN("4901234567890");
      expect(result).toHaveLength(1);
      expect(result[0].gtin).toBe("4901234567890");
    });
  });

  describe("getCategories", () => {
    it("should return category list", async () => {
      const categories = await connector.getCategories();
      expect(categories).toHaveLength(5);
      expect(categories[0]).toHaveProperty("id");
      expect(categories[0]).toHaveProperty("name");
    });
  });
});

describe("createYahooConnector", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should create connector with environment variables", () => {
    process.env.YAHOO_CLIENT_ID = "test_client_id";
    process.env.YAHOO_CLIENT_SECRET = "test_client_secret";

    const connector = createYahooConnector();
    const config = connector.getConfig();

    expect(config.clientId).toBe("test_client_id");
    expect(config.clientSecret).toBe("test_client_secret");
  });

  it("should throw error when required environment variables are missing", () => {
    delete process.env.YAHOO_CLIENT_ID;
    delete process.env.YAHOO_CLIENT_SECRET;

    expect(() => createYahooConnector()).toThrow(
      "YAHOO_CLIENT_ID and YAHOO_CLIENT_SECRET environment variables are required",
    );
  });
});

describe("MockYahooConnector", () => {
  let mockConnector: MockYahooConnector;

  beforeEach(() => {
    mockConnector = new MockYahooConnector();
  });

  it("should search mock products", async () => {
    const result = await mockConnector.searchProducts({ query: "ビタミン" });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].name).toContain("ビタミン");
  });

  it("should filter by price range", async () => {
    const result = await mockConnector.searchProducts({
      query: "",
      minPrice: 2000,
      maxPrice: 4000,
    });

    result.forEach((product) => {
      expect(product.price).toBeGreaterThanOrEqual(2000);
      expect(product.price).toBeLessThanOrEqual(4000);
    });
  });

  it("should sort by price", async () => {
    const result = await mockConnector.searchProducts({
      query: "",
      sort: "price",
    });

    for (let i = 1; i < result.length; i++) {
      expect(result[i].price).toBeGreaterThanOrEqual(result[i - 1].price);
    }
  });

  it("should handle pagination", async () => {
    const result = await mockConnector.searchProducts({
      query: "",
      results: 2,
      start: 1,
    });

    expect(result.length).toBeLessThanOrEqual(2);
  });
});

describe("MockYahooConnectorWithErrors", () => {
  let mockConnector: MockYahooConnectorWithErrors;

  beforeEach(() => {
    mockConnector = new MockYahooConnectorWithErrors();
  });

  it("should throw error when configured", async () => {
    mockConnector.setError(true, "Test Yahoo error");

    await expect(
      mockConnector.searchProducts({ query: "test" }),
    ).rejects.toThrow("Test Yahoo error");
  });

  it("should work normally when error is disabled", async () => {
    mockConnector.setError(false);

    const result = await mockConnector.searchProducts({ query: "ビタミン" });
    expect(result.length).toBeGreaterThan(0);
  });
});
