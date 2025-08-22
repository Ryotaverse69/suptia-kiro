/**
 * Price Connectors Integration Tests
 * 楽天・Yahoo!コネクタの統合テスト
 */

import { describe, it, expect, beforeEach } from "vitest";
import { MockRakutenConnector } from "../../../../mocks/rakuten-mock";
import { MockYahooConnector } from "../../../../mocks/yahoo-mock";

describe("Price Connectors Integration", () => {
  let rakutenConnector: MockRakutenConnector;
  let yahooConnector: MockYahooConnector;

  beforeEach(() => {
    rakutenConnector = new MockRakutenConnector();
    yahooConnector = new MockYahooConnector();
  });

  describe("Cross-platform product matching", () => {
    it("should find same product across both platforms using GTIN", async () => {
      const gtin = "4901234567890";

      const rakutenResults = await rakutenConnector.searchByGTIN(gtin);
      const yahooResults = await yahooConnector.searchByGTIN(gtin);

      expect(rakutenResults.length).toBeGreaterThan(0);
      expect(yahooResults.length).toBeGreaterThan(0);

      const rakutenProduct = rakutenResults[0];
      const yahooProduct = yahooResults[0];

      expect(rakutenProduct.gtin).toBe(gtin);
      expect(yahooProduct.gtin).toBe(gtin);
    });

    it("should handle different product availability across platforms", async () => {
      const keyword = "マルチビタミン";

      const rakutenResults = await rakutenConnector.searchProducts({ keyword });
      const yahooResults = await yahooConnector.searchProducts({
        query: keyword,
      });

      // 楽天では在庫切れ、Yahoo!でも在庫切れの商品を確認
      const rakutenOutOfStock = rakutenResults.find(
        (p) => p.availability === 0,
      );
      const yahooOutOfStock = yahooResults.find((p) => !p.inStock);

      if (rakutenOutOfStock && yahooOutOfStock) {
        expect(rakutenOutOfStock.availability).toBe(0);
        expect(yahooOutOfStock.inStock).toBe(false);
      }
    });
  });

  describe("Price comparison scenarios", () => {
    it("should compare prices for same product across platforms", async () => {
      const gtin = "4901234567890";

      const rakutenResults = await rakutenConnector.searchByGTIN(gtin);
      const yahooResults = await yahooConnector.searchByGTIN(gtin);

      if (rakutenResults.length > 0 && yahooResults.length > 0) {
        const rakutenProduct = rakutenResults[0];
        const yahooProduct = yahooResults[0];

        // 価格情報の構造が異なることを確認
        expect(typeof rakutenProduct.itemPrice).toBe("number");
        expect(typeof yahooProduct.price).toBe("number");

        // 送料情報の構造が異なることを確認
        expect(typeof rakutenProduct.postageFlag).toBe("number");
        expect(typeof yahooProduct.shipping.code).toBe("number");
      }
    });

    it("should handle shipping cost calculation differences", async () => {
      const keyword = "プロテイン";

      const rakutenResults = await rakutenConnector.searchProducts({ keyword });
      const yahooResults = await yahooConnector.searchProducts({
        query: keyword,
      });

      if (rakutenResults.length > 0 && yahooResults.length > 0) {
        const rakutenProduct = rakutenResults[0];
        const yahooProduct = yahooResults[0];

        // 楽天の送料フラグ確認
        expect([0, 1]).toContain(rakutenProduct.postageFlag);

        // Yahoo!の送料情報確認
        expect([0, 1]).toContain(yahooProduct.shipping.code);

        // 送料別の場合の処理確認
        if (rakutenProduct.postageFlag === 0) {
          // 楽天は送料別 - 実際の実装では送料計算が必要
        }

        if (yahooProduct.shipping.code === 0) {
          // Yahoo!は送料別 - shipping.priceまたはデフォルト送料
          const shippingCost = await yahooConnector.getShippingCost(
            yahooProduct.code,
            "東京都",
          );
          expect(typeof shippingCost).toBe("number");
        }
      }
    });
  });

  describe("Error handling consistency", () => {
    it("should handle search errors consistently across platforms", async () => {
      // 空のキーワードでの検索
      const rakutenResults = await rakutenConnector.searchProducts({
        keyword: "",
      });
      const yahooResults = await yahooConnector.searchProducts({ query: "" });

      // 両方とも結果を返すか、一貫したエラーハンドリング
      expect(Array.isArray(rakutenResults)).toBe(true);
      expect(Array.isArray(yahooResults)).toBe(true);
    });

    it("should handle non-existent product queries consistently", async () => {
      const nonExistentQuery = "non-existent-product-12345";

      const rakutenResults = await rakutenConnector.searchProducts({
        keyword: nonExistentQuery,
      });
      const yahooResults = await yahooConnector.searchProducts({
        query: nonExistentQuery,
      });

      // 両方とも空の配列を返すべき
      expect(rakutenResults).toEqual([]);
      expect(yahooResults).toEqual([]);
    });
  });

  describe("Performance characteristics", () => {
    it("should complete searches within reasonable time", async () => {
      const startTime = Date.now();

      const [rakutenResults, yahooResults] = await Promise.all([
        rakutenConnector.searchProducts({ keyword: "ビタミン" }),
        yahooConnector.searchProducts({ query: "ビタミン" }),
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // モックなので高速であることを確認（実際のAPIでは調整が必要）
      expect(duration).toBeLessThan(1000); // 1秒以内

      expect(rakutenResults.length).toBeGreaterThan(0);
      expect(yahooResults.length).toBeGreaterThan(0);
    });

    it("should handle concurrent requests properly", async () => {
      const requests = Array.from({ length: 5 }, (_, i) => [
        rakutenConnector.searchProducts({ keyword: `test${i}` }),
        yahooConnector.searchProducts({ query: `test${i}` }),
      ]).flat();

      const results = await Promise.all(requests);

      // すべてのリクエストが完了することを確認
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe("Data format consistency", () => {
    it("should provide consistent product data structure", async () => {
      const rakutenResults = await rakutenConnector.searchProducts({
        keyword: "ビタミン",
      });
      const yahooResults = await yahooConnector.searchProducts({
        query: "ビタミン",
      });

      if (rakutenResults.length > 0) {
        const rakutenProduct = rakutenResults[0];

        // 楽天商品の必須フィールド確認
        expect(rakutenProduct).toHaveProperty("itemCode");
        expect(rakutenProduct).toHaveProperty("itemName");
        expect(rakutenProduct).toHaveProperty("itemPrice");
        expect(rakutenProduct).toHaveProperty("itemUrl");
        expect(rakutenProduct).toHaveProperty("availability");
        expect(rakutenProduct).toHaveProperty("reviewCount");
        expect(rakutenProduct).toHaveProperty("reviewAverage");
        expect(rakutenProduct).toHaveProperty("shopName");
      }

      if (yahooResults.length > 0) {
        const yahooProduct = yahooResults[0];

        // Yahoo!商品の必須フィールド確認
        expect(yahooProduct).toHaveProperty("code");
        expect(yahooProduct).toHaveProperty("name");
        expect(yahooProduct).toHaveProperty("price");
        expect(yahooProduct).toHaveProperty("url");
        expect(yahooProduct).toHaveProperty("inStock");
        expect(yahooProduct).toHaveProperty("review");
        expect(yahooProduct).toHaveProperty("seller");
        expect(yahooProduct.review).toHaveProperty("count");
        expect(yahooProduct.review).toHaveProperty("rate");
        expect(yahooProduct.seller).toHaveProperty("name");
      }
    });
  });

  describe("Boundary value testing", () => {
    it("should handle edge cases in price filtering", async () => {
      // 最小価格での検索
      const minPriceResults = await Promise.all([
        rakutenConnector.searchProducts({ keyword: "", minPrice: 1 }),
        yahooConnector.searchProducts({ query: "", minPrice: 1 }),
      ]);

      minPriceResults.forEach((results) => {
        results.forEach((product) => {
          const price =
            "itemPrice" in product ? product.itemPrice : product.price;
          expect(price).toBeGreaterThanOrEqual(1);
        });
      });

      // 最大価格での検索
      const maxPriceResults = await Promise.all([
        rakutenConnector.searchProducts({ keyword: "", maxPrice: 999999 }),
        yahooConnector.searchProducts({ query: "", maxPrice: 999999 }),
      ]);

      maxPriceResults.forEach((results) => {
        results.forEach((product) => {
          const price =
            "itemPrice" in product ? product.itemPrice : product.price;
          expect(price).toBeLessThanOrEqual(999999);
        });
      });
    });

    it("should handle pagination edge cases", async () => {
      // 最初のページ
      const firstPageResults = await Promise.all([
        rakutenConnector.searchProducts({ keyword: "", page: 1, hits: 1 }),
        yahooConnector.searchProducts({ query: "", start: 1, results: 1 }),
      ]);

      firstPageResults.forEach((results) => {
        expect(results.length).toBeLessThanOrEqual(1);
      });

      // 存在しないページ
      const emptyPageResults = await Promise.all([
        rakutenConnector.searchProducts({ keyword: "", page: 999, hits: 1 }),
        yahooConnector.searchProducts({ query: "", start: 999, results: 1 }),
      ]);

      emptyPageResults.forEach((results) => {
        expect(results.length).toBe(0);
      });
    });
  });
});
