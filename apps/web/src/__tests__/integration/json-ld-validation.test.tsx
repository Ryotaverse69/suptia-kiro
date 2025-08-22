import React from "react";
import { render } from "@testing-library/react";
import { vi } from "vitest";
import { CompareItemListJsonLd } from "../../components/seo/CompareItemListJsonLd";
import { validateJsonLdSchema } from "../../lib/seo/schema-validator";
import type { Product } from "../../components/compare/types";

describe("JSON-LD Validation Integration", () => {
  const mockProducts: Product[] = [
    {
      id: "p1",
      name: "イブプロフェン錠A",
      price: 1000,
      totalScore: 85,
      scoreBreakdown: {
        effectiveness: 90,
        safety: 80,
        convenience: 85,
        costEffectiveness: 75,
      },
      warnings: [],
      imageUrl: "/images/product-a.jpg",
      url: "/products/ibuprofen-a",
    },
    {
      id: "p2",
      name: "アセトアミノフェン錠B",
      price: 800,
      totalScore: 75,
      scoreBreakdown: {
        effectiveness: 70,
        safety: 85,
        convenience: 70,
        costEffectiveness: 90,
      },
      warnings: [],
      imageUrl: "/images/product-b.jpg",
      url: "/products/acetaminophen-b",
    },
    {
      id: "p3",
      name: "ロキソプロフェン錠C",
      price: 1200,
      totalScore: 95,
      scoreBreakdown: {
        effectiveness: 95,
        safety: 95,
        convenience: 95,
        costEffectiveness: 85,
      },
      warnings: [],
      imageUrl: "/images/product-c.jpg",
      url: "/products/loxoprofen-c",
    },
  ];

  describe("schema.org準拠テスト", () => {
    it("ItemList JSON-LDがschema.org仕様に準拠する", () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={mockProducts}
          pageUrl="https://example.com/compare"
          title="製品比較"
          description="3つの製品を比較"
        />,
      );

      const jsonLdScript = container.querySelector(
        'script[type="application/ld+json"]',
      );
      expect(jsonLdScript).toBeInTheDocument();

      const jsonData = JSON.parse(jsonLdScript?.textContent || "{}");

      // 基本構造の検証
      expect(jsonData["@context"]).toBe("https://schema.org");
      expect(jsonData["@type"]).toBe("ItemList");
      expect(jsonData.name).toBe("製品比較");
      expect(jsonData.description).toBe("3つの製品を比較");
      expect(jsonData.numberOfItems).toBe(3);
      expect(jsonData.itemListElement).toHaveLength(3);

      // 各ListItemの検証
      jsonData.itemListElement.forEach((item: any, index: number) => {
        expect(item["@type"]).toBe("ListItem");
        expect(item.position).toBe(index + 1);
        expect(item.name).toBe(mockProducts[index].name);
        expect(item.url).toBe(`https://example.com${mockProducts[index].url}`);

        // Product情報の検証
        expect(item.item["@type"]).toBe("Product");
        expect(item.item.name).toBe(mockProducts[index].name);
        expect(item.item.url).toBe(
          `https://example.com${mockProducts[index].url}`,
        );

        // Offer情報の検証
        expect(item.item.offers["@type"]).toBe("Offer");
        expect(item.item.offers.price).toBe(mockProducts[index].price);
        expect(item.item.offers.priceCurrency).toBe("JPY");
      });
    });

    it("構造化データテストツールで有効であることを確認", async () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={mockProducts}
          pageUrl="https://example.com/compare"
          title="製品比較"
          description="3つの製品を比較"
        />,
      );

      const jsonLdScript = container.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonData = JSON.parse(jsonLdScript?.textContent || "{}");

      // schema-validator を使用して検証
      const validation = await validateJsonLdSchema(jsonData, "ItemList");

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("必須プロパティがすべて含まれる", () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={mockProducts}
          pageUrl="https://example.com/compare"
        />,
      );

      const jsonLdScript = container.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonData = JSON.parse(jsonLdScript?.textContent || "{}");

      // ItemListの必須プロパティ
      expect(jsonData).toHaveProperty("@context");
      expect(jsonData).toHaveProperty("@type");
      expect(jsonData).toHaveProperty("itemListElement");

      // ListItemの必須プロパティ
      jsonData.itemListElement.forEach((item: any) => {
        expect(item).toHaveProperty("@type");
        expect(item).toHaveProperty("position");
        expect(item).toHaveProperty("item");
      });

      // Productの必須プロパティ
      jsonData.itemListElement.forEach((item: any) => {
        expect(item.item).toHaveProperty("@type");
        expect(item.item).toHaveProperty("name");
      });
    });

    it("オプションプロパティが適切に含まれる", () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={mockProducts}
          pageUrl="https://example.com/compare"
          title="製品比較"
          description="3つの製品を比較"
        />,
      );

      const jsonLdScript = container.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonData = JSON.parse(jsonLdScript?.textContent || "{}");

      // オプションプロパティの確認
      expect(jsonData.name).toBe("製品比較");
      expect(jsonData.description).toBe("3つの製品を比較");
      expect(jsonData.numberOfItems).toBe(3);

      // ListItemのオプションプロパティ
      jsonData.itemListElement.forEach((item: any) => {
        expect(item.name).toBeDefined();
        expect(item.url).toBeDefined();
      });

      // Productのオプションプロパティ
      jsonData.itemListElement.forEach((item: any) => {
        expect(item.item.url).toBeDefined();
        expect(item.item.offers).toBeDefined();
      });
    });
  });

  describe("データ型検証", () => {
    it("数値プロパティが正しい型で出力される", () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={mockProducts}
          pageUrl="https://example.com/compare"
        />,
      );

      const jsonLdScript = container.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonData = JSON.parse(jsonLdScript?.textContent || "{}");

      expect(typeof jsonData.numberOfItems).toBe("number");

      jsonData.itemListElement.forEach((item: any) => {
        expect(typeof item.position).toBe("number");
        expect(typeof item.item.offers.price).toBe("number");
      });
    });

    it("文字列プロパティが正しい型で出力される", () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={mockProducts}
          pageUrl="https://example.com/compare"
          title="製品比較"
          description="3つの製品を比較"
        />,
      );

      const jsonLdScript = container.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonData = JSON.parse(jsonLdScript?.textContent || "{}");

      expect(typeof jsonData["@context"]).toBe("string");
      expect(typeof jsonData["@type"]).toBe("string");
      expect(typeof jsonData.name).toBe("string");
      expect(typeof jsonData.description).toBe("string");

      jsonData.itemListElement.forEach((item: any) => {
        expect(typeof item["@type"]).toBe("string");
        expect(typeof item.name).toBe("string");
        expect(typeof item.url).toBe("string");
        expect(typeof item.item["@type"]).toBe("string");
        expect(typeof item.item.name).toBe("string");
        expect(typeof item.item.url).toBe("string");
        expect(typeof item.item.offers["@type"]).toBe("string");
        expect(typeof item.item.offers.priceCurrency).toBe("string");
      });
    });

    it("配列プロパティが正しい型で出力される", () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={mockProducts}
          pageUrl="https://example.com/compare"
        />,
      );

      const jsonLdScript = container.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonData = JSON.parse(jsonLdScript?.textContent || "{}");

      expect(Array.isArray(jsonData.itemListElement)).toBe(true);
      expect(jsonData.itemListElement).toHaveLength(3);
    });
  });

  describe("URL処理", () => {
    it("相対URLが絶対URLに変換される", () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={mockProducts}
          pageUrl="https://example.com/compare"
        />,
      );

      const jsonLdScript = container.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonData = JSON.parse(jsonLdScript?.textContent || "{}");

      jsonData.itemListElement.forEach((item: any, index: number) => {
        expect(item.url).toBe(`https://example.com${mockProducts[index].url}`);
        expect(item.item.url).toBe(
          `https://example.com${mockProducts[index].url}`,
        );
      });
    });

    it("絶対URLがそのまま保持される", () => {
      const absoluteUrlProducts = mockProducts.map((p) => ({
        ...p,
        url: `https://external.com${p.url}`,
      }));

      const { container } = render(
        <CompareItemListJsonLd
          products={absoluteUrlProducts}
          pageUrl="https://example.com/compare"
        />,
      );

      const jsonLdScript = container.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonData = JSON.parse(jsonLdScript?.textContent || "{}");

      jsonData.itemListElement.forEach((item: any, index: number) => {
        expect(item.url).toBe(absoluteUrlProducts[index].url);
        expect(item.item.url).toBe(absoluteUrlProducts[index].url);
      });
    });
  });

  describe("エラーハンドリング", () => {
    it("不正な製品データでもクラッシュしない", () => {
      const invalidProducts = [
        null,
        undefined,
        { id: "p1" },
        {
          id: "p2",
          name: "",
          price: -100,
          url: "",
        },
      ] as any;

      expect(() => {
        render(
          <CompareItemListJsonLd
            products={invalidProducts}
            pageUrl="https://example.com/compare"
          />,
        );
      }).not.toThrow();
    });

    it("空の製品リストを適切に処理する", () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={[]}
          pageUrl="https://example.com/compare"
        />,
      );

      const jsonLdScript = container.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonData = JSON.parse(jsonLdScript?.textContent || "{}");

      expect(jsonData.numberOfItems).toBe(0);
      expect(jsonData.itemListElement).toHaveLength(0);
    });

    it("不正なpageURLでもクラッシュしない", () => {
      expect(() => {
        render(<CompareItemListJsonLd products={mockProducts} pageUrl="" />);
      }).not.toThrow();

      expect(() => {
        render(
          <CompareItemListJsonLd
            products={mockProducts}
            pageUrl="invalid-url"
          />,
        );
      }).not.toThrow();
    });
  });

  describe("Google構造化データテスト統合", () => {
    it("Google Rich Results Testで有効な構造を生成", async () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={mockProducts}
          pageUrl="https://example.com/compare"
          title="製品比較"
          description="3つの製品を比較"
        />,
      );

      const jsonLdScript = container.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonData = JSON.parse(jsonLdScript?.textContent || "{}");

      // Google Rich Results Testで期待される構造
      expect(jsonData["@context"]).toBe("https://schema.org");
      expect(jsonData["@type"]).toBe("ItemList");

      // リッチリザルトに必要な情報
      expect(jsonData.name).toBeDefined();
      expect(jsonData.itemListElement).toBeDefined();
      expect(jsonData.itemListElement.length).toBeGreaterThan(0);

      // 各アイテムの必要情報
      jsonData.itemListElement.forEach((item: any) => {
        expect(item.position).toBeDefined();
        expect(item.item.name).toBeDefined();
        expect(item.item.url).toBeDefined();
      });
    });

    it("検索結果での表示に適した情報を含む", () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={mockProducts}
          pageUrl="https://example.com/compare"
          title="おすすめ解熱鎮痛剤比較"
          description="効果・安全性・価格を総合的に比較した解熱鎮痛剤ランキング"
        />,
      );

      const jsonLdScript = container.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonData = JSON.parse(jsonLdScript?.textContent || "{}");

      // 検索結果での表示に適したタイトルと説明
      expect(jsonData.name).toBe("おすすめ解熱鎮痛剤比較");
      expect(jsonData.description).toBe(
        "効果・安全性・価格を総合的に比較した解熱鎮痛剤ランキング",
      );

      // 価格情報が含まれる（ショッピング検索対応）
      jsonData.itemListElement.forEach((item: any) => {
        expect(item.item.offers.price).toBeDefined();
        expect(item.item.offers.priceCurrency).toBe("JPY");
      });
    });
  });

  describe("パフォーマンス", () => {
    it("JSON-LD生成が高速に実行される", () => {
      const startTime = performance.now();

      render(
        <CompareItemListJsonLd
          products={mockProducts}
          pageUrl="https://example.com/compare"
        />,
      );

      const endTime = performance.now();
      const generationTime = endTime - startTime;

      // JSON-LD生成時間が10ms以下であることを確認
      expect(generationTime).toBeLessThan(10);
    });

    it("大量の製品データでも適切に処理する", () => {
      const manyProducts = Array(100)
        .fill(mockProducts[0])
        .map((p, i) => ({
          ...p,
          id: `p${i}`,
          name: `Product ${i}`,
          url: `/products/product-${i}`,
        }));

      expect(() => {
        render(
          <CompareItemListJsonLd
            products={manyProducts}
            pageUrl="https://example.com/compare"
          />,
        );
      }).not.toThrow();
    });
  });
});
