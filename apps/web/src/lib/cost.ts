// Cost calculation utilities for Suptia MVP

export interface ProductCostData {
  priceJPY: number;
  servingsPerContainer: number;
  servingsPerDay: number;
  ingredients?: Array<{
    amountMgPerServing: number;
  }>;
}

export interface CostCalculationResult {
  effectiveCostPerDay: number;
  normalizedCostPerMgPerDay?: number;
  totalMgPerDay?: number;
  isCalculable: boolean;
  error?: string;
}

/**
 * Calculate effective cost per day
 * Formula: priceJPY / servingsPerContainer * servingsPerDay
 */
export function calculateEffectiveCostPerDay(product: ProductCostData): number {
  // Validate required fields
  if (typeof product.priceJPY !== "number" || isNaN(product.priceJPY)) {
    throw new Error("価格が無効です");
  }

  if (
    typeof product.servingsPerContainer !== "number" ||
    isNaN(product.servingsPerContainer)
  ) {
    throw new Error("容量が無効です");
  }

  if (
    typeof product.servingsPerDay !== "number" ||
    isNaN(product.servingsPerDay)
  ) {
    throw new Error("1日摂取量が無効です");
  }

  // Validate ranges
  if (product.priceJPY < 0) {
    throw new Error("価格は0以上である必要があります");
  }

  if (product.servingsPerContainer <= 0) {
    throw new Error("容量は0より大きい必要があります");
  }

  if (product.servingsPerDay <= 0) {
    throw new Error("1日摂取量は0より大きい必要があります");
  }

  // Check for division by zero
  if (product.servingsPerContainer === 0) {
    throw new Error("ゼロ除算エラー: 容量が0です");
  }

  const result =
    (product.priceJPY / product.servingsPerContainer) * product.servingsPerDay;

  // Validate result
  if (!isFinite(result)) {
    throw new Error("計算結果が無効です");
  }

  return result;
}

/**
 * Calculate normalized cost per mg per day
 * Formula: effectiveCostPerDay / totalMgPerDay
 */
export function calculateNormalizedCostPerMgPerDay(
  product: ProductCostData,
): number {
  if (!product.ingredients || product.ingredients.length === 0) {
    throw new Error("No ingredients data available");
  }

  const totalMgPerServing = product.ingredients.reduce(
    (sum, ingredient) => sum + (ingredient.amountMgPerServing || 0),
    0,
  );

  const totalMgPerDay = totalMgPerServing * product.servingsPerDay;

  if (totalMgPerDay <= 0) {
    throw new Error("Total mg per day must be greater than 0");
  }

  const effectiveCostPerDay = calculateEffectiveCostPerDay(product);
  return effectiveCostPerDay / totalMgPerDay;
}

/**
 * Calculate complete product costs with error handling
 */
export function calculateProductCosts(
  product: ProductCostData,
): CostCalculationResult {
  try {
    const effectiveCostPerDay = calculateEffectiveCostPerDay(product);

    let normalizedCostPerMgPerDay: number | undefined;
    let totalMgPerDay: number | undefined;

    // Try to calculate normalized cost if ingredients data is available
    if (product.ingredients && product.ingredients.length > 0) {
      try {
        normalizedCostPerMgPerDay = calculateNormalizedCostPerMgPerDay(product);
        const totalMgPerServing = product.ingredients.reduce(
          (sum, ingredient) => sum + (ingredient.amountMgPerServing || 0),
          0,
        );
        totalMgPerDay = totalMgPerServing * product.servingsPerDay;
      } catch (error) {
        // Normalized cost calculation failed, but basic cost is still available
      }
    }

    return {
      effectiveCostPerDay,
      normalizedCostPerMgPerDay,
      totalMgPerDay,
      isCalculable: true,
    };
  } catch (error) {
    return {
      effectiveCostPerDay: 0,
      isCalculable: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Format cost as Japanese Yen
 */
export function formatCostJPY(cost: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(cost));
}

/**
 * Format cost per mg with precision
 */
export function formatCostPerMg(cost: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cost);
}
