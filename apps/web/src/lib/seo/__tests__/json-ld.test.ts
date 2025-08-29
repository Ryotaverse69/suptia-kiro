import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateProductJsonLd,
  generateBreadcrumbJsonLd,
  generateWebsiteJsonLd,
  generateOrganizationJsonLd,
  type ProductSEOData,
  type BreadcrumbItem,
} from "../json-ld";

// Mock runtimeConfig
vi.mock("../../runtimeConfig", () => ({
  getSiteUrl: () => "https://suptia.com",
}));

describe("JSON-LD Structured Data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateProductJsonLd", () => {
    it("商品のJSON-LDを正しく生成する (要件4.1)", () => {
      const product: ProductSEOData = {
        name: "ビタミンC 1000mg",
        brand: "HealthBrand",
        description: "高品質なビタミンCサプリメント",
        priceJPY: 2980,
        slug: "vitamin-c-1000mg",
        images: ["https://cdn.sanity.io/images/test/vitamin-c.jpg"],
      };

      const result = generateProductJsonLd(product);

      expect(result).toEqual({
        "@context": "https://schema.org",
        "@type": "Product",
        name: "ビタミンC 1000mg",
        brand: {
          "@type": "Brand",
          name: "HealthBrand",
        },
        description: "高品質なビタミンCサプリメント",
        offers: {
          "@type": "Offer",
          price: 2980,
          priceCurrency: "JPY",
          availability: "https://schema.org/InStock",
          url: "https://suptia.com/products/vitamin-c-1000mg",
        },
        image: "https://cdn.sanity.io/images/test/vitamin-c.jpg",
        url: "https://suptia.com/products/vitamin-c-1000mg",
      });
    });

    it("説明がない場合はデフォルト説明を生成する", () => {
      const product: ProductSEOData = {
        name: "マルチビタミン",
        brand: "TestBrand",
        priceJPY: 1500,
        slug: "multivitamin",
      };

      const result = generateProductJsonLd(product);

      expect(result.description).toBe("TestBrandのマルチビタミン");
    });

    it("画像がない場合はプレースホルダーを使用する", () => {
      const product: ProductSEOData = {
        name: "プロテイン",
        brand: "FitnessBrand",
        priceJPY: 3500,
        slug: "protein",
      };

      const result = generateProductJsonLd(product);

      expect(result.image).toBe("https://suptia.com/product-placeholder.jpg");
    });
  });

  describe("generateBreadcrumbJsonLd", () => {
    it("パンくずリストのJSON-LDを正しく生成する (要件4.4)", () => {
      const items: BreadcrumbItem[] = [
        { name: "ホーム", url: "/" },
        { name: "商品", url: "/products" },
        { name: "ビタミンC", url: "/products/vitamin-c" },
      ];

      const result = generateBreadcrumbJsonLd(items);

      expect(result).toEqual({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "ホーム",
            item: "https://suptia.com/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "商品",
            item: "https://suptia.com/products",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "ビタミンC",
            item: "https://suptia.com/products/vitamin-c",
          },
        ],
      });
    });

    it("空の配列でも正しく処理する", () => {
      const result = generateBreadcrumbJsonLd([]);

      expect(result.itemListElement).toEqual([]);
    });
  });

  describe("generateWebsiteJsonLd", () => {
    it("WebsiteのJSON-LDを正しく生成する", () => {
      const result = generateWebsiteJsonLd();

      expect(result).toEqual({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "サプティア",
        url: "https://suptia.com",
        description: "安全 × 価格 × 説明可能性のサプリ意思決定エンジン",
        inLanguage: "ja",
      });
    });
  });

  describe("generateOrganizationJsonLd", () => {
    it("OrganizationのJSON-LDを正しく生成する", () => {
      const result = generateOrganizationJsonLd();

      expect(result).toEqual({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "サプティア",
        url: "https://suptia.com",
        description: "安全 × 価格 × 説明可能性のサプリ意思決定エンジン",
      });
    });
  });
});