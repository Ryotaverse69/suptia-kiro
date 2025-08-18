/**
 * Price Normalizer Unit Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { PriceNormalizer, createPriceNormalizer } from "../price-normalizer";
import type { RakutenProduct } from "../rakuten-connector";
import type { YahooProduct } from "../yahoo-connector";

describe("PriceNormalizer", () => {
  let normalizer: PriceNormalizer;
  let sampleRakutenProduct: RakutenProduct;
  let sampleYahooProduct: YahooProduct;

  beforeEach(() => {
    normalizer = new PriceNormalizer();

    sampleRakutenProduct = {
      itemCode: "rakuten-vitamin-d-1000",
      itemName: "ビタミンD 1000IU 90粒",
      itemPrice: 1980,
      postageFlag: 0, // 送料別
      itemUrl: "https://item.rakuten.co.jp/test/vitamin-d/",
      mediumImageUrls: ["https://test.com/image.jpg"],
      availability: 1,
      reviewCount: 245,
      reviewAverage: 4.3,
      shopName: "HealthBrand Store",
      genreId: "509777",
      gtin: "4901234567890",
      jan: "4901234567890",
    };

    sampleYahooProduct = {
      code: "yahoo-vitamin-d-1000",
      name: "ビタミンD 1000IU 90カプセル",
      price: 1890,
      shipping: { code: 0, price: 300 }, // 送料別
      url: "https://shopping.yahoo.co.jp/products/vitamin-d/",
      image: { medium: "https://test.com/yahoo-image.jpg" },
      inStock: true,
      review: { count: 198, rate: 4.2 },
      seller: { name: "HealthBrand Yahoo Store" },
      category: { id: "24981", name: "ビタミン" },
      gtin: "4901234567890",
      jan: "4901234567890",
    };
  });

  describe("normalizeRakutenPrice", () => {
    it("should normalize Rakuten product price correctly", () => {
      const normalized = normalizer.normalizeRakutenPrice(
        sampleRakutenProduct,
        "test-product-1",
      );

      expect(normalized.productId).toBe("test-product-1");
      expect(normalized.source).toBe("rakuten");
      expect(normalized.sourceProductId).toBe("rakuten-vitamin-d-1000");
      expect(normalized.basePrice).toBe(1980);
      expect(normalized.shippingCost).toBe(500); // デフォルト送料
      expect(normalized.totalPrice).toBe(2480);
      expect(normalized.inStock).toBe(true);
      expect(normalized.currency).toBe("JPY");
      expect(normalized.taxIncluded).toBe(true);
    });

    it("should handle free shipping for Rakuten products", () => {
      const freeShippingProduct = {
        ...sampleRakutenProduct,
        postageFlag: 1 as const, // 送料込み
      };

      const normalized = normalizer.normalizeRakutenPrice(
        freeShippingProduct,
        "test-product-1",
      );

      expect(normalized.shippingCost).toBe(0);
      expect(normalized.totalPrice).toBe(1980);
    });

    it("should apply free shipping threshold for Rakuten products", () => {
      const highPriceProduct = {
        ...sampleRakutenProduct,
        itemPrice: 5000, // 送料無料閾値超え
      };

      const normalized = normalizer.normalizeRakutenPrice(
        highPriceProduct,
        "test-product-1",
      );

      expect(normalized.shippingCost).toBe(0);
      expect(normalized.totalPrice).toBe(5000);
    });

    it("should detect subscription products", () => {
      const subscriptionProduct = {
        ...sampleRakutenProduct,
        itemName: "ビタミンD 定期便 毎月お届け 10%オフ",
      };

      const normalized = normalizer.normalizeRakutenPrice(
        subscriptionProduct,
        "test-product-1",
      );

      expect(normalized.isSubscription).toBe(true);
      expect(normalized.subscriptionDiscount).toBe(0.1);
      expect(normalized.subscriptionInterval).toBe("monthly");
    });
  });

  describe("normalizeYahooPrice", () => {
    it("should normalize Yahoo product price correctly", () => {
      const normalized = normalizer.normalizeYahooPrice(
        sampleYahooProduct,
        "test-product-1",
      );

      expect(normalized.productId).toBe("test-product-1");
      expect(normalized.source).toBe("yahoo");
      expect(normalized.sourceProductId).toBe("yahoo-vitamin-d-1000");
      expect(normalized.basePrice).toBe(1890);
      expect(normalized.shippingCost).toBe(300);
      expect(normalized.totalPrice).toBe(2190);
      expect(normalized.inStock).toBe(true);
      expect(normalized.currency).toBe("JPY");
      expect(normalized.taxIncluded).toBe(true);
    });

    it("should handle free shipping for Yahoo products", () => {
      const freeShippingProduct = {
        ...sampleYahooProduct,
        shipping: { code: 1 as const }, // 送料込み
      };

      const normalized = normalizer.normalizeYahooPrice(
        freeShippingProduct,
        "test-product-1",
      );

      expect(normalized.shippingCost).toBe(0);
      expect(normalized.totalPrice).toBe(1890);
    });

    it("should apply free shipping threshold for Yahoo products", () => {
      const highPriceProduct = {
        ...sampleYahooProduct,
        price: 4000, // 送料無料閾値超え
      };

      const normalized = normalizer.normalizeYahooPrice(
        highPriceProduct,
        "test-product-1",
      );

      expect(normalized.shippingCost).toBe(0);
      expect(normalized.totalPrice).toBe(4000);
    });

    it("should use specified shipping cost when available", () => {
      const customShippingProduct = {
        ...sampleYahooProduct,
        shipping: { code: 0, price: 250 },
      };

      const normalized = normalizer.normalizeYahooPrice(
        customShippingProduct,
        "test-product-1",
      );

      expect(normalized.shippingCost).toBe(250);
      expect(normalized.totalPrice).toBe(2140);
    });
  });

  describe("detectSubscription", () => {
    it("should detect subscription keywords", () => {
      const testCases = [
        { name: "ビタミンD 定期便", expected: true },
        { name: "プロテイン 毎月お届け", expected: true },
        { name: "サプリメント サブスク", expected: true },
        { name: "オメガ3 継続購入", expected: true },
        { name: "通常のビタミンD", expected: false },
      ];

      testCases.forEach(({ name, expected }) => {
        const product = { ...sampleRakutenProduct, itemName: name };
        const normalized = normalizer.normalizeRakutenPrice(product, "test");
        expect(normalized.isSubscription).toBe(expected);
      });
    });

    it("should extract discount percentage", () => {
      const discountProduct = {
        ...sampleRakutenProduct,
        itemName: "ビタミンD 定期便 15%オフ",
      };

      const normalized = normalizer.normalizeRakutenPrice(
        discountProduct,
        "test",
      );

      expect(normalized.isSubscription).toBe(true);
      expect(normalized.subscriptionDiscount).toBe(0.15);
    });

    it("should detect subscription intervals", () => {
      const testCases = [
        { name: "ビタミンD 毎週お届け", expected: "weekly" },
        { name: "プロテイン 毎月配送", expected: "monthly" },
        { name: "サプリ 3ヶ月ごと", expected: "quarterly" },
        { name: "オメガ3 定期便", expected: "monthly" }, // デフォルト
      ];

      testCases.forEach(({ name, expected }) => {
        const product = { ...sampleRakutenProduct, itemName: name };
        const normalized = normalizer.normalizeRakutenPrice(product, "test");
        expect(normalized.subscriptionInterval).toBe(expected);
      });
    });
  });

  describe("convertCurrency", () => {
    it("should convert USD to JPY", () => {
      const usdAmount = 10;
      const jpyAmount = normalizer.convertCurrency(usdAmount, "USD", "JPY");
      expect(jpyAmount).toBe(1500); // 10 * 150
    });

    it("should return same amount for same currency", () => {
      const amount = 1000;
      const result = normalizer.convertCurrency(amount, "JPY", "JPY");
      expect(result).toBe(amount);
    });

    it("should throw error for unsupported currency", () => {
      expect(() => {
        normalizer.convertCurrency(100, "GBP", "JPY");
      }).toThrow("Unsupported currency conversion");
    });
  });

  describe("normalizeForComparison", () => {
    it("should apply subscription discounts for comparison", () => {
      const prices = [
        {
          productId: "test-1",
          source: "rakuten" as const,
          sourceProductId: "rakuten-1",
          basePrice: 2000,
          shippingCost: 500,
          totalPrice: 2500,
          inStock: true,
          isSubscription: true,
          subscriptionDiscount: 0.1,
          lastUpdated: "2023-01-01",
          sourceUrl: "https://test.com",
          shopName: "Test Shop",
          currency: "JPY" as const,
          taxIncluded: true,
          metadata: {},
        },
        {
          productId: "test-2",
          source: "yahoo" as const,
          sourceProductId: "yahoo-1",
          basePrice: 2200,
          shippingCost: 300,
          totalPrice: 2500,
          inStock: true,
          isSubscription: false,
          lastUpdated: "2023-01-01",
          sourceUrl: "https://test.com",
          shopName: "Test Shop",
          currency: "JPY" as const,
          taxIncluded: true,
          metadata: {},
        },
      ];

      const normalized = normalizer.normalizeForComparison(prices);

      expect(normalized[0].totalPrice).toBe(2250); // 2500 * 0.9
      expect(normalized[1].totalPrice).toBe(2500); // 変更なし
    });
  });

  describe("normalizeStockStatus", () => {
    it("should normalize Rakuten stock status", () => {
      const inStockProduct = {
        ...sampleRakutenProduct,
        availability: 1 as const,
      };
      const outOfStockProduct = {
        ...sampleRakutenProduct,
        availability: 0 as const,
      };

      const inStockStatus = normalizer.normalizeStockStatus(inStockProduct);
      const outOfStockStatus =
        normalizer.normalizeStockStatus(outOfStockProduct);

      expect(inStockStatus.inStock).toBe(true);
      expect(inStockStatus.stockLevel).toBe("high");

      expect(outOfStockStatus.inStock).toBe(false);
      expect(outOfStockStatus.stockLevel).toBe("out_of_stock");
    });

    it("should normalize Yahoo stock status", () => {
      const inStockProduct = { ...sampleYahooProduct, inStock: true };
      const outOfStockProduct = { ...sampleYahooProduct, inStock: false };

      const inStockStatus = normalizer.normalizeStockStatus(inStockProduct);
      const outOfStockStatus =
        normalizer.normalizeStockStatus(outOfStockProduct);

      expect(inStockStatus.inStock).toBe(true);
      expect(inStockStatus.stockLevel).toBe("high");

      expect(outOfStockStatus.inStock).toBe(false);
      expect(outOfStockStatus.stockLevel).toBe("out_of_stock");
    });
  });

  describe("detectBulkDiscounts", () => {
    it("should detect bulk discount patterns", () => {
      const testCases = [
        {
          name: "ビタミンD 3個以上で10%オフ",
          expected: [{ quantity: 3, discountRate: 0.1 }],
        },
        {
          name: "プロテイン 5個セットで15%割引",
          expected: [{ quantity: 5, discountRate: 0.15 }],
        },
        {
          name: "まとめ買い10個で20%オフ",
          expected: [{ quantity: 10, discountRate: 0.2 }],
        },
        {
          name: "通常商品",
          expected: [],
        },
      ];

      testCases.forEach(({ name, expected }) => {
        const discounts = normalizer.detectBulkDiscounts(name);
        expect(discounts).toEqual(expected);
      });
    });

    it("should sort bulk discounts by quantity", () => {
      const productName = "ビタミンD 10個で20%オフ 5個で10%オフ 3個で5%オフ";
      const discounts = normalizer.detectBulkDiscounts(productName);

      expect(discounts).toEqual([
        { quantity: 3, discountRate: 0.05 },
        { quantity: 5, discountRate: 0.1 },
        { quantity: 10, discountRate: 0.2 },
      ]);
    });
  });

  describe("validatePrice", () => {
    it("should validate correct price", () => {
      const validPrice = normalizer.normalizeRakutenPrice(
        sampleRakutenProduct,
        "test",
      );
      const validation = normalizer.validatePrice(validPrice);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should detect invalid base price", () => {
      const invalidPrice = {
        ...normalizer.normalizeRakutenPrice(sampleRakutenProduct, "test"),
        basePrice: -100,
      };

      const validation = normalizer.validatePrice(invalidPrice);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("基本価格が0以下です");
    });

    it("should detect invalid shipping cost", () => {
      const invalidPrice = {
        ...normalizer.normalizeRakutenPrice(sampleRakutenProduct, "test"),
        shippingCost: -50,
      };

      const validation = normalizer.validatePrice(invalidPrice);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("送料が負の値です");
    });

    it("should detect incorrect total price calculation", () => {
      const invalidPrice = {
        ...normalizer.normalizeRakutenPrice(sampleRakutenProduct, "test"),
        totalPrice: 9999, // 正しくない合計
      };

      const validation = normalizer.validatePrice(invalidPrice);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("合計価格の計算が正しくありません");
    });

    it("should generate warnings for unusual values", () => {
      const unusualPrice = {
        ...normalizer.normalizeRakutenPrice(sampleRakutenProduct, "test"),
        basePrice: 1500000, // 異常に高額
        shippingCost: 15000, // 異常に高い送料
      };
      unusualPrice.totalPrice =
        unusualPrice.basePrice + unusualPrice.shippingCost;

      const validation = normalizer.validatePrice(unusualPrice);

      expect(validation.warnings).toContain(
        "基本価格が異常に高額です（100万円超）",
      );
      expect(validation.warnings).toContain("送料が異常に高額です（1万円超）");
    });
  });

  describe("compareWithHistory", () => {
    it("should compare with empty history", () => {
      const currentPrice = normalizer.normalizeRakutenPrice(
        sampleRakutenProduct,
        "test",
      );
      const comparison = normalizer.compareWithHistory(currentPrice, []);

      expect(comparison.trend).toBe("stable");
      expect(comparison.changePercentage).toBe(0);
      expect(comparison.isLowestPrice).toBe(true);
      expect(comparison.isHighestPrice).toBe(true);
      expect(comparison.averagePrice).toBe(currentPrice.totalPrice);
    });

    it("should detect rising trend", () => {
      const currentPrice = normalizer.normalizeRakutenPrice(
        sampleRakutenProduct,
        "test",
      );
      const historicalPrices = [
        { ...currentPrice, totalPrice: 2000 },
        { ...currentPrice, totalPrice: 2100 },
      ];

      const comparison = normalizer.compareWithHistory(
        currentPrice,
        historicalPrices,
      );

      expect(comparison.trend).toBe("rising");
      expect(comparison.changePercentage).toBeGreaterThan(5);
    });

    it("should detect falling trend", () => {
      const currentPrice = normalizer.normalizeRakutenPrice(
        sampleRakutenProduct,
        "test",
      );
      const historicalPrices = [
        { ...currentPrice, totalPrice: 3000 },
        { ...currentPrice, totalPrice: 2800 },
      ];

      const comparison = normalizer.compareWithHistory(
        currentPrice,
        historicalPrices,
      );

      expect(comparison.trend).toBe("falling");
      expect(comparison.changePercentage).toBeLessThan(-5);
    });

    it("should identify lowest and highest prices", () => {
      const currentPrice = {
        ...normalizer.normalizeRakutenPrice(sampleRakutenProduct, "test"),
        totalPrice: 2000,
      };
      const historicalPrices = [
        { ...currentPrice, totalPrice: 2500 },
        { ...currentPrice, totalPrice: 2200 },
        { ...currentPrice, totalPrice: 2800 },
      ];

      const comparison = normalizer.compareWithHistory(
        currentPrice,
        historicalPrices,
      );

      expect(comparison.isLowestPrice).toBe(true);
      expect(comparison.isHighestPrice).toBe(false);
    });
  });

  describe("Edge cases and boundary values", () => {
    it("should handle zero prices", () => {
      const zeroPrice = { ...sampleRakutenProduct, itemPrice: 0 };
      const normalized = normalizer.normalizeRakutenPrice(zeroPrice, "test");

      expect(normalized.basePrice).toBe(0);
      expect(normalized.totalPrice).toBe(500); // 送料のみ
    });

    it("should handle very large prices", () => {
      const largePrice = { ...sampleRakutenProduct, itemPrice: 999999 };
      const normalized = normalizer.normalizeRakutenPrice(largePrice, "test");

      expect(normalized.basePrice).toBe(999999);
      expect(normalized.shippingCost).toBe(0); // 送料無料閾値超え
      expect(normalized.totalPrice).toBe(999999);
    });

    it("should handle products with special characters in names", () => {
      const specialCharProduct = {
        ...sampleRakutenProduct,
        itemName: "ビタミンD【高濃度】(1000IU)・90粒入り 定期便20%OFF",
      };

      const normalized = normalizer.normalizeRakutenPrice(
        specialCharProduct,
        "test",
      );

      expect(normalized.isSubscription).toBe(true);
      expect(normalized.subscriptionDiscount).toBe(0.2);
    });

    it("should handle empty product names", () => {
      const emptyNameProduct = { ...sampleRakutenProduct, itemName: "" };
      const normalized = normalizer.normalizeRakutenPrice(
        emptyNameProduct,
        "test",
      );

      expect(normalized.isSubscription).toBe(false);
      expect(normalized).toBeDefined();
    });
  });
});

describe("createPriceNormalizer", () => {
  it("should create normalizer with default config", () => {
    const normalizer = createPriceNormalizer();
    const config = normalizer.getConfig();

    expect(config.defaultTaxRate).toBe(0.1);
    expect(config.defaultShippingCost).toBe(500);
    expect(config.freeShippingThreshold).toBe(3000);
  });

  it("should create normalizer with custom config", () => {
    const customConfig = {
      defaultTaxRate: 0.08,
      defaultShippingCost: 300,
      freeShippingThreshold: 5000,
    };

    const normalizer = createPriceNormalizer(customConfig);
    const config = normalizer.getConfig();

    expect(config.defaultTaxRate).toBe(0.08);
    expect(config.defaultShippingCost).toBe(300);
    expect(config.freeShippingThreshold).toBe(5000);
  });
});
