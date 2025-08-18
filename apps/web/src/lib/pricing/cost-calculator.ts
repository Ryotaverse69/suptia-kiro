/**
 * Cost Calculator
 * 実効コスト/日の計算機能
 */

import type { NormalizedPrice } from "./price-normalizer";
import type { ProductInfo } from "./price-matcher";

export interface CostPerDay {
  productId: string;
  source: string;
  sourceProductId: string;
  servingSize: number; // 1回分の量
  servingsPerContainer: number; // 容器あたりの回数
  recommendedDailyIntake: number; // 推奨1日摂取量（回数）
  daysPerContainer: number; // 1容器で何日分
  costPerDay: number; // 1日あたりコスト
  costPerServing: number; // 1回分あたりコスト
  costPerUnit: number; // 単位あたりコスト（mg, g等）
  totalPrice: number; // 総価格
  currency: "JPY";
  calculatedAt: string;
  metadata: {
    unitType: "weight" | "volume" | "count";
    unit: string;
    concentrationPerServing?: number; // 1回分あたりの有効成分量
    bioavailability?: number; // バイオアベイラビリティ（吸収率）
    qualityScore?: number; // 品質スコア（0-1）
  };
}

export interface CostCalculationConfig {
  defaultServingSize: number;
  defaultDailyIntake: number;
  qualityWeightFactor: number; // 品質による重み付け（0-1）
  bioavailabilityWeightFactor: number; // 吸収率による重み付け（0-1）
  subscriptionDiscountFactor: number; // サブスクリプション割引考慮（0-1）
}

export class CostCalculator {
  private config: CostCalculationConfig;

  constructor(config?: Partial<CostCalculationConfig>) {
    this.config = {
      defaultServingSize: 1,
      defaultDailyIntake: 1,
      qualityWeightFactor: 0.2,
      bioavailabilityWeightFactor: 0.15,
      subscriptionDiscountFactor: 0.1,
      ...config,
    };
  }

  /**
   * 実効コスト/日の計算
   */
  calculateCostPerDay(
    price: NormalizedPrice,
    productInfo: ProductInfo,
    servingInfo?: {
      servingSize?: number;
      dailyIntake?: number;
      concentrationPerServing?: number;
      bioavailability?: number;
      qualityScore?: number;
    },
  ): CostPerDay {
    const servingSize =
      servingInfo?.servingSize || this.extractServingSize(productInfo);
    const dailyIntake =
      servingInfo?.dailyIntake || this.extractDailyIntake(productInfo);
    const servingsPerContainer = this.calculateServingsPerContainer(
      productInfo,
      servingSize,
    );

    const daysPerContainer = servingsPerContainer / dailyIntake;
    const costPerDay = price.totalPrice / daysPerContainer;
    const costPerServing = price.totalPrice / servingsPerContainer;
    const costPerUnit = this.calculateCostPerUnit(
      price.totalPrice,
      productInfo,
    );

    return {
      productId: price.productId,
      source: price.source,
      sourceProductId: price.sourceProductId,
      servingSize,
      servingsPerContainer,
      recommendedDailyIntake: dailyIntake,
      daysPerContainer: Math.round(daysPerContainer * 100) / 100,
      costPerDay: Math.round(costPerDay * 100) / 100,
      costPerServing: Math.round(costPerServing * 100) / 100,
      costPerUnit: Math.round(costPerUnit * 100) / 100,
      totalPrice: price.totalPrice,
      currency: "JPY",
      calculatedAt: new Date().toISOString(),
      metadata: {
        unitType: this.determineUnitType(productInfo.capacity.unit),
        unit: productInfo.capacity.unit,
        concentrationPerServing: servingInfo?.concentrationPerServing,
        bioavailability: servingInfo?.bioavailability,
        qualityScore: servingInfo?.qualityScore,
      },
    };
  }

  /**
   * 複数商品のコスト比較
   */
  compareCosts(costs: CostPerDay[]): CostPerDay[] {
    return costs
      .sort((a, b) => a.costPerDay - b.costPerDay)
      .map((cost, index) => ({
        ...cost,
        metadata: {
          ...cost.metadata,
          rank: index + 1,
          isLowestCost: index === 0,
          costDifferenceFromLowest:
            index === 0 ? 0 : cost.costPerDay - costs[0].costPerDay,
        },
      }));
  }

  /**
   * 最安コストの特定
   */
  findLowestCost(costs: CostPerDay[]): CostPerDay | null {
    if (costs.length === 0) return null;

    return costs.reduce((lowest, current) =>
      current.costPerDay < lowest.costPerDay ? current : lowest,
    );
  }

