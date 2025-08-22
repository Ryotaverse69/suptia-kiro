import { describe, it, expect } from "vitest";
import {
  score,
  calculateEvidenceScore,
  calculateSafetyScore,
  calculateCostScore,
  calculatePracticalityScore,
  applyWeights,
  normalizeScore,
  validateWeights,
  DEFAULT_WEIGHTS,
  type Product,
  type ScoreWeights,
  type ScoreComponents,
} from "../scoring";

describe("Scoring System", () => {
  // Test data
  const completeProduct: Product = {
    ingredients: [
      { evidenceLevel: "A", studyCount: 15, studyQuality: 85 },
      { evidenceLevel: "B", studyCount: 8, studyQuality: 70 },
    ],
    sideEffectLevel: "low",
    interactionRisk: 20,
    contraindicationCount: 2,
    priceJPY: 3000,
    servingsPerContainer: 30,
    servingsPerDay: 2,
    form: "capsule",
    description: "High-quality supplement with proven ingredients",
  };

  const partialProduct: Product = {
    priceJPY: 2000,
    servingsPerContainer: 60,
    servingsPerDay: 1,
    form: "tablet",
  };

  describe("normalizeScore", () => {
    it("正常な範囲で正しく正規化する", () => {
      expect(normalizeScore(50, 0, 100)).toBe(50);
      expect(normalizeScore(0, 0, 100)).toBe(0);
      expect(normalizeScore(100, 0, 100)).toBe(100);
      expect(normalizeScore(25, 0, 50)).toBe(50);
    });

    it("境界値を正しく処理する", () => {
      expect(normalizeScore(-10, 0, 100)).toBe(0);
      expect(normalizeScore(150, 0, 100)).toBe(100);
      expect(normalizeScore(Infinity, 0, 100)).toBe(0);
      expect(normalizeScore(NaN, 0, 100)).toBe(0);
    });

    it("無効な範囲でエラーを投げる", () => {
      expect(() => normalizeScore(50, 100, 0)).toThrow("Invalid range");
      expect(() => normalizeScore(50, 50, 50)).toThrow("Invalid range");
    });
  });

  describe("validateWeights", () => {
    it("有効な重みを受け入れる", () => {
      expect(() => validateWeights(DEFAULT_WEIGHTS)).not.toThrow();
      expect(() =>
        validateWeights({
          evidence: 0.25,
          safety: 0.25,
          cost: 0.25,
          practicality: 0.25,
        }),
      ).not.toThrow();
    });

    it("重み合計が1.0でない場合エラーを投げる", () => {
      expect(() =>
        validateWeights({
          evidence: 0.4,
          safety: 0.3,
          cost: 0.2,
          practicality: 0.2, // sum = 1.1
        }),
      ).toThrow("Weight sum must equal 1.0");
    });

    it("負の重みでエラーを投げる", () => {
      expect(() =>
        validateWeights({
          evidence: -0.1,
          safety: 0.4,
          cost: 0.4,
          practicality: 0.3,
        }),
      ).toThrow("Weight evidence must be between 0 and 1");
    });

    it("1を超える重みでエラーを投げる", () => {
      expect(() =>
        validateWeights({
          evidence: 1.5,
          safety: 0,
          cost: 0,
          practicality: -0.5,
        }),
      ).toThrow("Weight evidence must be between 0 and 1");
    });
  });

  describe("applyWeights", () => {
    const components: ScoreComponents = {
      evidence: 80,
      safety: 70,
      cost: 60,
      practicality: 90,
    };

    it("デフォルト重みで正しく計算する", () => {
      const result = applyWeights(components, DEFAULT_WEIGHTS);
      const expected = 80 * 0.35 + 70 * 0.3 + 60 * 0.2 + 90 * 0.15;
      expect(result).toBe(Math.round(expected * 10) / 10);
    });

    it("カスタム重みで正しく計算する", () => {
      const customWeights: ScoreWeights = {
        evidence: 0.5,
        safety: 0.3,
        cost: 0.1,
        practicality: 0.1,
      };
      const result = applyWeights(components, customWeights);
      const expected = 80 * 0.5 + 70 * 0.3 + 60 * 0.1 + 90 * 0.1;
      expect(result).toBe(Math.round(expected * 10) / 10);
    });

    it("無効な重みでエラーを投げる", () => {
      const invalidWeights: ScoreWeights = {
        evidence: 0.6,
        safety: 0.3,
        cost: 0.2,
        practicality: 0.1, // sum = 1.2
      };
      expect(() => applyWeights(components, invalidWeights)).toThrow();
    });
  });

  describe("calculateEvidenceScore", () => {
    it("完全なエビデンスデータで正しく計算する", () => {
      const result = calculateEvidenceScore(completeProduct);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.factors).toHaveLength(3);
      expect(result.explanation).toContain("エビデンス");
    });

    it("エビデンスレベルA/B/Cで適切なスコアを計算する", () => {
      const productA: Product = {
        ingredients: [{ evidenceLevel: "A" }],
        priceJPY: 1000,
        servingsPerContainer: 30,
        servingsPerDay: 1,
      };
      const productB: Product = {
        ingredients: [{ evidenceLevel: "B" }],
        priceJPY: 1000,
        servingsPerContainer: 30,
        servingsPerDay: 1,
      };
      const productC: Product = {
        ingredients: [{ evidenceLevel: "C" }],
        priceJPY: 1000,
        servingsPerContainer: 30,
        servingsPerDay: 1,
      };

      const scoreA = calculateEvidenceScore(productA);
      const scoreB = calculateEvidenceScore(productB);
      const scoreC = calculateEvidenceScore(productC);

      expect(scoreA.score).toBeGreaterThan(scoreB.score);
      expect(scoreB.score).toBeGreaterThan(scoreC.score);
    });

    it("データ不足時にフォールバック値を使用する", () => {
      const emptyProduct: Product = {
        priceJPY: 1000,
        servingsPerContainer: 30,
        servingsPerDay: 1,
      };
      const result = calculateEvidenceScore(emptyProduct);
      expect(result.score).toBe(50);
      expect(result.factors[0].name).toBe("データ不足");
    });
  });

  describe("calculateSafetyScore", () => {
    it("完全な安全性データで正しく計算する", () => {
      const result = calculateSafetyScore(completeProduct);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.factors.length).toBeGreaterThan(0);
      expect(result.explanation).toContain("安全性");
    });

    it("副作用リスクを正しく評価する", () => {
      const products = [
        { ...partialProduct, sideEffectLevel: "none" as const },
        { ...partialProduct, sideEffectLevel: "low" as const },
        { ...partialProduct, sideEffectLevel: "mid" as const },
        { ...partialProduct, sideEffectLevel: "high" as const },
      ];

      const scores = products.map((p) => calculateSafetyScore(p).score);

      // none > low > mid > high の順序を確認
      expect(scores[0]).toBeGreaterThan(scores[1]);
      expect(scores[1]).toBeGreaterThan(scores[2]);
      expect(scores[2]).toBeGreaterThan(scores[3]);
    });

    it("データ不足時に保守的な評価を使用する", () => {
      const emptyProduct: Product = {
        priceJPY: 1000,
        servingsPerContainer: 30,
        servingsPerDay: 1,
      };
      const result = calculateSafetyScore(emptyProduct);
      expect(result.score).toBe(75); // Conservative default
      expect(result.factors[0].name).toBe("データ不足");
    });
  });

  describe("calculateCostScore", () => {
    it("コスト計算を正しく実行する", () => {
      const result = calculateCostScore(completeProduct);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.factors).toHaveLength(1);
      expect(result.explanation).toContain("コスト");
    });

    it("安い商品ほど高いスコアを付ける", () => {
      const expensiveProduct: Product = {
        priceJPY: 10000,
        servingsPerContainer: 30,
        servingsPerDay: 1,
      };
      const cheapProduct: Product = {
        priceJPY: 1000,
        servingsPerContainer: 30,
        servingsPerDay: 1,
      };

      const expensiveScore = calculateCostScore(expensiveProduct);
      const cheapScore = calculateCostScore(cheapProduct);

      expect(cheapScore.score).toBeGreaterThan(expensiveScore.score);
    });
  });

  describe("calculatePracticalityScore", () => {
    it("実用性計算を正しく実行する", () => {
      const result = calculatePracticalityScore(completeProduct);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.factors).toHaveLength(3);
      expect(result.explanation).toContain("実用性");
    });

    it("摂取頻度を正しく評価する", () => {
      const onceDaily: Product = { ...partialProduct, servingsPerDay: 1 };
      const twiceDaily: Product = { ...partialProduct, servingsPerDay: 2 };
      const thriceDaily: Product = { ...partialProduct, servingsPerDay: 3 };

      const scores = [onceDaily, twiceDaily, thriceDaily].map(
        (p) => calculatePracticalityScore(p).score,
      );

      // 1日1回 > 1日2回 > 1日3回 の順序を確認
      expect(scores[0]).toBeGreaterThan(scores[1]);
      expect(scores[1]).toBeGreaterThan(scores[2]);
    });

    it("剤形を適切にスコア化する", () => {
      const capsule: Product = { ...partialProduct, form: "capsule" };
      const tablet: Product = { ...partialProduct, form: "tablet" };
      const powder: Product = { ...partialProduct, form: "powder" };

      const capsuleScore = calculatePracticalityScore(capsule).score;
      const tabletScore = calculatePracticalityScore(tablet).score;
      const powderScore = calculatePracticalityScore(powder).score;

      expect(capsuleScore).toBeGreaterThan(tabletScore);
      expect(tabletScore).toBeGreaterThan(powderScore);
    });
  });

  describe("score (main function)", () => {
    it("完全なデータで総合スコアを計算する", () => {
      const result = score(completeProduct);

      expect(result.total).toBeGreaterThan(0);
      expect(result.total).toBeLessThanOrEqual(100);
      expect(result.components.evidence).toBeGreaterThan(0);
      expect(result.components.safety).toBeGreaterThan(0);
      expect(result.components.cost).toBeGreaterThan(0);
      expect(result.components.practicality).toBeGreaterThan(0);
      expect(result.weights).toEqual(DEFAULT_WEIGHTS);
      expect(result.breakdown.evidence).toBeDefined();
      expect(result.breakdown.safety).toBeDefined();
      expect(result.breakdown.cost).toBeDefined();
      expect(result.breakdown.practicality).toBeDefined();
    });

    it("部分的なデータで適切にスコアを調整する", () => {
      const result = score(partialProduct);

      expect(result.total).toBeGreaterThan(0);
      expect(result.total).toBeLessThanOrEqual(100);
      expect(result.isComplete).toBe(false);
      expect(result.missingData.length).toBeGreaterThan(0);
    });

    it("カスタム重みで正しく計算する", () => {
      const customWeights: ScoreWeights = {
        evidence: 0.5,
        safety: 0.3,
        cost: 0.1,
        practicality: 0.1,
      };

      const result = score(completeProduct, customWeights);
      expect(result.weights).toEqual(customWeights);
      expect(result.total).toBeGreaterThan(0);
      expect(result.total).toBeLessThanOrEqual(100);
    });

    it("エラー時にフォールバック値を使用する", () => {
      const invalidWeights: ScoreWeights = {
        evidence: 0.6,
        safety: 0.3,
        cost: 0.2,
        practicality: 0.1, // sum = 1.2
      };

      const result = score(completeProduct, invalidWeights);
      expect(result.total).toBe(50);
      expect(result.components.evidence).toBe(50);
      expect(result.components.safety).toBe(50);
      expect(result.components.cost).toBe(50);
      expect(result.components.practicality).toBe(50);
      expect(result.isComplete).toBe(false);
      expect(result.missingData).toContain("計算エラーが発生");
    });

    it("0.1刻み四捨五入で表示する", () => {
      const result = score(completeProduct);

      // Check that the total is rounded to 1 decimal place
      expect(result.total).toBe(Math.round(result.total * 10) / 10);

      // Check that component scores are also properly rounded
      expect(result.components.evidence).toBe(
        Math.round(result.components.evidence * 10) / 10,
      );
      expect(result.components.safety).toBe(
        Math.round(result.components.safety * 10) / 10,
      );
      expect(result.components.cost).toBe(
        Math.round(result.components.cost * 10) / 10,
      );
      expect(result.components.practicality).toBe(
        Math.round(result.components.practicality * 10) / 10,
      );
    });
  });

  describe("境界値テスト", () => {
    it("スコアが0-100の範囲内に収まる", () => {
      const extremeProduct: Product = {
        ingredients: [
          { evidenceLevel: "A", studyCount: 1000, studyQuality: 1000 },
        ],
        sideEffectLevel: "none",
        interactionRisk: -100,
        contraindicationCount: -10,
        priceJPY: -1000,
        servingsPerContainer: 1000,
        servingsPerDay: 0.1,
        form: "capsule",
      };

      const result = score(extremeProduct);

      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeLessThanOrEqual(100);
      expect(result.components.evidence).toBeGreaterThanOrEqual(0);
      expect(result.components.evidence).toBeLessThanOrEqual(100);
      expect(result.components.safety).toBeGreaterThanOrEqual(0);
      expect(result.components.safety).toBeLessThanOrEqual(100);
      expect(result.components.cost).toBeGreaterThanOrEqual(0);
      expect(result.components.cost).toBeLessThanOrEqual(100);
      expect(result.components.practicality).toBeGreaterThanOrEqual(0);
      expect(result.components.practicality).toBeLessThanOrEqual(100);
    });

    it("無効な数値を適切に処理する", () => {
      const invalidProduct: Product = {
        priceJPY: NaN,
        servingsPerContainer: Infinity,
        servingsPerDay: -Infinity,
        interactionRisk: NaN,
        contraindicationCount: Infinity,
      };

      const result = score(invalidProduct);

      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeLessThanOrEqual(100);
      expect(Number.isFinite(result.total)).toBe(true);
    });

    it("空のproductオブジェクトを処理する", () => {
      const emptyProduct: Product = {
        priceJPY: 0,
        servingsPerContainer: 0,
        servingsPerDay: 0,
      };

      const result = score(emptyProduct);

      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeLessThanOrEqual(100);
      expect(result.isComplete).toBe(false);
      expect(result.missingData.length).toBeGreaterThan(0);
    });
  });
});
