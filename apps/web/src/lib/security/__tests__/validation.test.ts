import { describe, it, expect } from "vitest";
import {
  ProductSearchSchema,
  ProductDetailSchema,
  DiagnosisFormSchema,
  PriceComparisonSchema,
  ReviewSubmissionSchema,
  ContactFormSchema,
  validateInput,
  formatValidationError,
  sanitizeHtml,
  escapeSql,
  validateCsrfToken,
} from "../validation";
import { z } from "zod";

describe("Input Validation", () => {
  describe("ProductSearchSchema", () => {
    it("should validate valid product search input", () => {
      const validInput = {
        query: "ビタミンC",
        category: "vitamins",
        minPrice: 1000,
        maxPrice: 5000,
        page: 1,
        limit: 20,
        sortBy: "price" as const,
        sortOrder: "asc" as const,
      };

      const result = ProductSearchSchema.parse(validInput);
      expect(result).toEqual(validInput);
    });

    it("should apply default values", () => {
      const minimalInput = { query: "ビタミンC" };
      const result = ProductSearchSchema.parse(minimalInput);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.sortBy).toBe("relevance");
      expect(result.sortOrder).toBe("asc");
    });

    it("should reject invalid price range", () => {
      const invalidInput = {
        query: "ビタミンC",
        minPrice: 5000,
        maxPrice: 1000, // 最小価格が最大価格より大きい
      };

      expect(() => ProductSearchSchema.parse(invalidInput)).toThrow();
    });

    it("should reject empty query", () => {
      const invalidInput = { query: "" };
      expect(() => ProductSearchSchema.parse(invalidInput)).toThrow();
    });

    it("should reject query that is too long", () => {
      const invalidInput = { query: "a".repeat(101) };
      expect(() => ProductSearchSchema.parse(invalidInput)).toThrow();
    });

    it("should reject invalid page numbers", () => {
      const invalidInputs = [
        { query: "test", page: 0 },
        { query: "test", page: 1001 },
        { query: "test", page: -1 },
      ];

      invalidInputs.forEach((input) => {
        expect(() => ProductSearchSchema.parse(input)).toThrow();
      });
    });
  });

  describe("ProductDetailSchema", () => {
    it("should validate valid product detail input", () => {
      const validInput = {
        productId: "product123",
        includeReviews: true,
        includePricing: false,
      };

      const result = ProductDetailSchema.parse(validInput);
      expect(result).toEqual(validInput);
    });

    it("should apply default values", () => {
      const minimalInput = { productId: "product123" };
      const result = ProductDetailSchema.parse(minimalInput);

      expect(result.includeReviews).toBe(false);
      expect(result.includePricing).toBe(true);
    });

    it("should reject invalid product ID", () => {
      const invalidInputs = [
        { productId: "" },
        { productId: "product@123" }, // 特殊文字を含む
        { productId: "a".repeat(51) }, // 長すぎる
      ];

      invalidInputs.forEach((input) => {
        expect(() => ProductDetailSchema.parse(input)).toThrow();
      });
    });
  });

  describe("DiagnosisFormSchema", () => {
    it("should validate valid diagnosis form input", () => {
      const validInput = {
        age: 30,
        gender: "female" as const,
        exerciseFrequency: "moderate" as const,
        stressLevel: "low" as const,
        sleepHours: 7.5,
        dietType: "balanced" as const,
        goals: [
          { category: "energy" as const, priority: "high" as const },
          { category: "immunity" as const, priority: "medium" as const },
        ],
        preferences: {
          formType: "tablet" as const,
          priceRange: "mid_range" as const,
          brandPreference: ["brand1", "brand2"],
        },
      };

      const result = DiagnosisFormSchema.parse(validInput);
      expect(result).toEqual(validInput);
    });

    it("should allow optional fields to be undefined", () => {
      const minimalInput = {};
      const result = DiagnosisFormSchema.parse(minimalInput);
      expect(result).toEqual({});
    });

    it("should reject invalid age", () => {
      const invalidInputs = [
        { age: 12 }, // 13歳未満
        { age: 121 }, // 120歳超過
        { age: -1 }, // 負の値
      ];

      invalidInputs.forEach((input) => {
        expect(() => DiagnosisFormSchema.parse(input)).toThrow();
      });
    });

    it("should reject too many goals", () => {
      const invalidInput = {
        goals: Array(11).fill({ category: "energy", priority: "high" }),
      };

      expect(() => DiagnosisFormSchema.parse(invalidInput)).toThrow();
    });

    it("should reject invalid sleep hours", () => {
      const invalidInputs = [{ sleepHours: -1 }, { sleepHours: 25 }];

      invalidInputs.forEach((input) => {
        expect(() => DiagnosisFormSchema.parse(input)).toThrow();
      });
    });
  });

  describe("ReviewSubmissionSchema", () => {
    it("should validate valid review submission", () => {
      const validInput = {
        productId: "product123",
        rating: 4.5,
        title: "良い商品です",
        content:
          "この商品を使用してみて、とても満足しています。品質が良く、価格も適正だと思います。",
        verified: true,
      };

      const result = ReviewSubmissionSchema.parse(validInput);
      expect(result).toEqual(validInput);
    });

    it("should reject prohibited medical terms", () => {
      const invalidInputs = [
        {
          productId: "product123",
          rating: 4.0,
          title: "病気が治りました",
          content: "この商品で病気が治りました。",
        },
        {
          productId: "product123",
          rating: 4.0,
          title: "効果抜群",
          content: "症状が改善されて治療効果がありました。",
        },
      ];

      invalidInputs.forEach((input) => {
        expect(() => ReviewSubmissionSchema.parse(input)).toThrow();
      });
    });

    it("should reject invalid rating", () => {
      const invalidInputs = [
        {
          productId: "product123",
          rating: -1,
          title: "テスト",
          content: "テストレビューです。",
        },
        {
          productId: "product123",
          rating: 6,
          title: "テスト",
          content: "テストレビューです。",
        },
      ];

      invalidInputs.forEach((input) => {
        expect(() => ReviewSubmissionSchema.parse(input)).toThrow();
      });
    });

    it("should reject content that is too short or too long", () => {
      const invalidInputs = [
        {
          productId: "product123",
          rating: 4.0,
          title: "テスト",
          content: "短い", // 10文字未満
        },
        {
          productId: "product123",
          rating: 4.0,
          title: "テスト",
          content: "a".repeat(2001), // 2000文字超過
        },
      ];

      invalidInputs.forEach((input) => {
        expect(() => ReviewSubmissionSchema.parse(input)).toThrow();
      });
    });
  });

  describe("ContactFormSchema", () => {
    it("should validate valid contact form input", () => {
      const validInput = {
        name: "田中太郎",
        email: "tanaka@example.com",
        subject: "お問い合わせ",
        message:
          "こちらは問い合わせメッセージです。詳細な内容を記載しています。",
        category: "general" as const,
        priority: "medium" as const,
      };

      const result = ContactFormSchema.parse(validInput);
      expect(result).toEqual(validInput);
    });

    it("should apply default values", () => {
      const minimalInput = {
        name: "田中太郎",
        email: "tanaka@example.com",
        subject: "お問い合わせ",
        message:
          "こちらは問い合わせメッセージです。詳細な内容を記載しています。",
      };

      const result = ContactFormSchema.parse(minimalInput);
      expect(result.category).toBe("general");
      expect(result.priority).toBe("medium");
    });

    it("should reject invalid email", () => {
      const invalidInput = {
        name: "田中太郎",
        email: "invalid-email",
        subject: "お問い合わせ",
        message: "こちらは問い合わせメッセージです。",
      };

      expect(() => ContactFormSchema.parse(invalidInput)).toThrow();
    });
  });

  describe("validateInput helper", () => {
    it("should return success for valid input", () => {
      const schema = z.object({ name: z.string() });
      const validInput = { name: "test" };

      const result = validateInput(schema, validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    it("should return error for invalid input", () => {
      const schema = z.object({ name: z.string() });
      const invalidInput = { name: 123 };

      const result = validateInput(schema, invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.message).toBe("入力データが無効です");
        expect(result.error.details.length).toBeGreaterThan(0);
        expect(result.error.details[0].field).toBe("name");
      }
    });
  });

  describe("formatValidationError", () => {
    it("should format Zod errors correctly", () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().min(0),
      });

      try {
        schema.parse({ name: "", age: -1 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const formatted = formatValidationError(error);
          expect(formatted.code).toBe("VALIDATION_ERROR");
          expect(formatted.message).toBe("入力データが無効です");
          expect(formatted.details.length).toBeGreaterThan(0);
          // フィールド名が含まれていることを確認
          const fieldNames = formatted.details.map((d) => d.field);
          expect(fieldNames).toContain("name");
          expect(fieldNames).toContain("age");
        }
      }
    });
  });

  describe("sanitizeHtml", () => {
    it("should escape HTML characters", () => {
      const input = '<script>alert("xss")</script>';
      const expected =
        "&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;";
      expect(sanitizeHtml(input)).toBe(expected);
    });

    it("should handle various HTML entities", () => {
      const testCases = [
        { input: "<div>", expected: "&lt;div&gt;" },
        { input: '"quote"', expected: "&quot;quote&quot;" },
        { input: "'single'", expected: "&#x27;single&#x27;" },
        { input: "path/to/file", expected: "path&#x2F;to&#x2F;file" },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(sanitizeHtml(input)).toBe(expected);
      });
    });
  });

  describe("escapeSql", () => {
    it("should escape SQL injection attempts", () => {
      const input = "'; DROP TABLE users; --";
      const result = escapeSql(input);
      expect(result).not.toContain(";");
      expect(result).toBe("'' DROP TABLE users --");
    });

    it("should escape single quotes", () => {
      const input = "O'Reilly";
      const expected = "O''Reilly";
      expect(escapeSql(input)).toBe(expected);
    });
  });

  describe("validateCsrfToken", () => {
    it("should validate matching tokens", () => {
      const token = "abc123def456";
      expect(validateCsrfToken(token, token)).toBe(true);
    });

    it("should reject non-matching tokens", () => {
      const token1 = "abc123def456";
      const token2 = "xyz789uvw012";
      expect(validateCsrfToken(token1, token2)).toBe(false);
    });

    it("should reject empty tokens", () => {
      expect(validateCsrfToken("", "token")).toBe(false);
      expect(validateCsrfToken("token", "")).toBe(false);
      expect(validateCsrfToken("", "")).toBe(false);
    });

    it("should handle different length tokens", () => {
      const token1 = "short";
      const token2 = "verylongtoken";
      expect(validateCsrfToken(token1, token2)).toBe(false);
    });
  });
});
