import { describe, it, expect } from "vitest";
import {
  calculateEffectiveCostPerDay,
  calculateNormalizedCostPerMgPerDay,
  calculateProductCosts,
  formatCostJPY,
  formatCostPerMg,
} from "../cost";

describe("Cost Calculations", () => {
  describe("calculateEffectiveCostPerDay", () => {
    it("正常な商品データで正しく計算する", () => {
      const product = {
        priceJPY: 3000,
        servingsPerContainer: 60,
        servingsPerDay: 2,
      };

      const result = calculateEffectiveCostPerDay(product);
      expect(result).toBe(100); // (3000 / 60) * 2 = 100
    });

    it("価格が無効な場合エラーを投げる", () => {
      const product = {
        priceJPY: NaN,
        servingsPerContainer: 60,
        servingsPerDay: 2,
      };

      expect(() => calculateEffectiveCostPerDay(product)).toThrow(
        "価格が無効です",
      );
    });

    it("容量が0の場合エラーを投げる", () => {
      const product = {
        priceJPY: 3000,
        servingsPerContainer: 0,
        servingsPerDay: 2,
      };

      expect(() => calculateEffectiveCostPerDay(product)).toThrow(
        "容量は0より大きい必要があります",
      );
    });

    it("負の価格の場合エラーを投げる", () => {
      const product = {
        priceJPY: -1000,
        servingsPerContainer: 60,
        servingsPerDay: 2,
      };

      expect(() => calculateEffectiveCostPerDay(product)).toThrow(
        "価格は0以上である必要があります",
      );
    });

    it("1日摂取量が0以下の場合エラーを投げる", () => {
      const product = {
        priceJPY: 3000,
        servingsPerContainer: 60,
        servingsPerDay: 0,
      };

      expect(() => calculateEffectiveCostPerDay(product)).toThrow(
        "1日摂取量は0より大きい必要があります",
      );
    });
  });

  describe("calculateNormalizedCostPerMgPerDay", () => {
    it("複数成分の商品で正しく計算する", () => {
      const product = {
        priceJPY: 3000,
        servingsPerContainer: 60,
        servingsPerDay: 2,
        ingredients: [{ amountMgPerServing: 500 }, { amountMgPerServing: 300 }],
      };

      const result = calculateNormalizedCostPerMgPerDay(product);
      // effectiveCostPerDay = 100, totalMgPerDay = (500 + 300) * 2 = 1600
      expect(result).toBe(100 / 1600); // 0.0625
    });

    it("成分が空配列の場合エラーを投げる", () => {
      const product = {
        priceJPY: 3000,
        servingsPerContainer: 60,
        servingsPerDay: 2,
        ingredients: [],
      };

      expect(() => calculateNormalizedCostPerMgPerDay(product)).toThrow(
        "No ingredients data available",
      );
    });

    it("totalMgPerDayが0の場合エラーを投げる", () => {
      const product = {
        priceJPY: 3000,
        servingsPerContainer: 60,
        servingsPerDay: 2,
        ingredients: [{ amountMgPerServing: 0 }],
      };

      expect(() => calculateNormalizedCostPerMgPerDay(product)).toThrow(
        "Total mg per day must be greater than 0",
      );
    });
  });

  describe("calculateProductCosts", () => {
    it("正常なデータで完全な結果を返す", () => {
      const product = {
        priceJPY: 3000,
        servingsPerContainer: 60,
        servingsPerDay: 2,
        ingredients: [{ amountMgPerServing: 500 }],
      };

      const result = calculateProductCosts(product);

      expect(result.isCalculable).toBe(true);
      expect(result.effectiveCostPerDay).toBe(100);
      expect(result.normalizedCostPerMgPerDay).toBe(0.1); // 100 / (500 * 2)
      expect(result.totalMgPerDay).toBe(1000);
      expect(result.error).toBeUndefined();
    });

    it("エラー時にisCalculable: falseを返す", () => {
      const product = {
        priceJPY: -1000, // Invalid price
        servingsPerContainer: 60,
        servingsPerDay: 2,
      };

      const result = calculateProductCosts(product);

      expect(result.isCalculable).toBe(false);
      expect(result.effectiveCostPerDay).toBe(0);
      expect(result.error).toBeDefined();
    });

    it("成分データなしでも基本計算は成功する", () => {
      const product = {
        priceJPY: 3000,
        servingsPerContainer: 60,
        servingsPerDay: 2,
        // ingredients not provided
      };

      const result = calculateProductCosts(product);

      expect(result.isCalculable).toBe(true);
      expect(result.effectiveCostPerDay).toBe(100);
      expect(result.normalizedCostPerMgPerDay).toBeUndefined();
      expect(result.totalMgPerDay).toBeUndefined();
    });
  });

  describe("formatCostJPY", () => {
    it("日本円形式で正しくフォーマットする", () => {
      expect(formatCostJPY(1000)).toBe("￥1,000");
      expect(formatCostJPY(1234.56)).toBe("￥1,235"); // Rounded
      expect(formatCostJPY(0)).toBe("￥0");
    });
  });

  describe("formatCostPerMg", () => {
    it("小数点2桁で正しくフォーマットする", () => {
      expect(formatCostPerMg(0.12345)).toBe("￥0.12");
      expect(formatCostPerMg(1.5)).toBe("￥1.50");
      expect(formatCostPerMg(0)).toBe("￥0.00");
    });
  });
});
