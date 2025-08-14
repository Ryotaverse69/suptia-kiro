import { describe, it, expect, beforeEach, afterEach, beforeAll } from "vitest";
import {
  generateMetadata,
  generateProductMetadata,
  generateProductJsonLd,
  generateBreadcrumbJsonLd,
  cleanUrl,
} from "../seo";

describe("SEO Utilities", () => {
  const originalEnv = process.env;

  // テスト時に SITE_URL を明示的に設定して、実装と期待値を一致させる
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://suptia.com";
  });

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_BASE_URL = "https://test.suptia.com";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("generateMetadata", () => {
    it("基本的なメタデータを生成する", () => {
      const metadata = generateMetadata({
        title: "テストページ",
        description: "テスト説明",
        canonical: "/test",
      });

      expect(metadata.title).toBe("テストページ | サプティア");
      expect(metadata.description).toBe("テスト説明");
      expect(metadata.alternates?.canonical).toBe("https://suptia.com/test");
      expect(metadata.openGraph?.title).toBe("テストページ | サプティア");
      expect(metadata.twitter?.title).toBe("テストページ | サプティア");
    });

    it("デフォルト値を使用する", () => {
      const metadata = generateMetadata();

      expect(metadata.title).toBe("サプティア");
      expect(metadata.description).toBe(
        "安全 × 価格 × 説明可能性のサプリ意思決定エンジン",
      );
      expect(metadata.alternates?.canonical).toBe("https://suptia.com");
    });

    it("noIndexが設定される", () => {
      const metadata = generateMetadata({ noIndex: true });

      expect(metadata.robots).toBe("noindex,nofollow");
    });

    it("キーワードが設定される", () => {
      const metadata = generateMetadata({
        keywords: ["サプリ", "健康", "価格比較"],
      });

      expect(metadata.keywords).toBe("サプリ, 健康, 価格比較");
    });
  });

  describe("generateProductMetadata", () => {
    const mockProduct = {
      name: "ビタミンC 1000mg",
      brand: "テストブランド",
      priceJPY: 2980,
      slug: "vitamin-c-1000",
      description: "テスト商品の説明",
    };

    it("商品メタデータを生成する", () => {
      const metadata = generateProductMetadata(mockProduct);

      expect(metadata.title).toBe(
        "ビタミンC 1000mg - テストブランド | サプティア",
      );
      expect(metadata.description).toBe("テスト商品の説明");
      expect(metadata.alternates?.canonical).toBe(
        "https://suptia.com/products/vitamin-c-1000",
      );
    });

    it("説明がない場合デフォルト説明を生成する", () => {
      const productWithoutDesc = { ...mockProduct, description: undefined };
      const metadata = generateProductMetadata(productWithoutDesc);

      expect(metadata.description).toContain(
        "テストブランドのビタミンC 1000mg",
      );
      expect(metadata.description).toContain("¥2,980");
    });

    it("適切なキーワードが設定される", () => {
      const metadata = generateProductMetadata(mockProduct);

      expect(metadata.keywords).toContain("ビタミンC 1000mg");
      expect(metadata.keywords).toContain("テストブランド");
      expect(metadata.keywords).toContain("サプリメント");
    });
  });

  describe("generateProductJsonLd", () => {
    const mockProduct = {
      name: "ビタミンC 1000mg",
      brand: "テストブランド",
      priceJPY: 2980,
      slug: "vitamin-c-1000",
      description: "テスト商品の説明",
      images: ["https://example.com/image.jpg"],
    };

    it("Product JSON-LDを生成する", () => {
      const jsonLd = generateProductJsonLd(mockProduct);

      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("Product");
      expect(jsonLd.name).toBe("ビタミンC 1000mg");
      expect(jsonLd.brand.name).toBe("テストブランド");
      expect(jsonLd.offers.price).toBe(2980);
      expect(jsonLd.offers.priceCurrency).toBe("JPY");
      expect(jsonLd.offers.availability).toBe("https://schema.org/InStock");
      expect(jsonLd.url).toBe("https://suptia.com/products/vitamin-c-1000");
    });

    it("画像がない場合プレースホルダーを使用する", () => {
      const productWithoutImage = { ...mockProduct, images: undefined };
      const jsonLd = generateProductJsonLd(productWithoutImage);

      expect(jsonLd.image).toBe("https://suptia.com/product-placeholder.jpg");
    });
  });

  describe("generateBreadcrumbJsonLd", () => {
    it("BreadcrumbList JSON-LDを生成する", () => {
      const items = [
        { name: "ホーム", url: "/" },
        { name: "商品", url: "/products" },
        { name: "ビタミンC", url: "/products/vitamin-c" },
      ];

      const jsonLd = generateBreadcrumbJsonLd(items);

      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("BreadcrumbList");
      expect(jsonLd.itemListElement).toHaveLength(3);

      expect(jsonLd.itemListElement[0].position).toBe(1);
      expect(jsonLd.itemListElement[0].name).toBe("ホーム");
      expect(jsonLd.itemListElement[0].item).toBe("https://suptia.com/");

      expect(jsonLd.itemListElement[2].position).toBe(3);
      expect(jsonLd.itemListElement[2].name).toBe("ビタミンC");
      expect(jsonLd.itemListElement[2].item).toBe(
        "https://suptia.com/products/vitamin-c",
      );
    });
  });

  describe("cleanUrl", () => {
    it("トラッキングパラメータを除去する", () => {
      const dirtyUrl =
        "https://example.com/page?utm_source=google&utm_medium=cpc&fbclid=123&normal=keep";
      const cleanedUrl = cleanUrl(dirtyUrl);

      expect(cleanedUrl).toBe("https://example.com/page?normal=keep");
    });

    it("すべてのパラメータが除去される場合", () => {
      const dirtyUrl = "https://example.com/page?utm_source=google&fbclid=123";
      const cleanedUrl = cleanUrl(dirtyUrl);

      expect(cleanedUrl).toBe("https://example.com/page");
    });

    it("トラッキングパラメータがない場合はそのまま返す", () => {
      const cleanUrl1 = "https://example.com/page?id=123&category=test";
      const result = cleanUrl(cleanUrl1);

      expect(result).toBe(cleanUrl1);
    });

    it("複数の同じタイプのパラメータを処理する", () => {
      const dirtyUrl =
        "https://example.com/page?utm_source=google&utm_campaign=test&gclid=456&keep=this";
      const cleanedUrl = cleanUrl(dirtyUrl);

      expect(cleanedUrl).toBe("https://example.com/page?keep=this");
    });
  });
});
