import type { Product } from "../../components/compare/types";

export interface ScoreSummary {
  category: string;
  maxScore: number;
  minScore: number;
  averageScore: number;
  products: Array<{
    productId: string;
    score: number;
  }>;
}

export interface CategorySummary {
  category: string;
  maxScore: number;
  minScore: number;
  averageScore: number;
  products: Array<{
    productId: string;
    score: number;
  }>;
}

/**
 * スコア要約計算クラス
 */
export class ScoreSummaryCalculator {
  /**
   * 製品リストから全カテゴリのスコア要約を計算する
   */
  calculateSummary(products: Product[]): Record<string, ScoreSummary> {
    if (!Array.isArray(products) || products.length === 0) {
      return {};
    }

    // 全製品のスコアBreakdownからカテゴリを抽出
    const categories = new Set<string>();
    products.forEach((product) => {
      if (
        product.scoreBreakdown &&
        typeof product.scoreBreakdown === "object"
      ) {
        Object.keys(product.scoreBreakdown).forEach((category) => {
          categories.add(category);
        });
      }
    });

    const summary: Record<string, ScoreSummary> = {};

    categories.forEach((category) => {
      const scores: number[] = [];
      const productIds: string[] = [];

      products.forEach((product) => {
        const score = product.scoreBreakdown?.[category];
        if (typeof score === "number" && !isNaN(score) && isFinite(score)) {
          scores.push(score);
          productIds.push(product.id);
        }
      });

      if (scores.length > 0) {
        summary[category] = calculateCategorySummary(
          category,
          scores,
          productIds,
        );
      }
    });

    return summary;
  }

  /**
   * 指定カテゴリで最高パフォーマンスの製品を特定する
   */
  findBestPerformingProduct(
    category: string,
    products: Product[],
  ): string | undefined {
    let bestProduct: Product | undefined;
    let bestScore = -1;

    products.forEach((product) => {
      const score = product.scoreBreakdown?.[category];
      if (typeof score === "number" && !isNaN(score) && score > bestScore) {
        bestScore = score;
        bestProduct = product;
      }
    });

    return bestProduct?.id;
  }

  /**
   * 指定カテゴリで最低パフォーマンスの製品を特定する
   */
  findWorstPerformingProduct(
    category: string,
    products: Product[],
  ): string | undefined {
    let worstProduct: Product | undefined;
    let worstScore = Infinity;

    products.forEach((product) => {
      const score = product.scoreBreakdown?.[category];
      if (typeof score === "number" && !isNaN(score) && score < worstScore) {
        worstScore = score;
        worstProduct = product;
      }
    });

    return worstProduct?.id;
  }

  /**
   * 指定カテゴリの平均スコアを計算する
   */
  calculateCategoryAverage(category: string, products: Product[]): number {
    const scores: number[] = [];

    products.forEach((product) => {
      const score = product.scoreBreakdown?.[category];
      if (typeof score === "number" && !isNaN(score) && isFinite(score)) {
        scores.push(score);
      }
    });

    if (scores.length === 0) {
      return 0;
    }

    const average =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(average);
  }
}

/**
 * カテゴリの統計情報を計算する
 */
export function calculateCategorySummary(
  category: string,
  scores: number[],
  productIds: string[],
): CategorySummary {
  if (scores.length === 0) {
    return {
      category,
      maxScore: 0,
      minScore: 0,
      averageScore: 0,
      products: [],
    };
  }

  const validScores = scores.filter(
    (score) => typeof score === "number" && !isNaN(score) && isFinite(score),
  );

  if (validScores.length === 0) {
    return {
      category,
      maxScore: 0,
      minScore: 0,
      averageScore: 0,
      products: [],
    };
  }

  const maxScore = Math.max(...validScores);
  const minScore = Math.min(...validScores);
  const averageScore = Math.round(
    validScores.reduce((sum, score) => sum + score, 0) / validScores.length,
  );

  const products = scores.map((score, index) => ({
    productId: productIds[index],
    score,
  }));

  return {
    category,
    maxScore,
    minScore,
    averageScore,
    products,
  };
}

/**
 * 指定カテゴリで最高パフォーマンスの製品を特定する
 */
export function findBestPerformingProduct(
  category: string,
  products: Product[],
): string | undefined {
  const calculator = new ScoreSummaryCalculator();
  return calculator.findBestPerformingProduct(category, products);
}

/**
 * 指定カテゴリで最低パフォーマンスの製品を特定する
 */
export function findWorstPerformingProduct(
  category: string,
  products: Product[],
): string | undefined {
  const calculator = new ScoreSummaryCalculator();
  return calculator.findWorstPerformingProduct(category, products);
}

/**
 * 指定カテゴリの平均スコアを計算する
 */
export function calculateCategoryAverage(
  category: string,
  products: Product[],
): number {
  const calculator = new ScoreSummaryCalculator();
  return calculator.calculateCategoryAverage(category, products);
}

/**
 * 製品リストから全カテゴリのスコア要約を計算する（ヘルパー関数）
 */
export function calculateScoreSummary(
  products: Product[],
): Record<string, ScoreSummary> {
  const calculator = new ScoreSummaryCalculator();
  return calculator.calculateSummary(products);
}
