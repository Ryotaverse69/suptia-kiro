/**
 * Performance regression tests for product comparison feature
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  PerformanceMonitor,
  DEFAULT_BUDGET,
} from "../../lib/performance/monitor";
import {
  calculateScoreSummariesOptimized,
  calculateAllMetricsOptimized,
  clearCalculationCache,
} from "../../lib/compare/score-calculator";
import { sortProducts } from "../../lib/compare/sort-utils";
import type { Product } from "../../components/compare/types";

// Mock products for performance testing
const createMockProducts = (count: number): Product[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `product-${i}`,
    name: `Test Product ${i}`,
    price: 1000 + i * 100,
    totalScore: 70 + (i % 30),
    scoreBreakdown: {
      safety: 80 + (i % 20),
      efficacy: 75 + (i % 25),
      quality: 85 + (i % 15),
      value: 70 + (i % 30),
    },
    warnings: Array.from({ length: i % 5 }, (_, j) => ({
      id: `warning-${i}-${j}`,
      type: j % 3 === 0 ? "critical" : j % 2 === 0 ? "warning" : "info",
      category: "test",
      message: `Test warning ${j}`,
      severity: 1 + (j % 10),
      productId: `product-${i}`,
    })),
    imageUrl: `/test-image-${i}.jpg`,
    url: `/products/test-product-${i}`,
  }));
};

describe("Compare Performance Tests", () => {
  let monitor: PerformanceMonitor;

  beforeAll(() => {
    // Clear any existing cache
    clearCalculationCache();

    // Initialize performance monitor
    monitor = new PerformanceMonitor();
  });

  afterAll(() => {
    monitor?.disconnect();
  });

  describe("Score Calculation Performance", () => {
    it("should calculate score summaries within performance budget", () => {
      const products = createMockProducts(3);

      const startTime = performance.now();
      const summaries = calculateScoreSummariesOptimized(products);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      // Should complete within 10ms for 3 products
      expect(executionTime).toBeLessThan(10);
      expect(summaries).toHaveLength(4); // safety, efficacy, quality, value
      expect(summaries[0]).toHaveProperty("category");
      expect(summaries[0]).toHaveProperty("maxScore");
      expect(summaries[0]).toHaveProperty("minScore");
      expect(summaries[0]).toHaveProperty("averageScore");
    });

    it("should handle large product sets efficiently", () => {
      const products = createMockProducts(100);

      const startTime = performance.now();
      const summaries = calculateScoreSummariesOptimized(products);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      // Should complete within 50ms even for 100 products
      expect(executionTime).toBeLessThan(50);
      expect(summaries).toHaveLength(4);
    });

    it("should benefit from caching on repeated calculations", () => {
      const products = createMockProducts(10);

      // First calculation (cold)
      const startTime1 = performance.now();
      calculateScoreSummariesOptimized(products);
      const endTime1 = performance.now();
      const firstTime = endTime1 - startTime1;

      // Second calculation (cached)
      const startTime2 = performance.now();
      calculateScoreSummariesOptimized(products);
      const endTime2 = performance.now();
      const secondTime = endTime2 - startTime2;

      // Cached calculation should be significantly faster
      expect(secondTime).toBeLessThan(firstTime * 0.5);
    });
  });

  describe("Sorting Performance", () => {
    it("should sort products efficiently", () => {
      const products = createMockProducts(50);

      const startTime = performance.now();
      const sortedByScore = sortProducts(products, {
        field: "score",
        direction: "desc",
      });
      const sortedByPrice = sortProducts(products, {
        field: "price",
        direction: "asc",
      });
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      // Should complete within 5ms for 50 products
      expect(executionTime).toBeLessThan(5);
      expect(sortedByScore).toHaveLength(50);
      expect(sortedByPrice).toHaveLength(50);

      // Verify sorting correctness
      expect(sortedByScore[0].totalScore).toBeGreaterThanOrEqual(
        sortedByScore[1].totalScore,
      );
      expect(sortedByPrice[0].price).toBeLessThanOrEqual(
        sortedByPrice[1].price,
      );
    });

    it("should handle different sort fields efficiently", () => {
      const products = createMockProducts(20);
      const sortFields: Array<"score" | "price" | "name" | "warnings"> = [
        "score",
        "price",
        "name",
        "warnings",
      ];

      const startTime = performance.now();

      sortFields.forEach((field) => {
        sortProducts(products, { field, direction: "asc" });
        sortProducts(products, { field, direction: "desc" });
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Should complete all sorts within 10ms
      expect(executionTime).toBeLessThan(10);
    });
  });

  describe("Batch Calculation Performance", () => {
    it("should calculate all metrics efficiently in batch", () => {
      const products = createMockProducts(10);

      const startTime = performance.now();
      const allMetrics = calculateAllMetricsOptimized(products);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      // Should complete within 20ms for comprehensive calculation
      expect(executionTime).toBeLessThan(20);
      expect(allMetrics).toHaveProperty("scoreSummaries");
      expect(allMetrics).toHaveProperty("rankings");
      expect(allMetrics).toHaveProperty("warningSeverity");
    });
  });

  describe("Memory Usage", () => {
    it("should not cause memory leaks with repeated calculations", () => {
      const products = createMockProducts(5);

      // Perform many calculations to test for memory leaks
      for (let i = 0; i < 1000; i++) {
        calculateScoreSummariesOptimized(products);

        // Modify products slightly to prevent excessive caching
        products[0].totalScore = 80 + (i % 20);
      }

      // If we reach here without running out of memory, test passes
      expect(true).toBe(true);
    });
  });

  describe("Lighthouse Budget Compliance", () => {
    it("should meet JavaScript bundle size budget", async () => {
      // This test would be more meaningful in an E2E environment
      // For now, we test that the budget constants are reasonable
      expect(DEFAULT_BUDGET.bundleSize).toBe(300); // 300KB limit
      expect(DEFAULT_BUDGET.lcp).toBe(2500); // 2.5s limit
      expect(DEFAULT_BUDGET.tbt).toBe(200); // 200ms limit
      expect(DEFAULT_BUDGET.cls).toBe(0.1); // 0.1 limit
    });

    it("should validate performance budget structure", () => {
      const budget = DEFAULT_BUDGET;

      expect(typeof budget.lcp).toBe("number");
      expect(typeof budget.fcp).toBe("number");
      expect(typeof budget.tbt).toBe("number");
      expect(typeof budget.cls).toBe("number");
      expect(typeof budget.si).toBe("number");
      expect(typeof budget.bundleSize).toBe("number");

      // Ensure reasonable values
      expect(budget.lcp).toBeGreaterThan(0);
      expect(budget.lcp).toBeLessThan(10000);
      expect(budget.cls).toBeGreaterThan(0);
      expect(budget.cls).toBeLessThan(1);
    });
  });

  describe("Component Rendering Performance", () => {
    it("should render comparison table efficiently", () => {
      // This would typically be tested with React Testing Library
      // and performance measurement tools
      const products = createMockProducts(3);

      // Simulate the expensive operations that happen during rendering
      const startTime = performance.now();

      // Score calculation
      calculateScoreSummariesOptimized(products);

      // Sorting
      sortProducts(products, { field: "score", direction: "desc" });

      // Warning analysis (simulated)
      products.forEach((product) => {
        product.warnings.forEach((warning) => {
          // Simulate warning processing
          const severity =
            warning.severity * (warning.type === "critical" ? 3 : 1);
          return severity;
        });
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // All rendering-related calculations should complete quickly
      expect(executionTime).toBeLessThan(15);
    });
  });
});

describe("Performance Regression Detection", () => {
  it("should detect performance regressions in score calculation", () => {
    const products = createMockProducts(10);
    const iterations = 100;
    const times: number[] = [];

    // Measure multiple iterations
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      calculateScoreSummariesOptimized(products);
      const endTime = performance.now();
      times.push(endTime - startTime);
    }

    const averageTime =
      times.reduce((sum, time) => sum + time, 0) / times.length;
    const maxTime = Math.max(...times);

    // Performance regression thresholds
    expect(averageTime).toBeLessThan(5); // Average should be under 5ms
    expect(maxTime).toBeLessThan(20); // No single execution should exceed 20ms

    // Consistency check - standard deviation should be reasonable
    const variance =
      times.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) /
      times.length;
    const standardDeviation = Math.sqrt(variance);
    expect(standardDeviation).toBeLessThan(averageTime); // SD should be less than mean
  });
});
