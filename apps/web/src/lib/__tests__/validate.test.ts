import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import {
  ProductQuerySchema,
  SearchQuerySchema,
  ContactFormSchema,
  withValidation,
  sanitizeSlug,
  sanitizeSearchQuery,
} from "../validate";

describe("Validation Schemas", () => {
  describe("ProductQuerySchema", () => {
    it("有効なslugを受け入れる", () => {
      const validSlugs = [
        "vitamin-d3",
        "omega-3-fish-oil",
        "magnesium-glycinate",
        "b-complex-100",
      ];

      validSlugs.forEach((slug) => {
        const result = ProductQuerySchema.safeParse({ slug });
        expect(result.success).toBe(true);
      });
    });

    it("無効なslugを拒否する", () => {
      const invalidSlugs = [
        "", // 空文字
        "a".repeat(101), // 長すぎる
        "Vitamin D3", // 大文字
        "vitamin_d3", // アンダースコア
        "vitamin d3", // スペース
        "vitamin@d3", // 特殊文字
      ];

      invalidSlugs.forEach((slug) => {
        const result = ProductQuerySchema.safeParse({ slug });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("SearchQuerySchema", () => {
    it("有効な検索クエリを受け入れる", () => {
      const validQueries = [
        { q: "vitamin d", category: "vitamin", limit: 10, offset: 0 },
        { category: "mineral", limit: 20 },
        { q: "omega 3" },
        {}, // 全てオプショナル
      ];

      validQueries.forEach((query) => {
        const result = SearchQuerySchema.safeParse(query);
        expect(result.success).toBe(true);
      });
    });

    it("デフォルト値を適用する", () => {
      const result = SearchQuerySchema.parse({});
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it("数値の強制変換を行う", () => {
      const result = SearchQuerySchema.parse({
        limit: "25",
        offset: "5",
      });
      expect(result.limit).toBe(25);
      expect(result.offset).toBe(5);
    });

    it("無効な検索クエリを拒否する", () => {
      const invalidQueries = [
        { q: "a".repeat(201) }, // 長すぎるクエリ
        { category: "invalid" }, // 無効なカテゴリ
        { limit: 0 }, // 最小値未満
        { limit: 51 }, // 最大値超過
        { offset: -1 }, // 負の値
      ];

      invalidQueries.forEach((query) => {
        const result = SearchQuerySchema.safeParse(query);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("ContactFormSchema", () => {
    it("有効なコンタクトフォームを受け入れる", () => {
      const validForm = {
        name: "John Doe",
        email: "john@example.com",
        message: "This is a test message with sufficient length.",
      };

      const result = ContactFormSchema.safeParse(validForm);
      expect(result.success).toBe(true);
    });

    it("無効なコンタクトフォームを拒否する", () => {
      const invalidForms = [
        { name: "", email: "john@example.com", message: "Valid message here." }, // 空の名前
        {
          name: "John",
          email: "invalid-email",
          message: "Valid message here.",
        }, // 無効なメール
        { name: "John", email: "john@example.com", message: "Short" }, // 短すぎるメッセージ
        {
          name: "a".repeat(101),
          email: "john@example.com",
          message: "Valid message here.",
        }, // 長すぎる名前
        {
          name: "John",
          email: "a".repeat(200) + "@example.com",
          message: "Valid message here.",
        }, // 長すぎるメール
        { name: "John", email: "john@example.com", message: "a".repeat(1001) }, // 長すぎるメッセージ
      ];

      invalidForms.forEach((form) => {
        const result = ContactFormSchema.safeParse(form);
        expect(result.success).toBe(false);
      });
    });
  });
});

describe("withValidation Middleware", () => {
  const mockHandler = vi.fn();

  beforeEach(() => {
    mockHandler.mockClear();
    mockHandler.mockResolvedValue(NextResponse.json({ success: true }));
  });

  it("GETリクエストのクエリパラメータを検証する", async () => {
    const url = "http://localhost:3000/api/test?slug=vitamin-d3";
    const request = new NextRequest(url, { method: "GET" });

    const validatedHandler = withValidation(ProductQuerySchema, mockHandler);
    const response = await validatedHandler(request);

    expect(mockHandler).toHaveBeenCalledWith(request, { slug: "vitamin-d3" });
    expect(response.status).toBe(200);
  });

  it("POSTリクエストのJSONボディを検証する", async () => {
    const body = {
      name: "John Doe",
      email: "john@example.com",
      message: "This is a test message.",
    };

    const request = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    const validatedHandler = withValidation(ContactFormSchema, mockHandler);
    const response = await validatedHandler(request);

    expect(mockHandler).toHaveBeenCalledWith(request, body);
    expect(response.status).toBe(200);
  });

  it("バリデーションエラー時に400を返す", async () => {
    const url = "http://localhost:3000/api/test?slug=Invalid Slug!";
    const request = new NextRequest(url, { method: "GET" });

    const validatedHandler = withValidation(ProductQuerySchema, mockHandler);
    const response = await validatedHandler(request);

    expect(mockHandler).not.toHaveBeenCalled();
    expect(response.status).toBe(400);

    const responseData = await response.json();
    expect(responseData.error).toBe("Validation failed");
    expect(responseData.details).toBeInstanceOf(Array);
  });

  it("JSON解析エラー時に400を返す", async () => {
    const request = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: "invalid json",
      headers: { "Content-Type": "application/json" },
    });

    const validatedHandler = withValidation(ContactFormSchema, mockHandler);
    const response = await validatedHandler(request);

    expect(mockHandler).not.toHaveBeenCalled();
    expect(response.status).toBe(400);

    const responseData = await response.json();
    expect(responseData.error).toBe("Invalid request");
  });

  it("ハンドラーエラー時に適切に処理する", async () => {
    mockHandler.mockRejectedValue(new Error("Handler error"));

    const url = "http://localhost:3000/api/test?slug=vitamin-d3";
    const request = new NextRequest(url, { method: "GET" });

    const validatedHandler = withValidation(ProductQuerySchema, mockHandler);

    // withValidationは全てのエラーをキャッチして400レスポンスを返す
    const response = await validatedHandler(request);

    expect(response.status).toBe(400);
    const responseData = await response.json();
    expect(responseData.error).toBe("Invalid request");

    // ハンドラーが呼ばれたことを確認
    expect(mockHandler).toHaveBeenCalledWith(request, { slug: "vitamin-d3" });
  });
});

describe("Sanitization Utilities", () => {
  describe("sanitizeSlug", () => {
    it("有効なslugを正規化する", () => {
      const testCases = [
        { input: "Vitamin D3", expected: "vitamin-d3" },
        { input: "Omega-3 Fish Oil", expected: "omega-3-fish-oil" },
        { input: "B_Complex 100", expected: "b-complex-100" },
        { input: "CoQ10@#$%", expected: "coq10" },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(sanitizeSlug(input)).toBe(expected);
      });
    });

    it("複数のハイフンを単一にする", () => {
      expect(sanitizeSlug("vitamin---d3")).toBe("vitamin-d3");
      expect(sanitizeSlug("omega--3--fish--oil")).toBe("omega-3-fish-oil");
    });

    it("先頭と末尾のハイフンを除去する", () => {
      expect(sanitizeSlug("-vitamin-d3-")).toBe("vitamin-d3");
      expect(sanitizeSlug("---omega-3---")).toBe("omega-3");
    });

    it("長さを100文字に制限する", () => {
      const longInput = "a".repeat(150);
      const result = sanitizeSlug(longInput);
      expect(result.length).toBe(100);
    });

    it("空文字列を適切に処理する", () => {
      expect(sanitizeSlug("")).toBe("");
      expect(sanitizeSlug("   ")).toBe("");
      expect(sanitizeSlug("!@#$%")).toBe("");
    });
  });

  describe("sanitizeSearchQuery", () => {
    it("XSS文字を除去する", () => {
      const testCases = [
        { input: "vitamin<script>", expected: "vitaminscript" },
        { input: 'omega"3', expected: "omega3" },
        { input: "fish'oil", expected: "fishoil" },
        { input: "coq10&test", expected: "coq10test" },
        { input: "b>complex", expected: "bcomplex" },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(sanitizeSearchQuery(input)).toBe(expected);
      });
    });

    it("前後の空白を除去する", () => {
      expect(sanitizeSearchQuery("  vitamin d3  ")).toBe("vitamin d3");
      expect(sanitizeSearchQuery("\t\nomega 3\n\t")).toBe("omega 3");
    });

    it("長さを200文字に制限する", () => {
      const longInput = "a".repeat(250);
      const result = sanitizeSearchQuery(longInput);
      expect(result.length).toBe(200);
    });

    it("安全な文字はそのまま保持する", () => {
      const safeInput = "vitamin d3 omega-3 CoQ10 (100mg)";
      expect(sanitizeSearchQuery(safeInput)).toBe(safeInput);
    });

    it("空文字列を適切に処理する", () => {
      expect(sanitizeSearchQuery("")).toBe("");
      expect(sanitizeSearchQuery("   ")).toBe("");
    });
  });
});
