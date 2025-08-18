// Product data interface for scoring
export interface Product {
  ingredients?: Array<{
    evidenceLevel?: "A" | "B" | "C";
    studyCount?: number;
    studyQuality?: number;
  }>;
  sideEffectLevel?: "none" | "low" | "mid" | "high";
  interactionRisk?: number;
  contraindicationCount?: number;
  priceJPY: number;
  servingsPerContainer: number;
  servingsPerDay: number;
  form?: "capsule" | "tablet" | "powder";
  description?: string;
}

// Score weights configuration
export interface ScoreWeights {
  evidence: number; // 0.35
  safety: number; // 0.30
  cost: number; // 0.20
  practicality: number; // 0.15
}

// Individual component scores (0-100)
export interface ScoreComponents {
  evidence: number;
  safety: number;
  cost: number;
  practicality: number;
}

// Detailed breakdown for each component
export interface ScoreBreakdown {
  score: number;
  factors: Array<{
    name: string;
    value: number;
    weight: number;
    description: string;
  }>;
  explanation: string;
}

// Complete scoring result
export interface ScoreResult {
  total: number; // 0-100 weighted total
  components: ScoreComponents;
  weights: ScoreWeights;
  breakdown: {
    evidence: ScoreBreakdown;
    safety: ScoreBreakdown;
    cost: ScoreBreakdown;
    practicality: ScoreBreakdown;
  };
  isComplete: boolean; // true if all data available
  missingData: string[]; // list of missing data points
}

// Default weights (must sum to 1.0)
export const DEFAULT_WEIGHTS: ScoreWeights = {
  evidence: 0.35,
  safety: 0.3,
  cost: 0.2,
  practicality: 0.15,
} as const;

