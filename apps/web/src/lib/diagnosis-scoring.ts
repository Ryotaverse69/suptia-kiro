/**
 * 診断システム用スコアリングエンジン
 * ユーザーの診断回答に基づいて商品の適合度を計算
 */

import { DiagnosisAnswers } from '@/components/diagnosis/DiagnosisForm';
import { Product, ScoreResult, ScoreWeights, DEFAULT_WEIGHTS, score } from './scoring';

// ===== 型定義 =====

/**
 * 診断結果
 */
export interface DiagnosisResult {
  totalScore: number;           // 総合適合度スコア (0-100)
  personalizedScore: number;    // 個人化スコア (0-100)
  baseScore: ScoreResult;       // 基本商品スコア
  costPerDay: number;          // 実効コスト/日
  dangerAlerts: DangerAlert[]; // 危険成分アラート
  recommendations: string[];    // 推奨理由
  warnings: string[];          // 注意事項
}

/**
 * 危険成分アラート
 */
export interface DangerAlert {
  ingredient: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
  reason: string;
}

/**
 * 個人化重み設定
 * ユーザーの回答に基づいて動的に調整される重み
 */
export interface PersonalizedWeights extends ScoreWeights {
  personalizedFactors: {
    budgetSensitivity: number;    // 予算重視度 (0-1)
    safetyConcern: number;        // 安全性重視度 (0-1)
    conveniencePriority: number;  // 利便性重視度 (0-1)
    evidenceRequirement: number;  // エビデンス要求度 (0-1)
  };
}

// ===== 定数 =====

/**
 * 目的別重み調整
 */
const PURPOSE_WEIGHT_ADJUSTMENTS: Record<string, Partial<ScoreWeights>> = {
  '疲労回復・エネルギー向上': { evidence: 0.40, safety: 0.25, cost: 0.20, practicality: 0.15 },
  '美容・アンチエイジング': { evidence: 0.35, safety: 0.35, cost: 0.15, practicality: 0.15 },
  '免疫力向上': { evidence: 0.40, safety: 0.30, cost: 0.15, practicality: 0.15 },
  '筋力・体力向上': { evidence: 0.45, safety: 0.25, cost: 0.15, practicality: 0.15 },
  '睡眠の質改善': { evidence: 0.35, safety: 0.40, cost: 0.15, practicality: 0.10 },
  '集中力・記憶力向上': { evidence: 0.45, safety: 0.30, cost: 0.15, practicality: 0.10 },
  '骨・関節の健康': { evidence: 0.40, safety: 0.35, cost: 0.15, practicality: 0.10 },
  'ダイエット・体重管理': { evidence: 0.35, safety: 0.35, cost: 0.20, practicality: 0.10 },
  'ストレス軽減': { evidence: 0.30, safety: 0.40, cost: 0.15, practicality: 0.15 },
  '栄養補給': { evidence: 0.30, safety: 0.30, cost: 0.25, practicality: 0.15 }
};

/**
 * 優先度別重み調整
 */
const PRIORITY_WEIGHT_ADJUSTMENTS: Record<string, Partial<ScoreWeights>> = {
  '即効性（すぐに効果を感じたい）': { evidence: 0.45, safety: 0.25, cost: 0.15, practicality: 0.15 },
  '持続性（長期的な健康維持）': { evidence: 0.35, safety: 0.35, cost: 0.15, practicality: 0.15 },
  '安全性（副作用のリスクを最小限に）': { evidence: 0.25, safety: 0.50, cost: 0.15, practicality: 0.10 },
  'コストパフォーマンス（価格と効果のバランス）': { evidence: 0.30, safety: 0.25, cost: 0.35, practicality: 0.10 }
};

/**
 * 予算別コスト重み調整
 */
const BUDGET_COST_WEIGHTS: Record<string, number> = {
  '3,000円未満': 0.40,
  '3,000円〜5,000円': 0.30,
  '5,000円〜10,000円': 0.20,
  '10,000円〜20,000円': 0.15,
  '20,000円以上': 0.10
};

