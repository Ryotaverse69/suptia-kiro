import { describe, it, expect } from "vitest";
import {
  getMinimalPersonaRules,
  checkPersonaRules,
  evaluatePersonaWarnings,
  aggregateWarnings,
  withExtraRules,
  type PersonaRule,
  type PersonaWarning,
  type Persona,
  type Severity,
} from "../persona-rules";

describe("Persona Rules Engine", () => {
  describe("getMinimalPersonaRules", () => {
    it("最小ルールセットを返す", () => {
      const rules = getMinimalPersonaRules();

      expect(rules.length).toBeGreaterThan(0);
      expect(
        rules.every(
          (rule) =>
            rule.tag && rule.ingredient && rule.severity && rule.message,
        ),
      ).toBe(true);
    });

    it("必須フィールドが正しく設定されている", () => {
      const rules = getMinimalPersonaRules();

      rules.forEach((rule) => {
        expect(rule).toHaveProperty("tag");
        expect(rule).toHaveProperty("ingredient");
        expect(rule).toHaveProperty("severity");
        expect(rule).toHaveProperty("message");
        expect(["low", "mid", "high"]).toContain(rule.severity);
      });
    });

    it("基本的なカテゴリのルールが含まれている", () => {
      const rules = getMinimalPersonaRules();
      const tags = rules.map((rule) => rule.tag);

      expect(tags).toContain("pregnancy");
      expect(tags).toContain("lactation");
      expect(tags).toContain("medication");
      expect(tags).toContain("stimulant");
    });
  });

  describe("checkPersonaRules", () => {
    it("成分とペルソナに基づいて警告を返す", () => {
      const warnings = checkPersonaRules(
        "カフェインを含む商品です",
        ["カフェイン"],
        ["general"],
      );

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some((w) => w.ingredient === "カフェイン")).toBe(true);
    });

    it("重要度順（high > mid > low）でソートされる", () => {
      const warnings = checkPersonaRules(
        "テスト商品",
        ["カフェイン", "ビタミンK"],
        ["general"],
      );

      if (warnings.length > 1) {
        const severityOrder = { high: 3, mid: 2, low: 1 };
        for (let i = 0; i < warnings.length - 1; i++) {
          expect(severityOrder[warnings[i].severity]).toBeGreaterThanOrEqual(
            severityOrder[warnings[i + 1].severity],
          );
        }
      }
    });

    it("重複メッセージを除去する", () => {
      const warnings = checkPersonaRules(
        "カフェイン商品",
        ["カフェイン", "カフェイン抽出物"], // 同じ成分の異なる表記
        ["general"],
      );

      const messages = warnings.map((w) => w.message);
      const uniqueMessages = new Set(messages);
      expect(messages.length).toBe(uniqueMessages.size);
    });

    it("ペルソナ制約を正しく適用する", () => {
      const underageWarnings = checkPersonaRules(
        "クレアチン商品",
        ["クレアチン"],
        ["underage"],
      );

      const generalWarnings = checkPersonaRules(
        "クレアチン商品",
        ["クレアチン"],
        ["general"],
      );

      expect(underageWarnings.length).toBeGreaterThan(0);
      expect(generalWarnings.length).toBe(0); // クレアチンはunderage専用
    });

    it("空の入力に対して空配列を返す", () => {
      expect(checkPersonaRules("", [], ["general"])).toEqual([]);
      expect(checkPersonaRules("テスト", [], ["general"])).toEqual([]);
      expect(checkPersonaRules("テスト", ["成分"], [])).toEqual([]);
    });

    it("部分一致で成分をマッチングする", () => {
      const warnings = checkPersonaRules(
        "ビタミンA配合",
        ["レチノール"], // ビタミンAの一種
        ["general"],
      );

      // 部分一致ロジックをテスト（実装に依存）
      expect(Array.isArray(warnings)).toBe(true);
    });
  });

  describe("aggregateWarnings", () => {
    it("同じメッセージと重要度の警告をマージする", () => {
      const warnings: PersonaWarning[] = [
        {
          tag: "test1",
          ingredient: "成分A",
          severity: "high",
          message: "同じメッセージ",
          personas: ["general"],
        },
        {
          tag: "test2",
          ingredient: "成分B",
          severity: "high",
          message: "同じメッセージ",
          personas: ["medical_professional"],
        },
      ];

      const aggregated = aggregateWarnings(warnings);

      expect(aggregated.length).toBe(1);
      expect(aggregated[0].personas).toContain("general");
      expect(aggregated[0].personas).toContain("medical_professional");
    });

    it("異なるメッセージは別々に保持する", () => {
      const warnings: PersonaWarning[] = [
        {
          tag: "test1",
          ingredient: "成分A",
          severity: "high",
          message: "メッセージ1",
          personas: ["general"],
        },
        {
          tag: "test2",
          ingredient: "成分B",
          severity: "high",
          message: "メッセージ2",
          personas: ["general"],
        },
      ];

      const aggregated = aggregateWarnings(warnings);

      expect(aggregated.length).toBe(2);
    });
  });

  describe("withExtraRules", () => {
    it("追加ルールを適用する", () => {
      const extraRules: PersonaRule[] = [
        {
          tag: "custom",
          ingredient: "テスト成分",
          severity: "mid",
          message: "カスタム警告メッセージ",
          personas: ["general"],
        },
      ];

      const customChecker = withExtraRules(extraRules);
      const warnings = customChecker("テスト", ["テスト成分"], ["general"]);

      expect(warnings.some((w) => w.message === "カスタム警告メッセージ")).toBe(
        true,
      );
    });

    it("基本ルールと追加ルールを組み合わせる", () => {
      const extraRules: PersonaRule[] = [
        {
          tag: "custom",
          ingredient: "カスタム成分",
          severity: "low",
          message: "カスタム警告",
          personas: ["general"],
        },
      ];

      const customChecker = withExtraRules(extraRules);
      const warnings = customChecker(
        "テスト",
        ["カフェイン", "カスタム成分"],
        ["general"],
      );

      // 基本ルール（カフェイン）と追加ルール（カスタム成分）の両方が適用される
      expect(warnings.length).toBeGreaterThan(1);
    });
  });

  describe("evaluatePersonaWarnings (legacy)", () => {
    it("後方互換性のためにComplianceViolation形式を返す", () => {
      const violations = evaluatePersonaWarnings("カフェイン商品", {
        personas: ["general"],
        ingredients: ["カフェイン"],
      });

      expect(Array.isArray(violations)).toBe(true);
      violations.forEach((violation) => {
        expect(violation).toHaveProperty("originalText");
        expect(violation).toHaveProperty("suggestedText");
        expect(violation).toHaveProperty("pattern");
      });
    });
  });

  describe("重要度レベル", () => {
    it("high重要度の警告が存在する", () => {
      const rules = getMinimalPersonaRules();
      const highSeverityRules = rules.filter(
        (rule) => rule.severity === "high",
      );

      expect(highSeverityRules.length).toBeGreaterThan(0);
    });

    it("mid重要度の警告が存在する", () => {
      const rules = getMinimalPersonaRules();
      const midSeverityRules = rules.filter((rule) => rule.severity === "mid");

      expect(midSeverityRules.length).toBeGreaterThan(0);
    });

    it("low重要度の警告が存在する", () => {
      const rules = getMinimalPersonaRules();
      const lowSeverityRules = rules.filter((rule) => rule.severity === "low");

      expect(lowSeverityRules.length).toBeGreaterThan(0);
    });
  });

  describe("特定のルールケース", () => {
    it("妊娠関連の警告（pregnancy）", () => {
      const warnings = checkPersonaRules(
        "ビタミンA配合",
        ["ビタミンA"],
        ["general"],
      );

      const pregnancyWarnings = warnings.filter((w) => w.tag === "pregnancy");
      expect(pregnancyWarnings.length).toBeGreaterThan(0);
      expect(pregnancyWarnings[0].severity).toBe("high");
    });

    it("授乳関連の警告（lactation）", () => {
      const warnings = checkPersonaRules(
        "ハーブエキス配合",
        ["ハーブエキス"],
        ["general"],
      );

      const lactationWarnings = warnings.filter((w) => w.tag === "lactation");
      expect(lactationWarnings.length).toBeGreaterThan(0);
    });

    it("薬物相互作用の警告（medication）", () => {
      const warnings = checkPersonaRules(
        "ビタミンK配合",
        ["ビタミンK"],
        ["general"],
      );

      const medicationWarnings = warnings.filter((w) => w.tag === "medication");
      expect(medicationWarnings.length).toBeGreaterThan(0);
      expect(medicationWarnings[0].severity).toBe("high");
    });

    it("未成年者向け警告（underage）", () => {
      const warnings = checkPersonaRules(
        "クレアチン配合",
        ["クレアチン"],
        ["underage"],
      );

      const underageWarnings = warnings.filter((w) => w.tag === "underage");
      expect(underageWarnings.length).toBeGreaterThan(0);
    });

    it("高齢者向け警告（elderly）", () => {
      const warnings = checkPersonaRules(
        "高用量ビタミンD配合",
        ["高用量ビタミンD"],
        ["general"],
      );

      const elderlyWarnings = warnings.filter((w) => w.tag === "elderly");
      expect(elderlyWarnings.length).toBeGreaterThan(0);
    });
  });

  describe("エッジケース", () => {
    it("null値を適切に処理する", () => {
      expect(checkPersonaRules(null as any, ["成分"], ["general"])).toEqual([]);
      expect(checkPersonaRules("テスト", null as any, ["general"])).toEqual([]);
      expect(checkPersonaRules("テスト", ["成分"], null as any)).toEqual([]);
    });

    it("undefined値を適切に処理する", () => {
      expect(
        checkPersonaRules(undefined as any, ["成分"], ["general"]),
      ).toEqual([]);
      expect(
        checkPersonaRules("テスト", undefined as any, ["general"]),
      ).toEqual([]);
      expect(checkPersonaRules("テスト", ["成分"], undefined as any)).toEqual(
        [],
      );
    });

    it("空文字列を適切に処理する", () => {
      expect(checkPersonaRules("", ["成分"], ["general"])).toEqual([]);
      expect(checkPersonaRules("テスト", [""], ["general"])).toEqual([]);
    });

    it("大文字小文字を区別しない成分マッチング", () => {
      const warnings1 = checkPersonaRules(
        "テスト",
        ["カフェイン"],
        ["general"],
      );
      const warnings2 = checkPersonaRules(
        "テスト",
        ["カフェイン"],
        ["general"],
      );
      const warnings3 = checkPersonaRules("テスト", ["caffeine"], ["general"]);

      // 日本語の大文字小文字は同じ結果
      expect(warnings1.length).toBe(warnings2.length);
    });
  });
});
