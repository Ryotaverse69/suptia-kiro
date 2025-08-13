import { describe, it, expect } from "vitest";
import {
  sanitizePortableText,
  isValidSlug,
  normalizeSlug,
  generateUniqueSlug,
  sanitizeHTML,
} from "../sanitize";

describe("Sanitization Utilities", () => {
  describe("sanitizePortableText", () => {
    it("許可されたブロックタイプのみを保持する", () => {
      const blocks = [
        {
          _type: "block",
          style: "normal",
          children: [{ _type: "span", text: "Hello" }],
        },
        { _type: "malicious", content: "Should be removed" },
        { _type: "image", asset: { _ref: "image-123" }, alt: "Test image" },
      ];

      const sanitized = sanitizePortableText(blocks);

      expect(sanitized).toHaveLength(2);
      expect(sanitized[0]._type).toBe("block");
      expect(sanitized[1]._type).toBe("image");
    });

    it("許可されたマークのみを保持する", () => {
      const blocks = [
        {
          _type: "block",
          style: "normal",
          children: [
            {
              _type: "span",
              text: "Hello",
              marks: ["strong", "malicious-mark", "em"],
            },
          ],
        },
      ];

      const sanitized = sanitizePortableText(blocks);

      expect(sanitized[0].children[0].marks).toEqual(["strong", "em"]);
    });

    it("許可されたスタイルのみを保持する", () => {
      const blocks = [
        { _type: "block", style: "malicious-style", children: [] },
        { _type: "block", style: "h1", children: [] },
      ];

      const sanitized = sanitizePortableText(blocks);

      expect(sanitized[0].style).toBe("normal"); // Fallback to normal
      expect(sanitized[1].style).toBe("h1");
    });

    it("markDefsを除去する", () => {
      const blocks = [
        {
          _type: "block",
          style: "normal",
          children: [],
          markDefs: [{ _type: "link", href: "https://malicious.com" }],
        },
      ];

      const sanitized = sanitizePortableText(blocks);

      expect(sanitized[0].markDefs).toEqual([]);
    });

    it("無効な入力を処理する", () => {
      expect(sanitizePortableText(null as any)).toEqual([]);
      expect(sanitizePortableText(undefined as any)).toEqual([]);
      expect(sanitizePortableText("not an array" as any)).toEqual([]);
    });
  });

  describe("isValidSlug", () => {
    it("有効なslugを認識する", () => {
      expect(isValidSlug("valid-slug")).toBe(true);
      expect(isValidSlug("slug123")).toBe(true);
      expect(isValidSlug("a")).toBe(true);
    });

    it("無効なslugを認識する", () => {
      expect(isValidSlug("")).toBe(false);
      expect(isValidSlug("invalid_slug")).toBe(false);
      expect(isValidSlug("invalid slug")).toBe(false);
      expect(isValidSlug("UPPERCASE")).toBe(false);
      expect(isValidSlug("slug-with-@")).toBe(false);
    });

    it("長すぎるslugを無効とする", () => {
      const longSlug = "a".repeat(101);
      expect(isValidSlug(longSlug)).toBe(false);
    });
  });

  describe("normalizeSlug", () => {
    it("文字列を正規化する", () => {
      expect(normalizeSlug("Hello World")).toBe("hello-world");
      expect(normalizeSlug("Test@#$%Product")).toBe("testproduct");
      expect(normalizeSlug("  Multiple   Spaces  ")).toBe("multiple-spaces");
    });

    it("複数のハイフンを単一にする", () => {
      expect(normalizeSlug("test---product")).toBe("test-product");
      expect(normalizeSlug("test - - product")).toBe("test-product");
    });

    it("先頭と末尾のハイフンを除去する", () => {
      expect(normalizeSlug("-test-product-")).toBe("test-product");
      expect(normalizeSlug("---test---")).toBe("test");
    });

    it("長さを制限する", () => {
      const longInput = "a".repeat(150);
      const result = normalizeSlug(longInput);
      expect(result.length).toBeLessThanOrEqual(100);
    });

    it("空文字列を処理する", () => {
      expect(normalizeSlug("")).toBe("");
      expect(normalizeSlug("   ")).toBe("");
      expect(normalizeSlug("@#$%")).toBe("");
    });
  });

  describe("generateUniqueSlug", () => {
    it("重複がない場合はそのまま返す", () => {
      const existingSlugs = ["existing-1", "existing-2"];
      const result = generateUniqueSlug("new-slug", existingSlugs);
      expect(result).toBe("new-slug");
    });

    it("重複がある場合は番号を付加する", () => {
      const existingSlugs = ["test-slug", "test-slug-1"];
      const result = generateUniqueSlug("test-slug", existingSlugs);
      expect(result).toBe("test-slug-2");
    });

    it("複数の重複がある場合は適切な番号を付加する", () => {
      const existingSlugs = ["product", "product-1", "product-2", "product-4"];
      const result = generateUniqueSlug("product", existingSlugs);
      expect(result).toBe("product-3");
    });

    it("正規化も同時に行う", () => {
      const existingSlugs = ["hello-world"];
      const result = generateUniqueSlug("Hello World", existingSlugs);
      expect(result).toBe("hello-world-1");
    });
  });

  describe("sanitizeHTML", () => {
    it("危険な文字をエスケープする", () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeHTML(input);
      expect(result).toBe(
        "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
      );
    });

    it("すべての危険な文字を処理する", () => {
      const input = `<>"'&`;
      const result = sanitizeHTML(input);
      expect(result).toBe("&lt;&gt;&quot;&#x27;&amp;");
    });

    it("安全な文字はそのまま保持する", () => {
      const input = "Hello World 123 こんにちは";
      const result = sanitizeHTML(input);
      expect(result).toBe(input);
    });

    it("空文字列を処理する", () => {
      expect(sanitizeHTML("")).toBe("");
    });

    it("混在した内容を処理する", () => {
      const input = 'Hello <b>World</b> & "Test"';
      const result = sanitizeHTML(input);
      expect(result).toBe(
        "Hello &lt;b&gt;World&lt;/b&gt; &amp; &quot;Test&quot;",
      );
    });
  });
});
