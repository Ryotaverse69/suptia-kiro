# Product Scoring System Design Document

## Overview

商品詳細ページに4要素スコアリングシステム（エビデンス、安全性、コスト、実用性）を実装し、重み付けされた総合スコアと個別スコアを表示します。透明性のある計算ロジックにより、ユーザーがデータに基づいた意思決定を行えるようサポートします。

## Architecture

### Component Structure
```
/products/[slug]/
├── page.tsx (商品詳細ページ)
├── components/
│   ├── ScoreDisplay.tsx (スコア表示コンポーネント)
│   └── ScoreBreakdown.tsx (スコア詳細コンポーネント)
└── __tests__/
    ├── ScoreDisplay.test.tsx
    └── ScoreBreakdown.test.tsx
```

### Service Layer
```
/lib/
├── scoring.ts (スコアリングエンジン)
└── __tests__/
    └── scoring.test.ts
```

## Components and Interfaces

### Scoring Engine

```typescript
// lib/scoring.ts
interface ScoreWeights {
  evidence: number;    // 0.35
  safety: number;      // 0.30
  cost: number;        // 0.20
  practicality: number; // 0.15
}

interface ScoreComponents {
  evidence: number;      // 0-100
  safety: number;        // 0-100
  cost: number;          // 0-100
  practicality: number;  // 0-100
}

interface ScoreResult {
  total: number;           // 0-100 weighted total
  components: ScoreComponents;
  weights: ScoreWeights;
  breakdown: {
    evidence: ScoreBreakdown;
    safety: ScoreBreakdown;
    cost: ScoreBreakdown;
    practicality: ScoreBreakdown;
  };
  isComplete: boolean;     // true if all data available
  missingData: string[];   // list of missing data points
}

interface ScoreBreakdown {
  score: number;
  factors: Array<{
    name: string;
    value: number;
    weight: number;
    description: string;
  }>;
  explanation: string;
}

// Main scoring function
export function score(product: Product): ScoreResult;

// Individual scoring functions
export function calculateEvidenceScore(product: Product): ScoreBreakdown;
export function calculateSafetyScore(product: Product): ScoreBreakdown;
export function calculateCostScore(product: Product): ScoreBreakdown;
export function calculatePracticalityScore(product: Product): ScoreBreakdown;

// Utility functions
export function applyWeights(components: ScoreComponents, weights: ScoreWeights): number;
export function normalizeScore(value: number, min: number, max: number): number;
```

### Score Display Component

```typescript
// components/ScoreDisplay.tsx
interface ScoreDisplayProps {
  scoreResult: ScoreResult;
  showBreakdown?: boolean;
  className?: string;
}

interface ScoreVisualization {
  total: number;
  components: ScoreComponents;
  colors: {
    excellent: string; // 80-100
    good: string;      // 60-79
    fair: string;      // 40-59
    poor: string;      // 0-39
  };
}

export function ScoreDisplay({
  scoreResult,
  showBreakdown = false,
  className
}: ScoreDisplayProps): JSX.Element;
```

### Score Breakdown Component

```typescript
// components/ScoreBreakdown.tsx
interface ScoreBreakdownProps {
  breakdown: ScoreResult['breakdown'];
  weights: ScoreWeights;
  className?: string;
}

export function ScoreBreakdown({
  breakdown,
  weights,
  className
}: ScoreBreakdownProps): JSX.Element;
```

## Data Models

### Score Calculation Logic

#### Evidence Score (0-100)
```typescript
function calculateEvidenceScore(product: Product): ScoreBreakdown {
  const factors = [];
  
  // Factor 1: Evidence Level (40% weight)
  const evidenceLevels = product.ingredients.map(ing => ing.evidenceLevel);
  const avgEvidenceLevel = calculateAverageEvidenceLevel(evidenceLevels);
  factors.push({
    name: 'エビデンスレベル',
    value: evidenceLevelToScore(avgEvidenceLevel), // A=90, B=75, C=60
    weight: 0.4,
    description: '成分の科学的根拠の質'
  });
  
  // Factor 2: Study Count (30% weight)
  const studyCount = getStudyCount(product.ingredients);
  factors.push({
    name: '研究数',
    value: normalizeScore(studyCount, 0, 20), // 0-20 studies -> 0-100
    weight: 0.3,
    description: '成分に関する研究の数'
  });
  
  // Factor 3: Study Quality (30% weight)
  const studyQuality = getAverageStudyQuality(product.ingredients);
  factors.push({
    name: '研究品質',
    value: studyQuality,
    weight: 0.3,
    description: 'RCT、メタ分析等の研究品質'
  });
  
  const score = factors.reduce((sum, factor) => 
    sum + (factor.value * factor.weight), 0);
    
  return {
    score: Math.round(score),
    factors,
    explanation: 'エビデンススコアは科学的根拠の質と量を評価します'
  };
}
```

