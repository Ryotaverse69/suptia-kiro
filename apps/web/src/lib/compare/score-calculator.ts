import type { Product, ScoreSummary } from "@/components/compare/types";

/**
 * Optimized score calculation utilities
 */

// Cache for expensive calculations
const calculationCache = new Map<string, any>();

/**
 * Generate cache key for score calculations
 */
function generateCacheKey(products: Product[], operation: string): string {
  const productIds = products
    .map((p) => p.id)
    .sort()
    .join(",");
  const productVersions = products
    .map((p) => `${p.id}:${p.totalScore}:${p.warnings.length}`)
    .join("|");
  return `${operation}:${productIds}:${productVersions}`;
}

/**
 * Optimized score summary calculation with caching
 */
export function calculateScoreSummariesOptimized(
  products: Product[],
): ScoreSummary[] {
  if (products.length === 0) return [];

  const cacheKey = generateCacheKey(products, "scoreSummaries");

  // Check cache first
  if (calculationCache.has(cacheKey)) {
    return calculationCache.get(cacheKey);
  }

  // Get all unique categories efficiently
  const categoriesSet = new Set<string>();
  products.forEach((product) => {
    Object.keys(product.scoreBreakdown).forEach((category) => {
      categoriesSet.add(category);
    });
  });

  const categories = Array.from(categoriesSet);

  // Calculate summaries using optimized algorithms
  const summaries = categories.map((category) => {
    const scores = products.map((product) => ({
      productId: product.id,
      score: product.scoreBreakdown[category] || 0,
    }));

    // Use single pass for min/max/sum calculation
    let minScore = Infinity;
    let maxScore = -Infinity;
    let sum = 0;

    scores.forEach(({ score }) => {
      if (score < minScore) minScore = score;
      if (score > maxScore) maxScore = score;
      sum += score;
    });

    const averageScore = sum / scores.length;

    return {
      category,
      maxScore,
      minScore,
      averageScore,
      products: scores,
    };
  });

  // Cache the result
  calculationCache.set(cacheKey, summaries);

  // Clean cache if it gets too large (prevent memory leaks)
  if (calculationCache.size > 100) {
    const firstKey = calculationCache.keys().next().value;
    if (firstKey) {
      calculationCache.delete(firstKey);
    }
  }

  return summaries;
}

/**
 * Optimized product ranking calculation
 */
export function calculateProductRankingsOptimized(products: Product[]): Array<{
  productId: string;
  rank: number;
  score: number;
  percentile: number;
}> {
  if (products.length === 0) return [];

  const cacheKey = generateCacheKey(products, "rankings");

  if (calculationCache.has(cacheKey)) {
    return calculationCache.get(cacheKey);
  }

  // Sort products by score (descending) and assign ranks
  const sortedProducts = [...products].sort(
    (a, b) => b.totalScore - a.totalScore,
  );

  const rankings = sortedProducts.map((product, index) => ({
    productId: product.id,
    rank: index + 1,
    score: product.totalScore,
    percentile: ((products.length - index) / products.length) * 100,
  }));

  calculationCache.set(cacheKey, rankings);

  return rankings;
}

/**
 * Optimized warning severity calculation
 */
export function calculateWarningSeverityOptimized(products: Product[]): Record<
  string,
  {
    totalWarnings: number;
    criticalWarnings: number;
    severityScore: number;
    riskLevel: "low" | "medium" | "high" | "critical";
  }
> {
  const cacheKey = generateCacheKey(products, "warningSeverity");

  if (calculationCache.has(cacheKey)) {
    return calculationCache.get(cacheKey);
  }

  const result: Record<string, any> = {};

  products.forEach((product) => {
    const warnings = product.warnings;
    const totalWarnings = warnings.length;
    const criticalWarnings = warnings.filter(
      (w) => w.type === "critical",
    ).length;

    // Calculate severity score using weighted sum
    const severityScore = warnings.reduce((sum, warning) => {
      const typeWeight =
        warning.type === "critical" ? 3 : warning.type === "warning" ? 2 : 1;
      return sum + warning.severity * typeWeight;
    }, 0);

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" | "critical" = "low";
    if (criticalWarnings > 0) {
      riskLevel = "critical";
    } else if (severityScore > 20) {
      riskLevel = "high";
    } else if (severityScore > 10) {
      riskLevel = "medium";
    }

    result[product.id] = {
      totalWarnings,
      criticalWarnings,
      severityScore,
      riskLevel,
    };
  });

  calculationCache.set(cacheKey, result);

  return result;
}

/**
 * Batch calculation for multiple metrics (more efficient)
 */
export function calculateAllMetricsOptimized(products: Product[]): {
  scoreSummaries: ScoreSummary[];
  rankings: Array<{
    productId: string;
    rank: number;
    score: number;
    percentile: number;
  }>;
  warningSeverity: Record<
    string,
    {
      totalWarnings: number;
      criticalWarnings: number;
      severityScore: number;
      riskLevel: "low" | "medium" | "high" | "critical";
    }
  >;
} {
  const cacheKey = generateCacheKey(products, "allMetrics");

  if (calculationCache.has(cacheKey)) {
    return calculationCache.get(cacheKey);
  }

  const result = {
    scoreSummaries: calculateScoreSummariesOptimized(products),
    rankings: calculateProductRankingsOptimized(products),
    warningSeverity: calculateWarningSeverityOptimized(products),
  };

  calculationCache.set(cacheKey, result);

  return result;
}

/**
 * Clear calculation cache (useful for testing or memory management)
 */
export function clearCalculationCache(): void {
  calculationCache.clear();
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats(): {
  size: number;
  keys: string[];
} {
  return {
    size: calculationCache.size,
    keys: Array.from(calculationCache.keys()),
  };
}