/**
 * 危険成分データベース
 */
const DANGER_INGREDIENTS: Record<string, {
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
  contraindications: string[];
}> = {
  'カフェイン': {
    severity: 'medium',
    description: '過剰摂取により不眠、動悸、不安感を引き起こす可能性があります',
    recommendation: '1日400mg以下に制限し、就寝6時間前の摂取は避けてください',
    contraindications: ['不眠・睡眠不足', 'ストレス・イライラ']
  },
  'エフェドラ': {
    severity: 'high',
    description: '心血管系への重篤な副作用のリスクがあります',
    recommendation: '医師の指導なしに摂取しないでください',
    contraindications: ['心血管疾患', '高血圧']
  },
  'ヨヒンビン': {
    severity: 'high',
    description: '血圧上昇、心拍数増加、不安感を引き起こす可能性があります',
    recommendation: '医師の指導なしに摂取しないでください',
    contraindications: ['心血管疾患', '不安障害']
  },
  'DMAA': {
    severity: 'high',
    description: '心血管系への重篤な副作用のリスクがあります',
    recommendation: '摂取を避けてください',
    contraindications: ['心血管疾患']
  }
};

// ===== ユーティリティ関数 =====

/**
 * 診断回答に基づいて個人化された重みを計算
 */
export function calculatePersonalizedWeights(answers: DiagnosisAnswers): PersonalizedWeights {
  let weights = { ...DEFAULT_WEIGHTS };
  
  // 目的に基づく重み調整
  if (answers.purpose.length > 0) {
    const purposeAdjustments = answers.purpose.map(purpose => 
      PURPOSE_WEIGHT_ADJUSTMENTS[purpose] || {}
    );
    
    // 複数目的の場合は平均を取る
    if (purposeAdjustments.length > 0) {
      const avgAdjustment = purposeAdjustments.reduce((acc, adj) => ({
        evidence: (acc.evidence || 0) + (adj.evidence || 0),
        safety: (acc.safety || 0) + (adj.safety || 0),
        cost: (acc.cost || 0) + (adj.cost || 0),
        practicality: (acc.practicality || 0) + (adj.practicality || 0)
      }), { evidence: 0, safety: 0, cost: 0, practicality: 0 });
      
      const count = purposeAdjustments.length;
      weights = {
        evidence: (avgAdjustment.evidence || 0) / count || weights.evidence,
        safety: (avgAdjustment.safety || 0) / count || weights.safety,
        cost: (avgAdjustment.cost || 0) / count || weights.cost,
        practicality: (avgAdjustment.practicality || 0) / count || weights.practicality
      };
    }
  }
  
  // 優先度に基づく重み調整
  const priorityAnswer = answers.lifestyle.find(answer => 
    Object.keys(PRIORITY_WEIGHT_ADJUSTMENTS).includes(answer)
  );
  if (priorityAnswer) {
    const priorityAdjustment = PRIORITY_WEIGHT_ADJUSTMENTS[priorityAnswer];
    weights = { ...weights, ...priorityAdjustment };
  }
  
  // 予算に基づくコスト重み調整
  const budgetAnswer = answers.lifestyle.find(answer => 
    Object.keys(BUDGET_COST_WEIGHTS).includes(answer)
  );
  if (budgetAnswer) {
    const costWeight = BUDGET_COST_WEIGHTS[budgetAnswer];
    const remainingWeight = 1 - costWeight;
    const otherWeightSum = weights.evidence + weights.safety + weights.practicality;
    
    if (otherWeightSum > 0) {
      weights = {
        evidence: weights.evidence * (remainingWeight / otherWeightSum),
        safety: weights.safety * (remainingWeight / otherWeightSum),
        cost: costWeight,
        practicality: weights.practicality * (remainingWeight / otherWeightSum)
      };
    }
  }
  
  // 重み合計を1.0に正規化
  const weightSum = weights.evidence + weights.safety + weights.cost + weights.practicality;
  if (weightSum > 0) {
    weights = {
      evidence: weights.evidence / weightSum,
      safety: weights.safety / weightSum,
      cost: weights.cost / weightSum,
      practicality: weights.practicality / weightSum
    };
  }
  
  // 個人化要因の計算
  const personalizedFactors = {
    budgetSensitivity: weights.cost / DEFAULT_WEIGHTS.cost,
    safetyConcern: weights.safety / DEFAULT_WEIGHTS.safety,
    conveniencePriority: weights.practicality / DEFAULT_WEIGHTS.practicality,
    evidenceRequirement: weights.evidence / DEFAULT_WEIGHTS.evidence
  };
  
  return {
    ...weights,
    personalizedFactors
  };
}