// Utility functions
export function normalizeScore(
  value: number,
  min: number = 0,
  max: number = 100,
): number {
  if (!Number.isFinite(value)) return 0;
  if (min >= max) throw new Error("Invalid range: min must be less than max");

  const normalized = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

function clamp(value: number, min: number = 0, max: number = 100): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function roundToDecimal(value: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// Weight validation
export function validateWeights(weights: ScoreWeights): void {
  const sum =
    weights.evidence + weights.safety + weights.cost + weights.practicality;
  const tolerance = 0.001; // Allow small floating point errors

  if (Math.abs(sum - 1.0) > tolerance) {
    throw new Error(`Weight sum must equal 1.0, got ${sum}`);
  }

  // Check individual weights are positive
  Object.entries(weights).forEach(([key, value]) => {
    if (value < 0 || value > 1) {
      throw new Error(`Weight ${key} must be between 0 and 1, got ${value}`);
    }
  });
}

// Apply weights to component scores
export function applyWeights(
  components: ScoreComponents,
  weights: ScoreWeights,
): number {
  validateWeights(weights);

  const weightedTotal =
    components.evidence * weights.evidence +
    components.safety * weights.safety +
    components.cost * weights.cost +
    components.practicality * weights.practicality;

  return roundToDecimal(weightedTotal);
}

// Individual scoring functions
export function calculateEvidenceScore(product: Product): ScoreBreakdown {
  const factors = [];
  let totalScore = 0;

  if (product.ingredients && product.ingredients.length > 0) {
    // Factor 1: Evidence Level (40% weight)
    const evidenceLevels = product.ingredients
      .map((ing) => ing.evidenceLevel)
      .filter(Boolean) as Array<"A" | "B" | "C">;

    if (evidenceLevels.length > 0) {
      const avgScore =
        evidenceLevels.reduce((sum, level) => {
          const scores = { A: 90, B: 75, C: 60 };
          return sum + scores[level];
        }, 0) / evidenceLevels.length;

      factors.push({
        name: "エビデンスレベル",
        value: avgScore,
        weight: 0.4,
        description: "成分の科学的根拠の質（A=90, B=75, C=60）",
      });
      totalScore += avgScore * 0.4;
    }

    // Factor 2: Study Count (30% weight)
    const studyCounts = product.ingredients
      .map((ing) => ing.studyCount || 0)
      .filter((count) => count > 0);

    if (studyCounts.length > 0) {
      const avgStudyCount =
        studyCounts.reduce((sum, count) => sum + count, 0) / studyCounts.length;
      const studyScore = normalizeScore(avgStudyCount, 0, 20); // 0-20 studies -> 0-100

      factors.push({
        name: "研究数",
        value: studyScore,
        weight: 0.3,
        description: "成分に関する研究の数（多いほど高スコア）",
      });
      totalScore += studyScore * 0.3;
    }

    // Factor 3: Study Quality (30% weight)
    const studyQualities = product.ingredients
      .map((ing) => ing.studyQuality || 0)
      .filter((quality) => quality > 0);

    if (studyQualities.length > 0) {
      const avgQuality =
        studyQualities.reduce((sum, quality) => sum + quality, 0) /
        studyQualities.length;

      factors.push({
        name: "研究品質",
        value: clamp(avgQuality),
        weight: 0.3,
        description: "RCT、メタ分析等の研究品質",
      });
      totalScore += avgQuality * 0.3;
    }
  }

  // If no factors available, use fallback
  if (factors.length === 0) {
    const fallbackScore = 50; // Neutral score when no data
    factors.push({
      name: "データ不足",
      value: fallbackScore,
      weight: 1.0,
      description: "エビデンスデータが不足しています",
    });
    totalScore = fallbackScore;
  }

  return {
    score: roundToDecimal(clamp(totalScore)),
    factors,
    explanation: "エビデンススコアは科学的根拠の質と量を評価します",
  };
}

export function calculateSafetyScore(product: Product): ScoreBreakdown {
  const factors = [];
  let totalScore = 0;

  // Factor 1: Side Effects (40% weight)
  if (product.sideEffectLevel) {
    const sideEffectScores = { none: 100, low: 85, mid: 70, high: 40 };
    const sideEffectScore = sideEffectScores[product.sideEffectLevel];

    factors.push({
      name: "副作用リスク",
      value: sideEffectScore,
      weight: 0.4,
      description: `報告されている副作用の重篤度（${product.sideEffectLevel}）`,
    });
    totalScore += sideEffectScore * 0.4;
  }

  // Factor 2: Drug Interactions (35% weight)
  if (typeof product.interactionRisk === "number") {
    const interactionScore = clamp(100 - product.interactionRisk);

    factors.push({
      name: "相互作用リスク",
      value: interactionScore,
      weight: 0.35,
      description: "薬物や他の成分との相互作用リスク",
    });
    totalScore += interactionScore * 0.35;
  }

  // Factor 3: Contraindications (25% weight)
  if (typeof product.contraindicationCount === "number") {
    const contraindicationScore = normalizeScore(
      10 - product.contraindicationCount,
      0,
      10,
    );

    factors.push({
      name: "禁忌事項",
      value: contraindicationScore,
      weight: 0.25,
      description: `使用を避けるべき条件の数（${product.contraindicationCount}件）`,
    });
    totalScore += contraindicationScore * 0.25;
  }

  // If no factors available, use conservative default
  if (factors.length === 0) {
    const fallbackScore = 75; // Conservative default
    factors.push({
      name: "データ不足",
      value: fallbackScore,
      weight: 1.0,
      description: "安全性データが不足しています（保守的な評価）",
    });
    totalScore = fallbackScore;
  }

  return {
    score: roundToDecimal(clamp(totalScore)),
    factors,
    explanation: "安全性スコアは副作用や相互作用のリスクを評価します",
  };
}

export function calculateCostScore(product: Product): ScoreBreakdown {
  const factors = [];
  let totalScore = 0;

  // Calculate cost per mg per day
  const costPerServing = product.priceJPY / (product.servingsPerContainer || 1);
  const costPerDay = costPerServing * (product.servingsPerDay || 1);

  // Factor 1: Cost per day (simplified for MVP)
  const costScore = normalizeScore(1000 - costPerDay, 0, 1000); // Assume 1000 JPY/day as expensive

  factors.push({
    name: "1日あたりコスト",
    value: costScore,
    weight: 1.0,
    description: `1日あたり${Math.round(costPerDay)}円（安いほど高スコア）`,
  });
  totalScore = costScore;

  return {
    score: roundToDecimal(clamp(totalScore)),
    factors,
    explanation: "コストスコアは価格対効果を評価します",
  };
}

export function calculatePracticalityScore(product: Product): ScoreBreakdown {
  const factors = [];
  let totalScore = 0;

  // Factor 1: Dosing Frequency (40% weight) - MVP implementation
  const dosingFrequency = product.servingsPerDay || 1;
  const dosageBurdenIndex = Math.min(
    40,
    Math.max(0, (dosingFrequency - 1) * 15),
  );
  const dosingScore = 100 - dosageBurdenIndex;

  factors.push({
    name: "摂取頻度",
    value: dosingScore,
    weight: 0.4,
    description: `1日${dosingFrequency}回（少ない方が高スコア）`,
  });
  totalScore += dosingScore * 0.4;

  // Factor 2: Form Factor (30% weight)
  const formScores = { capsule: 100, tablet: 85, powder: 70 };
  const formScore = product.form ? formScores[product.form] || 80 : 80;

  factors.push({
    name: "剤形",
    value: formScore,
    weight: 0.3,
    description: `${product.form || "不明"}（摂取しやすさ）`,
  });
  totalScore += formScore * 0.3;

  // Factor 3: Container Size (30% weight)
  const daysPerContainer =
    (product.servingsPerContainer || 30) / (product.servingsPerDay || 1);
  const containerScore = normalizeScore(daysPerContainer, 7, 90); // 1 week to 3 months

  factors.push({
    name: "容量",
    value: containerScore,
    weight: 0.3,
    description: `約${Math.round(daysPerContainer)}日分（長期間ほど高スコア）`,
  });
  totalScore += containerScore * 0.3;

  return {
    score: roundToDecimal(clamp(totalScore)),
    factors,
    explanation: "実用性スコアは使いやすさを評価します",
  };
}

// Main scoring function
export function score(
  product: Product,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
): ScoreResult {
  try {
    validateWeights(weights);

    // Calculate individual component scores
    const evidenceBreakdown = calculateEvidenceScore(product);
    const safetyBreakdown = calculateSafetyScore(product);
    const costBreakdown = calculateCostScore(product);
    const practicalityBreakdown = calculatePracticalityScore(product);

    const components: ScoreComponents = {
      evidence: evidenceBreakdown.score,
      safety: safetyBreakdown.score,
      cost: costBreakdown.score,
      practicality: practicalityBreakdown.score,
    };

    // Calculate weighted total
    const total = applyWeights(components, weights);

    // Determine completeness
    const missingData: string[] = [];
    let isComplete = true;

    if (!product.ingredients || product.ingredients.length === 0) {
      missingData.push("成分エビデンス情報");
      isComplete = false;
    }
    if (!product.sideEffectLevel) {
      missingData.push("副作用レベル");
      isComplete = false;
    }
    if (typeof product.interactionRisk !== "number") {
      missingData.push("相互作用リスク");
      isComplete = false;
    }
    if (typeof product.contraindicationCount !== "number") {
      missingData.push("禁忌事項数");
      isComplete = false;
    }

    return {
      total,
      components,
      weights,
      breakdown: {
        evidence: evidenceBreakdown,
        safety: safetyBreakdown,
        cost: costBreakdown,
        practicality: practicalityBreakdown,
      },
      isComplete,
      missingData,
    };
  } catch (error) {
    // Error handling: return fallback scores
    const fallbackComponents: ScoreComponents = {
      evidence: 50,
      safety: 50,
      cost: 50,
      practicality: 50,
    };

    const fallbackBreakdown: ScoreBreakdown = {
      score: 50,
      factors: [
        {
          name: "エラー",
          value: 50,
          weight: 1.0,
          description: `計算エラーが発生しました: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      explanation: "エラーのためフォールバック値を使用しています",
    };

    return {
      total: 50,
      components: fallbackComponents,
      weights,
      breakdown: {
        evidence: fallbackBreakdown,
        safety: fallbackBreakdown,
        cost: fallbackBreakdown,
        practicality: fallbackBreakdown,
      },
      isComplete: false,
      missingData: ["計算エラーが発生"],
    };
  }
}
