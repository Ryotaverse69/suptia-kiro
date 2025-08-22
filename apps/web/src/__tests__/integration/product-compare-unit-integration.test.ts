import { describe, it, expect } from "vitest";
import { compareProducts } from "../../lib/compare/compare-logic";
import { sortProducts } from "../../lib/compare/sort-utils";
import { analyzeProductWarnings } from "../../lib/compare/warning-analyzer";
import { calculateScoreSummary } from "../../lib/compare/score-summary";
import type { Product, SortConfig } from "../../components/compare/types";

describe("Product Compare Unit Integration Tests", () => {
  const mockProducts: Product[] = [
    {
      id: "p1",
      name: "イブプロフェン錠A",
      price: 1000,
      totalScore: 85,
      scoreBreakdown: {
        effectiveness: 90,
        safety: 80,
        convenience: 85,
        costEffectiveness: 75,
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
      url: "/products/ibuprofen-a",
    },
    {
      id: "p2",
      name: "アセトアミノフェン錠B",
      price: 800,
      totalScore: 75,
      scoreBreakdown: {
        effectiveness: 70,
        safety: 85,
        convenience: 70,
        costEffectiveness: 90,
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
      url: "/products/acetaminophen-b",
    },
    {
      id: "p3",
      name: "ロキソプロフェン錠C",
      price: 1200,
      totalScore: 95,
      scoreBreakdown: {
        effectiveness: 95,
        safety: 95,
        convenience: 95,
        costEffectiveness: 85,
      },
      warnings: [],
      imageUrl: "/images/product-c.jpg",
      url: "/products/loxoprofen-c",
    },
  ];

  describe("比較ロジック統合テスト", () => {
    it("compareProducts関数が正しく動作する", () => {
      const result = compareProducts(mockProducts);

      expect(result.products).toHaveLength(3);
      expect(result.scoreSummary).toBeDefined();
      expect(result.warningAnalysis).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it("製品データを正しく処理する", () => {
      const result = compareProducts(mockProducts);

      // 製品データの整合性確認
      result.products.forEach((product, index) => {
        expect(product.id).toBe(mockProducts[index].id);
        expect(product.name).toBe(mockProducts[index].name);
        expect(product.price).toBe(mockProducts[index].price);
        expect(product.totalScore).toBe(mockProducts[index].totalScore);
      });
    });

    it("スコア計算が正確である", () => {
      const result = compareProducts(mockProducts);

      // 各製品のスコアが正しく計算される
      expect(result.products[0].totalScore).toBe(85);
      expect(result.products[1].totalScore).toBe(75);
      expect(result.products[2].totalScore).toBe(95);
    });

    it("並べ替えロジックが正常に動作する", () => {
      const result = compareProducts(mockProducts);

      // スコア順降順
      const sortedByScoreDesc = sortProducts(result.products, {
        field: "score",
        direction: "desc",
      });

      expect(sortedByScoreDesc[0].totalScore).toBe(95);
      expect(sortedByScoreDesc[1].totalScore).toBe(85);
      expect(sortedByScoreDesc[2].totalScore).toBe(75);

      // 価格順昇順
      const sortedByPriceAsc = sortProducts(result.products, {
        field: "price",
        direction: "asc",
      });

      expect(sortedByPriceAsc[0].price).toBe(800);
      expect(sortedByPriceAsc[1].price).toBe(1000);
      expect(sortedByPriceAsc[2].price).toBe(1200);
    });
  });

  describe("ソートユーティリティ統合テスト", () => {
    it("スコア順並べ替えが正しく動作する", () => {
      const sortConfigs: SortConfig[] = [
        { field: "score", direction: "desc" },
        { field: "score", direction: "asc" },
      ];

      sortConfigs.forEach((config) => {
        const sorted = sortProducts(mockProducts, config);
        expect(sorted).toHaveLength(mockProducts.length);

        if (config.direction === "desc") {
          expect(sorted[0].totalScore).toBeGreaterThanOrEqual(
            sorted[1].totalScore,
          );
          expect(sorted[1].totalScore).toBeGreaterThanOrEqual(
            sorted[2].totalScore,
          );
        } else {
          expect(sorted[0].totalScore).toBeLessThanOrEqual(
            sorted[1].totalScore,
          );
          expect(sorted[1].totalScore).toBeLessThanOrEqual(
            sorted[2].totalScore,
          );
        }
      });
    });

    it("価格順並べ替えが正しく動作する", () => {
      const sortConfigs: SortConfig[] = [
        { field: "price", direction: "asc" },
        { field: "price", direction: "desc" },
      ];

      sortConfigs.forEach((config) => {
        const sorted = sortProducts(mockProducts, config);
        expect(sorted).toHaveLength(mockProducts.length);

        if (config.direction === "asc") {
          expect(sorted[0].price).toBeLessThanOrEqual(sorted[1].price);
          expect(sorted[1].price).toBeLessThanOrEqual(sorted[2].price);
        } else {
          expect(sorted[0].price).toBeGreaterThanOrEqual(sorted[1].price);
          expect(sorted[1].price).toBeGreaterThanOrEqual(sorted[2].price);
        }
      });
    });

    it("名前順並べ替えが正しく動作する", () => {
      const sortedAsc = sortProducts(mockProducts, {
        field: "name",
        direction: "asc",
      });

      const sortedDesc = sortProducts(mockProducts, {
        field: "name",
        direction: "desc",
      });

      expect(sortedAsc).toHaveLength(mockProducts.length);
      expect(sortedDesc).toHaveLength(mockProducts.length);

      // 名前順（昇順）の確認
      for (let i = 0; i < sortedAsc.length - 1; i++) {
        expect(
          sortedAsc[i].name.localeCompare(sortedAsc[i + 1].name),
        ).toBeLessThanOrEqual(0);
      }

      // 名前順（降順）の確認
      for (let i = 0; i < sortedDesc.length - 1; i++) {
        expect(
          sortedDesc[i].name.localeCompare(sortedDesc[i + 1].name),
        ).toBeGreaterThanOrEqual(0);
      }
    });

    it("複数条件での並べ替えを処理する", () => {
      // 同じスコアの製品を追加してテスト
      const productsWithSameScore = [
        ...mockProducts,
        {
          ...mockProducts[0],
          id: "p4",
          name: "アイブプロフェン錠D",
          totalScore: 85, // 同じスコア
          price: 900,
        },
      ];

      const sorted = sortProducts(productsWithSameScore, {
        field: "score",
        direction: "desc",
      });

      // スコアが同じ場合の並び順を確認
      const sameScoreProducts = sorted.filter((p) => p.totalScore === 85);
      expect(sameScoreProducts).toHaveLength(2);
    });
  });

  describe("警告分析統合テスト", () => {
    it("警告分析が正確である", () => {
      const analysis = analyzeProductWarnings(mockProducts);

      expect(analysis.totalWarnings).toBe(2);
      expect(analysis.criticalWarnings).toHaveLength(1);
      expect(analysis.mostImportantWarning?.severity).toBe(9);
      expect(analysis.mostImportantWarning?.type).toBe("critical");
    });

    it("最重要警告を正しく特定する", () => {
      const analysis = analyzeProductWarnings(mockProducts);

      expect(analysis.mostImportantWarning).toBeDefined();
      expect(analysis.mostImportantWarning?.id).toBe("w2");
      expect(analysis.mostImportantWarning?.message).toBe(
        "妊娠中の使用は避けてください",
      );
    });

    it("警告カテゴリ分類が適切である", () => {
      const analysis = analyzeProductWarnings(mockProducts);

      expect(analysis.warningsByCategory).toBeDefined();
      expect(analysis.warningsByCategory.pregnancy).toHaveLength(1);
      expect(analysis.warningsByCategory.medication).toHaveLength(1);
    });

    it("製品別警告分類が正確である", () => {
      const analysis = analyzeProductWarnings(mockProducts);

      expect(analysis.warningsByProduct.p1).toHaveLength(1);
      expect(analysis.warningsByProduct.p2).toHaveLength(1);
      expect(analysis.warningsByProduct.p3).toHaveLength(0);
    });
  });

  describe("スコア要約統合テスト", () => {
    it("スコア要約を正しく計算する", () => {
      const summary = calculateScoreSummary(mockProducts);

      expect(summary.effectiveness).toBeDefined();
      expect(summary.safety).toBeDefined();
      expect(summary.convenience).toBeDefined();
      expect(summary.costEffectiveness).toBeDefined();
    });

    it("最高・最低スコアを適切に計算する", () => {
      const summary = calculateScoreSummary(mockProducts);

      // 効果スコア
      expect(summary.effectiveness.maxScore).toBe(95);
      expect(summary.effectiveness.minScore).toBe(70);
      expect(summary.effectiveness.averageScore).toBeCloseTo(85);

      // 安全性スコア
      expect(summary.safety.maxScore).toBe(95);
      expect(summary.safety.minScore).toBe(80);
      expect(summary.safety.averageScore).toBeCloseTo(86.67, 1);

      // 利便性スコア
      expect(summary.convenience.maxScore).toBe(95);
      expect(summary.convenience.minScore).toBe(70);
      expect(summary.convenience.averageScore).toBeCloseTo(83.33, 1);

      // コスト効果スコア
      expect(summary.costEffectiveness.maxScore).toBe(90);
      expect(summary.costEffectiveness.minScore).toBe(75);
      expect(summary.costEffectiveness.averageScore).toBeCloseTo(83.33, 1);
    });

    it("製品別スコア情報を含む", () => {
      const summary = calculateScoreSummary(mockProducts);

      summary.effectiveness.products.forEach((productScore) => {
        expect(productScore.productId).toBeDefined();
        expect(productScore.score).toBeGreaterThanOrEqual(0);
        expect(productScore.score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe("統合データフロー", () => {
    it("全ての関数が連携して正常に動作する", () => {
      // 1. 比較データ処理
      const comparisonResult = compareProducts(mockProducts);
      expect(comparisonResult.products).toHaveLength(3);

      // 2. ソート処理
      const sortedProducts = sortProducts(comparisonResult.products, {
        field: "score",
        direction: "desc",
      });
      expect(sortedProducts[0].totalScore).toBe(95);

      // 3. 警告分析
      const warningAnalysis = analyzeProductWarnings(sortedProducts);
      expect(warningAnalysis.totalWarnings).toBe(2);

      // 4. スコア要約
      const scoreSummary = calculateScoreSummary(sortedProducts);
      expect(Object.keys(scoreSummary)).toContain("effectiveness");

      // 5. 推奨製品
      const bestScoreProduct = sortedProducts[0];
      const leastWarningsProduct = sortedProducts.find(
        (p) => p.warnings.length === 0,
      );

      expect(bestScoreProduct.id).toBe("p3");
      expect(leastWarningsProduct?.id).toBe("p3");
    });

    it("エラーハンドリングが適切に動作する", () => {
      // 空の配列
      expect(() => compareProducts([])).not.toThrow();
      expect(() =>
        sortProducts([], { field: "score", direction: "desc" }),
      ).not.toThrow();
      expect(() => analyzeProductWarnings([])).not.toThrow();
      expect(() => calculateScoreSummary([])).not.toThrow();

      // 不正なデータ
      const invalidProducts = [null, undefined, { id: "invalid" }] as any;

      expect(() => compareProducts(invalidProducts)).not.toThrow();
      expect(() => analyzeProductWarnings(invalidProducts)).not.toThrow();
      expect(() => calculateScoreSummary(invalidProducts)).not.toThrow();
    });

    it("パフォーマンスが要件を満たす", () => {
      const startTime = performance.now();

      // 全ての処理を実行
      const comparisonResult = compareProducts(mockProducts);
      const sortedProducts = sortProducts(comparisonResult.products, {
        field: "score",
        direction: "desc",
      });
      const warningAnalysis = analyzeProductWarnings(sortedProducts);
      const scoreSummary = calculateScoreSummary(sortedProducts);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // 全体処理時間が50ms以下
      expect(totalTime).toBeLessThan(50);

      // 結果の整合性確認
      expect(sortedProducts).toHaveLength(3);
      expect(warningAnalysis.totalWarnings).toBe(2);
      expect(Object.keys(scoreSummary)).toHaveLength(4);
    });

    it("大量データでもスケールする", () => {
      const largeDataSet = Array.from({ length: 100 }, (_, i) => ({
        ...mockProducts[0],
        id: `large-p${i}`,
        name: `Large Product ${i}`,
        price: 1000 + i * 10,
        totalScore: 50 + (i % 50),
        scoreBreakdown: {
          effectiveness: 50 + (i % 50),
          safety: 60 + (i % 40),
          convenience: 70 + (i % 30),
          costEffectiveness: 80 + (i % 20),
        },
        warnings:
          i % 10 === 0
            ? [
                {
                  id: `w${i}`,
                  type: "warning",
                  category: "general",
                  message: `Warning for product ${i}`,
                  severity: 5,
                  productId: `large-p${i}`,
                },
              ]
            : [],
      }));

      const startTime = performance.now();

      const comparisonResult = compareProducts(largeDataSet);
      const sortedProducts = sortProducts(comparisonResult.products, {
        field: "score",
        direction: "desc",
      });
      const warningAnalysis = analyzeProductWarnings(sortedProducts);
      const scoreSummary = calculateScoreSummary(sortedProducts);

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // 大量データでも処理時間が500ms以下
      expect(processingTime).toBeLessThan(500);

      // 結果の整合性確認
      expect(sortedProducts).toHaveLength(100);
      expect(warningAnalysis.totalWarnings).toBe(10);
      expect(Object.keys(scoreSummary)).toHaveLength(4);
    });
  });

  describe("型安全性とデータ整合性", () => {
    it("TypeScript型チェックが正常に動作する", () => {
      // 型安全性の確認（コンパイル時チェック）
      const validSortConfig: SortConfig = {
        field: "score",
        direction: "desc",
      };

      expect(validSortConfig.field).toBe("score");
      expect(validSortConfig.direction).toBe("desc");

      // 不正な型は TypeScript コンパイル時にエラーになる
      // const invalidSortConfig: SortConfig = {
      //   field: 'invalid', // Type error
      //   direction: 'invalid' // Type error
      // };
    });

    it("データ整合性が保たれる", () => {
      const result = compareProducts(mockProducts);

      // 製品数の整合性
      expect(result.products).toHaveLength(mockProducts.length);

      // スコア要約の整合性
      Object.values(result.scoreSummary).forEach((summary) => {
        expect(summary.products).toHaveLength(mockProducts.length);
        expect(summary.maxScore).toBeGreaterThanOrEqual(summary.minScore);
        expect(summary.averageScore).toBeGreaterThanOrEqual(summary.minScore);
        expect(summary.averageScore).toBeLessThanOrEqual(summary.maxScore);
      });

      // 警告分析の整合性
      const totalWarningsFromProducts = mockProducts.reduce(
        (total, product) => total + product.warnings.length,
        0,
      );
      expect(result.warningAnalysis.totalWarnings).toBe(
        totalWarningsFromProducts,
      );
    });

    it("不変性が保たれる", () => {
      const originalProducts = [...mockProducts];

      // 各関数が元のデータを変更しないことを確認
      compareProducts(mockProducts);
      expect(mockProducts).toEqual(originalProducts);

      sortProducts(mockProducts, { field: "score", direction: "desc" });
      expect(mockProducts).toEqual(originalProducts);

      analyzeProductWarnings(mockProducts);
      expect(mockProducts).toEqual(originalProducts);

      calculateScoreSummary(mockProducts);
      expect(mockProducts).toEqual(originalProducts);
    });
  });
});
