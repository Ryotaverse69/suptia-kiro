import { describe, it, expect } from "vitest";
import {
  checkTextSimple,
  suggestAlternatives,
  generateSampleDescription,
  type ComplianceViolation,
} from "../compliance-simple";

describe("Simple Compliance Checker", () => {
  describe("checkTextSimple", () => {
    it("違反がないテキストで正しい結果を返す", () => {
      const cleanTexts = [
        "ビタミンDは健康維持をサポートします",
        "科学的根拠に基づいて開発された製品です",
        "毎日の栄養バランスを整えましょう",
        "高品質なサプリメントです",
      ];

      cleanTexts.forEach((text) => {
        const result = checkTextSimple(text);
        expect(result.hasViolations).toBe(false);
        expect(result.violations).toHaveLength(0);
      });
    });

    it("「完治」パターンの違反を検出する", () => {
      const violatingTexts = [
        "完治を目指しましょう",
        "この薬で完治できます",
        "完治への道のり",
      ];

      violatingTexts.forEach((text) => {
        const result = checkTextSimple(text);
        expect(result.hasViolations).toBe(true);
        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].originalText).toBe("完治");
        expect(result.violations[0].suggestedText).toBe("改善が期待される");
        expect(result.violations[0].pattern).toBe("完治");
      });
    });

    it("「即効|速攻」パターンの違反を検出する", () => {
      const testCases = [
        { text: "即効性があります", expected: "即効" },
        { text: "速攻で効果が現れます", expected: "速攻" },
        { text: "即効で痩せる", expected: "即効" },
        { text: "速攻効果", expected: "速攻" },
      ];

      testCases.forEach(({ text, expected }) => {
        const result = checkTextSimple(text);
        expect(result.hasViolations).toBe(true);
        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].originalText).toBe(expected);
        expect(result.violations[0].suggestedText).toBe(
          "短期間での変化が報告されている",
        );
        expect(result.violations[0].pattern).toBe("即効|速攻");
      });
    });

    it("「必ず痩せる」パターンの違反を検出する", () => {
      const violatingTexts = [
        "必ず痩せる効果",
        "このサプリで必ず痩せる",
        "必ず痩せることができます",
      ];

      violatingTexts.forEach((text) => {
        const result = checkTextSimple(text);
        expect(result.hasViolations).toBe(true);
        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].originalText).toBe("必ず痩せる");
        expect(result.violations[0].suggestedText).toBe(
          "体重管理をサポートする可能性",
        );
        expect(result.violations[0].pattern).toBe("必ず痩せる");
      });
    });

    it("複数の違反を検出する", () => {
      const text = "この薬は即効性があり、必ず痩せる効果で完治を目指せます";
      const result = checkTextSimple(text);

      expect(result.hasViolations).toBe(true);
      expect(result.violations).toHaveLength(3);

      const violationTexts = result.violations.map((v) => v.originalText);
      expect(violationTexts).toContain("即効");
      expect(violationTexts).toContain("必ず痩せる");
      expect(violationTexts).toContain("完治");
    });

    it("空文字列や無効な入力を適切に処理する", () => {
      const invalidInputs = [
        "",
        null as any,
        undefined as any,
        123 as any,
        {} as any,
        [] as any,
      ];

      invalidInputs.forEach((input) => {
        const result = checkTextSimple(input);
        expect(result.hasViolations).toBe(false);
        expect(result.violations).toHaveLength(0);
      });
    });
  });

  describe("suggestAlternatives", () => {
    it("違反に対する代替案を提供する", () => {
      const violations: ComplianceViolation[] = [
        {
          originalText: "完治",
          suggestedText: "改善が期待される",
          pattern: "完治"
        },
        {
          originalText: "即効",
          suggestedText: "短期間での変化が報告されている",
          pattern: "即効|速攻"
        }
      ];

      const alternatives = suggestAlternatives(violations);
      expect(alternatives).toHaveLength(2);
      expect(alternatives[0]).toBe("改善が期待される");
      expect(alternatives[1]).toBe("短期間での変化が報告されている");
    });

    it("空の違反配列に対して空の配列を返す", () => {
      const alternatives = suggestAlternatives([]);
      expect(alternatives).toHaveLength(0);
    });
  });

  describe("generateSampleDescription", () => {
    it("製品名を含む説明文を生成する", () => {
      const productNames = [
        "ビタミンD3",
        "オメガ3",
        "マグネシウム",
        "プロテイン",
      ];

      productNames.forEach((productName) => {
        const description = generateSampleDescription(productName);
        expect(typeof description).toBe("string");
        expect(description.length).toBeGreaterThan(0);
        expect(description).toContain(productName);
      });
    });

    it("空の製品名でも動作する", () => {
      const description = generateSampleDescription("");
      expect(typeof description).toBe("string");
      expect(description.length).toBeGreaterThan(0);
    });
  });
});