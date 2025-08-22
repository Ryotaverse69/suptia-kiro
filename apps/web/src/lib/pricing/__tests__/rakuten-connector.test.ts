/**
 * Rakuten Connector Unit Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { RakutenConnector, createRakutenConnector } from "../rakuten-connector";
import {
  MockRakutenConnector,
  MockRakutenConnectorWithErrors,
} from "../../../../mocks/rakuten-mock";

// グローバルfetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("RakutenConnector", () => {
  let connector: RakutenConnector;

  beforeEach(() => {
    connector = new RakutenConnector({
      applicationId: "test_app_id",
      affiliateId: "test_affiliate_id",
    });
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("searchProducts", () => {
    it("should search products with keyword", async () => {
      const mockResponse = {
        Items: [
          {
            Item: {
              itemCode: "test-item-1",
              itemName: "テストサプリメント",
              itemPrice: 1000,
              postageFlag: 0,
              itemUrl: "https://test.com/item1",
              mediumImageUrls: ["https://test.com/image1.jpg"],
              availability: 1,
              reviewCount: 10,
              reviewAverage: 4.0,
              shopName: "テストショップ",
              genreId: "509777",
            },
          },
        ],
        count: 1,
        page: 1,
        first: 1,
        last: 1,
        hits: 30,
        carrier: 0,
        pageCount: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await connector.searchProducts({ keyword: "ビタミン" });

      expect(result).toHaveLength(1);
      expect(result[0].itemName).toBe("テストサプリメント");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("keyword=%E3%83%93%E3%82%BF%E3%83%9F%E3%83%B3"),
        expect.any(Object),
      );
    });

    it("should handle search with filters", async () => {
      const mockResponse = { Items: [], count: 0 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await connector.searchProducts({
        keyword: "プロテイン",
        genreId: "509778",
        minPrice: 1000,
        maxPrice: 5000,
        sort: "+itemPrice",
        hits: 20,
        page: 2,
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("genreId=509778");
      expect(calledUrl).toContain("minPrice=1000");
      expect(calledUrl).toContain("maxPrice=5000");
      expect(calledUrl).toContain("sort=%2BitemPrice");
      expect(calledUrl).toContain("hits=20");
      expect(calledUrl).toContain("page=2");
    });

    it("should handle API errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
      });

      await expect(
        connector.searchProducts({ keyword: "test" }),
      ).rejects.toThrow("楽天API検索エラー");
    });

    it("should handle network errors with retry", async () => {
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ Items: [], count: 0 }),
        });

      const result = await connector.searchProducts({ keyword: "test" });
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
          json: async () => ({ Items: [], count: 0 }),
        });

      const result = await connector.searchProducts({ keyword: "test" });
      expect(result).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("getProductByCode", () => {
    it("should get product by item code", async () => {
      const mockResponse = {
        Items: [
          {
            Item: {
              itemCode: "test-item-1",
              itemName: "テストサプリメント",
              itemPrice: 1000,
              postageFlag: 0,
              itemUrl: "https://test.com/item1",
              mediumImageUrls: ["https://test.com/image1.jpg"],
              availability: 1,
              reviewCount: 10,
              reviewAverage: 4.0,
              shopName: "テストショップ",
              genreId: "509777",
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await connector.getProductByCode("test-item-1");
      expect(result).not.toBeNull();
      expect(result?.itemCode).toBe("test-item-1");
    });

    it("should return null for non-existent product", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: [], count: 0 }),
      });

      const result = await connector.getProductByCode("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("checkStock", () => {
    it("should return true for in-stock product", async () => {
      const mockResponse = {
        Items: [
          {
            Item: {
              itemCode: "test-item-1",
              availability: 1,
              itemName: "テスト",
              itemPrice: 1000,
              postageFlag: 0,
              itemUrl: "https://test.com",
              mediumImageUrls: [],
              reviewCount: 0,
              reviewAverage: 0,
              shopName: "テスト",
              genreId: "509777",
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await connector.checkStock("test-item-1");
      expect(result).toBe(true);
    });

    it("should return false for out-of-stock product", async () => {
      const mockResponse = {
        Items: [
          {
            Item: {
              itemCode: "test-item-1",
              availability: 0,
              itemName: "テスト",
              itemPrice: 1000,
              postageFlag: 0,
              itemUrl: "https://test.com",
              mediumImageUrls: [],
              reviewCount: 0,
              reviewAverage: 0,
              shopName: "テスト",
              genreId: "509777",
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await connector.checkStock("test-item-1");
      expect(result).toBe(false);
    });
  });

  describe("searchByGTIN", () => {
    it("should search products by GTIN", async () => {
      const mockResponse = {
        Items: [
          {
            Item: {
              itemCode: "test-item-1",
              itemName: "テストサプリメント",
              itemPrice: 1000,
              postageFlag: 0,
              itemUrl: "https://test.com/item1",
              mediumImageUrls: [],
              availability: 1,
              reviewCount: 10,
              reviewAverage: 4.0,
              shopName: "テストショップ",
              genreId: "509777",
              gtin: "4901234567890",
            },
          },
        ],
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
});

describe("createRakutenConnector", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should create connector with environment variables", () => {
    process.env.RAKUTEN_APPLICATION_ID = "test_app_id";
    process.env.RAKUTEN_AFFILIATE_ID = "test_affiliate_id";

    const connector = createRakutenConnector();
    const config = connector.getConfig();

    expect(config.applicationId).toBe("test_app_id");
    expect(config.affiliateId).toBe("test_affiliate_id");
  });

  it("should throw error when required environment variable is missing", () => {
    delete process.env.RAKUTEN_APPLICATION_ID;

    expect(() => createRakutenConnector()).toThrow(
      "RAKUTEN_APPLICATION_ID environment variable is required",
    );
  });
});

describe("MockRakutenConnector", () => {
  let mockConnector: MockRakutenConnector;

  beforeEach(() => {
    mockConnector = new MockRakutenConnector();
  });

  it("should search mock products", async () => {
    const result = await mockConnector.searchProducts({ keyword: "ビタミン" });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].itemName).toContain("ビタミン");
  });

  it("should filter by price range", async () => {
    const result = await mockConnector.searchProducts({
      keyword: "",
      minPrice: 2000,
      maxPrice: 3000,
    });

    result.forEach((product) => {
      expect(product.itemPrice).toBeGreaterThanOrEqual(2000);
      expect(product.itemPrice).toBeLessThanOrEqual(3000);
    });
  });

  it("should sort by price", async () => {
    const result = await mockConnector.searchProducts({
      keyword: "",
      sort: "+itemPrice",
    });

    for (let i = 1; i < result.length; i++) {
      expect(result[i].itemPrice).toBeGreaterThanOrEqual(
        result[i - 1].itemPrice,
      );
    }
  });
});

describe("MockRakutenConnectorWithErrors", () => {
  let mockConnector: MockRakutenConnectorWithErrors;

  beforeEach(() => {
    mockConnector = new MockRakutenConnectorWithErrors();
  });

  it("should throw error when configured", async () => {
    mockConnector.setError(true, "Test error");

    await expect(
      mockConnector.searchProducts({ keyword: "test" }),
    ).rejects.toThrow("Test error");
  });

  it("should work normally when error is disabled", async () => {
    mockConnector.setError(false);

    const result = await mockConnector.searchProducts({ keyword: "ビタミン" });
    expect(result.length).toBeGreaterThan(0);
  });
});
