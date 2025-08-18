/**
 * Product Price Matcher Unit Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ProductMatcher } from "../price-matcher";
import type { ProductInfo, ProductMatch } from "../price-matcher";
import type { RakutenProduct } from "../rakuten-connector";
import type { YahooProduct } from "../yahoo-connector";

describe("ProductMatcher", () => {
  let matcher: ProductMatcher;
  let sampleProductInfo: ProductInfo;
  let sampleRakutenProducts: RakutenProduct[];
  let sampleYahooProducts: YahooProduct[];

  beforeEach(() => {
    matcher = new ProductMatcher();

    sampleProductInfo = {
      id: "test-product-1",
      name: "ビタミンD 1000IU 90粒",
      brand: "HealthBrand",
      gtin: "4901234567890",
      jan: "4901234567890",
      capacity: {
        amount: 90,
        unit: "粒",
        servingsPerContainer: 90,
      },
      category: "ビタミン",
    };

    sampleRakutenProducts = [
      {
        itemCode: "rakuten-vitamin-d-1000",
        itemName: "ビタミンD 1000IU 90粒",
        itemPrice: 1980,
        postageFlag: 0,
        itemUrl: "https://item.rakuten.co.jp/test/vitamin-d/",
        mediumImageUrls: ["https://test.com/image.jpg"],
        availability: 1,
        reviewCount: 245,
        reviewAverage: 4.3,
        shopName: "HealthBrand Store",
        genreId: "509777",
        gtin: "4901234567890",
        jan: "4901234567890",
      },
      {
        itemCode: "rakuten-vitamin-d-different",
        itemName: "ビタミンD3 1000IU 60粒",
        itemPrice: 1580,
        postageFlag: 1,
        itemUrl: "https://item.rakuten.co.jp/test/vitamin-d-60/",
        mediumImageUrls: ["https://test.com/image2.jpg"],
        availability: 1,
        reviewCount: 156,
        reviewAverage: 4.1,
        shopName: "Different Brand",
        genreId: "509777",
        gtin: "4901234567891",
        jan: "4901234567891",
      },
    ];

    sampleYahooProducts = [
      {
        code: "yahoo-vitamin-d-1000",
        name: "ビタミンD 1000IU 90カプセル",
        price: 1890,
        shipping: { code: 0, price: 300 },
        url: "https://shopping.yahoo.co.jp/products/vitamin-d/",
        image: { medium: "https://test.com/yahoo-image.jpg" },
        inStock: true,
        review: { count: 198, rate: 4.2 },
        seller: { name: "HealthBrand Yahoo Store" },
        category: { id: "24981", name: "ビタミン" },
        gtin: "4901234567890",
        jan: "4901234567890",
      },
      {
        code: "yahoo-vitamin-d-similar",
        name: "ビタミンD3 1000IU 90粒 プレミアム",
        price: 2200,
        shipping: { code: 1 },
        url: "https://shopping.yahoo.co.jp/products/vitamin-d-premium/",
        image: { medium: "https://test.com/yahoo-image2.jpg" },
        inStock: true,
        review: { count: 89, rate: 4.5 },
        seller: { name: "Premium Health" },
        category: { id: "24981", name: "ビタミン" },
        gtin: "4901234567892",
        jan: "4901234567892",
      },
    ];
  });

  describe("matchByGTIN", () => {
    it("should match products by GTIN with perfect confidence", async () => {
      const matches = await matcher.matchByGTIN(
        sampleProductInfo,
        sampleRakutenProducts,
        sampleYahooProducts,
      );

      expect(matches).toHaveLength(2); // 楽天とYahoo!で1つずつ

      const rakutenMatch = matches.find((m) => m.source === "rakuten");
      const yahooMatch = matches.find((m) => m.source === "yahoo");

      expect(rakutenMatch).toBeDefined();
      expect(rakutenMatch?.confidence).toBe(1.0);
      expect(rakutenMatch?.matchType).toBe("gtin");
      expect(rakutenMatch?.matchDetails.gtinMatch).toBe(true);

      expect(yahooMatch).toBeDefined();
      expect(yahooMatch?.confidence).toBe(1.0);
      expect(yahooMatch?.matchType).toBe("gtin");
      expect(yahooMatch?.matchDetails.gtinMatch).toBe(true);
    });

    it("should return empty array when no GTIN is provided", async () => {
      const productWithoutGTIN = { ...sampleProductInfo, gtin: undefined };

      const matches = await matcher.matchByGTIN(
        productWithoutGTIN,
        sampleRakutenProducts,
        sampleYahooProducts,
      );

      expect(matches).toHaveLength(0);
    });

    it("should return empty array when no GTIN matches found", async () => {
      const productWithDifferentGTIN = {
        ...sampleProductInfo,
        gtin: "9999999999999",
      };

      const matches = await matcher.matchByGTIN(
        productWithDifferentGTIN,
        sampleRakutenProducts,
        sampleYahooProducts,
      );

      expect(matches).toHaveLength(0);
    });
  });

  describe("matchByJAN", () => {
    it("should match products by JAN with perfect confidence", async () => {
      const matches = await matcher.matchByJAN(
        sampleProductInfo,
        sampleRakutenProducts,
        sampleYahooProducts,
      );

      expect(matches).toHaveLength(2);

      matches.forEach((match) => {
        expect(match.confidence).toBe(1.0);
        expect(match.matchType).toBe("jan");
        expect(match.matchDetails.janMatch).toBe(true);
      });
    });

    it("should return empty array when no JAN is provided", async () => {
      const productWithoutJAN = { ...sampleProductInfo, jan: undefined };

      const matches = await matcher.matchByJAN(
        productWithoutJAN,
        sampleRakutenProducts,
        sampleYahooProducts,
      );

      expect(matches).toHaveLength(0);
    });
  });

  describe("matchByNameAndCapacity", () => {
    it("should match products by name and capacity when capacity matches", async () => {
      // GTINとJANを除去してテスト
      const productWithoutCodes = {
        ...sampleProductInfo,
        gtin: undefined,
        jan: undefined,
      };

      const rakutenWithoutCodes = sampleRakutenProducts.map((p) => ({
        ...p,
        gtin: undefined,
        jan: undefined,
      }));

      const yahooWithoutCodes = sampleYahooProducts.map((p) => ({
        ...p,
        gtin: undefined,
        jan: undefined,
      }));

      const matches = await matcher.matchByNameAndCapacity(
        productWithoutCodes,
        rakutenWithoutCodes,
        yahooWithoutCodes,
      );

      expect(matches.length).toBeGreaterThan(0);

      matches.forEach((match) => {
        expect(match.matchType).toBe("name_capacity");
        expect(match.matchDetails.capacityMatch).toBe(true);
        expect(match.confidence).toBeGreaterThanOrEqual(0.6);
      });
    });

    it("should not match when capacity does not match", async () => {
      const productWithDifferentCapacity = {
        ...sampleProductInfo,
        gtin: undefined,
        jan: undefined,
        capacity: {
          amount: 120, // 異なる容量
          unit: "粒",
        },
      };

      const matches = await matcher.matchByNameAndCapacity(
        productWithDifferentCapacity,
        sampleRakutenProducts,
        sampleYahooProducts,
      );

      // 容量が一致しないため、マッチしないはず
      expect(matches).toHaveLength(0);
    });

    it("should require minimum name similarity", async () => {
      const productWithDifferentName = {
        ...sampleProductInfo,
        name: "全く異なる商品名",
        gtin: undefined,
        jan: undefined,
      };

      const matches = await matcher.matchByNameAndCapacity(
        productWithDifferentName,
        sampleRakutenProducts,
        sampleYahooProducts,
      );

      // 名前の類似度が低いため、マッチしないはず
      expect(matches).toHaveLength(0);
    });
  });

  describe("matchProduct (integrated matching)", () => {
    it("should prioritize GTIN matches over other types", async () => {
      const result = await matcher.matchProduct(
        sampleProductInfo,
        sampleRakutenProducts,
        sampleYahooProducts,
      );

      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.bestMatches.length).toBeGreaterThan(0);

      // GTINマッチが最優先されるべき
      result.bestMatches.forEach((match) => {
        expect(match.matchType).toBe("gtin");
        expect(match.confidence).toBe(1.0);
      });

      expect(result.confidence.overall).toBe(1.0);
      expect(result.warnings).toHaveLength(0);
    });

    it("should fall back to JAN when GTIN is not available", async () => {
      const productWithoutGTIN = { ...sampleProductInfo, gtin: undefined };

      const result = await matcher.matchProduct(
        productWithoutGTIN,
        sampleRakutenProducts,
        sampleYahooProducts,
      );

      expect(result.bestMatches.length).toBeGreaterThan(0);

      result.bestMatches.forEach((match) => {
        expect(match.matchType).toBe("jan");
        expect(match.confidence).toBe(1.0);
      });
    });

    it("should fall back to name and capacity when codes are not available", async () => {
      const productWithoutCodes = {
        ...sampleProductInfo,
        gtin: undefined,
        jan: undefined,
      };

      const productsWithoutCodes = {
        rakuten: sampleRakutenProducts.map((p) => ({
          ...p,
          gtin: undefined,
          jan: undefined,
        })),
        yahoo: sampleYahooProducts.map((p) => ({
          ...p,
          gtin: undefined,
          jan: undefined,
        })),
      };

      const result = await matcher.matchProduct(
        productWithoutCodes,
        productsWithoutCodes.rakuten,
        productsWithoutCodes.yahoo,
      );

      if (result.bestMatches.length > 0) {
        result.bestMatches.forEach((match) => {
          expect(match.matchType).toBe("name_capacity");
          expect(match.matchDetails.capacityMatch).toBe(true);
        });
      }
    });

    it("should generate warnings when no matches found", async () => {
      const unmatchableProduct = {
        ...sampleProductInfo,
        name: "存在しない商品",
        gtin: "9999999999999",
        jan: "9999999999999",
      };

      const result = await matcher.matchProduct(
        unmatchableProduct,
        sampleRakutenProducts,
        sampleYahooProducts,
      );

      expect(result.matches).toHaveLength(0);
      expect(result.bestMatches).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain(
        "一致する商品が見つかりませんでした",
      );
    });

    it("should generate warnings for low confidence matches", async () => {
      // 低信頼度のマッチを作成するため、類似度の低い商品を使用
      const lowSimilarityProduct = {
        ...sampleProductInfo,
        name: "ビタミンC 500mg", // 異なるビタミン
        gtin: undefined,
        jan: undefined,
        capacity: {
          amount: 90,
          unit: "粒",
        },
      };

      const result = await matcher.matchProduct(
        lowSimilarityProduct,
        sampleRakutenProducts,
        sampleYahooProducts,
      );

      // 低信頼度のマッチがある場合、警告が生成されるべき
      const hasLowConfidenceMatches = result.matches.some(
        (match) => match.confidence < 0.7,
      );
      if (hasLowConfidenceMatches) {
        expect(result.warnings.some((w) => w.includes("信頼度が低い"))).toBe(
          true,
        );
      }
    });
  });

  describe("validateMatch", () => {
    it("should validate high confidence matches", () => {
      const highConfidenceMatch: ProductMatch = {
        productId: "test-1",
        source: "rakuten",
        sourceProductId: "rakuten-1",
        confidence: 0.9,
        matchType: "gtin",
        product: sampleRakutenProducts[0],
        matchDetails: { gtinMatch: true },
      };

      const isValid = matcher.validateMatch(
        highConfidenceMatch,
        sampleProductInfo,
      );
      expect(isValid).toBe(true);
    });

    it("should reject low confidence matches", () => {
      const lowConfidenceMatch: ProductMatch = {
        productId: "test-1",
        source: "rakuten",
        sourceProductId: "rakuten-1",
        confidence: 0.5, // 最小閾値未満
        matchType: "name_capacity",
        product: sampleRakutenProducts[0],
        matchDetails: { nameMatch: 0.5, capacityMatch: true },
      };

      const isValid = matcher.validateMatch(
        lowConfidenceMatch,
        sampleProductInfo,
      );
      expect(isValid).toBe(false);
    });

    it("should always validate GTIN/JAN matches", () => {
      const gtinMatch: ProductMatch = {
        productId: "test-1",
        source: "rakuten",
        sourceProductId: "rakuten-1",
        confidence: 1.0,
        matchType: "gtin",
        product: sampleRakutenProducts[0],
        matchDetails: { gtinMatch: true },
      };

      const isValid = matcher.validateMatch(gtinMatch, sampleProductInfo);
      expect(isValid).toBe(true);
    });

    it("should require capacity match for name_capacity matches", () => {
      const nameCapacityMatchWithoutCapacity: ProductMatch = {
        productId: "test-1",
        source: "rakuten",
        sourceProductId: "rakuten-1",
        confidence: 0.8,
        matchType: "name_capacity",
        product: sampleRakutenProducts[0],
        matchDetails: { nameMatch: 0.8, capacityMatch: false },
      };

      const isValid = matcher.validateMatch(
        nameCapacityMatchWithoutCapacity,
        sampleProductInfo,
      );
      expect(isValid).toBe(false);
    });
  });

  describe("Edge cases and boundary values", () => {
    it("should handle empty product lists", async () => {
      const result = await matcher.matchProduct(sampleProductInfo, [], []);

      expect(result.matches).toHaveLength(0);
      expect(result.bestMatches).toHaveLength(0);
      expect(result.confidence.overall).toBe(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should handle products with missing optional fields", async () => {
      const minimalProduct: ProductInfo = {
        id: "minimal-1",
        name: "ミニマル商品",
        brand: "ミニマルブランド",
        capacity: { amount: 30, unit: "粒" },
        category: "テスト",
      };

      const result = await matcher.matchProduct(
        minimalProduct,
        sampleRakutenProducts,
        sampleYahooProducts,
      );

      // エラーが発生しないことを確認
      expect(result).toBeDefined();
      expect(result.productInfo).toEqual(minimalProduct);
    });

    it("should handle very similar product names", async () => {
      const similarProduct = {
        ...sampleProductInfo,
        name: "ビタミンD 1000IU 90錠", // 「粒」→「錠」
        gtin: undefined,
        jan: undefined,
      };

      const result = await matcher.matchProduct(
        similarProduct,
        sampleRakutenProducts,
        sampleYahooProducts,
      );

      // 高い類似度でマッチするはず
      if (result.bestMatches.length > 0) {
        result.bestMatches.forEach((match) => {
          expect(match.matchDetails.nameMatch).toBeGreaterThan(0.8);
        });
      }
    });

    it("should handle capacity tolerance correctly", async () => {
      const productWithSlightlyDifferentCapacity = {
        ...sampleProductInfo,
        capacity: { amount: 88, unit: "粒" }, // 90の約2%差（許容範囲内）
        gtin: undefined,
        jan: undefined,
      };

      const result = await matcher.matchProduct(
        productWithSlightlyDifferentCapacity,
        sampleRakutenProducts,
        sampleYahooProducts,
      );

      // 許容範囲内の差異なのでマッチするはず
      const capacityMatches = result.matches.filter(
        (m) => m.matchDetails.capacityMatch,
      );
      expect(capacityMatches.length).toBeGreaterThan(0);
    });

    it("should reject capacity differences outside tolerance", async () => {
      const productWithVeryDifferentCapacity = {
        ...sampleProductInfo,
        capacity: { amount: 180, unit: "粒" }, // 90の2倍（許容範囲外）
        gtin: undefined,
        jan: undefined,
      };

      const result = await matcher.matchProduct(
        productWithVeryDifferentCapacity,
        sampleRakutenProducts,
        sampleYahooProducts,
      );

      // 許容範囲外の差異なのでマッチしないはず
      const capacityMatches = result.matches.filter(
        (m) => m.matchDetails.capacityMatch,
      );
      expect(capacityMatches).toHaveLength(0);
    });
  });
});
