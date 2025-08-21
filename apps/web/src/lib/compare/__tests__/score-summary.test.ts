import { describe, it, expect } from "vitest";
import {
  ScoreSummaryCalculator,
  calculateCategorySummary,
  findBestPerformingProduct,
  findWorstPerformingProduct,
  calculateCategoryAverage,
  type Product,
  type ScoreSummary,
  type CategorySummary,
} from "../score-summary";

describe("Score Summary Calculator", () => {
  const mockProducts: Product[] = [
    {
      id: "p1",
      name: "Product A",
      price: 1000,
      totalScore: 85,
      scoreBreakdown: {
        effectiveness: 90,
        safety: 80,
        convenience: 85,
        costEffectiveness: 75,
      },
      warnings: [],
      url: "/products/product-a",
    },
    {
      id: "p2",
      name: "Product B",
      price: 800,
      totalScore: 75,
      scoreBreakdown: {
        effectiveness: 70,
        safety: 85,
        convenience: 70,
        costEffectiveness: 90,
      },
      warnings: [],
      url: "/products/product-b",
    },
    {
      id: "p3",
      name: "Product C",
      price: 1200,
      totalScore: 95,
      scoreBreakdown: {
        effectiveness: 95,
        safety: 95,
        convenience: 95,
        costEffectiveness: 85,
      },
      warnings: [],
      url: "/products/product-c",
    },
  ];

  describe("ScoreSummaryCalculator", () => {
    let calculator: ScoreSummaryCalculator;

    beforeEach(() => {
      calculator = new ScoreSummaryCalculator();
    });

    it("全カテゴリのスコア要約を計算する", () => {
      const summary = calculator.calculateSummary(mockProducts);

      expect(Object.keys(summary)).toContain("effectiveness");
      expect(Object.keys(summary)).toContain("safety");
      expect(Object.keys(summary)).toContain("convenience");
      expect(Object.keys(summary)).toContain("costEffectiveness");
    });

    it("各カテゴリの統計を正しく計算する", () => {
      const summary = calculator.calculateSummary(mockProducts);

      // effectiveness: 90, 70, 95
      expect(summary.effectiveness.maxScore).toBe(95);
      expect(summary.effectiveness.minScore).toBe(70);
      expect(summary.effectiveness.averageScore).toBe(85);

      // safety: 80, 85, 95
      expect(summary.safety.maxScore).toBe(95);
      expect(summary.safety.minScore).toBe(80);
      expect(summary.safety.averageScore).toBe(87);
    });

    it("製品ごとのスコア詳細を含む", () => {
      const summary = calculator.calculateSummary(mockProducts);

      expect(summary.effectiveness.products).toHaveLength(3);
      expect(summary.effectiveness.products).toEqual([
        { productId: "p1", score: 90 },
        { productId: "p2", score: 70 },
        { productId: "p3", score: 95 },
      ]);
    });

    it("最高・最低パフォーマンス製品を特定する", () => {
      const bestEffectiveness = calculator.findBestPerformingProduct(
        "effectiveness",
        mockProducts,
      );
      const worstEffectiveness = calculator.findWorstPerformingProduct(
        "effectiveness",
        mockProducts,
      );

      expect(bestEffectiveness).toBe("p3"); // スコア95
      expect(worstEffectiveness).toBe("p2"); // スコア70
    });

    it("カテゴリ平均を正しく計算する", () => {
      const avgEffectiveness = calculator.calculateCategoryAverage(
        "effectiveness",
        mockProducts,
      );
      const avgSafety = calculator.calculateCategoryAverage(
        "safety",
        mockProducts,
      );

      expect(avgEffectiveness).toBe(85); // (90+70+95)/3
      expect(avgSafety).toBe(87); // (80+85+95)/3 = 86.67 → 87
    });

    it("空の製品リストを処理する", () => {
      const summary = calculator.calculateSummary([]);

      expect(Object.keys(summary)).toHaveLength(0);
    });

    it("単一製品を処理する", () => {
      const singleProduct = [mockProducts[0]];
      const summary = calculator.calculateSummary(singleProduct);

      expect(summary.effectiveness.maxScore).toBe(90);
      expect(summary.effectiveness.minScore).toBe(90);
      expect(summary.effectiveness.averageScore).toBe(90);
    });

    it("不完全なスコアBreakdownを処理する", () => {
      const incompleteProduct = {
        ...mockProducts[0],
        scoreBreakdown: {
          effectiveness: 90,
          // safety, convenience, costEffectiveness が不足
        },
      };

      const summary = calculator.calculateSummary([incompleteProduct]);

      expect(summary.effectiveness).toBeDefined();
      expect(summary.safety).toBeUndefined();
    });
  });

  describe("calculateCategorySummary", () => {
    it("カテゴリの統計情報を正しく計算する", () => {
      const scores = [90, 70, 95];
      const productIds = ["p1", "p2", "p3"];

      const summary = calculateCategorySummary(
        "effectiveness",
        scores,
        productIds,
      );

      expect(summary.category).toBe("effectiveness");
      expect(summary.maxScore).toBe(95);
      expect(summary.minScore).toBe(70);
      expect(summary.averageScore).toBe(85);
      expect(summary.products).toHaveLength(3);
    });

    it("同じスコアの製品を正しく処理する", () => {
      const scores = [80, 80, 80];
      const productIds = ["p1", "p2", "p3"];

      const summary = calculateCategorySummary("safety", scores, productIds);

      expect(summary.maxScore).toBe(80);
      expect(summary.minScore).toBe(80);
      expect(summary.averageScore).toBe(80);
    });

    it("小数点を含むスコアを正しく処理する", () => {
      const scores = [85.5, 90.2, 78.8];
      const productIds = ["p1", "p2", "p3"];

      const summary = calculateCategorySummary(
        "convenience",
        scores,
        productIds,
      );

      expect(summary.maxScore).toBe(90.2);
      expect(summary.minScore).toBe(78.8);
      expect(summary.averageScore).toBe(85); // 平均は整数に丸める
    });

    it("空の配列を処理する", () => {
      const summary = calculateCategorySummary("effectiveness", [], []);

      expect(summary.maxScore).toBe(0);
      expect(summary.minScore).toBe(0);
      expect(summary.averageScore).toBe(0);
      expect(summary.products).toHaveLength(0);
    });
  });

  describe("findBestPerformingProduct", () => {
    it("最高スコアの製品を特定する", () => {
      const best = findBestPerformingProduct("effectiveness", mockProducts);
      expect(best).toBe("p3"); // スコア95
    });

    it("同点の場合は最初の製品を返す", () => {
      const tiedProducts = [
        { ...mockProducts[0], scoreBreakdown: { effectiveness: 90 } },
        { ...mockProducts[1], scoreBreakdown: { effectiveness: 90 } },
      ];

      const best = findBestPerformingProduct("effectiveness", tiedProducts);
      expect(best).toBe("p1"); // 最初の製品
    });

    it("存在しないカテゴリの場合はundefinedを返す", () => {
      const best = findBestPerformingProduct(
        "nonexistent" as any,
        mockProducts,
      );
      expect(best).toBeUndefined();
    });

    it("空の製品リストの場合はundefinedを返す", () => {
      const best = findBestPerformingProduct("effectiveness", []);
      expect(best).toBeUndefined();
    });
  });

  describe("findWorstPerformingProduct", () => {
    it("最低スコアの製品を特定する", () => {
      const worst = findWorstPerformingProduct("effectiveness", mockProducts);
      expect(worst).toBe("p2"); // スコア70
    });

    it("同点の場合は最初の製品を返す", () => {
      const tiedProducts = [
        { ...mockProducts[0], scoreBreakdown: { safety: 80 } },
        { ...mockProducts[1], scoreBreakdown: { safety: 80 } },
      ];

      const worst = findWorstPerformingProduct("safety", tiedProducts);
      expect(worst).toBe("p1"); // 最初の製品
    });

    it("存在しないカテゴリの場合はundefinedを返す", () => {
      const worst = findWorstPerformingProduct(
        "nonexistent" as any,
        mockProducts,
      );
      expect(worst).toBeUndefined();
    });
  });

  describe("calculateCategoryAverage", () => {
    it("カテゴリの平均スコアを計算する", () => {
      const avg = calculateCategoryAverage("effectiveness", mockProducts);
      expect(avg).toBe(85); // (90+70+95)/3
    });

    it("小数点以下を適切に丸める", () => {
      const products = [
        { ...mockProducts[0], scoreBreakdown: { safety: 83 } },
        { ...mockProducts[1], scoreBreakdown: { safety: 84 } },
        { ...mockProducts[2], scoreBreakdown: { safety: 85 } },
      ];

      const avg = calculateCategoryAverage("safety", products);
      expect(avg).toBe(84); // (83+84+85)/3 = 84
    });

    it("存在しないカテゴリの場合は0を返す", () => {
      const avg = calculateCategoryAverage("nonexistent" as any, mockProducts);
      expect(avg).toBe(0);
    });

    it("空の製品リストの場合は0を返す", () => {
      const avg = calculateCategoryAverage("effectiveness", []);
      expect(avg).toBe(0);
    });
  });

  describe("エッジケースとエラーハンドリング", () => {
    it("不正なスコア値を処理する", () => {
      const invalidProducts = [
        {
          ...mockProducts[0],
          scoreBreakdown: {
            effectiveness: NaN,
            safety: Infinity,
            convenience: -10,
          },
        },
      ];

      const calculator = new ScoreSummaryCalculator();

      expect(() => {
        calculator.calculateSummary(invalidProducts);
      }).not.toThrow();
    });

    it("nullやundefinedのスコアを処理する", () => {
      const nullScoreProducts = [
        {
          ...mockProducts[0],
          scoreBreakdown: {
            effectiveness: null,
            safety: undefined,
            convenience: 85,
          },
        },
      ] as any;

      const calculator = new ScoreSummaryCalculator();
      const summary = calculator.calculateSummary(nullScoreProducts);

      expect(summary.convenience).toBeDefined();
      expect(summary.effectiveness).toBeUndefined();
      expect(summary.safety).toBeUndefined();
    });

    it("scoreBreakdownが存在しない製品を処理する", () => {
      const noBreakdownProducts = [
        {
          ...mockProducts[0],
          scoreBreakdown: undefined,
        },
      ] as any;

      const calculator = new ScoreSummaryCalculator();

      expect(() => {
        calculator.calculateSummary(noBreakdownProducts);
      }).not.toThrow();
    });
  });
});
