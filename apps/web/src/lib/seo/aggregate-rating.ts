import { ScoreResult } from "../scoring";

/**
 * AggregateRating interface for schema.org compliance
 */
export interface AggregateRating {
  "@type": "AggregateRating";
  ratingValue: number; // 0-5スケール、1桁小数
  bestRating: number;
  worstRating: number;
  ratingCount: number;
}

/**
 * Rating calculation configuration
 */
export interface RatingConfig {
  maxScore: number; // 元のスコアの最大値（通常100）
  minScore: number; // 元のスコアの最小値（通常0）
  targetMax: number; // 変換後の最大値（5）
  targetMin: number; // 変換後の最小値（0）
  decimalPlaces: number; // 小数点以下の桁数（1）
}

/**
 * Default rating configuration
 */
export const DEFAULT_RATING_CONFIG: RatingConfig = {
  maxScore: 100,
  minScore: 0,
  targetMax: 5,
  targetMin: 0,
  decimalPlaces: 1,
} as const;

/**
 * Convert score from 0-100 scale to 0-5 scale
 * @param score - Original score (0-100)
 * @param config - Rating configuration
 * @returns Converted rating (0-5) with specified decimal places
 */
export function convertToFivePointScale(
  score: number,
  config: RatingConfig = DEFAULT_RATING_CONFIG,
): number {
  // Input validation
  if (!Number.isFinite(score)) {
    return config.targetMin;
  }

  // Clamp score to valid range
  const clampedScore = Math.max(
    config.minScore,
    Math.min(config.maxScore, score),
  );

  // Convert to 0-5 scale
  const normalizedScore =
    (clampedScore - config.minScore) / (config.maxScore - config.minScore);
  const convertedScore =
    normalizedScore * (config.targetMax - config.targetMin) + config.targetMin;

  // Round to specified decimal places
  return formatToOneDecimal(convertedScore, config.decimalPlaces);
}

/**
 * Format rating value to specified decimal places
 * @param rating - Rating value
 * @param decimalPlaces - Number of decimal places (default: 1)
 * @returns Formatted rating
 */
export function formatToOneDecimal(
  rating: number,
  decimalPlaces: number = 1,
): number {
  if (!Number.isFinite(rating)) {
    return 0;
  }

  const factor = Math.pow(10, decimalPlaces);
  return Math.round(rating * factor) / factor;
}

/**
 * Calculate aggregate rating from ScoreResult
 * @param scoreResult - Product scoring result
 * @param reviewCount - Number of reviews/evaluations (optional, defaults to 1)
 * @param config - Rating configuration
 * @returns AggregateRating object for JSON-LD
 */
export function calculateAggregateRating(
  scoreResult: ScoreResult,
  reviewCount: number = 1,
  config: RatingConfig = DEFAULT_RATING_CONFIG,
): AggregateRating {
  // Convert total score to 0-5 scale
  const ratingValue = convertToFivePointScale(scoreResult.total, config);

  // Ensure reviewCount is positive
  const validReviewCount = Math.max(1, Math.floor(reviewCount));

  return {
    "@type": "AggregateRating",
    ratingValue,
    bestRating: config.targetMax,
    worstRating: config.targetMin,
    ratingCount: validReviewCount,
  };
}

/**
 * Calculate aggregate rating from multiple scores
 * @param scores - Array of scores (0-100 scale)
 * @param config - Rating configuration
 * @returns AggregateRating object for JSON-LD
 */
export function calculateAggregateRatingFromScores(
  scores: number[],
  config: RatingConfig = DEFAULT_RATING_CONFIG,
): AggregateRating {
  // Filter valid scores
  const validScores = scores.filter((score) => Number.isFinite(score));

  if (validScores.length === 0) {
    return {
      "@type": "AggregateRating",
      ratingValue: config.targetMin,
      bestRating: config.targetMax,
      worstRating: config.targetMin,
      ratingCount: 0,
    };
  }

  // Calculate average score
  const averageScore =
    validScores.reduce((sum, score) => sum + score, 0) / validScores.length;

  // Convert to 0-5 scale
  const ratingValue = convertToFivePointScale(averageScore, config);

  return {
    "@type": "AggregateRating",
    ratingValue,
    bestRating: config.targetMax,
    worstRating: config.targetMin,
    ratingCount: validScores.length,
  };
}

/**
 * Validate AggregateRating for schema.org compliance
 * @param rating - AggregateRating object
 * @returns Validation result with errors if any
 */
export function validateAggregateRating(rating: AggregateRating): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required fields
  if (rating["@type"] !== "AggregateRating") {
    errors.push('@type must be "AggregateRating"');
  }

  // Validate ratingValue
  if (!Number.isFinite(rating.ratingValue)) {
    errors.push("ratingValue must be a finite number");
  } else if (
    rating.ratingValue < rating.worstRating ||
    rating.ratingValue > rating.bestRating
  ) {
    errors.push(
      `ratingValue (${rating.ratingValue}) must be between worstRating (${rating.worstRating}) and bestRating (${rating.bestRating})`,
    );
  }

  // Validate bestRating
  if (!Number.isFinite(rating.bestRating) || rating.bestRating <= 0) {
    errors.push("bestRating must be a positive number");
  }

  // Validate worstRating
  if (!Number.isFinite(rating.worstRating) || rating.worstRating < 0) {
    errors.push("worstRating must be a non-negative number");
  }

  // Validate ratingCount
  if (!Number.isInteger(rating.ratingCount) || rating.ratingCount < 0) {
    errors.push("ratingCount must be a non-negative integer");
  }

  // Check rating scale consistency
  if (rating.bestRating <= rating.worstRating) {
    errors.push("bestRating must be greater than worstRating");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Create a safe AggregateRating with fallback values
 * @param ratingValue - Rating value (0-5 scale)
 * @param ratingCount - Number of ratings
 * @returns Valid AggregateRating object
 */
export function createSafeAggregateRating(
  ratingValue: number = 0,
  ratingCount: number = 0,
): AggregateRating {
  const safeRatingValue = Math.max(
    0,
    Math.min(5, Number.isFinite(ratingValue) ? ratingValue : 0),
  );
  const safeRatingCount = Math.max(
    0,
    Number.isInteger(ratingCount) ? ratingCount : 0,
  );

  return {
    "@type": "AggregateRating",
    ratingValue: formatToOneDecimal(safeRatingValue),
    bestRating: 5,
    worstRating: 0,
    ratingCount: safeRatingCount,
  };
}
