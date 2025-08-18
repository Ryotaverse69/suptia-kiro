/**
 * Cost Calculator Unit Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CostCalculator, createCostCalculator } from "../cost-calculator";
import type { NormalizedPrice } from "../price-normalizer";
import type { ProductInfo } from "../price-matcher";

describe("CostCalculator", () => {
  let calculator: CostCalculator;
  let samplePrice: NormalizedPrice;
  let sampleProductInfo: ProductInfo;

  beforeEach(() => {
    calculator = new CostCalculator();

    samplePrice = {
      productId: "test-product-1",
      source: "rakuten",
      sourceProductId: "rakuten-vitamin-d-1000",
      basePrice: 1980,
      shippingCost: 500,
      totalPrice: 2480,
      inStock: true,
      isSubscription: false,
      lastUpdated: "2023-01-01T00:00:00Z",
      sourceUrl: "https://test.com",
      shopName: "Test Shop",
      currency: "JPY",
      taxIncluded: true,
      metadata: {},
    };

    sampleProductInfo = {
      id: "test-product-1",
      name: "ビタミンD 1000IU 90粒",
      brand: "HealthBrand",
      capacity: {
        amount: 90,
        unit: "粒",
        servingsPerContainer: 90,
      },
      category: "ビタミン",
    };
  });

  describe("calculateCostPerDay", () => {
    it("should calculate cost per day correctly", () => {
      const cost = calculator.calculateCostPerDay(
        samplePrice,
        sampleProductInfo,
        {
          servingSize: 1,
          dailyIntake: 1,
        },
      );

      expect(cost.productId).toBe("test-product-1");
      expect(cost.source).toBe("rakuten");
      expect(cost.servingSize).toBe(1);
      expect(cost.servingsPerContainer).toBe(90);
      expect(cost.recommendedDailyIntake).toBe(1);
      expect(cost.daysPerContainer).toBe(90);
      expect(cost.costPerDay).toBe(27.56); // 2480 / 90
      expect(cost.costPerServing).toBe(27.56); // 2480 / 90
      expect(cost.totalPrice).toBe(2480);
      expect(cost.currency).toBe("JPY");
    });

    it("should handle multiple servings per day", () => {
      const cost = calculator.calculateCostPerDay(
        samplePrice,
        sampleProductInfo,
        {
          servingSize: 1,
          dailyIntake: 2, // 1日2回
        },
      );

      expect(cost.daysPerContainer).toBe(45); // 90 / 2
      expect(cost.costPerDay).toBe(55.11); // 2480 / 45
      expect(cost.costPerServing).toBe(27.56); // 2480 / 90
    });

    it("should handle different serving sizes", () => {
      const cost = calculator.calculateCostPerDay(
        samplePrice,
        sampleProductInfo,
        {
          servingSize: 2, // 1回2粒
          dailyIntake: 1,
        },
      );

      expect(cost.servingsPerContainer).toBe(45); // 90 / 2
      expect(cost.daysPerContainer).toBe(45);
      expect(cost.costPerDay).toBe(55.11); // 2480 / 45
      expect(cost.costPerServing).toBe(55.11); // 2480 / 45
    });

    it("should extract serving info from product name", () => {
      const productWithServingInfo = {
        ...sampleProductInfo,
        name: "ビタミンD 1000IU 1日2回 90粒",
      };

      const cost = calculator.calculateCostPerDay(
        samplePrice,
        productWithServingInfo,
      );

      expect(cost.recommendedDailyIntake).toBe(2);
    });

    it("should handle weight-based products", () => {
      const weightBasedProduct = {
        ...sampleProductInfo,
        capacity: {
          amount: 300,
          unit: "g",
        },
      };

      const cost = calculator.calculateCostPerDay(
        samplePrice,
        weightBasedProduct,
        {
          servingSize: 10, // 10g per serving
          dailyIntake: 1,
        },
      );

      expect(cost.servingsPerContainer).toBe(30); // 300 / 10
      expect(cost.daysPerContainer).toBe(30);
      expect(cost.costPerDay).toBe(82.67); // 2480 / 30
    });
  });

  describe("compareCosts", () => {
    it("should sort costs by cost per day", () => {
      const costs = [
        {
          productId: "product-1",
          source: "rakuten",
          sourceProductId: "rakuten-1",
          servingSize: 1,
          servingsPerContainer: 60,
          recommendedDailyIntake: 1,
          daysPerContainer: 60,
          costPerDay: 50,
          costPerServing: 50,
          costPerUnit: 1,
          totalPrice: 3000,
          currency: "JPY" as const,
          calculatedAt: "2023-01-01",
          metadata: { unitType: "count" as const, unit: "粒" },
        },
        {
          productId: "product-2",
          source: "yahoo",
          sourceProductId: "yahoo-1",
          servingSize: 1,
          servingsPerContainer: 90,
          recommendedDailyIntake: 1,
          daysPerContainer: 90,
          costPerDay: 30,
          costPerServing: 30,
          costPerUnit: 1,
          totalPrice: 2700,
          currency: "JPY" as const,
          calculatedAt: "2023-01-01",
          metadata: { unitType: "count" as const, unit: "粒" },
        },
      ];

      const compared = calculator.compareCosts(costs);

      expect(compared[0].costPerDay).toBe(30); // 最安値が最初
      expect(compared[1].costPerDay).toBe(50);
      expect(compared[0].metadata.rank).toBe(1);
      expect(compared[1].metadata.rank).toBe(2);
      expect(compared[0].metadata.isLowestCost).toBe(true);
      expect(compared[1].metadata.isLowestCost).toBe(false);
    });
  });

  describe("findLowestCost", () => {
    it("should find the lowest cost option", () => {
      const costs = [
        {
          productId: "product-1",
          costPerDay: 50,
        },
        {
          productId: "product-2",
          costPerDay: 30,
        },
        {
          productId: "product-3",
          costPerDay: 40,
        },
      ] as any[];

      const lowest = calculator.findLowestCost(costs);

      expect(lowest?.productId).toBe("product-2");
      expect(lowest?.costPerDay).toBe(30);
    });

    it("should return null for empty array", () => {
      const lowest = calculator.findLowestCost([]);
      expect(lowest).toBeNull();
    });
  });

  describe("calculateQualityAdjustedCost", () => {
    it("should adjust cost based on quality score", () => {
      const cost = {
        costPerDay: 100,
        metadata: {
          qualityScore: 0.8,
          unitType: "count" as const,
          unit: "粒",
        },
      } as any;

      const adjustedCost = calculator.calculateQualityAdjustedCost(cost);

      // 品質スコア0.8、重み0.2の場合: 100 * (1 - 0.8 * 0.2) = 100 * 0.84 = 84
      expect(adjustedCost).toBe(84);
    });

    it("should adjust cost based on bioavailability", () => {
      const cost = {
        costPerDay: 100,
        metadata: {
          bioavailability: 0.7,
          unitType: "count" as const,
          unit: "粒",
        },
      } as any;

      const adjustedCost = calculator.calculateQualityAdjustedCost(cost);

      // バイオアベイラビリティ0.7の場合: 100 * (2 - 0.7) = 100 * 1.3 = 130
      expect(adjustedCost).toBe(130);
    });

    it("should apply both quality and bioavailability adjustments", () => {
      const cost = {
        costPerDay: 100,
        metadata: {
          qualityScore: 0.9,
          bioavailability: 0.8,
          unitType: "count" as const,
          unit: "粒",
        },
      } as any;

      const adjustedCost = calculator.calculateQualityAdjustedCost(cost);

      // 品質: 100 * (1 - 0.9 * 0.2) = 100 * 0.82 = 82
      // バイオアベイラビリティ: 82 * (2 - 0.8) = 82 * 1.2 = 98.4
      expect(adjustedCost).toBe(98.4);
    });
  });

  describe("analyzeCostPerformance", () => {
    it("should analyze cost performance correctly", () => {
      const costs = [
        { costPerDay: 30, metadata: { qualityScore: 0.7 } },
        { costPerDay: 50, metadata: { qualityScore: 0.9 } },
        { costPerDay: 40, metadata: { qualityScore: 0.8 } },
      ] as any[];

      const analysis = calculator.analyzeCostPerformance(costs);

      expect(analysis.bestValue?.costPerDay).toBe(30);
      expect(analysis.worstValue?.costPerDay).toBe(50);
      expect(analysis.averageCost).toBe(40);
      expect(analysis.medianCost).toBe(40);
      expect(analysis.costRange.min).toBe(30);
      expect(analysis.costRange.max).toBe(50);
      expect(analysis.costRange.spread).toBe(20);
      expect(analysis.costRange.spreadPercentage).toBe(66.67);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });

    it("should handle empty cost array", () => {
      const analysis = calculator.analyzeCostPerformance([]);

      expect(analysis.bestValue).toBeNull();
      expect(analysis.worstValue).toBeNull();
      expect(analysis.averageCost).toBe(0);
      expect(analysis.medianCost).toBe(0);
      expect(analysis.recommendations).toHaveLength(0);
    });

    it("should generate appropriate recommendations", () => {
      const costs = [
        { costPerDay: 30, metadata: { qualityScore: 0.6 } },
        { costPerDay: 50, metadata: { qualityScore: 0.9 } },
        { costPerDay: 40, metadata: { qualityScore: 0.8 } },
      ] as any[];

      const analysis = calculator.analyzeCostPerformance(costs);

      const budgetOption = analysis.recommendations.find(
        (r) => r.type === "budget_option",
      );
      const premiumChoice = analysis.recommendations.find(
        (r) => r.type === "premium_choice",
      );

      expect(budgetOption).toBeDefined();
      expect(budgetOption?.product.costPerDay).toBe(30);

      expect(premiumChoice).toBeDefined();
      expect(premiumChoice?.product.metadata.qualityScore).toBeGreaterThan(0.8);
    });
  });

  describe("calculateLongTermCost", () => {
    it("should calculate monthly, quarterly, and yearly costs", () => {
      const cost = {
        costPerDay: 100,
      } as any;

      const longTerm = calculator.calculateLongTermCost(cost);

      expect(longTerm.monthly).toBe(3000); // 100 * 30
      expect(longTerm.quarterly).toBe(9000); // 100 * 90
      expect(longTerm.yearly).toBe(36500); // 100 * 365
    });

    it("should calculate only specified periods", () => {
      const cost = {
        costPerDay: 50,
      } as any;

      const longTerm = calculator.calculateLongTermCost(cost, {
        monthly: true,
      });

      expect(longTerm.monthly).toBe(1500);
      expect(longTerm.quarterly).toBeUndefined();
      expect(longTerm.yearly).toBeUndefined();
    });
  });

  describe("validateCostCalculation", () => {
    it("should validate correct cost calculation", () => {
      const validCost = calculator.calculateCostPerDay(
        samplePrice,
        sampleProductInfo,
        {
          servingSize: 1,
          dailyIntake: 1,
        },
      );

      const validation = calculator.validateCostCalculation(validCost);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should detect invalid cost per day", () => {
      const invalidCost = {
        ...calculator.calculateCostPerDay(samplePrice, sampleProductInfo),
        costPerDay: -10,
      };

      const validation = calculator.validateCostCalculation(invalidCost);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("1日あたりコストが0以下です");
    });

    it("should detect invalid days per container", () => {
      const invalidCost = {
        ...calculator.calculateCostPerDay(samplePrice, sampleProductInfo),
        daysPerContainer: 0,
      };

      const validation = calculator.validateCostCalculation(invalidCost);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("容器あたり日数が0以下です");
    });

    it("should detect calculation inconsistencies", () => {
      const inconsistentCost = {
        ...calculator.calculateCostPerDay(samplePrice, sampleProductInfo),
        costPerDay: 999, // 正しくない値
      };

      const validation = calculator.validateCostCalculation(inconsistentCost);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        "1日あたりコストの計算が正しくありません",
      );
    });

    it("should generate warnings for unusual values", () => {
      const unusualCost = {
        ...calculator.calculateCostPerDay(samplePrice, sampleProductInfo),
        costPerDay: 15000, // 異常に高額
        daysPerContainer: 400, // 1年超
      };
      unusualCost.totalPrice =
        unusualCost.costPerDay * unusualCost.daysPerContainer;

      const validation = calculator.validateCostCalculation(unusualCost);

      expect(validation.warnings).toContain(
        "1日あたりコストが異常に高額です（1万円超）",
      );
      expect(validation.warnings).toContain(
        "容器あたり日数が1年を超えています",
      );
    });
  });

  describe("Edge cases and boundary values", () => {
    it("should handle very small serving sizes", () => {
      const cost = calculator.calculateCostPerDay(
        samplePrice,
        sampleProductInfo,
        {
          servingSize: 0.1,
          dailyIntake: 1,
        },
      );

      expect(cost.servingsPerContainer).toBe(900); // 90 / 0.1
      expect(cost.daysPerContainer).toBe(900);
      expect(cost.costPerDay).toBe(2.76); // 2480 / 900
    });

    it("should handle very large serving sizes", () => {
      const cost = calculator.calculateCostPerDay(
        samplePrice,
        sampleProductInfo,
        {
          servingSize: 30,
          dailyIntake: 1,
        },
      );

      expect(cost.servingsPerContainer).toBe(3); // 90 / 30
      expect(cost.daysPerContainer).toBe(3);
      expect(cost.costPerDay).toBe(826.67); // 2480 / 3
    });

    it("should handle fractional daily intake", () => {
      const cost = calculator.calculateCostPerDay(
        samplePrice,
        sampleProductInfo,
        {
          servingSize: 1,
          dailyIntake: 0.5, // 2日に1回
        },
      );

      expect(cost.daysPerContainer).toBe(180); // 90 / 0.5
      expect(cost.costPerDay).toBe(13.78); // 2480 / 180
    });

    it("should handle products with zero capacity", () => {
      const zeroCapacityProduct = {
        ...sampleProductInfo,
        capacity: {
          amount: 0,
          unit: "粒",
        },
      };

      const cost = calculator.calculateCostPerDay(
        samplePrice,
        zeroCapacityProduct,
        {
          servingSize: 1,
          dailyIntake: 1,
        },
      );

      expect(cost.servingsPerContainer).toBe(0);
      expect(cost.daysPerContainer).toBe(0);
    });

    it("should handle products with very high capacity", () => {
      const highCapacityProduct = {
        ...sampleProductInfo,
        capacity: {
          amount: 10000,
          unit: "粒",
        },
      };

      const cost = calculator.calculateCostPerDay(
        samplePrice,
        highCapacityProduct,
        {
          servingSize: 1,
          dailyIntake: 1,
        },
      );

      expect(cost.servingsPerContainer).toBe(10000);
      expect(cost.daysPerContainer).toBe(10000);
      expect(cost.costPerDay).toBe(0.25); // 2480 / 10000
    });

    it("should handle different unit types correctly", () => {
      const weightProduct = {
        ...sampleProductInfo,
        capacity: {
          amount: 500,
          unit: "mg",
        },
      };

      const cost = calculator.calculateCostPerDay(samplePrice, weightProduct, {
        servingSize: 10, // 10mg per serving
        dailyIntake: 2,
      });

      expect(cost.servingsPerContainer).toBe(50); // 500 / 10
      expect(cost.daysPerContainer).toBe(25); // 50 / 2
      expect(cost.costPerDay).toBe(99.2); // 2480 / 25
      expect(cost.metadata.unitType).toBe("weight");
    });
  });
});

describe("createCostCalculator", () => {
  it("should create calculator with default config", () => {
    const calculator = createCostCalculator();
    const config = calculator.getConfig();

    expect(config.defaultServingSize).toBe(1);
    expect(config.defaultDailyIntake).toBe(1);
    expect(config.qualityWeightFactor).toBe(0.2);
  });

  it("should create calculator with custom config", () => {
    const customConfig = {
      defaultServingSize: 2,
      defaultDailyIntake: 3,
      qualityWeightFactor: 0.3,
    };

    const calculator = createCostCalculator(customConfig);
    const config = calculator.getConfig();

    expect(config.defaultServingSize).toBe(2);
    expect(config.defaultDailyIntake).toBe(3);
    expect(config.qualityWeightFactor).toBe(0.3);
  });
});
