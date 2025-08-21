import { describe, it, expect } from "vitest";
import {
  WarningAnalyzer,
  analyzeProductWarnings,
  findMostImportantWarning,
  groupWarningsByCategory,
  calculateWarningSeverityScore,
  type Warning,
  type Product,
} from "../warning-analyzer";

describe("WarningAnalyzer", () => {
  const mockWarnings: Warning[] = [
    {
      id: "w1",
      type: "critical",
      category: "pregnancy",
      message: "妊娠中の使用は避けてください",
      severity: 9,
      productId: "p1",
    },
    {
      id: "w2",
      type: "warning",
      category: "medication",
      message: "薬物相互作用の可能性があります",
      severity: 6,
      productId: "p1",
    },
    {
      id: "w3",
      type: "info",
      category: "elderly",
      message: "高齢者は注意が必要です",
      severity: 3,
      productId: "p2",
    },
    {
      id: "w4",
      type: "critical",
      category: "lactation",
      message: "授乳中の使用は医師に相談してください",
      severity: 8,
      productId: "p2",
    },
  ];

  const mockProducts: Product[] = [
    {
      id: "p1",
      name: "Product A",
      warnings: [mockWarnings[0], mockWarnings[1]],
    },
    {
      id: "p2",
      name: "Product B",
      warnings: [mockWarnings[2], mockWarnings[3]],
    },
    {
      id: "p3",
      name: "Product C",
      warnings: [],
    },
  ];

  describe("analyzeWarnings", () => {
    it("製品リストの警告を正しく分析する", () => {
      const analyzer = new WarningAnalyzer();
      const result = analyzer.analyzeWarnings(mockProducts);

      expect(result.totalWarnings).toBe(4);
      expect(result.criticalWarnings).toHaveLength(2);
      expect(result.mostImportantWarning?.id).toBe("w1"); // severity 9が最高
      expect(result.severitySummary).toEqual({
        critical: 2,
        warning: 1,
        info: 1,
      });
    });

    it("警告がない場合を正しく処理する", () => {
      const analyzer = new WarningAnalyzer();
      const result = analyzer.analyzeWarnings([
        { id: "p1", name: "Product A", warnings: [] },
      ]);

      expect(result.totalWarnings).toBe(0);
      expect(result.criticalWarnings).toHaveLength(0);
      expect(result.mostImportantWarning).toBeUndefined();
      expect(result.severitySummary).toEqual({
        critical: 0,
        warning: 0,
        info: 0,
      });
    });

    it("製品別に警告をグループ化する", () => {
      const analyzer = new WarningAnalyzer();
      const result = analyzer.analyzeWarnings(mockProducts);

      expect(result.warningsByProduct["p1"]).toHaveLength(2);
      expect(result.warningsByProduct["p2"]).toHaveLength(2);
      expect(result.warningsByProduct["p3"]).toHaveLength(0);
    });

    it("カテゴリ別に警告をグループ化する", () => {
      const analyzer = new WarningAnalyzer();
      const result = analyzer.analyzeWarnings(mockProducts);

      expect(result.warningsByCategory["pregnancy"]).toHaveLength(1);
      expect(result.warningsByCategory["medication"]).toHaveLength(1);
      expect(result.warningsByCategory["elderly"]).toHaveLength(1);
      expect(result.warningsByCategory["lactation"]).toHaveLength(1);
    });
  });

  describe("findMostImportantWarning", () => {
    it("最も重要度の高い警告を特定する", () => {
      const analyzer = new WarningAnalyzer();
      const result = analyzer.findMostImportantWarning(mockWarnings);

      expect(result?.id).toBe("w1"); // severity 9が最高
      expect(result?.severity).toBe(9);
    });

    it("重要度が同じ場合はタイプで判定する", () => {
      const sameSevrityWarnings: Warning[] = [
        {
          id: "w1",
          type: "warning",
          category: "test",
          message: "Warning message",
          severity: 5,
          productId: "p1",
        },
        {
          id: "w2",
          type: "critical",
          category: "test",
          message: "Critical message",
          severity: 5,
          productId: "p1",
        },
      ];

      const analyzer = new WarningAnalyzer();
      const result = analyzer.findMostImportantWarning(sameSevrityWarnings);

      expect(result?.id).toBe("w2"); // criticalが優先
      expect(result?.type).toBe("critical");
    });

    it("警告がない場合はundefinedを返す", () => {
      const analyzer = new WarningAnalyzer();
      const result = analyzer.findMostImportantWarning([]);

      expect(result).toBeUndefined();
    });
  });

  describe("groupWarningsByCategory", () => {
    it("警告をカテゴリ別に正しくグループ化する", () => {
      const analyzer = new WarningAnalyzer();
      const result = analyzer.groupWarningsByCategory(mockWarnings);

      expect(Object.keys(result)).toHaveLength(4);
      expect(result["pregnancy"]).toHaveLength(1);
      expect(result["medication"]).toHaveLength(1);
      expect(result["elderly"]).toHaveLength(1);
      expect(result["lactation"]).toHaveLength(1);
    });

    it("同じカテゴリの警告を正しくグループ化する", () => {
      const sameCategory: Warning[] = [
        { ...mockWarnings[0], category: "pregnancy" },
        { ...mockWarnings[1], category: "pregnancy" },
      ];

      const analyzer = new WarningAnalyzer();
      const result = analyzer.groupWarningsByCategory(sameCategory);

      expect(result["pregnancy"]).toHaveLength(2);
    });
  });

  describe("calculateWarningSeverityScore", () => {
    it("警告の重要度スコアを正しく計算する", () => {
      const analyzer = new WarningAnalyzer();
      const score = analyzer.calculateWarningSeverityScore(mockWarnings);

      // critical: 9*3 + 8*3 = 51, warning: 6*2 = 12, info: 3*1 = 3
      // 合計: 66, 平均: 66/4 = 16.5 → 17
      expect(score).toBe(17);
    });

    it("警告がない場合は0を返す", () => {
      const analyzer = new WarningAnalyzer();
      const score = analyzer.calculateWarningSeverityScore([]);

      expect(score).toBe(0);
    });

    it("単一の警告の場合は正しく計算する", () => {
      const analyzer = new WarningAnalyzer();
      const score = analyzer.calculateWarningSeverityScore([mockWarnings[0]]);

      // critical: 9*3 = 27
      expect(score).toBe(27);
    });
  });

  describe("compareWarningsBetweenProducts", () => {
    it("製品間の警告比較情報を生成する", () => {
      const analyzer = new WarningAnalyzer();
      const result = analyzer.compareWarningsBetweenProducts(mockProducts);

      expect(result.warningCounts["p1"]).toBe(2);
      expect(result.warningCounts["p2"]).toBe(2);
      expect(result.warningCounts["p3"]).toBe(0);
      expect(result.safestProduct?.id).toBe("p3"); // 警告0件
    });

    it("製品がない場合を正しく処理する", () => {
      const analyzer = new WarningAnalyzer();
      const result = analyzer.compareWarningsBetweenProducts([]);

      expect(result.warningCounts).toEqual({});
      expect(result.safestProduct).toBeUndefined();
      expect(result.riskiestProduct).toBeUndefined();
    });

    it("全製品の警告数が同じ場合を処理する", () => {
      const sameWarningProducts: Product[] = [
        { id: "p1", name: "Product A", warnings: [mockWarnings[0]] },
        { id: "p2", name: "Product B", warnings: [mockWarnings[1]] },
      ];

      const analyzer = new WarningAnalyzer();
      const result =
        analyzer.compareWarningsBetweenProducts(sameWarningProducts);

      expect(result.safestProduct).toBeUndefined();
      expect(result.riskiestProduct).toBeUndefined();
    });
  });
});

describe("ヘルパー関数", () => {
  const mockProducts: Product[] = [
    {
      id: "p1",
      name: "Product A",
      warnings: [
        {
          id: "w1",
          type: "critical",
          category: "pregnancy",
          message: "妊娠中の使用は避けてください",
          severity: 9,
          productId: "p1",
        },
      ],
    },
  ];

  it("analyzeProductWarnings が正しく動作する", () => {
    const result = analyzeProductWarnings(mockProducts);
    expect(result.totalWarnings).toBe(1);
    expect(result.mostImportantWarning?.id).toBe("w1");
  });

  it("findMostImportantWarning が正しく動作する", () => {
    const warnings = mockProducts[0].warnings;
    const result = findMostImportantWarning(warnings);
    expect(result?.id).toBe("w1");
  });

  it("groupWarningsByCategory が正しく動作する", () => {
    const warnings = mockProducts[0].warnings;
    const result = groupWarningsByCategory(warnings);
    expect(result["pregnancy"]).toHaveLength(1);
  });

  it("calculateWarningSeverityScore が正しく動作する", () => {
    const warnings = mockProducts[0].warnings;
    const result = calculateWarningSeverityScore(warnings);
    expect(result).toBe(27); // 9 * 3 (critical weight)
  });
});
