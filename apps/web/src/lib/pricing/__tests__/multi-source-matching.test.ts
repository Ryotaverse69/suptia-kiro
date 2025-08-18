/**
 * Multi-Source Product Matching Integration Tests
 * 複数ソース商品マッチングの統合テスト
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ProductMatcher } from "../price-matcher";
import { MockRakutenConnector } from "../../../../mocks/rakuten-mock";
import { MockYahooConnector } from "../../../../mocks/yahoo-mock";
import type { ProductInfo } from "../price-matcher";

describe("Multi-Source Product Matching Integration", () => {
  let matcher: ProductMatcher;
  let rakutenConnector: MockRakutenConnector;
  let yahooConnector: MockYahooConnector;

  beforeEach(() => {
    matcher = new ProductMatcher();
    rakutenConnector = new MockRakutenConnector();
    yahooConnector = new MockYahooConnector();
  });

  describe("Real-world matching scenarios", () => {
    it("should match identical products across platforms using GTIN", async () => {
      const productInfo: ProductInfo = {
        id: "vitamin-d-1000",
        name: "ビタミンD 1000IU 90粒",
        brand: "HealthBrand",
        gtin: "4901234567890",
        jan: "4901234567890",
        capacity: { amount: 90, unit: "粒" },
        category: "ビタミン",
      };

      // 両プラットフォームから商品を検索
      const rakutenProducts = await rakutenConnector.searchByGTIN(
        productInfo.gtin!,
      );
      const yahooProducts = await yahooConnector.searchByGTIN(
        productInfo.gtin!,
      );

      // マッチング実行
      const result = await matcher.matchProduct(
        productInfo,
        rakutenProducts,
        yahooProducts,
      );

      expect(result.bestMatches.length).toBe(2); // 楽天とYahoo!で1つずつ
      expect(result.confidence.overall).toBe(1.0);
      expect(result.warnings).toHaveLength(0);

      // 各ソースで最高信頼度のマッチを確認
      const rakutenMatch = result.bestMatches.find(
        (m) => m.source === "rakuten",
      );
      const yahooMatch = result.bestMatches.find((m) => m.source === "yahoo");

      expect(rakutenMatch?.matchType).toBe("gtin");
      expect(yahooMatch?.matchType).toBe("gtin");
    });

    it("should handle products with different naming conventions", async () => {
      const productInfo: ProductInfo = {
        id: "omega3-epa-dha",
        name: "オメガ3 EPA・DHA 180粒",
        brand: "HealthStore",
        capacity: { amount: 180, unit: "粒" },
        category: "オメガ3",
      };

      // 名前で検索（GTINなし）
      const rakutenProducts = await rakutenConnector.searchProducts({
        keyword: "オメガ3",
      });
      const yahooProducts = await yahooConnector.searchProducts({
        query: "オメガ3",
      });

      const result = await matcher.matchProduct(
        productInfo,
        rakutenProducts,
        yahooProducts,
      );

      // 名前・容量マッチングで一致するはず
      if (result.bestMatches.length > 0) {
        result.bestMatches.forEach((match) => {
          expect(match.matchType).toBe("name_capacity");
          expect(match.matchDetails.capacityMatch).toBe(true);
          expect(match.confidence).toBeGreaterThanOrEqual(0.6);
        });
      }
    });

    it("should prioritize exact matches over partial matches", async () => {
      const productInfo: ProductInfo = {
        id: "multivitamin-30",
        name: "マルチビタミン 30日分",
        brand: "VitaminWorld",
        capacity: { amount: 30, unit: "粒" },
        category: "マルチビタミン",
      };

      // 複数の類似商品を含む検索結果
      const rakutenProducts = await rakutenConnector.searchProducts({
        keyword: "マルチビタミン",
      });
      const yahooProducts = await yahooConnector.searchProducts({
        query: "マルチビタミン",
      });

      const result = await matcher.matchProduct(
        productInfo,
        rakutenProducts,
        yahooProducts,
      );

      // 最も類似度の高いマッチが選択されるべき
      if (result.bestMatches.length > 0) {
        result.bestMatches.forEach((match) => {
          expect(match.confidence).toBeGreaterThan(0.6);
        });

        // 信頼度順にソートされていることを確認
        const sortedMatches = [...result.matches].sort(
          (a, b) => b.confidence - a.confidence,
        );
        expect(result.matches).toEqual(sortedMatches);
      }
    });

    it("should handle out-of-stock products correctly", async () => {
      const productInfo: ProductInfo = {
        id: "out-of-stock-product",
        name: "マルチビタミン 30日分",
        brand: "VitaminWorld",
        capacity: { amount: 30, unit: "粒" },
        category: "マルチビタミン",
      };

      const rakutenProducts = await rakutenConnector.searchProducts({
        keyword: "マルチビタミン",
      });
      const yahooProducts = await yahooConnector.searchProducts({
        query: "マルチビタミン",
      });

      const result = await matcher.matchProduct(
        productInfo,
        rakutenProducts,
        yahooProducts,
      );

      // 在庫状況に関係なくマッチングは実行されるべき
      if (result.bestMatches.length > 0) {
        result.bestMatches.forEach((match) => {
          expect(match.product).toBeDefined();
          // 在庫情報の確認
          if ("availability" in match.product) {
            // 楽天商品の場合
            expect([0, 1]).toContain(match.product.availability);
          } else {
            // Yahoo!商品の場合
            expect(typeof match.product.inStock).toBe("boolean");
          }
        });
      }
    });
  });

  describe("Performance and scalability", () => {
    it("should handle large product lists efficiently", async () => {
      const productInfo: ProductInfo = {
        id: "performance-test",
        name: "プロテイン 1kg",
        brand: "ProteinLab",
        capacity: { amount: 1, unit: "kg" },
        category: "プロテイン",
      };

      // 大量の商品データを生成
      const largeRakutenList = Array.from({ length: 100 }, (_, i) => ({
        itemCode: `rakuten-protein-${i}`,
        itemName: `プロテイン商品${i} 1kg`,
        itemPrice: 3000 + i * 10,
        postageFlag: (i % 2) as 0 | 1,
        itemUrl: `https://test.com/protein-${i}`,
        mediumImageUrls: [`https://test.com/image-${i}.jpg`],
        availability: (i % 10 !== 0 ? 1 : 0) as 0 | 1,
        reviewCount: i * 2,
        reviewAverage: 3.5 + (i % 10) * 0.1,
        shopName: `Shop${i}`,
        genreId: "509778",
      }));

      const largeYahooList = Array.from({ length: 100 }, (_, i) => ({
        code: `yahoo-protein-${i}`,
        name: `プロテイン商品${i} 1kg`,
        price: 3100 + i * 10,
        shipping: {
          code: (i % 2) as 0 | 1,
          price: i % 2 === 0 ? 300 : undefined,
        },
        url: `https://yahoo.com/protein-${i}`,
        image: { medium: `https://yahoo.com/image-${i}.jpg` },
        inStock: i % 10 !== 0,
        review: { count: i * 3, rate: 3.8 + (i % 10) * 0.1 },
        seller: { name: `YahooShop${i}` },
        category: { id: "24983", name: "プロテイン" },
      }));

      const startTime = Date.now();
      const result = await matcher.matchProduct(
        productInfo,
        largeRakutenList,
        largeYahooList,
      );
      const endTime = Date.now();

      // パフォーマンス確認（1秒以内）
      expect(endTime - startTime).toBeLessThan(1000);

      // 結果の妥当性確認
      expect(result).toBeDefined();
      expect(result.matches.length).toBeLessThanOrEqual(200); // 最大でも全商品数
    });

    it("should handle concurrent matching requests", async () => {
      const productInfos: ProductInfo[] = Array.from(
        { length: 10 },
        (_, i) => ({
          id: `concurrent-test-${i}`,
          name: `テスト商品${i}`,
          brand: `ブランド${i}`,
          capacity: { amount: 30 + i, unit: "粒" },
          category: "テスト",
        }),
      );

      const rakutenProducts = await rakutenConnector.searchProducts({
        keyword: "ビタミン",
      });
      const yahooProducts = await yahooConnector.searchProducts({
        query: "ビタミン",
      });

      // 並行処理でマッチング実行
      const promises = productInfos.map((productInfo) =>
        matcher.matchProduct(productInfo, rakutenProducts, yahooProducts),
      );

      const results = await Promise.all(promises);

      // 全ての結果が正常に返されることを確認
      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result.productInfo.id).toBe(`concurrent-test-${index}`);
      });
    });
  });

  describe("Error handling and edge cases", () => {
    it("should handle malformed product data gracefully", async () => {
      const malformedProductInfo: ProductInfo = {
        id: "malformed-test",
        name: "", // 空の名前
        brand: "",
        capacity: { amount: 0, unit: "" }, // 無効な容量
        category: "",
      };

      const rakutenProducts = await rakutenConnector.searchProducts({
        keyword: "test",
      });
      const yahooProducts = await yahooConnector.searchProducts({
        query: "test",
      });

      // エラーが発生せずに処理されることを確認
      const result = await matcher.matchProduct(
        malformedProductInfo,
        rakutenProducts,
        yahooProducts,
      );

      expect(result).toBeDefined();
      expect(result.productInfo).toEqual(malformedProductInfo);
      expect(result.matches).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should handle network simulation errors", async () => {
      // エラーシミュレーション用のコネクタを使用
      const errorRakutenConnector = new MockRakutenConnector();
      const errorYahooConnector = new MockYahooConnector();

      // 空の結果を返すように設定
      errorRakutenConnector.clearMockProducts();
      errorYahooConnector.clearMockProducts();

      const productInfo: ProductInfo = {
        id: "error-test",
        name: "エラーテスト商品",
        brand: "テストブランド",
        capacity: { amount: 30, unit: "粒" },
        category: "テスト",
      };

      const rakutenProducts = await errorRakutenConnector.searchProducts({
        keyword: "test",
      });
      const yahooProducts = await errorYahooConnector.searchProducts({
        query: "test",
      });

      const result = await matcher.matchProduct(
        productInfo,
        rakutenProducts,
        yahooProducts,
      );

      expect(result.matches).toHaveLength(0);
      expect(result.bestMatches).toHaveLength(0);
      expect(result.confidence.overall).toBe(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should handle products with special characters in names", async () => {
      const productInfo: ProductInfo = {
        id: "special-chars-test",
        name: "ビタミンD3【高濃度】(1000IU)・90粒入り",
        brand: "Special Brand",
        capacity: { amount: 90, unit: "粒" },
        category: "ビタミン",
      };

      const rakutenProducts = await rakutenConnector.searchProducts({
        keyword: "ビタミン",
      });
      const yahooProducts = await yahooConnector.searchProducts({
        query: "ビタミン",
      });

      const result = await matcher.matchProduct(
        productInfo,
        rakutenProducts,
        yahooProducts,
      );

      // 特殊文字が含まれていても正常に処理されることを確認
      expect(result).toBeDefined();

      if (result.bestMatches.length > 0) {
        result.bestMatches.forEach((match) => {
          expect(match.matchDetails.nameMatch).toBeGreaterThan(0);
        });
      }
    });
  });

  describe("Boundary value testing", () => {
    it("should handle minimum and maximum capacity values", async () => {
      const testCases = [
        { amount: 1, unit: "粒" }, // 最小値
        { amount: 9999, unit: "粒" }, // 大きな値
        { amount: 0.1, unit: "g" }, // 小数値
      ];

      for (const capacity of testCases) {
        const productInfo: ProductInfo = {
          id: `boundary-test-${capacity.amount}`,
          name: "バウンダリーテスト商品",
          brand: "テストブランド",
          capacity,
          category: "テスト",
        };

        const rakutenProducts = await rakutenConnector.searchProducts({
          keyword: "test",
        });
        const yahooProducts = await yahooConnector.searchProducts({
          query: "test",
        });

        // エラーが発生しないことを確認
        const result = await matcher.matchProduct(
          productInfo,
          rakutenProducts,
          yahooProducts,
        );
        expect(result).toBeDefined();
      }
    });

    it("should handle confidence threshold boundaries", async () => {
      const productInfo: ProductInfo = {
        id: "confidence-boundary-test",
        name: "ビタミン", // 短い名前で類似度をテスト
        brand: "テスト",
        capacity: { amount: 90, unit: "粒" },
        category: "ビタミン",
      };

      const rakutenProducts = await rakutenConnector.searchProducts({
        keyword: "ビタミン",
      });
      const yahooProducts = await yahooConnector.searchProducts({
        query: "ビタミン",
      });

      const result = await matcher.matchProduct(
        productInfo,
        rakutenProducts,
        yahooProducts,
      );

      // 信頼度の境界値テスト
      result.matches.forEach((match) => {
        expect(match.confidence).toBeGreaterThanOrEqual(0);
        expect(match.confidence).toBeLessThanOrEqual(1);

        // 最小閾値未満のマッチは除外されているはず
        if (match.matchType !== "gtin" && match.matchType !== "jan") {
          expect(match.confidence).toBeGreaterThanOrEqual(0.6);
        }
      });
    });

    it("should handle empty and null values correctly", async () => {
      const edgeCaseProducts = [
        {
          ...(await rakutenConnector.searchProducts({ keyword: "ビタミン" })),
          // 一部フィールドを空にする
        },
        {
          ...(await yahooConnector.searchProducts({ query: "ビタミン" })),
          // 一部フィールドを空にする
        },
      ];

      const productInfo: ProductInfo = {
        id: "null-test",
        name: "ヌルテスト商品",
        brand: "テストブランド",
        capacity: { amount: 30, unit: "粒" },
        category: "テスト",
      };

      // 空の配列でもエラーが発生しないことを確認
      const result = await matcher.matchProduct(productInfo, [], []);
      expect(result).toBeDefined();
      expect(result.matches).toHaveLength(0);
    });
  });
});
