/**
 * 商品スコアリングエンジン
 * 4要素（エビデンス、安全性、コスト、実用性）による総合スコア計算システム
 */

// ===== 型定義 =====

/**
 * スコア重み設定
 * 合計が1.0になる必要がある
 */
export interface ScoreWeights {
  evidence: number;    // エビデンス重み (0.35)
  safety: number;      // 安全性重み (0.30)
  cost: number;        // コスト重み (0.20)
  practicality: number; // 実用性重み (0.15)
}

/**
 * 4要素の個別スコア
 * 各スコアは0-100の範囲
 */
export interface ScoreComponents {
  evidence: number;      // エビデンススコア (0-100)
  safety: number;        // 安全性スコア (0-100)
  cost: number;          // コストスコア (0-100)
  practicality: number;  // 実用性スコア (0-100)
}

/**
 * スコア詳細情報
 * 各要素の計算根拠と説明
 */
export interface ScoreBreakdown {
  score: number;         // 計算されたスコア
  factors: Array<{
    name: string;        // 要因名
    value: number;       // 要因の値
    weight: number;      // 要因の重み
    description: string; // 要因の説明
  }>;
  explanation: string;   // スコアの説明
}

/**
 * 総合スコア結果
 * 全ての計算結果と詳細情報を含む
 */
export interface ScoreResult {
  total: number;           // 重み付け総合スコア (0-100)
  components: ScoreComponents; // 個別スコア
  weights: ScoreWeights;   // 使用された重み
  breakdown: {
    evidence: ScoreBreakdown;
    safety: ScoreBreakdown;
    cost: ScoreBreakdown;
    practicality: ScoreBreakdown;
  };
  isComplete: boolean;     // 全データが利用可能かどうか
  missingData: string[];   // 不足しているデータのリスト
}

/**
 * 商品データ型（Sanityスキーマに基づく）
 */
export interface Product {
  name: string;
  brand: string;
  ingredients: Array<{
    ingredient: {
      name: string;
      evidenceLevel: 'A' | 'B' | 'C';
      safetyNotes?: string[];
      category: string;
    };
    amountMgPerServing: number;
  }>;
  servingsPerDay: number;
  servingsPerContainer: number;
  priceJPY: number;
  form?: 'capsule' | 'tablet' | 'softgel' | 'powder' | 'liquid' | 'gummy';
  warnings?: string[];
  thirdPartyTested?: boolean;
}

// ===== 定数 =====

/**
 * デフォルト重み設定
 * 要件に基づく固定値
 */
export const DEFAULT_WEIGHTS: ScoreWeights = {
  evidence: 0.35,      // エビデンス重視
  safety: 0.30,        // 安全性重視
  cost: 0.20,          // コスト考慮
  practicality: 0.15   // 実用性考慮
};

/**
 * エビデンスレベル固定スコア
 * 要件2.2に基づく
 */
const EVIDENCE_LEVEL_SCORES = {
  A: 90,  // 高品質な証拠
  B: 75,  // 中程度の証拠
  C: 60   // 限定的な証拠
} as const;

/**
 * 安全性レベル固定スコア
 * 要件2.3に基づく
 */
const SAFETY_LEVEL_SCORES = {
  none: 100,  // 副作用なし
  low: 85,    // 軽微な副作用
  mid: 70,    // 中程度の副作用
  high: 40    // 重篤な副作用
} as const;

/**
 * 剤形スコア
 * 摂取しやすさに基づく
 */
const FORM_SCORES = {
  capsule: 100,   // カプセル（最も摂取しやすい）
  softgel: 95,    // ソフトジェル
  tablet: 90,     // タブレット
  gummy: 85,      // グミ
  liquid: 75,     // リキッド
  powder: 70      // パウダー（最も摂取しにくい）
} as const;

// ===== ユーティリティ関数 =====

/**
 * 値を指定範囲に正規化
 * @param value 正規化する値
 * @param min 最小値
 * @param max 最大値
 * @returns 0-100の範囲に正規化された値
 */