  /**
   * 品質調整済みコスト計算
   */
  calculateQualityAdjustedCost(cost: CostPerDay): number {
    let adjustedCost = cost.costPerDay;

    // 品質スコアによる調整
    if (cost.metadata.qualityScore) {
      const qualityAdjustment =
        1 - cost.metadata.qualityScore * this.config.qualityWeightFactor;
      adjustedCost *= qualityAdjustment;
    }

    // バイオアベイラビリティによる調整
    if (cost.metadata.bioavailability) {
      const bioavailabilityAdjustment = 2 - cost.metadata.bioavailability;
      adjustedCost *= bioavailabilityAdjustment;
    }

    return Math.round(adjustedCost * 100) / 100;
  }

  /**
   * コストパフォーマンス分析
   */
  analyzeCostPerformance(costs: CostPerDay[]): {
    bestValue: CostPerDay | null;
    worstValue: CostPerDay | null;
    averageCost: number;
    medianCost: number;
    costRange: {
      min: number;
      max: number;
      spread: number;
      spreadPercentage: number;
    };
    recommendations: Array<{
      type: "best_value" | "premium_choice" | "budget_option";
      product: CostPerDay;
      reason: string;
    }>;
  } {
    if (costs.length === 0) {
      return {
        bestValue: null,
        worstValue: null,
        averageCost: 0,
        medianCost: 0,
        costRange: { min: 0, max: 0, spread: 0, spreadPercentage: 0 },
        recommendations: [],
      };
    }

    const sortedCosts = [...costs].sort((a, b) => a.costPerDay - b.costPerDay);
    const costValues = sortedCosts.map((c) => c.costPerDay);

    const min = costValues[0];
    const max = costValues[costValues.length - 1];
    const average =
      costValues.reduce((sum, cost) => sum + cost, 0) / costValues.length;
    const median =
      costValues.length % 2 === 0
        ? (costValues[costValues.length / 2 - 1] +
            costValues[costValues.length / 2]) /
          2
        : costValues[Math.floor(costValues.length / 2)];

    const spread = max - min;
    const spreadPercentage = min > 0 ? (spread / min) * 100 : 0;

    // 推奨商品の選定
    const recommendations = this.generateRecommendations(sortedCosts);

    return {
      bestValue: sortedCosts[0],
      worstValue: sortedCosts[sortedCosts.length - 1],
      averageCost: Math.round(average * 100) / 100,
      medianCost: Math.round(median * 100) / 100,
      costRange: {
        min,
        max,
        spread: Math.round(spread * 100) / 100,
        spreadPercentage: Math.round(spreadPercentage * 100) / 100,
      },
      recommendations,
    };
  }

  /**
   * 長期コスト計算
   */
  calculateLongTermCost(
    cost: CostPerDay,
    periods: {
      monthly?: boolean;
      quarterly?: boolean;
      yearly?: boolean;
    } = { monthly: true, quarterly: true, yearly: true },
  ): {
    monthly?: number;
    quarterly?: number;
    yearly?: number;
  } {
    const result: { monthly?: number; quarterly?: number; yearly?: number } =
      {};

    if (periods.monthly) {
      result.monthly = Math.round(cost.costPerDay * 30 * 100) / 100;
    }

    if (periods.quarterly) {
      result.quarterly = Math.round(cost.costPerDay * 90 * 100) / 100;
    }

    if (periods.yearly) {
      result.yearly = Math.round(cost.costPerDay * 365 * 100) / 100;
    }

    return result;
  }

  /**
   * 容器あたりの回数計算
   */
  private calculateServingsPerContainer(
    productInfo: ProductInfo,
    servingSize: number,
  ): number {
    const totalAmount = productInfo.capacity.amount;

    if (productInfo.capacity.servingsPerContainer) {
      return productInfo.capacity.servingsPerContainer;
    }

    // 単位に基づく計算
    if (this.isCountUnit(productInfo.capacity.unit)) {
      return Math.floor(totalAmount / servingSize);
    }

    // 重量・容量単位の場合は推定
    return Math.floor(totalAmount / servingSize);
  }

  /**
   * 1回分の量を抽出
   */
  private extractServingSize(productInfo: ProductInfo): number {
    // 商品名から1回分の量を抽出
    const servingPatterns = [
      /1回(\d+(?:\.\d+)?)\s*(?:mg|g|ml|粒|錠|カプセル)/i,
      /(\d+(?:\.\d+)?)\s*(?:mg|g|ml|粒|錠|カプセル)\/回/i,
    ];

    for (const pattern of servingPatterns) {
      const match = productInfo.name.match(pattern);
      if (match) {
        return parseFloat(match[1]);
      }
    }

    return this.config.defaultServingSize;
  }

