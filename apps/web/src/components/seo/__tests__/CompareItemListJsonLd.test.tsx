import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CompareItemListJsonLd, {
  validateItemList,
  createSafeItemList,
  type CompareItemList,
} from "../CompareItemListJsonLd";
import { Product } from "../../compare/types";

// Mock console.warn to test validation warnings
const mockConsoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

// Test data
const mockProducts: Product[] = [
  {
    id: "1",
    name: "テスト製品A",
    price: 1000,
    totalScore: 85,
    scoreBreakdown: { safety: 90, efficacy: 80 },
    warnings: [],
    imageUrl: "/test-image-a.jpg",
    url: "/products/test-product-a",
  },
  {
    id: "2",
    name: "テスト製品B",
    price: 1500,
    totalScore: 75,
    scoreBreakdown: { safety: 70, efficacy: 80 },
    warnings: [],
    imageUrl: "/test-image-b.jpg",
    url: "/products/test-product-b",
  },
  {
    id: "3",
    name: "テスト製品C",
    price: 800,
    totalScore: 90,
    scoreBreakdown: { safety: 95, efficacy: 85 },
    warnings: [],
    imageUrl: "/test-image-c.jpg",
    url: "/products/test-product-c",
  },
];

describe("CompareItemListJsonLd", () => {
  beforeEach(() => {
    mockConsoleWarn.mockClear();
  });

  afterAll(() => {
    mockConsoleWarn.mockRestore();
  });

  describe("Component Rendering", () => {
    it("空の製品配列の場合はnullを返す", () => {
      const { container } = render(
        <CompareItemListJsonLd products={[]} pageUrl="/compare" />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("製品が存在する場合はJSON-LDスクリプトを生成する", () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={mockProducts.slice(0, 2)}
          pageUrl="/compare"
          title="製品比較テスト"
          description="テスト用の製品比較"
        />,
      );

      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );
      expect(script).toBeTruthy();

      const jsonLd = JSON.parse(script?.textContent || "{}");
      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("ItemList");
      expect(jsonLd.name).toBe("製品比較テスト");
      expect(jsonLd.description).toBe("テスト用の製品比較");
      expect(jsonLd.numberOfItems).toBe(2);
    });

    it("最大3製品まで制限される", () => {
      const manyProducts = [...mockProducts, ...mockProducts]; // 6 products
      const { container } = render(
        <CompareItemListJsonLd products={manyProducts} pageUrl="/compare" />,
      );

      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonLd = JSON.parse(script?.textContent || "{}");
      expect(jsonLd.numberOfItems).toBe(3);
      expect(jsonLd.itemListElement).toHaveLength(3);
    });

    it("デフォルトのタイトルと説明を生成する", () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={mockProducts.slice(0, 2)}
          pageUrl="/compare"
        />,
      );

      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonLd = JSON.parse(script?.textContent || "{}");

      expect(jsonLd.name).toBe("製品比較: テスト製品A vs テスト製品B");
      expect(jsonLd.description).toContain("2製品の価格・スコア・機能を比較");
      expect(jsonLd.description).toContain("テスト製品A、テスト製品B");
    });

    it("カスタム通貨を設定できる", () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={mockProducts.slice(0, 1)}
          pageUrl="/compare"
          currency="USD"
        />,
      );

      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonLd = JSON.parse(script?.textContent || "{}");

      expect(jsonLd.itemListElement[0].item.offers.priceCurrency).toBe("USD");
    });
  });

  describe("JSON-LD Structure", () => {
    it("正しいItemList構造を生成する", () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={mockProducts.slice(0, 2)}
          pageUrl="/compare"
        />,
      );

      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonLd = JSON.parse(script?.textContent || "{}");

      // ItemList structure
      expect(jsonLd).toMatchObject({
        "@context": "https://schema.org",
        "@type": "ItemList",
        numberOfItems: 2,
        url: "/compare",
      });

      // ListItem structure
      expect(jsonLd.itemListElement).toHaveLength(2);
      jsonLd.itemListElement.forEach((item: any, index: number) => {
        expect(item).toMatchObject({
          "@type": "ListItem",
          position: index + 1,
          name: mockProducts[index].name,
          url: mockProducts[index].url,
        });

        // Product structure
        expect(item.item).toMatchObject({
          "@type": "Product",
          name: mockProducts[index].name,
          url: mockProducts[index].url,
        });

        // Offer structure
        expect(item.item.offers).toMatchObject({
          "@type": "Offer",
          price: mockProducts[index].price,
          priceCurrency: "JPY",
          availability: "https://schema.org/InStock",
        });
      });
    });

    it("position番号が正しく設定される", () => {
      const { container } = render(
        <CompareItemListJsonLd products={mockProducts} pageUrl="/compare" />,
      );

      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonLd = JSON.parse(script?.textContent || "{}");

      jsonLd.itemListElement.forEach((item: any, index: number) => {
        expect(item.position).toBe(index + 1);
      });
    });
  });

  describe("createSafeItemList", () => {
    it("正しいItemList構造を作成する", () => {
      const itemList = createSafeItemList(
        mockProducts.slice(0, 2),
        "/compare",
        "テストタイトル",
        "テスト説明",
      );

      expect(itemList).toMatchObject({
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "テストタイトル",
        description: "テスト説明",
        numberOfItems: 2,
        url: "/compare",
      });

      expect(itemList.itemListElement).toHaveLength(2);
    });

    it("デフォルト値を適切に設定する", () => {
      const itemList = createSafeItemList(mockProducts.slice(0, 1), "/compare");

      expect(itemList.name).toBe("製品比較: テスト製品A");
      expect(itemList.description).toContain("1製品の価格・スコア・機能を比較");
      expect(itemList.itemListElement[0].item.offers.priceCurrency).toBe("JPY");
    });

    it("最大3製品まで制限する", () => {
      const manyProducts = [...mockProducts, ...mockProducts]; // 6 products
      const itemList = createSafeItemList(manyProducts, "/compare");

      expect(itemList.numberOfItems).toBe(3);
      expect(itemList.itemListElement).toHaveLength(3);
    });
  });

  describe("validateItemList", () => {
    it("有効なItemListを検証する", () => {
      const validItemList: CompareItemList = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "テスト比較",
        description: "テスト用比較リスト",
        numberOfItems: 1,
        url: "/compare",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "テスト製品",
            url: "/products/test",
            item: {
              "@type": "Product",
              name: "テスト製品",
              url: "/products/test",
              offers: {
                "@type": "Offer",
                price: 1000,
                priceCurrency: "JPY",
                availability: "https://schema.org/InStock",
              },
            },
          },
        ],
      };

      const validation = validateItemList(validItemList);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("必須フィールドの不足を検出する", () => {
      const invalidItemList = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        // name missing
        description: "テスト説明",
        numberOfItems: 0,
        url: "/compare",
        itemListElement: [],
      } as CompareItemList;

      const validation = validateItemList(invalidItemList);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        "name is required and must be a string",
      );
    });

    it("不正な@contextを検出する", () => {
      const invalidItemList = {
        "@context": "https://invalid.org",
        "@type": "ItemList",
        name: "テスト",
        description: "テスト説明",
        numberOfItems: 0,
        url: "/compare",
        itemListElement: [],
      } as CompareItemList;

      const validation = validateItemList(invalidItemList);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        '@context must be "https://schema.org"',
      );
    });

    it("numberOfItemsと配列長の不一致を検出する", () => {
      const invalidItemList: CompareItemList = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "テスト",
        description: "テスト説明",
        numberOfItems: 2, // But array has 1 item
        url: "/compare",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "テスト製品",
            url: "/products/test",
            item: {
              "@type": "Product",
              name: "テスト製品",
              url: "/products/test",
            },
          },
        ],
      };

      const validation = validateItemList(invalidItemList);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        "numberOfItems must match itemListElement array length",
      );
    });

    it("ListItemの不正な構造を検出する", () => {
      const invalidItemList: CompareItemList = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "テスト",
        description: "テスト説明",
        numberOfItems: 1,
        url: "/compare",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 0, // Invalid: must be positive
            name: "テスト製品",
            url: "/products/test",
            item: {
              "@type": "Product",
              name: "テスト製品",
              url: "/products/test",
            },
          },
        ],
      };

      const validation = validateItemList(invalidItemList);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        "itemListElement[0] position must be a positive number",
      );
    });

    it("Offer構造の検証を行う", () => {
      const invalidItemList: CompareItemList = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "テスト",
        description: "テスト説明",
        numberOfItems: 1,
        url: "/compare",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "テスト製品",
            url: "/products/test",
            item: {
              "@type": "Product",
              name: "テスト製品",
              url: "/products/test",
              offers: {
                "@type": "Offer",
                price: -100, // Invalid: negative price
                priceCurrency: "JPY",
                availability: "https://schema.org/InStock",
              },
            },
          },
        ],
      };

      const validation = validateItemList(invalidItemList);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        "itemListElement[0] item offers price must be a non-negative number",
      );
    });
  });

  describe("Error Handling", () => {
    it("検証エラーがある場合でもレンダリングする", () => {
      // Create invalid products that will cause validation errors
      const invalidProducts = [
        {
          ...mockProducts[0],
          name: "", // Invalid: empty name
        },
      ] as Product[];

      const { container } = render(
        <CompareItemListJsonLd products={invalidProducts} pageUrl="/compare" />,
      );

      // Should still render script tag
      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );
      expect(script).toBeTruthy();

      // Should log warning
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        "CompareItemListJsonLd validation failed:",
        expect.any(Array),
      );
    });

    it("製品配列がundefinedの場合はnullを返す", () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={undefined as any}
          pageUrl="/compare"
        />,
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Schema.org Compliance", () => {
    it("schema.org仕様に準拠したJSON-LDを生成する", () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={mockProducts.slice(0, 2)}
          pageUrl="/compare"
        />,
      );

      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonLd = JSON.parse(script?.textContent || "{}");

      // Required schema.org fields for ItemList
      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("ItemList");
      expect(typeof jsonLd.name).toBe("string");
      expect(typeof jsonLd.description).toBe("string");
      expect(typeof jsonLd.numberOfItems).toBe("number");
      expect(typeof jsonLd.url).toBe("string");
      expect(Array.isArray(jsonLd.itemListElement)).toBe(true);

      // Required schema.org fields for ListItem
      jsonLd.itemListElement.forEach((item: any) => {
        expect(item["@type"]).toBe("ListItem");
        expect(typeof item.position).toBe("number");
        expect(typeof item.name).toBe("string");
        expect(typeof item.url).toBe("string");
        expect(item.item["@type"]).toBe("Product");
      });

      // Required schema.org fields for Product
      jsonLd.itemListElement.forEach((item: any) => {
        expect(typeof item.item.name).toBe("string");
        expect(typeof item.item.url).toBe("string");
        if (item.item.offers) {
          expect(item.item.offers["@type"]).toBe("Offer");
          expect(typeof item.item.offers.price).toBe("number");
          expect(typeof item.item.offers.priceCurrency).toBe("string");
          expect(typeof item.item.offers.availability).toBe("string");
        }
      });
    });

    it("有効なschema.org URLを使用する", () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={mockProducts.slice(0, 1)}
          pageUrl="/compare"
        />,
      );

      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonLd = JSON.parse(script?.textContent || "{}");

      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd.itemListElement[0].item.offers.availability).toBe(
        "https://schema.org/InStock",
      );
    });
  });
});