#### Safety Score (0-100)
```typescript
function calculateSafetyScore(product: Product): ScoreBreakdown {
  const factors = [];
  
  // Factor 1: Side Effects (40% weight)
  const sideEffectLevel = getSideEffectLevel(product); // none/low/mid/high
  const sideEffectScore = { none: 100, low: 85, mid: 70, high: 40 }[sideEffectLevel];
  factors.push({
    name: '副作用リスク',
    value: sideEffectScore,
    weight: 0.4,
    description: '報告されている副作用の重篤度'
  });
  
  // Factor 2: Drug Interactions (35% weight)
  const interactionRisk = calculateInteractionRisk(product);
  factors.push({
    name: '相互作用リスク',
    value: 100 - interactionRisk,
    weight: 0.35,
    description: '薬物や他の成分との相互作用リスク'
  });
  
  // Factor 3: Contraindications (25% weight)
  const contraindicationCount = getContraindicationCount(product);
  factors.push({
    name: '禁忌事項',
    value: normalizeScore(10 - contraindicationCount, 0, 10),
    weight: 0.25,
    description: '使用を避けるべき条件の数'
  });
  
  const score = factors.reduce((sum, factor) => 
    sum + (factor.value * factor.weight), 0);
    
  return {
    score: Math.round(score),
    factors,
    explanation: '安全性スコアは副作用や相互作用のリスクを評価します'
  };
}
```

#### Cost Score (0-100)
```typescript
function calculateCostScore(product: Product): ScoreBreakdown {
  const factors = [];
  
  // Factor 1: Price vs Market Average (60% weight)
  const marketComparison = calculateMarketComparison(product);
  factors.push({
    name: '市場価格比較',
    value: marketComparison, // Lower price = higher score
    weight: 0.6,
    description: '同類商品との価格比較'
  });
  
  // Factor 2: Cost per mg (40% weight)
  const productCostPerMgPerDay = calculateCostPerMgPerDay(product);
  const minCostPerMgPerDay = getMarketMinCostPerMgPerDay(); // 市場最安値
  const costScore = Math.min(100, 100 * (minCostPerMgPerDay / productCostPerMgPerDay));
  factors.push({
    name: 'mg単価',
    value: costScore,
    weight: 0.4,
    description: '有効成分1mgあたりのコスト'
  });
  
  const score = factors.reduce((sum, factor) => 
    sum + (factor.value * factor.weight), 0);
    
  return {
    score: Math.round(score),
    factors,
    explanation: 'コストスコアは価格対効果を評価します'
  };
}
```

#### Practicality Score (0-100)
```typescript
function calculatePracticalityScore(product: Product): ScoreBreakdown {
  const factors = [];
  
  // Factor 1: Dosing Frequency (40% weight) - MVPは1日回数のみ
  const dosingFrequency = product.servingsPerDay;
  const dosageBurdenIndex = Math.min(40, (dosingFrequency - 1) * 15); // 1回=0, 2回=15, 3回=30, 4回以上=40
  const dosingScore = 100 - dosageBurdenIndex;
  factors.push({
    name: '摂取頻度',
    value: dosingScore,
    weight: 0.4,
    description: '1日の摂取回数（少ない方が高スコア）'
  });
  
  // Factor 2: Form Factor (30% weight)
  const formScore = calculateFormScore(product.form); // capsule=100, powder=70
  factors.push({
    name: '剤形',
    value: formScore,
    weight: 0.3,
    description: '摂取しやすさ（カプセル>錠剤>粉末）'
  });
  
  // Factor 3: Container Size (30% weight)
  const containerScore = calculateContainerScore(product.servingsPerContainer);
  factors.push({
    name: '容量',
    value: containerScore,
    weight: 0.3,
    description: '1容器での継続日数'
  });
  
  const score = factors.reduce((sum, factor) => 
    sum + (factor.value * factor.weight), 0);
    
  return {
    score: Math.round(score),
    factors,
    explanation: '実用性スコアは使いやすさを評価します'
  };
}
```

### Default Weights Configuration
```typescript
export const DEFAULT_WEIGHTS: ScoreWeights = {
  evidence: 0.35,      // エビデンス重視
  safety: 0.30,        // 安全性重視
  cost: 0.20,          // コスト考慮
  practicality: 0.15   // 実用性考慮
};
```

