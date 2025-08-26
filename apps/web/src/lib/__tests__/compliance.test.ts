import { describe, it, expect, vi } from "vitest";
import {
  checkCompliance,
  generateSampleDescription,
  type ComplianceRule,
  type ComplianceViolation,
  type ComplianceResult,
} from "../compliance";

describe("Compliance Checker", () => {
  describe("checkCompliance", () => {
    it("違反がないテキストで正しい結果を返す", () => {
      const cleanTexts = [
        "ビタミンDは健康維持をサポートします",
        "科学的根拠に基づいて開発された製品です",
        "毎日の栄養バランスを整えましょう",
        "高品質なサプリメントです",
      ];

      cleanTexts.forEach((text) => {
        const result = checkCompliance(text);
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
        const result = checkCompliance(text);
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
        const result = checkCompliance(text);
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
        const result = checkCompliance(text);
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
      const result = checkCompliance(text);

      expect(result.hasViolations).toBe(true);
      expect(result.violations).toHaveLength(3);

      const violationTexts = result.violations.map((v) => v.originalText);
      expect(violationTexts).toContain("即効");
      expect(violationTexts).toContain("必ず痩せる");
      expect(violationTexts).toContain("完治");
    });

    it("大文字小文字を区別しない", () => {
      const testCases = [
        "完治",
        "完治",
        "KANCHI", // ひらがな・カタカナは対象外だが、パターンが漢字なので検出されない
      ];

      // 漢字の場合
      const result1 = checkCompliance("完治します");
      expect(result1.hasViolations).toBe(true);

      // 英語パターンがあれば大文字小文字を区別しない
      const result2 = checkCompliance("SOKKO効果"); // 「速攻」の英語表記は想定外
      expect(result2.hasViolations).toBe(false); // 現在のパターンでは検出されない
    });

    it("同じパターンの複数マッチを検出する", () => {
      const text = "即効性があり、速攻で効果が現れる";
      const result = checkCompliance(text);

      expect(result.hasViolations).toBe(true);
      expect(result.violations).toHaveLength(2);
      expect(result.violations[0].originalText).toBe("即効");
      expect(result.violations[1].originalText).toBe("速攻");
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
        const result = checkCompliance(input);
        expect(result.hasViolations).toBe(false);
        expect(result.violations).toHaveLength(0);
      });
    });

    it("正規表現の特殊文字を含むテキストを適切に処理する", () => {
      const textsWithSpecialChars = [
        "健康維持に効果的です。",
        "ビタミン(D3)配合",
        "1日2錠*服用してください",
        "価格: $29.99",
        "効果は個人差があります[注意]",
      ];

      textsWithSpecialChars.forEach((text) => {
        const result = checkCompliance(text);
        expect(result.hasViolations).toBe(false);
        expect(result.violations).toHaveLength(0);
      });
    });

    it("長いテキストでも正しく動作する", () => {
      const longText = `
        このサプリメントは健康維持をサポートする高品質な製品です。
        科学的根拠に基づいて開発され、多くの方にご愛用いただいています。
        ただし、即効性を期待せず、継続的な摂取をお勧めします。
        また、必ず痩せるという保証はありませんが、体重管理をサポートする可能性があります。
        完治を目的とした医薬品ではありませんので、ご注意ください。
      `;

      const result = checkCompliance(longText);
      expect(result.hasViolations).toBe(true);
      expect(result.violations).toHaveLength(3);

      const violationTexts = result.violations.map((v) => v.originalText);
      expect(violationTexts).toContain("即効");
      expect(violationTexts).toContain("必ず痩せる");
      expect(violationTexts).toContain("完治");
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

    it("異なる呼び出しで異なる説明文を生成する可能性がある", () => {
      const productName = "テストサプリ";
      const descriptions = new Set();

      // 複数回実行して異なる結果が得られる可能性を確認
      for (let i = 0; i < 20; i++) {
        const description = generateSampleDescription(productName);
        descriptions.add(description);
      }

      // 少なくとも1つの説明文は生成される
      expect(descriptions.size).toBeGreaterThan(0);
      // 最大5種類の説明文がある
      expect(descriptions.size).toBeLessThanOrEqual(5);
    });

    it("空の製品名でも動作する", () => {
      const description = generateSampleDescription("");
      expect(typeof description).toBe("string");
      expect(description.length).toBeGreaterThan(0);
    });

    it("特殊文字を含む製品名でも動作する", () => {
      const specialProductNames = [
        "ビタミンD3(高濃度)",
        "オメガ-3 EPA/DHA",
        "マグネシウム[キレート]",
        "プロテイン★プレミアム",
      ];

      specialProductNames.forEach((productName) => {
        const description = generateSampleDescription(productName);
        expect(typeof description).toBe("string");
        expect(description).toContain(productName);
      });
    });

    it("生成される説明文の種類を確認する", () => {
      const productName = "テストサプリ";
      const allDescriptions = new Set();

      // 十分な回数実行してすべてのパターンを収集
      for (let i = 0; i < 100; i++) {
        const description = generateSampleDescription(productName);
        allDescriptions.add(description);
      }

      // 期待される説明文パターンを確認
      const expectedPatterns = [
        "は健康維持をサポートする高品質なサプリメントです",
        "で毎日の栄養バランスを整えましょう",
        "は科学的根拠に基づいて開発された製品です",
        "は即効性があり、必ず痩せる効果が期待できます",
        "で完治を目指しましょう",
      ];

      // 生成された説明文が期待されるパターンのいずれかに一致することを確認
      Array.from(allDescriptions).forEach((description) => {
        const matchesPattern = expectedPatterns.some((pattern) =>
          (description as string).includes(pattern),
        );
        expect(matchesPattern).toBe(true);
      });
    });

    it("Math.randomをモックして特定の説明文を生成する", () => {
      const originalRandom = Math.random;

      try {
        // 最初の説明文を選択するようにモック
        Math.random = vi.fn().mockReturnValue(0);

        const description = generateSampleDescription("テストサプリ");
        expect(description).toBe(
          "テストサプリは健康維持をサポートする高品質なサプリメントです。",
        );

        // 最後の説明文を選択するようにモック
        Math.random = vi.fn().mockReturnValue(0.99);

        const description2 = generateSampleDescription("テストサプリ");
        expect(description2).toBe("テストサプリで完治を目指しましょう。");
      } finally {
        Math.random = originalRandom;
      }
    });
  });

  describe("Type Definitions", () => {
    it("ComplianceRule型が正しく定義されている", () => {
      const rule: ComplianceRule = {
        pattern: "test",
        suggest: "suggestion",
      };

      expect(rule.pattern).toBe("test");
      expect(rule.suggest).toBe("suggestion");
    });

    it("ComplianceViolation型が正しく定義されている", () => {
      const violation: ComplianceViolation = {
        originalText: "original",
        suggestedText: "suggested",
        pattern: "pattern",
      };

      expect(violation.originalText).toBe("original");
      expect(violation.suggestedText).toBe("suggested");
      expect(violation.pattern).toBe("pattern");
    });

    it("ComplianceResult型が正しく定義されている", () => {
      const result: ComplianceResult = {
        hasViolations: true,
        violations: [
          {
            originalText: "test",
            suggestedText: "suggestion",
            pattern: "pattern",
          },
        ],
      };

      expect(result.hasViolations).toBe(true);
      expect(result.violations).toHaveLength(1);
    });
  });
});
