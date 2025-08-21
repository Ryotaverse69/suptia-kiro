import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CompareItemListJsonLd } from "../../components/seo/CompareItemListJsonLd";
import { validateItemListSchema } from "../../lib/seo/schema-validator";
import { Product } from "../../components/compare/types";

// Mock window.location
const mockLocation = {
  href: "https://example.com/compare",
  origin: "https://example.com",
  pathname: "/compare",
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

// Test data
const mockProducts: Product[] = [
  {
    id: "1",
    name: "ビタミンD3 サプリメント",
    price: 2980,
    totalScore: 85,
    scoreBreakdown: { safety: 90, efficacy: 80, quality: 85 },
    warnings: [],
    imageUrl: "/products/vitamin-d3.jpg",
    url: "/products/vitamin-d3-supplement",
  },
  {
    id: "2",
    name: "オメガ3 フィッシュオイル",
    price: 3500,
    totalScore: 92,
    scoreBreakdown: { safety: 95, efficacy: 90, quality: 90 },
    warnings: [],
    imageUrl: "/products/omega3.jpg",
    url: "/products/omega3-fish-oil",
  },
  {
    id: "3",
    name: "マルチビタミン",
    price: 1980,
    totalScore: 78,
    scoreBreakdown: { safety: 85, efficacy: 70, quality: 80 },
    warnings: [],
    imageUrl: "/products/multivitamin.jpg",
    url: "/products/multivitamin",
  },
];

describe("Compare JSON-LD Integration", () => {
  beforeEach(() => {
    // Reset any mocks
    vi.clearAllMocks();
  });

  describe("CompareItemListJsonLd Integration", () => {
    it("製品比較ページでJSON-LDが正しく生成される", () => {
      render(
        <CompareItemListJsonLd
          products={mockProducts.slice(0, 2)}
          pageUrl="https://example.com/compare"
          title="製品比較テスト"
          description="2製品のサプリメント比較"
        />,
      );

      const script = document.querySelector(
        'script[type="application/ld+json"]',
      );
      expect(script).toBeTruthy();

      const jsonLd = JSON.parse(script?.textContent || "{}");

      // Basic structure validation
      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("ItemList");
      expect(jsonLd.name).toBe("製品比較テスト");
      expect(jsonLd.description).toBe("2製品のサプリメント比較");
      expect(jsonLd.numberOfItems).toBe(2);
      expect(jsonLd.url).toBe("https://example.com/compare");
    });

    it("最大3製品まで制限される", () => {
      render(
        <CompareItemListJsonLd
          products={mockProducts} // 3 products
          pageUrl="https://example.com/compare"
        />,
      );

      const script = document.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonLd = JSON.parse(script?.textContent || "{}");

      expect(jsonLd.numberOfItems).toBe(3);
      expect(jsonLd.itemListElement).toHaveLength(3);
    });

    it("製品情報が正しくListItemに変換される", () => {
      render(
        <CompareItemListJsonLd
          products={mockProducts.slice(0, 2)}
          pageUrl="https://example.com/compare"
        />,
      );

      const script = document.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonLd = JSON.parse(script?.textContent || "{}");

      // First product validation
      const firstItem = jsonLd.itemListElement[0];
      expect(firstItem).toMatchObject({
        "@type": "ListItem",
        position: 1,
        name: "ビタミンD3 サプリメント",
        url: "/products/vitamin-d3-supplement",
        item: {
          "@type": "Product",
          name: "ビタミンD3 サプリメント",
          url: "/products/vitamin-d3-supplement",
          offers: {
            "@type": "Offer",
            price: 2980,
            priceCurrency: "JPY",
            availability: "https://schema.org/InStock",
          },
        },
      });

      // Second product validation
      const secondItem = jsonLd.itemListElement[1];
      expect(secondItem).toMatchObject({
        "@type": "ListItem",
        position: 2,
        name: "オメガ3 フィッシュオイル",
        url: "/products/omega3-fish-oil",
        item: {
          "@type": "Product",
          name: "オメガ3 フィッシュオイル",
          url: "/products/omega3-fish-oil",
          offers: {
            "@type": "Offer",
            price: 3500,
            priceCurrency: "JPY",
            availability: "https://schema.org/InStock",
          },
        },
      });
    });

    it("カスタム通貨が正しく設定される", () => {
      render(
        <CompareItemListJsonLd
          products={mockProducts.slice(0, 1)}
          pageUrl="https://example.com/compare"
          currency="USD"
        />,
      );

      const script = document.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonLd = JSON.parse(script?.textContent || "{}");

      expect(jsonLd.itemListElement[0].item.offers.priceCurrency).toBe("USD");
    });

    it("デフォルトタイトルと説明が生成される", () => {
      render(
        <CompareItemListJsonLd
          products={mockProducts.slice(0, 2)}
          pageUrl="https://example.com/compare"
        />,
      );

      const script = document.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonLd = JSON.parse(script?.textContent || "{}");

      expect(jsonLd.name).toBe(
        "製品比較: ビタミンD3 サプリメント vs オメガ3 フィッシュオイル",
      );
      expect(jsonLd.description).toContain("2製品の価格・スコア・機能を比較");
      expect(jsonLd.description).toContain(
        "ビタミンD3 サプリメント、オメガ3 フィッシュオイル",
      );
    });
  });

  describe("Schema.org Compliance Validation", () => {
    it("生成されたJSON-LDがschema.org仕様に準拠する", () => {
      render(
        <CompareItemListJsonLd
          products={mockProducts.slice(0, 2)}
          pageUrl="https://example.com/compare"
        />,
      );

      const script = document.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonString = script?.textContent || "";

      const validation = validateItemListSchema(jsonString);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("必須フィールドがすべて含まれる", () => {
      render(
        <CompareItemListJsonLd
          products={mockProducts.slice(0, 1)}
          pageUrl="https://example.com/compare"
        />,
      );

      const script = document.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonLd = JSON.parse(script?.textContent || "{}");

      // ItemList required fields
      expect(jsonLd["@context"]).toBeDefined();
      expect(jsonLd["@type"]).toBeDefined();
      expect(jsonLd.name).toBeDefined();
      expect(jsonLd.itemListElement).toBeDefined();

      // ListItem required fields
      const listItem = jsonLd.itemListElement[0];
      expect(listItem["@type"]).toBeDefined();
      expect(listItem.position).toBeDefined();
      expect(listItem.name).toBeDefined();
      expect(listItem.url).toBeDefined();
      expect(listItem.item).toBeDefined();

      // Product required fields
      expect(listItem.item["@type"]).toBeDefined();
      expect(listItem.item.name).toBeDefined();
      expect(listItem.item.url).toBeDefined();

      // Offer required fields
      expect(listItem.item.offers["@type"]).toBeDefined();
      expect(listItem.item.offers.price).toBeDefined();
      expect(listItem.item.offers.priceCurrency).toBeDefined();
      expect(listItem.item.offers.availability).toBeDefined();
    });

    it("position番号が連続している", () => {
      render(
        <CompareItemListJsonLd
          products={mockProducts}
          pageUrl="https://example.com/compare"
        />,
      );

      const script = document.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonLd = JSON.parse(script?.textContent || "{}");

      jsonLd.itemListElement.forEach((item: any, index: number) => {
        expect(item.position).toBe(index + 1);
      });
    });

    it("価格が非負の数値である", () => {
      render(
        <CompareItemListJsonLd
          products={mockProducts.slice(0, 2)}
          pageUrl="https://example.com/compare"
        />,
      );

      const script = document.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonLd = JSON.parse(script?.textContent || "{}");

      jsonLd.itemListElement.forEach((item: any) => {
        expect(typeof item.item.offers.price).toBe("number");
        expect(item.item.offers.price).toBeGreaterThanOrEqual(0);
      });
    });

    it("通貨コードが3文字である", () => {
      render(
        <CompareItemListJsonLd
          products={mockProducts.slice(0, 1)}
          pageUrl="https://example.com/compare"
          currency="USD"
        />,
      );

      const script = document.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonLd = JSON.parse(script?.textContent || "{}");

      const currency = jsonLd.itemListElement[0].item.offers.priceCurrency;
      expect(typeof currency).toBe("string");
      expect(currency).toHaveLength(3);
      expect(currency).toMatch(/^[A-Z]{3}$/);
    });

    it("availability URLがschema.org形式である", () => {
      render(
        <CompareItemListJsonLd
          products={mockProducts.slice(0, 1)}
          pageUrl="https://example.com/compare"
        />,
      );

      const script = document.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonLd = JSON.parse(script?.textContent || "{}");

      const availability = jsonLd.itemListElement[0].item.offers.availability;
      expect(availability).toBe("https://schema.org/InStock");
    });
  });

  describe("Error Handling", () => {
    it("空の製品配列でnullを返す", () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={[]}
          pageUrl="https://example.com/compare"
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("undefinedの製品配列でnullを返す", () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={undefined as any}
          pageUrl="https://example.com/compare"
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("不正な製品データでも基本構造を維持する", () => {
      const invalidProducts = [
        {
          ...mockProducts[0],
          name: "", // Invalid empty name
          price: -100, // Invalid negative price
        },
      ] as Product[];

      render(
        <CompareItemListJsonLd
          products={invalidProducts}
          pageUrl="https://example.com/compare"
        />,
      );

      const script = document.querySelector(
        'script[type="application/ld+json"]',
      );
      expect(script).toBeTruthy();

      const jsonLd = JSON.parse(script?.textContent || "{}");
      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("ItemList");
    });
  });

  describe("Performance Considerations", () => {
    it("大量の製品データでも適切に制限される", () => {
      const manyProducts = Array.from({ length: 10 }, (_, i) => ({
        ...mockProducts[0],
        id: `product-${i}`,
        name: `製品 ${i + 1}`,
      }));

      render(
        <CompareItemListJsonLd
          products={manyProducts}
          pageUrl="https://example.com/compare"
        />,
      );

      const script = document.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonLd = JSON.parse(script?.textContent || "{}");

      expect(jsonLd.numberOfItems).toBe(3);
      expect(jsonLd.itemListElement).toHaveLength(3);
    });

    it("JSON出力が適切にフォーマットされる", () => {
      render(
        <CompareItemListJsonLd
          products={mockProducts.slice(0, 1)}
          pageUrl="https://example.com/compare"
        />,
      );

      const script = document.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonString = script?.textContent || "";

      // Should be minified (no extra whitespace)
      expect(jsonString).not.toContain("\n  ");
      expect(jsonString).not.toContain("    ");

      // But should be valid JSON
      expect(() => JSON.parse(jsonString)).not.toThrow();
    });
  });
});
