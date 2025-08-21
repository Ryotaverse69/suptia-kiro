import { describe, it, expect } from "vitest";
import {
  validateSchemaOrgItemList,
  validateJsonLdSyntax,
  validateItemListSchema,
  generateSchemaTestUrl,
  generateStructuredDataTestUrl,
} from "../schema-validator";

describe("Schema Validator", () => {
  describe("validateSchemaOrgItemList", () => {
    it("有効なItemListを検証する", () => {
      const validItemList = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "テスト製品比較",
        description: "テスト用の製品比較リスト",
        numberOfItems: 2,
        url: "/compare",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "製品A",
            url: "/products/a",
            item: {
              "@type": "Product",
              name: "製品A",
              url: "/products/a",
              offers: {
                "@type": "Offer",
                price: 1000,
                priceCurrency: "JPY",
                availability: "https://schema.org/InStock",
              },
            },
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "製品B",
            url: "/products/b",
            item: {
              "@type": "Product",
              name: "製品B",
              url: "/products/b",
              offers: {
                "@type": "Offer",
                price: 1500,
                priceCurrency: "JPY",
                availability: "https://schema.org/InStock",
              },
            },
          },
        ],
      };

      const result = validateSchemaOrgItemList(validItemList);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("必須プロパティの不足を検出する", () => {
      const invalidItemList = {
        "@context": "https://schema.org",
        // @type missing
        name: "テスト",
        itemListElement: [],
      };

      const result = validateSchemaOrgItemList(invalidItemList);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Missing required property: @type");
    });

    it("不正な@contextを検出する", () => {
      const invalidItemList = {
        "@context": "https://invalid.org",
        "@type": "ItemList",
        name: "テスト",
        itemListElement: [],
      };

      const result = validateSchemaOrgItemList(invalidItemList);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Invalid @context: must be "https://schema.org"',
      );
    });

    it("不正な@typeを検出する", () => {
      const invalidItemList = {
        "@context": "https://schema.org",
        "@type": "InvalidType",
        name: "テスト",
        itemListElement: [],
      };

      const result = validateSchemaOrgItemList(invalidItemList);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid @type: must be "ItemList"');
    });

    it("numberOfItemsの不一致を検出する", () => {
      const invalidItemList = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "テスト",
        numberOfItems: 2,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "製品A",
            url: "/products/a",
            item: {
              "@type": "Product",
              name: "製品A",
              url: "/products/a",
            },
          },
        ], // Only 1 item but numberOfItems is 2
      };

      const result = validateSchemaOrgItemList(invalidItemList);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "numberOfItems does not match itemListElement array length",
      );
    });

    it("ListItemの不正な構造を検出する", () => {
      const invalidItemList = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "テスト",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 0, // Invalid: must be positive
            name: "製品A",
            url: "/products/a",
            item: {
              "@type": "Product",
              name: "製品A",
              url: "/products/a",
            },
          },
        ],
      };

      const result = validateSchemaOrgItemList(invalidItemList);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "itemListElement[0]: position must be a positive number",
      );
    });

    it("Productの不正な構造を検出する", () => {
      const invalidItemList = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "テスト",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "製品A",
            url: "/products/a",
            item: {
              "@type": "Product",
              // name missing
              url: "/products/a",
            },
          },
        ],
      };

      const result = validateSchemaOrgItemList(invalidItemList);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "itemListElement[0].item: name is required and must be a string",
      );
    });

    it("Offerの不正な構造を検出する", () => {
      const invalidItemList = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "テスト",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "製品A",
            url: "/products/a",
            item: {
              "@type": "Product",
              name: "製品A",
              url: "/products/a",
              offers: {
                "@type": "Offer",
                price: -100, // Invalid: negative price
                priceCurrency: "JPY",
              },
            },
          },
        ],
      };

      const result = validateSchemaOrgItemList(invalidItemList);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "itemListElement[0].item.offers: price must be a non-negative number",
      );
    });

    it("推奨プロパティの不足を警告する", () => {
      const itemListWithoutOptional = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "テスト",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "製品A",
            url: "/products/a",
            item: {
              "@type": "Product",
              name: "製品A",
              url: "/products/a",
              // No offers, description, image
            },
          },
        ],
      };

      const result = validateSchemaOrgItemList(itemListWithoutOptional);
      expect(result.isValid).toBe(true); // Still valid
      expect(result.warnings).toContain(
        "description property is recommended for better SEO",
      );
      expect(result.warnings).toContain(
        "url property is recommended for better SEO",
      );
      expect(result.warnings).toContain(
        "itemListElement[0].item: offers property is recommended for e-commerce products",
      );
    });

    it("不正な通貨コードを警告する", () => {
      const itemListWithInvalidCurrency = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "テスト",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "製品A",
            url: "/products/a",
            item: {
              "@type": "Product",
              name: "製品A",
              url: "/products/a",
              offers: {
                "@type": "Offer",
                price: 1000,
                priceCurrency: "INVALID", // Invalid: not 3 uppercase letters
                availability: "https://schema.org/InStock",
              },
            },
          },
        ],
      };

      const result = validateSchemaOrgItemList(itemListWithInvalidCurrency);
      expect(result.isValid).toBe(true); // Still valid
      const hasWarning = result.warnings.some((warning) =>
        warning.includes(
          "priceCurrency should be a valid 3-letter ISO currency code",
        ),
      );
      expect(hasWarning).toBe(true);
    });
  });

  describe("validateJsonLdSyntax", () => {
    it("有効なJSONを検証する", () => {
      const validJson = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "テスト",
      });

      const result = validateJsonLdSyntax(validJson);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("不正なJSON構文を検出する", () => {
      const invalidJson =
        '{ "@context": "https://schema.org", "@type": "ItemList", }'; // Trailing comma

      const result = validateJsonLdSyntax(invalidJson);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Invalid JSON syntax");
    });

    it("undefinedの値を検出する", () => {
      const jsonWithUndefined =
        '{ "@context": "https://schema.org", "name": undefined }';

      const result = validateJsonLdSyntax(jsonWithUndefined);
      expect(result.isValid).toBe(false);
      // The actual error will be JSON syntax error since undefined is not valid JSON
      expect(result.errors[0]).toContain("Invalid JSON syntax");
    });

    it("nullの値を警告する", () => {
      const jsonWithNull = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: null,
      });

      const result = validateJsonLdSyntax(jsonWithNull);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "JSON contains null values - ensure this is intentional",
      );
    });

    it("@contextの不足を検出する", () => {
      const jsonWithoutContext = JSON.stringify({
        "@type": "ItemList",
        name: "テスト",
      });

      const result = validateJsonLdSyntax(jsonWithoutContext);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Missing @context property");
    });

    it("@typeの不足を検出する", () => {
      const jsonWithoutType = JSON.stringify({
        "@context": "https://schema.org",
        name: "テスト",
      });

      const result = validateJsonLdSyntax(jsonWithoutType);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Missing @type property");
    });
  });

  describe("validateItemListSchema", () => {
    it("有効なItemList JSON文字列を検証する", () => {
      const validItemListJson = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "テスト製品比較",
        numberOfItems: 1,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "製品A",
            url: "/products/a",
            item: {
              "@type": "Product",
              name: "製品A",
              url: "/products/a",
            },
          },
        ],
      });

      const result = validateItemListSchema(validItemListJson);
      expect(result.isValid).toBe(true);
    });

    it("不正なJSON構文を検出する", () => {
      const invalidJson = "{ invalid json }";

      const result = validateItemListSchema(invalidJson);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Invalid JSON syntax");
    });

    it("不正なItemList構造を検出する", () => {
      const invalidItemListJson = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "InvalidType",
        name: "テスト",
      });

      const result = validateItemListSchema(invalidItemListJson);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid @type: must be "ItemList"');
    });
  });

  describe("URL Generators", () => {
    it("Google Rich Results Test URLを生成する", () => {
      const pageUrl = "https://example.com/compare";
      const testUrl = generateSchemaTestUrl(pageUrl);

      expect(testUrl).toBe(
        "https://search.google.com/test/rich-results?url=https%3A%2F%2Fexample.com%2Fcompare",
      );
    });

    it("Structured Data Testing Tool URLを生成する", () => {
      const pageUrl = "https://example.com/compare";
      const testUrl = generateStructuredDataTestUrl(pageUrl);

      expect(testUrl).toBe(
        "https://search.google.com/structured-data/testing-tool?url=https%3A%2F%2Fexample.com%2Fcompare",
      );
    });

    it("特殊文字を含むURLを適切にエンコードする", () => {
      const pageUrl = "https://example.com/compare?products=a&b&c";
      const testUrl = generateSchemaTestUrl(pageUrl);

      expect(testUrl).toContain(
        "https%3A%2F%2Fexample.com%2Fcompare%3Fproducts%3Da%26b%26c",
      );
    });
  });
});
