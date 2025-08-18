import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { EnhancedProductJsonLd } from "../../components/seo/AggregateRatingJsonLd";
import { generateProductJsonLd } from "../../lib/seo";
import { ScoreResult, DEFAULT_WEIGHTS } from "../../lib/scoring";

describe("Aggregate Rating Integration Tests", () => {
  const mockScoreResult: ScoreResult = {
    total: 82.5,
    components: {
      evidence: 85,
      safety: 90,
      cost: 75,
      practicality: 80,
    },
    weights: DEFAULT_WEIGHTS,
    breakdown: {
      evidence: {
        score: 85,
        factors: [],
        explanation: "High quality evidence",
      },
      safety: { score: 90, factors: [], explanation: "Very safe profile" },
      cost: { score: 75, factors: [], explanation: "Reasonable cost" },
      practicality: { score: 80, factors: [], explanation: "Easy to use" },
    },
    isComplete: true,
    missingData: [],
  };

  const mockProduct = {
    name: "ビタミンD3 2000IU",
    brand: "ヘルスブランド",
    description: "高品質なビタミンD3サプリメント",
    priceJPY: 1980,
    slug: "vitamin-d3-2000iu",
    images: ["https://example.com/vitamin-d3.jpg"],
  };

  describe("Schema.org Compliance", () => {
    it("should generate valid Product JSON-LD with AggregateRating", () => {
      const productData = {
        ...mockProduct,
        scoreResult: mockScoreResult,
        reviewCount: 15,
      };

      const jsonLd = generateProductJsonLd(productData);

      // Validate Product schema
      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("Product");
      expect(jsonLd.name).toBe(mockProduct.name);
      expect(jsonLd.brand["@type"]).toBe("Brand");
      expect(jsonLd.brand.name).toBe(mockProduct.brand);

      // Validate AggregateRating schema
      expect(jsonLd.aggregateRating).toBeDefined();
      expect(jsonLd.aggregateRating["@type"]).toBe("AggregateRating");
      expect(jsonLd.aggregateRating.ratingValue).toBe(4.1); // 82.5 / 100 * 5 = 4.125 -> 4.1
      expect(jsonLd.aggregateRating.bestRating).toBe(5);
      expect(jsonLd.aggregateRating.worstRating).toBe(0);
      expect(jsonLd.aggregateRating.ratingCount).toBe(15);

      // Validate rating constraints
      expect(jsonLd.aggregateRating.ratingValue).toBeGreaterThanOrEqual(
        jsonLd.aggregateRating.worstRating,
      );
      expect(jsonLd.aggregateRating.ratingValue).toBeLessThanOrEqual(
        jsonLd.aggregateRating.bestRating,
      );
      expect(jsonLd.aggregateRating.bestRating).toBeGreaterThan(
        jsonLd.aggregateRating.worstRating,
      );
      expect(jsonLd.aggregateRating.ratingCount).toBeGreaterThan(0);
    });

    it("should render valid JSON-LD in DOM", () => {
      const { container } = render(
        <EnhancedProductJsonLd
          product={mockProduct}
          scoreResult={mockScoreResult}
          reviewCount={25}
        />,
      );

      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );
      expect(script).toBeTruthy();

      const jsonLd = JSON.parse(script?.textContent || "{}");

      // Validate complete structure
      expect(jsonLd).toMatchObject({
        "@context": "https://schema.org",
        "@type": "Product",
        name: mockProduct.name,
        brand: {
          "@type": "Brand",
          name: mockProduct.brand,
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: expect.any(Number),
          bestRating: 5,
          worstRating: 0,
          ratingCount: 25,
        },
        offers: expect.objectContaining({
          "@type": "Offer",
          price: mockProduct.priceJPY,
          priceCurrency: "JPY",
        }),
      });
    });
  });

  describe("Score Conversion Accuracy", () => {
    const testCases = [
      { score: 0, expected: 0.0 },
      { score: 20, expected: 1.0 },
      { score: 40, expected: 2.0 },
      { score: 60, expected: 3.0 },
      { score: 80, expected: 4.0 },
      { score: 100, expected: 5.0 },
      { score: 75, expected: 3.8 },
      { score: 85, expected: 4.3 },
      { score: 92, expected: 4.6 },
    ];

    testCases.forEach(({ score, expected }) => {
      it(`should convert score ${score} to rating ${expected}`, () => {
        const testScoreResult = { ...mockScoreResult, total: score };
        const productData = {
          ...mockProduct,
          scoreResult: testScoreResult,
          reviewCount: 1,
        };

        const jsonLd = generateProductJsonLd(productData);

        if (score > 0) {
          expect(jsonLd.aggregateRating.ratingValue).toBe(expected);
        } else {
          expect(jsonLd.aggregateRating).toBeUndefined();
        }
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle incomplete score data gracefully", () => {
      const incompleteScore: ScoreResult = {
        total: 65.5,
        components: {
          evidence: 70,
          safety: 80,
          cost: 50,
          practicality: 60,
        },
        weights: DEFAULT_WEIGHTS,
        breakdown: {
          evidence: { score: 70, factors: [], explanation: "Limited evidence" },
          safety: { score: 80, factors: [], explanation: "Generally safe" },
          cost: { score: 50, factors: [], explanation: "Moderate cost" },
          practicality: {
            score: 60,
            factors: [],
            explanation: "Some inconvenience",
          },
        },
        isComplete: false,
        missingData: ["詳細な成分情報", "長期安全性データ"],
      };

      const productData = {
        ...mockProduct,
        scoreResult: incompleteScore,
        reviewCount: 5,
      };

      const jsonLd = generateProductJsonLd(productData);

      expect(jsonLd.aggregateRating).toBeDefined();
      expect(jsonLd.aggregateRating.ratingValue).toBe(3.3); // 65.5 / 100 * 5 = 3.275 -> 3.3
      expect(jsonLd.aggregateRating.ratingCount).toBe(5);
    });

    it("should handle multiple offers correctly", () => {
      const offers = [
        {
          price: 1980,
          priceCurrency: "JPY",
          availability: "https://schema.org/InStock",
          seller: "楽天市場",
          url: "https://rakuten.co.jp/product/123",
        },
        {
          price: 2100,
          priceCurrency: "JPY",
          availability: "https://schema.org/InStock",
          seller: "Yahoo!ショッピング",
          url: "https://shopping.yahoo.co.jp/product/456",
        },
      ];

      const { container } = render(
        <EnhancedProductJsonLd
          product={mockProduct}
          scoreResult={mockScoreResult}
          reviewCount={10}
          offers={offers}
        />,
      );

      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonLd = JSON.parse(script?.textContent || "{}");

      expect(Array.isArray(jsonLd.offers)).toBe(true);
      expect(jsonLd.offers).toHaveLength(2);
      expect(jsonLd.offers[0].seller.name).toBe("楽天市場");
      expect(jsonLd.offers[1].seller.name).toBe("Yahoo!ショッピング");
    });

    it("should maintain precision in decimal formatting", () => {
      // Test scores that result in specific decimal values
      const precisionTests = [
        { score: 73.6, expected: 3.7 }, // 73.6 / 100 * 5 = 3.68 -> 3.7
        { score: 84.2, expected: 4.2 }, // 84.2 / 100 * 5 = 4.21 -> 4.2
        { score: 91.8, expected: 4.6 }, // 91.8 / 100 * 5 = 4.59 -> 4.6
      ];

      precisionTests.forEach(({ score, expected }) => {
        const testScoreResult = { ...mockScoreResult, total: score };
        const productData = {
          ...mockProduct,
          scoreResult: testScoreResult,
          reviewCount: 1,
        };

        const jsonLd = generateProductJsonLd(productData);
        expect(jsonLd.aggregateRating.ratingValue).toBe(expected);
      });
    });
  });

  describe("Performance and Validation", () => {
    it("should validate large datasets efficiently", () => {
      const startTime = performance.now();

      // Generate multiple products with ratings
      for (let i = 0; i < 100; i++) {
        const score = Math.random() * 100;
        const testScoreResult = { ...mockScoreResult, total: score };
        const productData = {
          ...mockProduct,
          name: `テスト商品 ${i}`,
          scoreResult: testScoreResult,
          reviewCount: Math.floor(Math.random() * 50) + 1,
        };

        const jsonLd = generateProductJsonLd(productData);

        if (score > 0) {
          expect(jsonLd.aggregateRating).toBeDefined();
          expect(jsonLd.aggregateRating.ratingValue).toBeGreaterThanOrEqual(0);
          expect(jsonLd.aggregateRating.ratingValue).toBeLessThanOrEqual(5);
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 100ms for 100 products)
      expect(duration).toBeLessThan(100);
    });

    it("should handle concurrent rating calculations", async () => {
      const promises = Array.from({ length: 50 }, (_, i) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            const score = (i + 1) * 2; // Scores from 2 to 100
            const testScoreResult = { ...mockScoreResult, total: score };
            const productData = {
              ...mockProduct,
              scoreResult: testScoreResult,
              reviewCount: i + 1,
            };

            const jsonLd = generateProductJsonLd(productData);
            expect(jsonLd.aggregateRating.ratingValue).toBeGreaterThan(0);
            resolve();
          }, Math.random() * 10);
        });
      });

      await Promise.all(promises);
    });
  });
});
