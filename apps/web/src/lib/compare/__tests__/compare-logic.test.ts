import { describe, it, expect } from "vitest";
import {
  compareProducts,
  calculateScoreSummary,
  processComparisonData,
  validateProductsForComparison,
  type Product,
  type ComparisonResult,
  type ScoreSummary,
} from "../compare-logic";

describe("Compare Logic", () => {
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
      },
      warnings: [
        {
          id: "w1",
          type: "warning",
          category: "medication",
          message: "薬物相互作用の可能性があります",
          severity: 6,
          productId: "p1",
        },
      ],
      imageUrl: "/images/product-a.jpg",
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
      },
      warnings: [
        {
          id: "w2",
          type: "critical",
          category: "pregnancy",
          message: "妊娠中の使用は避けてください",
          severity: 9,
          productId: "p2",
        },
      ],
      imageUrl: "/images/product-b.jpg",
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
      },
      warnings: [],
      imageUrl: "/images/product-c.jpg",
      url: "/products/product-c",
    },
  ];

  describe("compareProducts", () => {
    it("製品比較データを正しく処理する", () => {
      const result = compareProducts(mockProducts);

      expect(result.products).toHaveLength(3);
      expect(result.scoreSummary).toBeDefined();
      expect(result.warningAnalysis).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it("スコア要約を正しく計算する", () => {
      const result = compareProducts(mockProducts);

      expect(result.scoreSummary.effectiveness.maxScore).toBe(95);
      expect(result.scoreSummary.effectiveness.minScore).toBe(70);
      expect(result.scoreSummary.effectiveness.averageScore).toBe(85);
    });

    it("警告分析を正しく実行する", () => {
      const result = compareProducts(mockProducts);

      expect(result.warningAnalysis.totalWarnings).toBe(2);
      expect(result.warningAnalysis.criticalWarnings).toHaveLength(1);
      expect(result.warningAnalysis.mostImportantWarning?.severity).toBe(9);
    });

    it("推奨製品を正しく特定する", () => {
      const result = compareProducts(mockProducts);

      const bestScore = result.recommendations.find(
        (r) => r.type === "best_score",
      );
      const bestPrice = result.recommendations.find(
        (r) => r.type === "best_price",
      );
      const leastWarnings = result.recommendations.find(
        (r) => r.type === "least_warnings",
      );

      expect(bestScore?.productId).toBe("p3"); // 最高スコア95
      expect(bestPrice?.productId).toBe("p2"); // 最安価格800
      expect(leastWarnings?.productId).toBe("p3"); // 警告0件
    });

    it("空の製品リストを正しく処理する", () => {
      const result = compareProducts([]);

      expect(result.products).toHaveLength(0);
      expect(result.scoreSummary).toEqual({});
      expect(result.warningAnalysis.totalWarnings).toBe(0);
      expect(result.recommendations).toHaveLength(0);
    });
  });

  describe("calculateScoreSummary", () => {
    it("各カテゴリのスコア要約を正しく計算する", () => {
      const summary = calculateScoreSummary(mockProducts);

      expect(summary.effectiveness.maxScore).toBe(95);
      expect(summary.effectiveness.minScore).toBe(70);
      expect(summary.effectiveness.averageScore).toBe(85);

      expect(summary.safety.maxScore).toBe(95);
      expect(summary.safety.minScore).toBe(80);
      expect(summary.safety.averageScore).toBe(87);

      expect(summary.convenience.maxScore).toBe(95);
      expect(summary.convenience.minScore).toBe(70);
      expect(summary.convenience.averageScore).toBe(83);
    });

    it("製品ごとのスコア情報を含む", () => {
      const summary = calculateScoreSummary(mockProducts);

      expect(summary.effectiveness.products).toHaveLength(3);
      expect(summary.effectiveness.products[0]).toEqual({
        productId: "p1",
        score: 90,
      });
    });

    it("単一製品の場合を正しく処理する", () => {
      const singleProduct = [mockProducts[0]];
      const summary = calculateScoreSummary(singleProduct);

      expect(summary.effectiveness.maxScore).toBe(90);
      expect(summary.effectiveness.minScore).toBe(90);
      expect(summary.effectiveness.averageScore).toBe(90);
    });
  });

  describe("processComparisonData", () => {
    it("比較データを正しく前処理する", () => {
      const processed = processComparisonData(mockProducts);

      expect(processed).toHaveLength(3);
      expect(processed[0].id).toBe("p1");
      expect(processed[0].totalScore).toBe(85);
    });

    it("不正なデータをフィルタリングする", () => {
      const invalidProducts = [
        ...mockProducts,
        {
          id: "",
          name: "",
          price: -100,
          totalScore: 150, // 無効なスコア
          scoreBreakdown: {},
          warnings: [],
          url: "",
        } as any,
      ];

      const processed = processComparisonData(invalidProducts);
      expect(processed).toHaveLength(3); // 無効な製品は除外
    });

    it("重複する製品IDを除去する", () => {
      const duplicateProducts = [
        mockProducts[0],
        mockProducts[0], // 重複
        mockProducts[1],
      ];

      const processed = processComparisonData(duplicateProducts);
      expect(processed).toHaveLength(2); // 重複は除去
    });
  });

  describe("validateProductsForComparison", () => {
    it("有効な製品リストを承認する", () => {
      const validation = validateProductsForComparison(mockProducts);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("製品数の上限を検証する", () => {
      const tooManyProducts = Array(5)
        .fill(mockProducts[0])
        .map((p, i) => ({
          ...p,
          id: `p${i}`,
        }));

      const validation = validateProductsForComparison(tooManyProducts);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("製品数は最大3つまでです");
    });

    it("空の製品リストを検証する", () => {
      const validation = validateProductsForComparison([]);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("比較する製品を選択してください");
    });

    it("必須フィールドの不足を検出する", () => {
      const invalidProduct = {
        id: "p1",
        name: "",
        price: 1000,
        totalScore: 85,
        scoreBreakdown: {},
        warnings: [],
        url: "",
      } as any;

      const validation = validateProductsForComparison([invalidProduct]);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.includes("製品名"))).toBe(true);
    });

    it("スコア範囲を検証する", () => {
      const invalidScoreProduct = {
        ...mockProducts[0],
        totalScore: 150, // 無効なスコア
      };

      const validation = validateProductsForComparison([invalidScoreProduct]);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.includes("スコア"))).toBe(true);
    });
  });

  describe("エラーハンドリング", () => {
    it("不正な製品データでもクラッシュしない", () => {
      const malformedProducts = [null, undefined, {}, { id: "p1" }] as any;

      expect(() => {
        compareProducts(malformedProducts);
      }).not.toThrow();
    });

    it("スコアBreakdownが不完全でも処理する", () => {
      const incompleteProduct = {
        ...mockProducts[0],
        scoreBreakdown: {
          effectiveness: 90,
          // safety と convenience が不足
        },
      };

      expect(() => {
        calculateScoreSummary([incompleteProduct]);
      }).not.toThrow();
    });

    it("警告データが不正でも処理する", () => {
      const invalidWarningProduct = {
        ...mockProducts[0],
        warnings: [
          null,
          undefined,
          { id: "w1" }, // 不完全な警告
        ] as any,
      };

      expect(() => {
        compareProducts([invalidWarningProduct]);
      }).not.toThrow();
    });
  });
});