  /**
   * 1日摂取量を抽出
   */
  private extractDailyIntake(productInfo: ProductInfo): number {
    // 商品名から1日摂取量を抽出
    const dailyPatterns = [/1日(\d+)回/i, /(\d+)回\/日/i, /daily\s*(\d+)/i];

    for (const pattern of dailyPatterns) {
      const match = productInfo.name.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return this.config.defaultDailyIntake;
  }

  /**
   * 単位あたりコスト計算
   */
  private calculateCostPerUnit(
    totalPrice: number,
    productInfo: ProductInfo,
  ): number {
    return totalPrice / productInfo.capacity.amount;
  }

  /**
   * 単位タイプの判定
   */
  private determineUnitType(unit: string): "weight" | "volume" | "count" {
    const weightUnits = ["mg", "g", "kg", "ミリグラム", "グラム", "キログラム"];
    const volumeUnits = ["ml", "l", "ミリリットル", "リットル"];
    const countUnits = ["粒", "錠", "カプセル", "包", "袋"];

    if (weightUnits.includes(unit.toLowerCase())) return "weight";
    if (volumeUnits.includes(unit.toLowerCase())) return "volume";
    if (countUnits.includes(unit.toLowerCase())) return "count";

    return "count"; // デフォルト
  }

  /**
   * カウント単位かどうかの判定
   */
  private isCountUnit(unit: string): boolean {
    return this.determineUnitType(unit) === "count";
  }

  /**
   * 推奨商品の生成
   */
  private generateRecommendations(sortedCosts: CostPerDay[]): Array<{
    type: "best_value" | "premium_choice" | "budget_option";
    product: CostPerDay;
    reason: string;
  }> {
    const recommendations: Array<{
      type: "best_value" | "premium_choice" | "budget_option";
      product: CostPerDay;
      reason: string;
    }> = [];

    if (sortedCosts.length === 0) return recommendations;

    // 最安値（予算重視）
    recommendations.push({
      type: "budget_option",
      product: sortedCosts[0],
      reason: "最も経済的な選択肢です",
    });

    // 品質調整済み最安値（ベストバリュー）
    const qualityAdjustedCosts = sortedCosts
      .map((cost) => ({
        ...cost,
        adjustedCost: this.calculateQualityAdjustedCost(cost),
      }))
      .sort((a, b) => a.adjustedCost - b.adjustedCost);

    if (qualityAdjustedCosts[0].productId !== sortedCosts[0].productId) {
      recommendations.push({
        type: "best_value",
        product: qualityAdjustedCosts[0],
        reason: "品質を考慮した最もコストパフォーマンスの良い選択肢です",
      });
    }

    // プレミアム選択肢（高品質）
    const highQualityCosts = sortedCosts.filter(
      (cost) => cost.metadata.qualityScore && cost.metadata.qualityScore > 0.8,
    );

    if (highQualityCosts.length > 0) {
      const premiumChoice = highQualityCosts.sort(
        (a, b) => a.costPerDay - b.costPerDay,
      )[0];
      recommendations.push({
        type: "premium_choice",
        product: premiumChoice,
        reason: "高品質な成分を重視する方におすすめです",
      });
    }

    return recommendations;
  }

  /**
   * コスト計算の妥当性検証
   */
  validateCostCalculation(cost: CostPerDay): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // 基本値の検証
    if (cost.costPerDay <= 0) {
      errors.push("1日あたりコストが0以下です");
    }

    if (cost.costPerServing <= 0) {
      errors.push("1回分あたりコストが0以下です");
    }

    if (cost.daysPerContainer <= 0) {
      errors.push("容器あたり日数が0以下です");
    }

    // 異常値の検証
    if (cost.costPerDay > 10000) {
      warnings.push("1日あたりコストが異常に高額です（1万円超）");
    }

    if (cost.daysPerContainer > 365) {
      warnings.push("容器あたり日数が1年を超えています");
    }

    if (cost.daysPerContainer < 1) {
      warnings.push("容器あたり日数が1日未満です");
    }

    // 計算の整合性検証
    const expectedCostPerDay = cost.totalPrice / cost.daysPerContainer;
    if (Math.abs(cost.costPerDay - expectedCostPerDay) > 0.01) {
      errors.push("1日あたりコストの計算が正しくありません");
    }

    const expectedCostPerServing = cost.totalPrice / cost.servingsPerContainer;
    if (Math.abs(cost.costPerServing - expectedCostPerServing) > 0.01) {
      errors.push("1回分あたりコストの計算が正しくありません");
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    };
  }

  /**
   * 設定の更新
   */
  updateConfig(newConfig: Partial<CostCalculationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 設定の取得
   */
  getConfig(): CostCalculationConfig {
    return { ...this.config };
  }
}

/**
 * デフォルトのコスト計算インスタンス
 */
export function createCostCalculator(
  config?: Partial<CostCalculationConfig>,
): CostCalculator {
  return new CostCalculator(config);
}