export function normalizeScore(value: number, min: number, max: number): number {
  if (max === min) return 50; // 範囲が0の場合は中間値
  const normalized = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

/**
 * 重み付け総合スコア計算
 * @param components 個別スコア
 * @param weights 重み設定
 * @returns 重み付け総合スコア（0.1刻み四捨五入）
 */
export function applyWeights(components: ScoreComponents, weights: ScoreWeights): number {
  // 重み合計の検証（要件2.7）
  const weightSum = weights.evidence + weights.safety + weights.cost + weights.practicality;
  if (Math.abs(weightSum - 1.0) > 0.001) {
    throw new Error(`重み合計が1.0ではありません: ${weightSum}`);
  }

  // 加重平均計算
  const weightedScore = 
    components.evidence * weights.evidence +
    components.safety * weights.safety +
    components.cost * weights.cost +
    components.practicality * weights.practicality;

  // 0.1刻み四捨五入（要件2.6）
  return Math.round(weightedScore * 10) / 10;
}

// ===== 個別スコア計算関数 =====

/**
 * エビデンススコア計算
 * @param product 商品データ
 * @returns エビデンススコアの詳細
 */
export function calculateEvidenceScore(product: Product): ScoreBreakdown {
  const factors = [];
  let totalScore = 0;

  try {
    // Factor 1: エビデンスレベル平均 (100% weight - MVPでは単一要因)
    if (product.ingredients && product.ingredients.length > 0) {
      const evidenceLevels = product.ingredients.map(ing => ing.ingredient.evidenceLevel);
      const evidenceScores = evidenceLevels.map(level => EVIDENCE_LEVEL_SCORES[level]);
      const avgEvidenceScore = evidenceScores.reduce((sum, score) => sum + score, 0) / evidenceScores.length;
      
      factors.push({
        name: 'エビデンスレベル',
        value: avgEvidenceScore,
        weight: 1.0,
        description: `成分の科学的根拠の質 (${evidenceLevels.join(', ')})`
      });

      totalScore = avgEvidenceScore;
    } else {
      // データ不足時のフォールバック
      factors.push({
        name: 'エビデンスレベル',
        value: 50,
        weight: 1.0,
        description: '成分データが不足しています'
      });
      totalScore = 50;
    }
  } catch (error) {
    // エラー時のフォールバック（要件6.4）
    factors.push({
      name: 'エビデンスレベル',
      value: 50,
      weight: 1.0,
      description: 'エビデンス計算でエラーが発生しました'
    });
    totalScore = 50;
  }

  return {
    score: Math.round(totalScore),
    factors,
    explanation: 'エビデンススコアは成分の科学的根拠の質を評価します'
  };
}

/**
 * 安全性スコア計算
 * @param product 商品データ
 * @returns 安全性スコアの詳細
 */
export function calculateSafetyScore(product: Product): ScoreBreakdown {
  const factors = [];
  let totalScore = 0;

  try {
    // 安全性レベルの判定
    let safetyLevel: keyof typeof SAFETY_LEVEL_SCORES = 'none';
    
    // 警告や安全性注意事項の数に基づいて判定
    const warningCount = (product.warnings?.length || 0);
    const safetyNotesCount = product.ingredients?.reduce((count, ing) => 
      count + (ing.ingredient.safetyNotes?.length || 0), 0) || 0;
    
    const totalRiskFactors = warningCount + safetyNotesCount;
    
    if (totalRiskFactors === 0) {
      safetyLevel = 'none';
    } else if (totalRiskFactors <= 2) {
      safetyLevel = 'low';
    } else if (totalRiskFactors <= 5) {
      safetyLevel = 'mid';
    } else {
      safetyLevel = 'high';
    }

    const safetyScore = SAFETY_LEVEL_SCORES[safetyLevel];

    factors.push({
      name: '副作用リスク',
      value: safetyScore,
      weight: 1.0,
      description: `リスク要因数: ${totalRiskFactors}件 (レベル: ${safetyLevel})`
    });

    totalScore = safetyScore;
  } catch (error) {
    // エラー時のフォールバック
    factors.push({
      name: '副作用リスク',
      value: 50,
      weight: 1.0,
      description: '安全性計算でエラーが発生しました'
    });
    totalScore = 50;
  }

  return {
    score: Math.round(totalScore),
    factors,
    explanation: '安全性スコアは副作用や相互作用のリスクを評価します'
  };
}

/**
 * コストスコア計算
 * @param product 商品データ
 * @returns コストスコアの詳細
 */
export function calculateCostScore(product: Product): ScoreBreakdown {
  const factors = [];
  let totalScore = 0;

  try {
    // 価格データの検証
    if (!product.priceJPY || product.priceJPY <= 0 || !product.servingsPerContainer || product.servingsPerContainer <= 0 || !product.servingsPerDay || product.servingsPerDay <= 0) {
      throw new Error('価格または容量データが不正です');
    }

    // 1日あたりのコスト計算
    const costPerDay = (product.priceJPY / product.servingsPerContainer) * product.servingsPerDay;
    
    // 1日あたりの有効成分総量計算
    const totalMgPerDay = product.ingredients?.reduce((total, ing) => 
      total + (ing.amountMgPerServing * product.servingsPerDay), 0) || 1;
    
    // 0除算チェック
    if (totalMgPerDay <= 0) {
      throw new Error('有効成分総量が0以下です');
    }
    
    // mg単価計算
    const costPerMgPerDay = costPerDay / totalMgPerDay;
    
    // NaN チェック
    if (isNaN(costPerMgPerDay) || !isFinite(costPerMgPerDay)) {
      throw new Error('mg単価計算でNaNまたは無限大が発生しました');
    }
    
    // 市場最安値を仮定（実際の実装では外部データソースから取得）
    // MVPでは固定値を使用
    const marketMinCostPerMgPerDay = 0.1; // 仮の市場最安値（円/mg/日）
    
    // コストスコア計算（要件2.4）
    const costScore = Math.min(100, 100 * (marketMinCostPerMgPerDay / costPerMgPerDay));
    
    // NaN チェック
    const finalCostScore = isNaN(costScore) || !isFinite(costScore) ? 50 : costScore;
    
    factors.push({
      name: 'mg単価効率',
      value: finalCostScore,
      weight: 1.0,
      description: `${costPerMgPerDay.toFixed(3)}円/mg/日 (1日${costPerDay.toFixed(0)}円)`
    });

    totalScore = finalCostScore;
  } catch (error) {
    // エラー時のフォールバック
    factors.push({
      name: 'mg単価効率',
      value: 50,
      weight: 1.0,
      description: 'コスト計算でエラーが発生しました'
    });
    totalScore = 50;
  }

  return {
    score: Math.round(totalScore),
    factors,
    explanation: 'コストスコアは価格対効果を評価します'
  };
}

/**
 * 実用性スコア計算
 * @param product 商品データ
 * @returns 実用性スコアの詳細
 */
export function calculatePracticalityScore(product: Product): ScoreBreakdown {
  const factors = [];
  let totalScore = 0;

  try {
    // データ検証
    if (!product.servingsPerDay || product.servingsPerDay <= 0) {
      throw new Error('摂取回数データが不正です');
    }
    if (!product.servingsPerContainer || product.servingsPerContainer <= 0) {
      throw new Error('容器容量データが不正です');
    }

    // Factor 1: 摂取頻度 (40% weight)
    const dosingFrequency = product.servingsPerDay;
    const dosageBurdenIndex = Math.min(40, (dosingFrequency - 1) * 15); // 要件2.5
    const dosingScore = 100 - dosageBurdenIndex;
    
    factors.push({
      name: '摂取頻度',
      value: dosingScore,
      weight: 0.4,
      description: `1日${dosingFrequency}回摂取`
    });

    // Factor 2: 剤形 (30% weight)
    const formScore = product.form ? FORM_SCORES[product.form] : 80; // デフォルト値
    
    factors.push({
      name: '剤形',
      value: formScore,
      weight: 0.3,
      description: `${product.form || '不明'}形式`
    });

    // Factor 3: 容量 (30% weight)
    const daysPerContainer = product.servingsPerContainer / product.servingsPerDay;
    
    // NaN チェック
    if (isNaN(daysPerContainer) || !isFinite(daysPerContainer)) {
      throw new Error('容量計算でNaNまたは無限大が発生しました');
    }
    
    const containerScore = normalizeScore(daysPerContainer, 7, 90); // 1週間〜3ヶ月で正規化
    
    factors.push({
      name: '容量',
      value: containerScore,
      weight: 0.3,
      description: `1容器で${Math.round(daysPerContainer)}日分`
    });

    // 重み付け合計計算
    totalScore = factors.reduce((sum, factor) => sum + (factor.value * factor.weight), 0);
    
    // NaN チェック
    if (isNaN(totalScore) || !isFinite(totalScore)) {
      throw new Error('実用性スコア計算でNaNまたは無限大が発生しました');
    }
  } catch (error) {
    // エラー時のフォールバック
    factors.push({
      name: '実用性',
      value: 50,
      weight: 1.0,
      description: '実用性計算でエラーが発生しました'
    });
    totalScore = 50;
  }

  return {
    score: Math.round(totalScore),
    factors,
    explanation: '実用性スコアは使いやすさを評価します'
  };
}

// ===== メイン関数 =====

/**
 * 商品の総合スコア計算
 * @param product 商品データ
 * @param weights 重み設定（オプション、デフォルトはDEFAULT_WEIGHTS）
 * @returns 総合スコア結果
 */
export function score(product: Product, weights: ScoreWeights = DEFAULT_WEIGHTS): ScoreResult {
  const missingData: string[] = [];
  
  // データ完全性チェック
  if (!product.ingredients || product.ingredients.length === 0) {
    missingData.push('成分情報');
  }
  if (!product.priceJPY || product.priceJPY <= 0) {
    missingData.push('価格情報');
  }
  if (!product.servingsPerDay || product.servingsPerDay <= 0) {
    missingData.push('摂取回数');
  }
  if (!product.servingsPerContainer || product.servingsPerContainer <= 0) {
    missingData.push('容器容量');
  }

  // 個別スコア計算
  const evidenceBreakdown = calculateEvidenceScore(product);
  const safetyBreakdown = calculateSafetyScore(product);
  const costBreakdown = calculateCostScore(product);
  const practicalityBreakdown = calculatePracticalityScore(product);

  // 個別スコアコンポーネント（NaN チェック付き）
  const components: ScoreComponents = {
    evidence: isNaN(evidenceBreakdown.score) ? 50 : evidenceBreakdown.score,
    safety: isNaN(safetyBreakdown.score) ? 50 : safetyBreakdown.score,
    cost: isNaN(costBreakdown.score) ? 50 : costBreakdown.score,
    practicality: isNaN(practicalityBreakdown.score) ? 50 : practicalityBreakdown.score
  };

  // 重み設定の検証と総合スコア計算
  let totalScore: number;
  let finalWeights: ScoreWeights;
  
  try {
    totalScore = applyWeights(components, weights);
    finalWeights = weights;
  } catch (error) {
    // 重み検証エラー時はデフォルト重みを使用
    totalScore = applyWeights(components, DEFAULT_WEIGHTS);
    finalWeights = DEFAULT_WEIGHTS;
  }

  return {
    total: totalScore,
    components,
    weights: finalWeights,
    breakdown: {
      evidence: evidenceBreakdown,
      safety: safetyBreakdown,
      cost: costBreakdown,
      practicality: practicalityBreakdown
    },
    isComplete: missingData.length === 0,
    missingData
  };
}

// ===== エクスポート =====

export default {
  score,
  calculateEvidenceScore,
  calculateSafetyScore,
  calculateCostScore,
  calculatePracticalityScore,
  applyWeights,
  normalizeScore,
  DEFAULT_WEIGHTS,
  EVIDENCE_LEVEL_SCORES,
  SAFETY_LEVEL_SCORES,
  FORM_SCORES
};