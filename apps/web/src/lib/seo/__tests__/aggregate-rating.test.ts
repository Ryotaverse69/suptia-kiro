import { describe, it, expect } from "vitest";
import {
  convertToFivePointScale,
  formatToOneDecimal,
  calculateAggregateRating,
  calculateAggregateRatingFromScores,
  validateAggregateRating,
  createSafeAggregateRating,
  DEFAULT_RATING_CONFIG,
  AggregateRating,
  RatingConfig,
} from "../aggregate-rating";
import { ScoreResult, DEFAULT_WEIGHTS } from "../../scoring";

describe("Aggregate Rating Utilities", () => {
  describe("convertToFivePointScale", () => {
    it("should convert 0-100 scale to 0-5 scale correctly", () => {
      expect(convertToFivePointScale(0)).toBe(0.0);
      expect(convertToFivePointScale(20)).toBe(1.0);
      expect(convertToFivePointScale(40)).toBe(2.0);
      expect(convertToFivePointScale(60)).toBe(3.0);
      expect(convertToFivePointScale(80)).toBe(4.0);
      expect(convertToFivePointScale(100)).toBe(5.0);
    });

    it("should handle intermediate values with 1 decimal place", () => {
      expect(convertToFivePointScale(75)).toBe(3.8);
      expect(convertToFivePointScale(85)).toBe(4.3);
      expect(convertToFivePointScale(92)).toBe(4.6);
      expect(convertToFivePointScale(33)).toBe(1.7);
    });

    it("should clamp values outside valid range", () => {
      expect(convertToFivePointScale(-10)).toBe(0.0);
      expect(convertToFivePointScale(150)).toBe(5.0);
    });

    it("should handle invalid inputs", () => {
      expect(convertToFivePointScale(NaN)).toBe(0.0);
      expect(convertToFivePointScale(Infinity)).toBe(0.0);
      expect(convertToFivePointScale(-Infinity)).toBe(0.0);
    });

    it("should work with custom config", () => {
      const customConfig: RatingConfig = {
        maxScore: 10,
        minScore: 0,
        targetMax: 5,
        targetMin: 0,
        decimalPlaces: 2,
      };

      expect(convertToFivePointScale(5, customConfig)).toBe(2.5);
      expect(convertToFivePointScale(7.5, customConfig)).toBe(3.75);
    });
  });

  describe("formatToOneDecimal", () => {
    it("should format numbers to 1 decimal place", () => {
      expect(formatToOneDecimal(3.14159)).toBe(3.1);
      expect(formatToOneDecimal(2.95)).toBe(3.0);
      expect(formatToOneDecimal(4.04)).toBe(4.0);
      expect(formatToOneDecimal(1.99)).toBe(2.0);
    });

    it("should handle integers", () => {
      expect(formatToOneDecimal(3)).toBe(3.0);
      expect(formatToOneDecimal(0)).toBe(0.0);
      expect(formatToOneDecimal(5)).toBe(5.0);
    });

    it("should handle invalid inputs", () => {
      expect(formatToOneDecimal(NaN)).toBe(0);
      expect(formatToOneDecimal(Infinity)).toBe(0);
      expect(formatToOneDecimal(-Infinity)).toBe(0);
    });

    it("should work with custom decimal places", () => {
      expect(formatToOneDecimal(3.14159, 2)).toBe(3.14);
      expect(formatToOneDecimal(3.14159, 0)).toBe(3);
      expect(formatToOneDecimal(3.14159, 3)).toBe(3.142);
    });
  });

  describe("calculateAggregateRating", () => {
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
        evidence: {
          score: 80,
          factors: [],
          explanation: "Test evidence",
        },
        safety: {
          score: 85,
          factors: [],
          explanation: "Test safety",
        },
        cost: {
          score: 60,
          factors: [],
          explanation: "Test cost",
        },
        practicality: {
          score: 70,
          factors: [],
          explanation: "Test practicality",
        },
      },
      isComplete: true,
      missingData: [],
    };

    it("should calculate aggregate rating from ScoreResult", () => {
      const rating = calculateAggregateRating(mockScoreResult);

      expect(rating["@type"]).toBe("AggregateRating");
      expect(rating.ratingValue).toBe(3.8); // 75.5 / 100 * 5 = 3.775 -> 3.8
      expect(rating.bestRating).toBe(5);
      expect(rating.worstRating).toBe(0);
      expect(rating.ratingCount).toBe(1);
    });

    it("should handle custom review count", () => {
      const rating = calculateAggregateRating(mockScoreResult, 25);

      expect(rating.ratingCount).toBe(25);
      expect(rating.ratingValue).toBe(3.8);
    });

    it("should handle zero or negative review count", () => {
      const rating1 = calculateAggregateRating(mockScoreResult, 0);
      const rating2 = calculateAggregateRating(mockScoreResult, -5);

      expect(rating1.ratingCount).toBe(1);
      expect(rating2.ratingCount).toBe(1);
    });

    it("should handle fractional review count", () => {
      const rating = calculateAggregateRating(mockScoreResult, 3.7);

      expect(rating.ratingCount).toBe(3); // Should be floored
    });
  });

  describe("calculateAggregateRatingFromScores", () => {
    it("should calculate aggregate rating from multiple scores", () => {
      const scores = [80, 75, 85, 70, 90];
      const rating = calculateAggregateRatingFromScores(scores);

      const expectedAverage = (80 + 75 + 85 + 70 + 90) / 5; // 80
      const expectedRating = 4.0; // 80 / 100 * 5

      expect(rating.ratingValue).toBe(expectedRating);
      expect(rating.ratingCount).toBe(5);
    });

    it("should filter out invalid scores", () => {
      const scores = [80, NaN, 75, Infinity, 85, -Infinity];
      const rating = calculateAggregateRatingFromScores(scores);

      const expectedAverage = (80 + 75 + 85) / 3; // 80
      const expectedRating = 4.0;

      expect(rating.ratingValue).toBe(expectedRating);
      expect(rating.ratingCount).toBe(3);
    });

    it("should handle empty score array", () => {
      const rating = calculateAggregateRatingFromScores([]);

      expect(rating.ratingValue).toBe(0);
      expect(rating.ratingCount).toBe(0);
    });

    it("should handle array with only invalid scores", () => {
      const scores = [NaN, Infinity, -Infinity];
      const rating = calculateAggregateRatingFromScores(scores);

      expect(rating.ratingValue).toBe(0);
      expect(rating.ratingCount).toBe(0);
    });
  });

  describe("validateAggregateRating", () => {
    it("should validate correct AggregateRating", () => {
      const validRating: AggregateRating = {
        "@type": "AggregateRating",
        ratingValue: 3.5,
        bestRating: 5,
        worstRating: 0,
        ratingCount: 10,
      };

      const result = validateAggregateRating(validRating);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect invalid @type", () => {
      const invalidRating = {
        "@type": "InvalidType",
        ratingValue: 3.5,
        bestRating: 5,
        worstRating: 0,
        ratingCount: 10,
      } as any;

      const result = validateAggregateRating(invalidRating);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('@type must be "AggregateRating"');
    });

    it("should detect invalid ratingValue", () => {
      const invalidRating: AggregateRating = {
        "@type": "AggregateRating",
        ratingValue: 6, // Above bestRating
        bestRating: 5,
        worstRating: 0,
        ratingCount: 10,
      };

      const result = validateAggregateRating(invalidRating);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((error) => error.includes("ratingValue"))).toBe(
        true,
      );
    });

    it("should detect invalid bestRating", () => {
      const invalidRating: AggregateRating = {
        "@type": "AggregateRating",
        ratingValue: 3.5,
        bestRating: 0, // Not positive
        worstRating: 0,
        ratingCount: 10,
      };

      const result = validateAggregateRating(invalidRating);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("bestRating must be a positive number");
    });

    it("should detect invalid worstRating", () => {
      const invalidRating: AggregateRating = {
        "@type": "AggregateRating",
        ratingValue: 3.5,
        bestRating: 5,
        worstRating: -1, // Negative
        ratingCount: 10,
      };

      const result = validateAggregateRating(invalidRating);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "worstRating must be a non-negative number",
      );
    });

    it("should detect invalid ratingCount", () => {
      const invalidRating: AggregateRating = {
        "@type": "AggregateRating",
        ratingValue: 3.5,
        bestRating: 5,
        worstRating: 0,
        ratingCount: -5, // Negative
      };

      const result = validateAggregateRating(invalidRating);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "ratingCount must be a non-negative integer",
      );
    });

    it("should detect inconsistent rating scale", () => {
      const invalidRating: AggregateRating = {
        "@type": "AggregateRating",
        ratingValue: 3.5,
        bestRating: 2, // Less than worstRating
        worstRating: 5,
        ratingCount: 10,
      };

      const result = validateAggregateRating(invalidRating);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "bestRating must be greater than worstRating",
      );
    });

    it("should detect multiple errors", () => {
      const invalidRating = {
        "@type": "InvalidType",
        ratingValue: NaN,
        bestRating: -1,
        worstRating: -2,
        ratingCount: 3.5,
      } as any;

      const result = validateAggregateRating(invalidRating);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe("createSafeAggregateRating", () => {
    it("should create valid AggregateRating with default values", () => {
      const rating = createSafeAggregateRating();

      expect(rating["@type"]).toBe("AggregateRating");
      expect(rating.ratingValue).toBe(0.0);
      expect(rating.bestRating).toBe(5);
      expect(rating.worstRating).toBe(0);
      expect(rating.ratingCount).toBe(0);
    });

    it("should create valid AggregateRating with custom values", () => {
      const rating = createSafeAggregateRating(3.7, 15);

      expect(rating.ratingValue).toBe(3.7);
      expect(rating.ratingCount).toBe(15);
    });

    it("should clamp invalid ratingValue", () => {
      const rating1 = createSafeAggregateRating(-1, 5);
      const rating2 = createSafeAggregateRating(6, 5);
      const rating3 = createSafeAggregateRating(NaN, 5);

      expect(rating1.ratingValue).toBe(0.0);
      expect(rating2.ratingValue).toBe(5.0);
      expect(rating3.ratingValue).toBe(0.0);
    });

    it("should clamp invalid ratingCount", () => {
      const rating1 = createSafeAggregateRating(3.5, -5);
      const rating2 = createSafeAggregateRating(3.5, 3.7);
      const rating3 = createSafeAggregateRating(3.5, NaN);

      expect(rating1.ratingCount).toBe(0);
      expect(rating2.ratingCount).toBe(0); // Non-integer becomes 0
      expect(rating3.ratingCount).toBe(0);
    });

    it("should always pass validation", () => {
      const rating1 = createSafeAggregateRating();
      const rating2 = createSafeAggregateRating(3.5, 10);
      const rating3 = createSafeAggregateRating(-100, -100); // Invalid inputs

      expect(validateAggregateRating(rating1).isValid).toBe(true);
      expect(validateAggregateRating(rating2).isValid).toBe(true);
      expect(validateAggregateRating(rating3).isValid).toBe(true);
    });
  });

  describe("Edge Cases and Integration", () => {
    it("should handle boundary values correctly", () => {
      // Test exact boundary values
      expect(convertToFivePointScale(0)).toBe(0.0);
      expect(convertToFivePointScale(100)).toBe(5.0);
      expect(convertToFivePointScale(50)).toBe(2.5);
    });

    it("should maintain precision in conversion chain", () => {
      const originalScore = 73.6;
      const converted = convertToFivePointScale(originalScore);
      const formatted = formatToOneDecimal(converted);

      // 73.6 / 100 * 5 = 3.68 -> 3.7
      expect(formatted).toBe(3.7);
    });

    it("should handle real-world ScoreResult data", () => {
      const realScoreResult: ScoreResult = {
        total: 82.3,
        components: {
          evidence: 85,
          safety: 90,
          cost: 75,
          practicality: 80,
        },
        weights: DEFAULT_WEIGHTS,
        breakdown: {
          evidence: { score: 85, factors: [], explanation: "" },
          safety: { score: 90, factors: [], explanation: "" },
          cost: { score: 75, factors: [], explanation: "" },
          practicality: { score: 80, factors: [], explanation: "" },
        },
        isComplete: true,
        missingData: [],
      };

      const rating = calculateAggregateRating(realScoreResult, 42);

      expect(rating.ratingValue).toBe(4.1); // 82.3 / 100 * 5 = 4.115 -> 4.1
      expect(rating.ratingCount).toBe(42);
      expect(validateAggregateRating(rating).isValid).toBe(true);
    });
  });
});
