import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import {
  AggregateRatingJsonLd,
  EnhancedProductJsonLd,
  AggregateRatingJsonLdProps,
  EnhancedProductJsonLdProps,
} from "../AggregateRatingJsonLd";
import { ScoreResult, DEFAULT_WEIGHTS } from "../../../lib/scoring";
import { AggregateRating } from "../../../lib/seo/aggregate-rating";

// Mock console.warn to test validation warnings
const mockConsoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

describe("AggregateRatingJsonLd", () => {
  const mockScoreResult: ScoreResult = {
    total: 75.5,
    components: {
      evidence: 80,
      safety: 85,
      cost: 60,
      practicality: 70,
    },
    weights: DEFAULT_WEIGHTS,
    breakdown: {
      evidence: { score: 80, factors: [], explanation: "Test evidence" },
      safety: { score: 85, factors: [], explanation: "Test safety" },
      cost: { score: 60, factors: [], explanation: "Test cost" },
      practicality: {
        score: 70,
        factors: [],
        explanation: "Test practicality",
      },
    },
    isComplete: true,
    missingData: [],
  };

  beforeEach(() => {
    mockConsoleWarn.mockClear();
  });

  describe("AggregateRatingJsonLd Component", () => {
    it("should render JSON-LD script with ScoreResult", () => {
      const props: AggregateRatingJsonLdProps = {
        productId: "test-product",
        scoreResult: mockScoreResult,
        reviewCount: 10,
      };

      const { container } = render(<AggregateRatingJsonLd {...props} />);
      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );

      expect(script).toBeTruthy();

      const jsonLd = JSON.parse(script?.textContent || "{}");
      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("AggregateRating");
      expect(jsonLd.ratingValue).toBe(3.8); // 75.5 / 100 * 5 = 3.775 -> 3.8
      expect(jsonLd.bestRating).toBe(5);
      expect(jsonLd.worstRating).toBe(0);
      expect(jsonLd.ratingCount).toBe(10);
    });

    it("should render JSON-LD script with totalScore", () => {
      const props: AggregateRatingJsonLdProps = {
        productId: "test-product",
        totalScore: 85,
        reviewCount: 5,
      };

      const { container } = render(<AggregateRatingJsonLd {...props} />);
      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );

      expect(script).toBeTruthy();

      const jsonLd = JSON.parse(script?.textContent || "{}");
      expect(jsonLd.ratingValue).toBe(4.3); // 85 / 100 * 5 = 4.25 -> 4.3
      expect(jsonLd.ratingCount).toBe(5);
    });

    it("should render JSON-LD script with custom rating", () => {
      const customRating: AggregateRating = {
        "@type": "AggregateRating",
        ratingValue: 4.2,
        bestRating: 5,
        worstRating: 0,
        ratingCount: 15,
      };

      const props: AggregateRatingJsonLdProps = {
        productId: "test-product",
        customRating,
      };

      const { container } = render(<AggregateRatingJsonLd {...props} />);
      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );

      expect(script).toBeTruthy();

      const jsonLd = JSON.parse(script?.textContent || "{}");
      expect(jsonLd.ratingValue).toBe(4.2);
      expect(jsonLd.ratingCount).toBe(15);
    });

    it("should handle custom maxScore", () => {
      const props: AggregateRatingJsonLdProps = {
        productId: "test-product",
        totalScore: 8,
        maxScore: 10,
        reviewCount: 3,
      };

      const { container } = render(<AggregateRatingJsonLd {...props} />);
      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );

      expect(script).toBeTruthy();

      const jsonLd = JSON.parse(script?.textContent || "{}");
      expect(jsonLd.ratingValue).toBe(4.0); // 8 / 10 * 5 = 4.0
      expect(jsonLd.ratingCount).toBe(3);
    });

    it("should not render when no valid rating data", () => {
      const props: AggregateRatingJsonLdProps = {
        productId: "test-product",
        // No scoreResult, totalScore, or customRating
      };

      const { container } = render(<AggregateRatingJsonLd {...props} />);
      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );

      expect(script).toBeFalsy();
    });

    it("should not render when ratingCount is 0", () => {
      const props: AggregateRatingJsonLdProps = {
        productId: "test-product",
        totalScore: 75,
        reviewCount: 0,
      };

      const { container } = render(<AggregateRatingJsonLd {...props} />);
      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );

      expect(script).toBeFalsy();
    });

    it("should handle validation errors gracefully", () => {
      const invalidRating: AggregateRating = {
        "@type": "AggregateRating",
        ratingValue: 6, // Invalid: above bestRating
        bestRating: 5,
        worstRating: 0,
        ratingCount: 10,
      };

      const props: AggregateRatingJsonLdProps = {
        productId: "test-product",
        customRating: invalidRating,
        validate: true,
      };

      const { container } = render(<AggregateRatingJsonLd {...props} />);
      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );

      expect(script).toBeFalsy(); // Should not render due to validation failure
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining("AggregateRating validation failed"),
        expect.any(Array),
      );
    });

    it("should skip validation when validate=false", () => {
      const invalidRating: AggregateRating = {
        "@type": "AggregateRating",
        ratingValue: 6, // Invalid: above bestRating
        bestRating: 5,
        worstRating: 0,
        ratingCount: 10,
      };

      const props: AggregateRatingJsonLdProps = {
        productId: "test-product",
        customRating: invalidRating,
        validate: false,
      };

      const { container } = render(<AggregateRatingJsonLd {...props} />);
      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );

      expect(script).toBeTruthy(); // Should render despite invalid data
      expect(mockConsoleWarn).not.toHaveBeenCalled();
    });
  });

  describe("EnhancedProductJsonLd Component", () => {
    const mockProduct = {
      name: "テストサプリメント",
      brand: "テストブランド",
      description: "テスト用のサプリメント説明",
      priceJPY: 2980,
      slug: "test-supplement",
      images: [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg",
      ],
    };

    it("should render enhanced Product JSON-LD with aggregate rating", () => {
      const props: EnhancedProductJsonLdProps = {
        product: mockProduct,
        scoreResult: mockScoreResult,
        reviewCount: 25,
      };

      const { container } = render(<EnhancedProductJsonLd {...props} />);
      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );

      expect(script).toBeTruthy();

      const jsonLd = JSON.parse(script?.textContent || "{}");

      // Check basic product data
      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("Product");
      expect(jsonLd.name).toBe(mockProduct.name);
      expect(jsonLd.brand.name).toBe(mockProduct.brand);
      expect(jsonLd.description).toBe(mockProduct.description);
      expect(jsonLd.image).toBe(mockProduct.images[0]);
      expect(jsonLd.url).toBe(`/products/${mockProduct.slug}`);

      // Check offers
      expect(jsonLd.offers).toBeDefined();
      expect(jsonLd.offers["@type"]).toBe("Offer");
      expect(jsonLd.offers.price).toBe(mockProduct.priceJPY);
      expect(jsonLd.offers.priceCurrency).toBe("JPY");

      // Check aggregate rating
      expect(jsonLd.aggregateRating).toBeDefined();
      expect(jsonLd.aggregateRating["@type"]).toBe("AggregateRating");
      expect(jsonLd.aggregateRating.ratingValue).toBe(3.8);
      expect(jsonLd.aggregateRating.ratingCount).toBe(25);
    });

    it("should render without aggregate rating when no score", () => {
      const props: EnhancedProductJsonLdProps = {
        product: mockProduct,
        // No scoreResult
      };

      const { container } = render(<EnhancedProductJsonLd {...props} />);
      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );

      expect(script).toBeTruthy();

      const jsonLd = JSON.parse(script?.textContent || "{}");
      expect(jsonLd.aggregateRating).toBeUndefined();
    });

    it("should handle multiple offers", () => {
      const offers = [
        {
          price: 2980,
          priceCurrency: "JPY",
          availability: "https://schema.org/InStock",
          seller: "楽天市場",
          url: "https://rakuten.co.jp/product/123",
        },
        {
          price: 3200,
          priceCurrency: "JPY",
          availability: "https://schema.org/InStock",
          seller: "Yahoo!ショッピング",
          url: "https://shopping.yahoo.co.jp/product/456",
        },
      ];

      const props: EnhancedProductJsonLdProps = {
        product: mockProduct,
        scoreResult: mockScoreResult,
        offers,
      };

      const { container } = render(<EnhancedProductJsonLd {...props} />);
      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );

      expect(script).toBeTruthy();

      const jsonLd = JSON.parse(script?.textContent || "{}");
      expect(Array.isArray(jsonLd.offers)).toBe(true);
      expect(jsonLd.offers).toHaveLength(2);
      expect(jsonLd.offers[0].seller.name).toBe("楽天市場");
      expect(jsonLd.offers[1].seller.name).toBe("Yahoo!ショッピング");
    });

    it("should handle missing optional product data", () => {
      const minimalProduct = {
        name: "ミニマルサプリ",
        brand: "ミニマルブランド",
        priceJPY: 1500,
        slug: "minimal-supplement",
        // No description or images
      };

      const props: EnhancedProductJsonLdProps = {
        product: minimalProduct,
      };

      const { container } = render(<EnhancedProductJsonLd {...props} />);
      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );

      expect(script).toBeTruthy();

      const jsonLd = JSON.parse(script?.textContent || "{}");
      expect(jsonLd.name).toBe(minimalProduct.name);
      expect(jsonLd.description).toBe(
        `${minimalProduct.brand}の${minimalProduct.name}`,
      );
      expect(jsonLd.image).toBe("/product-placeholder.jpg");
    });

    it("should handle validation errors in aggregate rating", () => {
      // Create a score result that will produce an invalid rating after conversion
      const zeroScoreResult: ScoreResult = {
        ...mockScoreResult,
        total: 0, // This will result in ratingCount: 0 which should not render
      };

      const props: EnhancedProductJsonLdProps = {
        product: mockProduct,
        scoreResult: zeroScoreResult,
        reviewCount: 10,
      };

      const { container } = render(<EnhancedProductJsonLd {...props} />);
      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );

      expect(script).toBeTruthy();

      const jsonLd = JSON.parse(script?.textContent || "{}");
      // Should not include aggregateRating when score is 0
      expect(jsonLd.aggregateRating).toBeUndefined();
    });
  });

  describe("Schema.org Compliance", () => {
    it("should generate valid schema.org structured data", () => {
      const props: AggregateRatingJsonLdProps = {
        productId: "compliance-test",
        scoreResult: mockScoreResult,
        reviewCount: 50,
      };

      const { container } = render(<AggregateRatingJsonLd {...props} />);
      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );

      expect(script).toBeTruthy();

      const jsonLd = JSON.parse(script?.textContent || "{}");

      // Required fields for AggregateRating
      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("AggregateRating");
      expect(typeof jsonLd.ratingValue).toBe("number");
      expect(typeof jsonLd.bestRating).toBe("number");
      expect(typeof jsonLd.worstRating).toBe("number");
      expect(typeof jsonLd.ratingCount).toBe("number");

      // Value constraints
      expect(jsonLd.ratingValue).toBeGreaterThanOrEqual(jsonLd.worstRating);
      expect(jsonLd.ratingValue).toBeLessThanOrEqual(jsonLd.bestRating);
      expect(jsonLd.bestRating).toBeGreaterThan(jsonLd.worstRating);
      expect(jsonLd.ratingCount).toBeGreaterThanOrEqual(0);
    });

    it("should format rating values to 1 decimal place", () => {
      const props: AggregateRatingJsonLdProps = {
        productId: "decimal-test",
        totalScore: 73.456789, // Should be rounded to 1 decimal
        reviewCount: 1,
      };

      const { container } = render(<AggregateRatingJsonLd {...props} />);
      const script = container.querySelector(
        'script[type="application/ld+json"]',
      );

      expect(script).toBeTruthy();

      const jsonLd = JSON.parse(script?.textContent || "{}");

      // Check that ratingValue has exactly 1 decimal place
      const ratingStr = jsonLd.ratingValue.toString();
      const decimalIndex = ratingStr.indexOf(".");
      if (decimalIndex !== -1) {
        const decimalPlaces = ratingStr.length - decimalIndex - 1;
        expect(decimalPlaces).toBeLessThanOrEqual(1);
      }
    });
  });
});