## Error Handling

### Data Availability Handling
1. **部分データ**: 利用可能なデータのみでスコア計算
2. **データ不足**: 該当要素を除外して重みを再調整
3. **計算エラー**: フォールバック値（50点）を使用

### Score Validation
- スコア範囲チェック（0-100）
- 重み合計チェック（1.0）必須検証
- 異常値検出と補正
- 表示は0.1刻み四捨五入（Math.round(score * 10) / 10）

## Testing Strategy

### Unit Testing (lib/scoring.ts)

```typescript
describe('Product Scoring', () => {
  describe('score function', () => {
    it('完全なデータで正確な総合スコアを計算する');
    it('部分的なデータで適切にスコアを調整する');
    it('データ不足時にフォールバック値を使用する');
  });

  describe('calculateEvidenceScore', () => {
    it('エビデンスレベルA/B/Cで適切なスコアを計算する');
    it('研究数と品質を正しく評価する');
  });

  describe('calculateSafetyScore', () => {
    it('副作用リスクを正しく評価する');
    it('相互作用と禁忌事項を考慮する');
  });

  describe('calculateCostScore', () => {
    it('市場価格比較を正確に計算する');
    it('mg単価を適切に評価する');
  });

  describe('calculatePracticalityScore', () => {
    it('摂取頻度を正しく評価する');
    it('剤形と容量を適切にスコア化する');
  });

  describe('applyWeights', () => {
    it('指定された重みで正確に計算する');
    it('重み合計が1.0でない場合エラーを投げる');
  });
});
```

### Component Testing

```typescript
describe('ScoreDisplay', () => {
  it('総合スコアと個別スコアを表示する');
  it('スコアに応じた色分けを適用する');
  it('データ不足時の表示を適切に処理する');
  it('レスポンシブデザインで表示される');
});

describe('ScoreBreakdown', () => {
  it('各要素の詳細スコアを表示する');
  it('計算根拠と説明を表示する');
  it('重み付けを視覚的に表現する');
});
```

## UI Design

### Score Display Layout

#### Desktop Layout
```
┌─────────────────────────────────────────────┐
│ 総合スコア: 78/100 ████████░░                │
├─────────────────────────────────────────────┤
│ エビデンス (35%): 85 ████████▌░              │
│ 安全性 (30%):     75 ███████▌░░              │
│ コスト (20%):     70 ███████░░░              │
│ 実用性 (15%):     80 ████████░░              │
└─────────────────────────────────────────────┘
```

#### Mobile Layout
```
┌─────────────────────────┐
│ 総合スコア              │
│ 78/100                 │
│ ████████░░              │
├─────────────────────────┤
│ エビデンス (35%)        │
│ 85 ████████▌░           │
├─────────────────────────┤
│ 安全性 (30%)            │
│ 75 ███████▌░░           │
├─────────────────────────┤
│ コスト (20%)            │
│ 70 ███████░░░           │
├─────────────────────────┤
│ 実用性 (15%)            │
│ 80 ████████░░           │
└─────────────────────────┘
```

### Color Scheme
```css
.score-excellent { @apply text-green-600 bg-green-100; } /* 80-100 */
.score-good      { @apply text-blue-600 bg-blue-100; }   /* 60-79 */
.score-fair      { @apply text-yellow-600 bg-yellow-100; } /* 40-59 */
.score-poor      { @apply text-red-600 bg-red-100; }     /* 0-39 */
```

## Performance Considerations

### Calculation Optimization
- スコア計算結果をuseMemoでキャッシュ
- 重い計算（市場価格比較）は非同期処理
- 部分的なデータ更新時の差分計算

### Rendering Optimization
- React.memoでコンポーネント最適化
- プログレスバーアニメーションの最適化
- 大量データ処理時のWorker活用

## Accessibility Considerations

### WCAG Compliance
- スコア値にaria-labelを設定
- プログレスバーにrole="progressbar"
- 色だけでなく数値でも情報を提供
- キーボードナビゲーション対応

### Screen Reader Support
- スコアの読み上げ順序を最適化
- 計算根拠の詳細説明を提供
- 重要度に応じたaria-levelを設定

## Security Considerations

### Input Validation
- 商品データの型チェック
- スコア計算の範囲チェック
- 異常値の検出と処理

### Calculation Integrity
- スコア計算ロジックの改ざん防止
- 重み設定の検証
- 計算結果の整合性チェック