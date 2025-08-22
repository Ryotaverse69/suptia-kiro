import {
  analyzeProductWarnings,
  type WarningAnalysis,
} from "./warning-analyzer";
import { calculateScoreSummary, type ScoreSummary } from "./score-summary";
import type { Product } from "../../components/compare/types";

export interface ComparisonResult {
  products: Product[];
  scoreSummary: Record<string, ScoreSummary>;
  warningAnalysis: WarningAnalysis;
  recommendations: Array<{
    type: "best_score" | "best_price" | "least_warnings";
    productId: string;
    reason: string;
  }>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 製品比較データを処理し、包括的な比較結果を生成する
 */
export function compareProducts(products: Product[]): ComparisonResult {
  // データの前処理
  const processedProducts = processComparisonData(products);

  // スコア要約の計算
  const scoreSummary = calculateScoreSummary(processedProducts);

  // 警告分析の実行
  const warningAnalysis = analyzeProductWarnings(processedProducts);

  // 推奨製品の特定
  const recommendations = generateRecommendations(
    processedProducts,
    scoreSummary,
    warningAnalysis,
  );

  return {
    products: processedProducts,
    scoreSummary,
    warningAnalysis,
    recommendations,
  };
}

/**
 * 各カテゴリのスコア要約を計算する
 */
// スコア要約の計算は score-summary モジュールに委譲

/**
 * 比較データを前処理し、不正なデータをフィルタリングする
 */
export function processComparisonData(products: Product[]): Product[] {
  if (!Array.isArray(products)) {
    return [];
  }

  const processedProducts: Product[] = [];
  const seenIds = new Set<string>();

  products.forEach((product) => {
    // null/undefinedをスキップ
    if (!product) {
      return;
    }

    // 必須フィールドの検証
    if (
      !product.id ||
      !product.name ||
      typeof product.price !== "number" ||
      typeof product.totalScore !== "number"
    ) {
      return;
    }

    // 重複IDをスキップ
    if (seenIds.has(product.id)) {
      return;
    }

    // スコア範囲の検証
    if (product.totalScore < 0 || product.totalScore > 100) {
      return;
    }

    // 価格の検証
    if (product.price < 0) {
      return;
    }

    seenIds.add(product.id);
    processedProducts.push({
      ...product,
      warnings: Array.isArray(product.warnings)
        ? product.warnings.filter((w) => w && w.id)
        : [],
      scoreBreakdown: product.scoreBreakdown || {},
    });
  });

  return processedProducts;
}

/**
 * 製品リストを比較用に検証する
 */
export function validateProductsForComparison(
  products: Product[],
): ValidationResult {
  const errors: string[] = [];

  // 製品数の検証
  if (!Array.isArray(products) || products.length === 0) {
    errors.push("比較する製品を選択してください");
    return { isValid: false, errors };
  }

  if (products.length > 3) {
    errors.push("製品数は最大3つまでです");
  }

  // 各製品の検証
  products.forEach((product, index) => {
    if (!product) {
      errors.push(`製品${index + 1}: 製品データが不正です`);
      return;
    }

    if (!product.id) {
      errors.push(`製品${index + 1}: IDが必要です`);
    }

    if (!product.name || product.name.trim() === "") {
      errors.push(`製品${index + 1}: 製品名が必要です`);
    }

    if (typeof product.price !== "number" || product.price < 0) {
      errors.push(`製品${index + 1}: 有効な価格が必要です`);
    }

    if (
      typeof product.totalScore !== "number" ||
      product.totalScore < 0 ||
      product.totalScore > 100
    ) {
      errors.push(`製品${index + 1}: スコアは0-100の範囲で入力してください`);
    }

    if (!product.url || product.url.trim() === "") {
      errors.push(`製品${index + 1}: URLが必要です`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 推奨製品を生成する
 */
function generateRecommendations(
  products: Product[],
  scoreSummary: Record<string, ScoreSummary>,
  warningAnalysis: WarningAnalysis,
): Array<{
  type: "best_score" | "best_price" | "least_warnings";
  productId: string;
  reason: string;
}> {
  const recommendations: Array<{
    type: "best_score" | "best_price" | "least_warnings";
    productId: string;
    reason: string;
  }> = [];

  if (products.length === 0) {
    return recommendations;
  }

  // 最高スコアの製品
  const bestScoreProduct = products.reduce((best, current) =>
    current.totalScore > best.totalScore ? current : best,
  );

  recommendations.push({
    type: "best_score",
    productId: bestScoreProduct.id,
    reason: `総合スコア${bestScoreProduct.totalScore}点で最高評価`,
  });

  // 最安価格の製品
  const bestPriceProduct = products.reduce((cheapest, current) =>
    current.price < cheapest.price ? current : cheapest,
  );

  recommendations.push({
    type: "best_price",
    productId: bestPriceProduct.id,
    reason: `¥${bestPriceProduct.price.toLocaleString()}で最安価格`,
  });

  // 最少警告の製品
  const leastWarningsProduct = products.reduce((safest, current) => {
    const currentWarnings = current.warnings?.length || 0;
    const safestWarnings = safest.warnings?.length || 0;
    return currentWarnings < safestWarnings ? current : safest;
  });

  const warningCount = leastWarningsProduct.warnings?.length || 0;
  recommendations.push({
    type: "least_warnings",
    productId: leastWarningsProduct.id,
    reason:
      warningCount === 0
        ? "警告なしで最も安全"
        : `警告${warningCount}件で最も安全`,
  });

  return recommendations;
}

export type { Product, ScoreSummary, WarningAnalysis };