/**
 * 実効コスト/日の計算
 */
export function calculateCostPerDay(product: Product): number {
  if (!product.priceJPY || !product.servingsPerContainer || !product.servingsPerDay) {
    return 0;
  }
  
  return (product.priceJPY / product.servingsPerContainer) * product.servingsPerDay;
}

/**
 * 危険成分アラートの検出
 */
export function detectDangerAlerts(product: Product, answers: DiagnosisAnswers): DangerAlert[] {
  const alerts: DangerAlert[] = [];
  
  if (!product.ingredients) return alerts;
  
  for (const ingredient of product.ingredients) {
    const ingredientName = ingredient.ingredient.name;
    const dangerInfo = DANGER_INGREDIENTS[ingredientName];
    
    if (dangerInfo) {
      // ユーザーの健康状態との照合
      const hasContraindication = answers.constitution.some(condition =>
        dangerInfo.contraindications.includes(condition)
      );
      
      if (hasContraindication || dangerInfo.severity === 'high') {
        alerts.push({
          ingredient: ingredientName,
          severity: dangerInfo.severity,
          description: dangerInfo.description,
          recommendation: dangerInfo.recommendation,
          reason: hasContraindication 
            ? `あなたの健康状態（${answers.constitution.join(', ')}）との相互作用の可能性があります`
            : '一般的に注意が必要な成分です'
        });
      }
    }
  }
  
  return alerts;
}

/**
 * 推奨理由の生成
 */
export function generateRecommendations(
  product: Product, 
  answers: DiagnosisAnswers, 
  scoreResult: ScoreResult
): string[] {
  const recommendations: string[] = [];
  
  // 高スコア要素に基づく推奨理由
  if (scoreResult.components.evidence >= 80) {
    recommendations.push('科学的根拠が豊富で信頼性の高い成分を含んでいます');
  }
  
  if (scoreResult.components.safety >= 85) {
    recommendations.push('副作用のリスクが低く、安全性に優れています');
  }
  
  if (scoreResult.components.cost >= 75) {
    recommendations.push('コストパフォーマンスに優れ、経済的です');
  }
  
  if (scoreResult.components.practicality >= 80) {
    recommendations.push('摂取しやすく、継続しやすい形状・用量です');
  }
  
  // 目的との適合性
  const purposes = answers.purpose;
  if (purposes.includes('疲労回復・エネルギー向上') && 
      product.ingredients?.some(ing => ['ビタミンB群', 'コエンザイムQ10', 'クレアチン'].includes(ing.ingredient.name))) {
    recommendations.push('疲労回復・エネルギー向上に効果的な成分を含んでいます');
  }
  
  if (purposes.includes('美容・アンチエイジング') && 
      product.ingredients?.some(ing => ['ビタミンC', 'ビタミンE', 'コラーゲン', 'ヒアルロン酸'].includes(ing.ingredient.name))) {
    recommendations.push('美容・アンチエイジングに効果的な成分を含んでいます');
  }
  
  // 予算との適合性
  const costPerDay = calculateCostPerDay(product);
  const budgetAnswer = answers.lifestyle.find(answer => answer.includes('円'));
  if (budgetAnswer && costPerDay > 0) {
    const budgetLimit = extractBudgetLimit(budgetAnswer);
    const monthlyCost = costPerDay * 30;
    
    if (monthlyCost <= budgetLimit) {
      recommendations.push(`月額予算（${budgetAnswer}）内で継続可能です`);
    }
  }
  
  return recommendations;
}

