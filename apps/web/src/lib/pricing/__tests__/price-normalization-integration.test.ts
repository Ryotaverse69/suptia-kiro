/**
 * Price Normalization Integration Tests
 * 価格正規化とコスト計算の統合テスト（境界値テスト含む）
 */

import { describe, it, expect, beforeEach } from "vitest";
import { PriceNormalizer } from "../price-normalizer";
import { CostCalculator } from "../cost-calculator";
import { MockRakutenConnector } from "../../../../mocks/rakuten-mock";
import { MockYahooConnector } from "../../../../mocks/yahoo-mock";
import type { ProductInfo } from "../price-matcher";

describe("Price Normalization Integration", () => {
  let normalizer: PriceNormalizer;
  let calculator: CostCalculator;
  let rakutenConnector: MockRakutenConnector;
  let yahooConnector: MockYahooConnector;

  beforeEach(() => {
    normalizer = new PriceNormalizer();
    calculator = new CostCalculator();
    rakutenConnector = new MockRakutenConnector();
    yahooConnector = new MockYahooConnector();
  });

  describe("End-to-end price processing", () => {
    it("should process complete price normalization and cost calculation flow", async () => {
      const productInfo: ProductInfo = {
        id: "vitamin-d-test",
        name: "ビタミンD 1000IU 90粒",
        brand: "HealthBrand",
        capacity: { amount: 90, unit: "粒" },
        category: "ビタミン",
      };

      // 1. 商品検索
      const rakutenProducts = await rakutenConnector.searchProducts({
        keyword: "ビタミン",
      });
      const yahooProducts = await yahooConnector.searchProducts({
        query: "ビタミン",
      });

      expect(rakutenProducts.length).toBeGreaterThan(0);
      expect(yahooProducts.length).toBeGreaterThan(0);

      // 2. 価格正規化
      const normalizedPrices = [
        ...rakutenProducts.map((p) =>
          normalizer.normalizeRakutenPrice(p, productInfo.id),
        ),
        ...yahooProducts.map((p) =>
          normalizer.normalizeYahooPrice(p, productInfo.id),
        ),
      ];

      expect(normalizedPrices.length).toBeGreaterThan(0);

      // 3. 価格検証
      normalizedPrices.forEach((price) => {
        const validation = normalizer.validatePrice(price);
        expect(validation.isValid).toBe(true);
      });

      // 4. コスト計算
      const costs = normalizedPrices.map((price) =>
        calculator.calculateCostPerDay(price, productInfo, {
          servingSize: 1,
          dailyIntake: 1,
        }),
      );

      expect(costs.length).toBe(normalizedPrices.length);

      // 5. コスト検証
      costs.forEach((cost) => {
        const validation = calculator.validateCostCalculation(cost);
        expect(validation.isValid).toBe(true);
      });

      // 6. コスト比較
      const comparedCosts = calculator.compareCosts(costs);
      expect(comparedCosts[0].metadata.isLowestCost).toBe(true);

      // 7. パフォーマンス分析
      const analysis = calculator.analyzeCostPerformance(comparedCosts);
      expect(analysis.bestValue).toBeDefined();
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });

    it("should handle subscription products correctly", async () => {
      // サブスクリプション商品のモックデータを追加
      rakutenConnector.addMockProduct({
        itemCode: "subscription-vitamin-d",
        itemName: "ビタミンD 定期便 毎月お届け 15%オフ",
        itemPrice: 2000,
        postageFlag: 1,
        itemUrl: "https://test.com/subscription",
        mediumImageUrls: ["https://test.com/sub-image.jpg"],
        availability: 1,
        reviewCount: 100,
        reviewAverage: 4.5,
        shopName: "Subscription Store",
        genreId: "509777",
      });

      const products = await rakutenConnector.searchProducts({
        keyword: "定期便",
      });
      const subscriptionProduct = products.find((p) =>
        p.itemName.includes("定期便"),
      );

      expect(subscriptionProduct).toBeDefined();

      const normalizedPrice = normalizer.normalizeRakutenPrice(
        subscriptionProduct!,
        "sub-test",
      );

      expect(normalizedPrice.isSubscription).toBe(true);
      expect(normalizedPrice.subscriptionDiscount).toBe(0.15);
      expect(normalizedPrice.subscriptionInterval).toBe("monthly");

      // サブスクリプション割引を適用した比較用正規化
      const comparisonPrices = normalizer.normalizeForComparison([
        normalizedPrice,
      ]);
      expect(comparisonPrices[0].totalPrice).toBeLessThan(
        normalizedPrice.totalPrice,
      );
    });

    it("should handle bulk discount scenarios", async () => {
      // バルク割引商品のモックデータを追加
      rakutenConnector.addMockProduct({
        itemCode: "bulk-vitamin-d",
        itemName: "ビタミンD 3個以上で10%オフ 5個以上で20%オフ",
        itemPrice: 1800,
        postageFlag: 0,
        itemUrl: "https://test.com/bulk",
        mediumImageUrls: ["https://test.com/bulk-image.jpg"],
        availability: 1,
        reviewCount: 50,
        reviewAverage: 4.0,
        shopName: "Bulk Store",
        genreId: "509777",
      });

      const products = await rakutenConnector.searchProducts({
        keyword: "ビタミン",
      });
      const bulkProduct = products.find((p) => p.itemName.includes("個以上"));

      expect(bulkProduct).toBeDefined();

      const bulkDiscounts = normalizer.detectBulkDiscounts(
        bulkProduct!.itemName,
      );

      expect(bulkDiscounts).toEqual([
        { quantity: 3, discountRate: 0.1 },
        { quantity: 5, discountRate: 0.2 },
      ]);
    });
  });

  describe("Boundary value testing", () => {
    it("should handle minimum price values", async () => {
      // 最小価格の商品
      rakutenConnector.addMockProduct({
        itemCode: "min-price-product",
        itemName: "最小価格商品",
        itemPrice: 1, // 最小価格
        postageFlag: 0,
        itemUrl: "https://test.com/min",
        mediumImageUrls: [],
        availability: 1,
        reviewCount: 1,
        reviewAverage: 1,
        shopName: "Min Store",
        genreId: "509777",
      });

      const products = await rakutenConnector.searchProducts({
        keyword: "最小価格",
      });
      const minPriceProduct = products[0];

      const normalizedPrice = normalizer.normalizeRakutenPrice(
        minPriceProduct,
        "min-test",
      );

      expect(normalizedPrice.basePrice).toBe(1);
      expect(normalizedPrice.shippingCost).toBe(500); // デフォルト送料
      expect(normalizedPrice.totalPrice).toBe(501);

      const validation = normalizer.validatePrice(normalizedPrice);
      expect(validation.isValid).toBe(true);
    });

    it("should handle maximum price values", async () => {
      // 最大価格の商品
      rakutenConnector.addMockProduct({
        itemCode: "max-price-product",
        itemName: "最大価格商品",
        itemPrice: 999999, // 高額商品
        postageFlag: 0,
        itemUrl: "https://test.com/max",
        mediumImageUrls: [],
        availability: 1,
        reviewCount: 1,
        reviewAverage: 1,
        shopName: "Max Store",
        genreId: "509777",
      });

      const products = await rakutenConnector.searchProducts({
        keyword: "最大価格",
      });
      const maxPriceProduct = products[0];

      const normalizedPrice = normalizer.normalizeRakutenPrice(
        maxPriceProduct,
        "max-test",
      );

      expect(normalizedPrice.basePrice).toBe(999999);
      expect(normalizedPrice.shippingCost).toBe(0); // 送料無料閾値超え
      expect(normalizedPrice.totalPrice).toBe(999999);

      const validation = normalizer.validatePrice(normalizedPrice);
      expect(validation.warnings.length).toBeGreaterThan(0); // 高額警告
    });

    it("should handle minimum capacity values", () => {
      const minCapacityProduct: ProductInfo = {
        id: "min-capacity-test",
        name: "最小容量商品",
        brand: "Test",
        capacity: { amount: 1, unit: "粒" }, // 最小容量
        category: "テスト",
      };

      const samplePrice = {
        productId: "min-capacity-test",
        source: "rakuten" as const,
        sourceProductId: "test",
        basePrice: 1000,
        shippingCost: 0,
        totalPrice: 1000,
        inStock: true,
        isSubscription: false,
        lastUpdated: "2023-01-01",
        sourceUrl: "https://test.com",
        shopName: "Test",
        currency: "JPY" as const,
        taxIncluded: true,
        metadata: {},
      };

      const cost = calculator.calculateCostPerDay(
        samplePrice,
        minCapacityProduct,
        {
          servingSize: 1,
          dailyIntake: 1,
        },
      );

      expect(cost.servingsPerContainer).toBe(1);
      expect(cost.daysPerContainer).toBe(1);
      expect(cost.costPerDay).toBe(1000);

      const validation = calculator.validateCostCalculation(cost);
      expect(validation.isValid).toBe(true);
    });

    it("should handle maximum capacity values", () => {
      const maxCapacityProduct: ProductInfo = {
        id: "max-capacity-test",
        name: "最大容量商品",
        brand: "Test",
        capacity: { amount: 100000, unit: "粒" }, // 大容量
        category: "テスト",
      };

      const samplePrice = {
        productId: "max-capacity-test",
        source: "rakuten" as const,
        sourceProductId: "test",
        basePrice: 10000,
        shippingCost: 0,
        totalPrice: 10000,
        inStock: true,
        isSubscription: false,
        lastUpdated: "2023-01-01",
        sourceUrl: "https://test.com",
        shopName: "Test",
        currency: "JPY" as const,
        taxIncluded: true,
        metadata: {},
      };

      const cost = calculator.calculateCostPerDay(
        samplePrice,
        maxCapacityProduct,
        {
          servingSize: 1,
          dailyIntake: 1,
        },
      );

      expect(cost.servingsPerContainer).toBe(100000);
      expect(cost.daysPerContainer).toBe(100000);
      expect(cost.costPerDay).toBe(0.1);

      const validation = calculator.validateCostCalculation(cost);
      expect(validation.isValid).toBe(true);
    });

    it("should handle fractional serving sizes", () => {
      const productInfo: ProductInfo = {
        id: "fractional-test",
        name: "フラクショナル商品",
        brand: "Test",
        capacity: { amount: 100, unit: "mg" },
        category: "テスト",
      };

      const samplePrice = {
        productId: "fractional-test",
        source: "rakuten" as const,
        sourceProductId: "test",
        basePrice: 2000,
        shippingCost: 0,
        totalPrice: 2000,
        inStock: true,
        isSubscription: false,
        lastUpdated: "2023-01-01",
        sourceUrl: "https://test.com",
        shopName: "Test",
        currency: "JPY" as const,
        taxIncluded: true,
        metadata: {},
      };

      const cost = calculator.calculateCostPerDay(samplePrice, productInfo, {
        servingSize: 0.5, // 0.5mg per serving
        dailyIntake: 2, // 1日2回
      });

      expect(cost.servingsPerContainer).toBe(200); // 100 / 0.5
      expect(cost.daysPerContainer).toBe(100); // 200 / 2
      expect(cost.costPerDay).toBe(20); // 2000 / 100

      const validation = calculator.validateCostCalculation(cost);
      expect(validation.isValid).toBe(true);
    });

    it("should handle zero shipping cost edge cases", () => {
      const freeShippingProduct = {
        itemCode: "free-shipping-test",
        itemName: "フリーシッピング商品",
        itemPrice: 2000,
        postageFlag: 1 as const, // 送料込み
        itemUrl: "https://test.com",
        mediumImageUrls: [],
        availability: 1 as const,
        reviewCount: 10,
        reviewAverage: 4.0,
        shopName: "Free Shipping Store",
        genreId: "509777",
      };

      const normalizedPrice = normalizer.normalizeRakutenPrice(
        freeShippingProduct,
        "free-test",
      );

      expect(normalizedPrice.shippingCost).toBe(0);
      expect(normalizedPrice.totalPrice).toBe(2000);

      const validation = normalizer.validatePrice(normalizedPrice);
      expect(validation.isValid).toBe(true);
    });

    it("should handle currency conversion edge cases", () => {
      // USD最小値
      const minUsdAmount = normalizer.convertCurrency(0.01, "USD", "JPY");
      expect(minUsdAmount).toBe(2); // 0.01 * 150 = 1.5 → 2 (四捨五入)

      // USD最大値（実用的な範囲）
      const maxUsdAmount = normalizer.convertCurrency(10000, "USD", "JPY");
      expect(maxUsdAmount).toBe(1500000); // 10000 * 150

      // 同一通貨
      const sameAmount = normalizer.convertCurrency(1000, "JPY", "JPY");
      expect(sameAmount).toBe(1000);
    });
  });

  describe("Error handling and data validation", () => {
    it("should handle invalid price data gracefully", () => {
      const invalidProduct = {
        itemCode: "invalid-product",
        itemName: "Invalid Product",
        itemPrice: -100, // 負の価格
        postageFlag: 0 as const,
        itemUrl: "https://test.com",
        mediumImageUrls: [],
        availability: 1 as const,
        reviewCount: 0,
        reviewAverage: 0,
        shopName: "Invalid Store",
        genreId: "509777",
      };

      const normalizedPrice = normalizer.normalizeRakutenPrice(
        invalidProduct,
        "invalid-test",
      );
      const validation = normalizer.validatePrice(normalizedPrice);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it("should handle malformed product info gracefully", () => {
      const malformedProduct: ProductInfo = {
        id: "malformed-test",
        name: "",
        brand: "",
        capacity: { amount: 0, unit: "" },
        category: "",
      };

      const samplePrice = {
        productId: "malformed-test",
        source: "rakuten" as const,
        sourceProductId: "test",
        basePrice: 1000,
        shippingCost: 0,
        totalPrice: 1000,
        inStock: true,
        isSubscription: false,
        lastUpdated: "2023-01-01",
        sourceUrl: "https://test.com",
        shopName: "Test",
        currency: "JPY" as const,
        taxIncluded: true,
        metadata: {},
      };

      // エラーが発生せずに処理されることを確認
      const cost = calculator.calculateCostPerDay(
        samplePrice,
        malformedProduct,
      );
      expect(cost).toBeDefined();

      const validation = calculator.validateCostCalculation(cost);
      // 無効なデータでも処理は完了するが、警告やエラーが発生する可能性
      expect(validation).toBeDefined();
    });

    it("should handle extreme serving size ratios", () => {
      const productInfo: ProductInfo = {
        id: "extreme-ratio-test",
        name: "エクストリーム商品",
        brand: "Test",
        capacity: { amount: 1000, unit: "mg" },
        category: "テスト",
      };

      const samplePrice = {
        productId: "extreme-ratio-test",
        source: "rakuten" as const,
        sourceProductId: "test",
        basePrice: 5000,
        shippingCost: 0,
        totalPrice: 5000,
        inStock: true,
        isSubscription: false,
        lastUpdated: "2023-01-01",
        sourceUrl: "https://test.com",
        shopName: "Test",
        currency: "JPY" as const,
        taxIncluded: true,
        metadata: {},
      };

      // 極端に大きなサービングサイズ
      const largeCost = calculator.calculateCostPerDay(
        samplePrice,
        productInfo,
        {
          servingSize: 500, // 容量の半分
          dailyIntake: 1,
        },
      );

      expect(largeCost.servingsPerContainer).toBe(2);
      expect(largeCost.daysPerContainer).toBe(2);
      expect(largeCost.costPerDay).toBe(2500);

      // 極端に小さなサービングサイズ
      const smallCost = calculator.calculateCostPerDay(
        samplePrice,
        productInfo,
        {
          servingSize: 0.1,
          dailyIntake: 1,
        },
      );

      expect(smallCost.servingsPerContainer).toBe(10000);
      expect(smallCost.daysPerContainer).toBe(10000);
      expect(smallCost.costPerDay).toBe(0.5);

      // 両方とも有効な計算結果であることを確認
      const largeValidation = calculator.validateCostCalculation(largeCost);
      const smallValidation = calculator.validateCostCalculation(smallCost);

      expect(largeValidation.isValid).toBe(true);
      expect(smallValidation.isValid).toBe(true);
    });
  });

  describe("Performance and scalability", () => {
    it("should handle large datasets efficiently", async () => {
      // 大量の商品データを生成
      const largeProductCount = 100;

      for (let i = 0; i < largeProductCount; i++) {
        rakutenConnector.addMockProduct({
          itemCode: `perf-test-${i}`,
          itemName: `パフォーマンステスト商品${i}`,
          itemPrice: 1000 + i * 10,
          postageFlag: (i % 2) as 0 | 1,
          itemUrl: `https://test.com/perf-${i}`,
          mediumImageUrls: [],
          availability: 1,
          reviewCount: i,
          reviewAverage: 3 + (i % 3),
          shopName: `Store${i}`,
          genreId: "509777",
        });
      }

      const startTime = Date.now();

      // 大量商品の処理
      const products = await rakutenConnector.searchProducts({
        keyword: "パフォーマンステスト",
      });

      const normalizedPrices = products.map((p) =>
        normalizer.normalizeRakutenPrice(p, `perf-test-${p.itemCode}`),
      );

      const productInfo: ProductInfo = {
        id: "perf-test",
        name: "パフォーマンステスト",
        brand: "Test",
        capacity: { amount: 100, unit: "粒" },
        category: "テスト",
      };

      const costs = normalizedPrices.map((price) =>
        calculator.calculateCostPerDay(price, productInfo),
      );

      const comparedCosts = calculator.compareCosts(costs);
      const analysis = calculator.analyzeCostPerformance(comparedCosts);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // パフォーマンス確認（2秒以内）
      expect(processingTime).toBeLessThan(2000);

      // 結果の妥当性確認
      expect(normalizedPrices.length).toBe(largeProductCount);
      expect(costs.length).toBe(largeProductCount);
      expect(comparedCosts.length).toBe(largeProductCount);
      expect(analysis.bestValue).toBeDefined();
    });

    it("should handle concurrent processing", async () => {
      const productInfo: ProductInfo = {
        id: "concurrent-test",
        name: "コンカレントテスト",
        brand: "Test",
        capacity: { amount: 90, unit: "粒" },
        category: "テスト",
      };

      // 並行処理テスト
      const promises = Array.from({ length: 10 }, async (_, i) => {
        const products = await rakutenConnector.searchProducts({
          keyword: "ビタミン",
        });
        const normalizedPrices = products.map((p) =>
          normalizer.normalizeRakutenPrice(p, `concurrent-${i}`),
        );

        return normalizedPrices.map((price) =>
          calculator.calculateCostPerDay(price, productInfo),
        );
      });

      const results = await Promise.all(promises);

      // 全ての並行処理が正常に完了することを確認
      expect(results).toHaveLength(10);
      results.forEach((costs) => {
        expect(costs.length).toBeGreaterThan(0);
        costs.forEach((cost) => {
          const validation = calculator.validateCostCalculation(cost);
          expect(validation.isValid).toBe(true);
        });
      });
    });
  });
});
