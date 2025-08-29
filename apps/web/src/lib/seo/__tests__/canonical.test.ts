import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  cleanUrl,
  generateCanonical,
  generateCanonicalFromUrl,
  isValidCanonicalUrl,
  extractPathFromCanonical,
} from "../canonical";

// Mock runtimeConfig
vi.mock("../../runtimeConfig", () => ({
  getSiteUrl: () => "https://suptia.com",
}));

describe("Canonical URL Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("cleanUrl", () => {
    it("UTMパラメータを除去する (要件4.3)", () => {
      const url = "https://suptia.com/products/vitamin-c?utm_source=google&utm_medium=cpc&utm_campaign=summer";
      const result = cleanUrl(url);

      expect(result).toBe("https://suptia.com/products/vitamin-c");
    });

    it("複数の追跡パラメータを除去する", () => {
      const url = "https://suptia.com/products/protein?utm_source=facebook&fbclid=123&gclid=456&ref=newsletter";
      const result = cleanUrl(url);

      expect(result).toBe("https://suptia.com/products/protein");
    });

    it("フラグメント（ハッシュ）を除去する", () => {
      const url = "https://suptia.com/products/multivitamin#reviews";
      const result = cleanUrl(url);

      expect(result).toBe("https://suptia.com/products/multivitamin");
    });

    it("有効なパラメータは保持する", () => {
      const url = "https://suptia.com/products?category=vitamins&sort=price";
      const result = cleanUrl(url);

      expect(result).toBe("https://suptia.com/products?category=vitamins&sort=price");
    });

    it("カスタム除外パラメータを使用する", () => {
      const url = "https://suptia.com/products?custom_param=test&keep_param=value";
      const result = cleanUrl(url, { excludeParams: ["custom_param"] });

      expect(result).toBe("https://suptia.com/products?keep_param=value");
    });

    it("不正なURLの場合は元のURLを返す", () => {
      const invalidUrl = "not-a-valid-url";
      const result = cleanUrl(invalidUrl);

      expect(result).toBe(invalidUrl);
    });
  });

  describe("generateCanonical", () => {
    it("パスからcanonical URLを生成する (要件4.3)", () => {
      const result = generateCanonical("/products/vitamin-c");

      expect(result).toBe("https://suptia.com/products/vitamin-c");
    });

    it("先頭にスラッシュがない場合は追加する", () => {
      const result = generateCanonical("products/protein");

      expect(result).toBe("https://suptia.com/products/protein");
    });

    it("ルートパスを正しく処理する", () => {
      const result = generateCanonical("/");

      expect(result).toBe("https://suptia.com/");
    });
  });

  describe("generateCanonicalFromUrl", () => {
    it("完全なURLからcanonical URLを生成する (要件4.3)", () => {
      const url = "https://suptia.com/products/vitamin-c?utm_source=google&utm_medium=cpc";
      const result = generateCanonicalFromUrl(url);

      expect(result).toBe("https://suptia.com/products/vitamin-c");
    });

    it("異なるドメインでもパスを保持する", () => {
      const url = "https://other-domain.com/products/protein?utm_campaign=test";
      const result = generateCanonicalFromUrl(url);

      expect(result).toBe("https://suptia.com/products/protein");
    });

    it("不正なURLの場合はサイトURLを返す", () => {
      const invalidUrl = "not-a-valid-url";
      const result = generateCanonicalFromUrl(invalidUrl);

      expect(result).toBe("https://suptia.com");
    });
  });

  describe("isValidCanonicalUrl", () => {
    it("同一オリジンのURLは有効", () => {
      const url = "https://suptia.com/products/vitamin-c";
      const result = isValidCanonicalUrl(url);

      expect(result).toBe(true);
    });

    it("異なるオリジンのURLは無効", () => {
      const url = "https://other-domain.com/products/vitamin-c";
      const result = isValidCanonicalUrl(url);

      expect(result).toBe(false);
    });

    it("不正なURLは無効", () => {
      const invalidUrl = "not-a-valid-url";
      const result = isValidCanonicalUrl(invalidUrl);

      expect(result).toBe(false);
    });
  });

  describe("extractPathFromCanonical", () => {
    it("canonical URLからパスを抽出する", () => {
      const url = "https://suptia.com/products/vitamin-c";
      const result = extractPathFromCanonical(url);

      expect(result).toBe("/products/vitamin-c");
    });

    it("ルートURLの場合はスラッシュを返す", () => {
      const url = "https://suptia.com/";
      const result = extractPathFromCanonical(url);

      expect(result).toBe("/");
    });

    it("不正なURLの場合はルートパスを返す", () => {
      const invalidUrl = "not-a-valid-url";
      const result = extractPathFromCanonical(invalidUrl);

      expect(result).toBe("/");
    });
  });
});