/**
 * 注意事項の生成
 */
export function generateWarnings(
  product: Product, 
  answers: DiagnosisAnswers, 
  dangerAlerts: DangerAlert[]
): string[] {
  const warnings: string[] = [];
  
  // 危険成分に基づく警告
  if (dangerAlerts.length > 0) {
    warnings.push(`${dangerAlerts.length}件の注意すべき成分が含まれています`);
  }
  
  // アレルギーとの照合
  const allergies = answers.constitution.filter(item => 
    ['乳製品', '大豆', '卵', '魚・甲殻類', 'ナッツ類', 'グルテン'].includes(item)
  );
  
  if (allergies.length > 0 && product.ingredients) {
    const potentialAllergens = product.ingredients.filter(ing =>
      allergies.some(allergy => ing.ingredient.name.includes(allergy.replace('類', '')))
    );
    
    if (potentialAllergens.length > 0) {
      warnings.push(`アレルギー成分（${allergies.join(', ')}）が含まれている可能性があります`);
    }
  }
  
  // 薬との相互作用（簡易版）
  if (answers.constitution.includes('薬を服用中')) {
    warnings.push('服用中の薬との相互作用について医師にご相談ください');
  }
  
  return warnings;
}

/**
 * 予算上限の抽出
 */
function extractBudgetLimit(budgetAnswer: string): number {
  if (budgetAnswer.includes('3,000円未満')) return 3000;
  if (budgetAnswer.includes('3,000円〜5,000円')) return 5000;
  if (budgetAnswer.includes('5,000円〜10,000円')) return 10000;
  if (budgetAnswer.includes('10,000円〜20,000円')) return 20000;
  if (budgetAnswer.includes('20,000円以上')) return 50000;
  return 10000; // デフォルト
}

// ===== メイン関数 =====

/**
 * 診断に基づく商品スコアリング
 */
export function diagnosisScore(
  product: Product, 
  answers: DiagnosisAnswers
): DiagnosisResult {
  // 個人化された重みを計算
  const personalizedWeights = calculatePersonalizedWeights(answers);
  
  // 基本商品スコアを計算
  const baseScore = score(product, personalizedWeights);
  
  // 実効コスト/日を計算
  const costPerDay = calculateCostPerDay(product);
  
  // 危険成分アラートを検出
  const dangerAlerts = detectDangerAlerts(product, answers);
  
  // 個人化スコアを計算（危険成分による減点を適用）
  let personalizedScore = baseScore.total;
  
  // 危険成分による減点
  const dangerPenalty = dangerAlerts.reduce((penalty, alert) => {
    switch (alert.severity) {
      case 'high': return penalty + 30;
      case 'medium': return penalty + 15;
      case 'low': return penalty + 5;
      default: return penalty;
    }
  }, 0);
  
  personalizedScore = Math.max(0, personalizedScore - dangerPenalty);
  
  // 推奨理由と注意事項を生成
  const recommendations = generateRecommendations(product, answers, baseScore);
  const warnings = generateWarnings(product, answers, dangerAlerts);
  
  return {
    totalScore: Math.round(personalizedScore * 10) / 10,
    personalizedScore: Math.round(personalizedScore * 10) / 10,
    baseScore,
    costPerDay: Math.round(costPerDay),
    dangerAlerts,
    recommendations,
    warnings
  };
}

/**
 * 複数商品の診断スコアリング
 */
export function diagnosisScoreMultiple(
  products: Product[], 
  answers: DiagnosisAnswers
): DiagnosisResult[] {
  return products.map(product => diagnosisScore(product, answers));
}

// ===== エクスポート =====

const diagnosisScoringModule = {
  diagnosisScore,
  diagnosisScoreMultiple,
  calculatePersonalizedWeights,
  calculateCostPerDay,
  detectDangerAlerts,
  generateRecommendations,
  generateWarnings
};

export default diagnosisScoringModule;