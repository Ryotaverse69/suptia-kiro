# Persona-Based Warnings Design Document

## Overview

商品詳細ページにペルソナベースの警告システムを実装し、phrase-checker/rules.jsonを活用したコンプライアンスチェックと、ペルソナルールに基づく個別化された警告を表示します。非ブロッキングな警告バナーにより、ユーザーの安全性を確保しながら快適な閲覧体験を提供します。

## Architecture

### Component Structure
```
/products/[slug]/
├── page.tsx (商品詳細ページ)
├── components/
│   ├── WarningBanner.tsx (警告バナーコンポーネント)
│   └── PersonaWarnings.tsx (ペルソナ警告コンポーネント)
└── __tests__/
    ├── WarningBanner.test.tsx
    └── PersonaWarnings.test.tsx
```

### Service Layer
```
/lib/
├── compliance.ts (コンプライアンスチェックロジック)
├── persona-rules.ts (ペルソナルールエンジン)
└── __tests__/
    ├── compliance.test.ts
    └── persona-rules.test.ts
```

### Data Layer
```
tools/phrase-checker/
└── rules.json (NGフレーズルール)
```

## Components and Interfaces

### Compliance Service

```typescript
// lib/compliance.ts
interface ComplianceRule {
  pattern: string;
  suggest: string;
}

interface ComplianceResult {
  hasViolations: boolean;
  violations: Array<{
    originalText: string;
    suggestedText: string;
    pattern: string;
  }>;
}

interface ComplianceChecker {
  checkText(text: string): ComplianceResult;
  loadRules(): Promise<ComplianceRule[]>;
  suggestAlternatives(text: string): string[];
}

export function createComplianceChecker(): ComplianceChecker;
export function checkProductCompliance(product: Product): ComplianceResult;
```

### Persona Rules Service

```typescript
// lib/persona-rules.ts
interface PersonaRule {
  id: string;
  tag: 'pregnancy' | 'lactation' | 'medication' | 'stimulant-sensitivity'; // 必須フィールド
  ingredient: string; // 必須フィールド（ingredientPatternから変更）
  severity: 'low' | 'mid' | 'high'; // 必須フィールド
  message: string; // 必須フィールド（warningMessageから変更）
  recommendedAction?: string; // オプション
}

interface PersonaWarning {
  ruleId: string;
  severity: 'low' | 'mid' | 'high';
  message: string;
  action?: string;
  affectedIngredients: string[];
}

interface WarningAggregation {
  warnings: PersonaWarning[];
  sortBySeverity(): PersonaWarning[]; // severity降順
  deduplicateMessages(): PersonaWarning[]; // 重複メッセージ折り畳み
}

interface PersonaCheckResult {
  hasWarnings: boolean;
  warnings: PersonaWarning[];
}

export function checkPersonaRules(
  product: Product, 
  personaTags: string[]
): PersonaCheckResult;
export function getMinimalPersonaRules(): PersonaRule[];
```

### Warning Banner Component

```typescript
// components/WarningBanner.tsx
interface WarningBannerProps {
  type: 'compliance' | 'persona';
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion?: string;
  onDismiss: () => void;
  className?: string;
}

export function WarningBanner({
  type,
  severity,
  message,
  suggestion,
  onDismiss,
  className
}: WarningBannerProps): JSX.Element;
```

### Persona Warnings Component

```typescript
// components/PersonaWarnings.tsx
interface PersonaWarningsProps {
  product: Product;
  userPersona?: string[];
  onWarningDismiss: (warningId: string) => void;
  className?: string;
}

interface WarningState {
  complianceWarnings: ComplianceResult;
  personaWarnings: PersonaCheckResult;
  dismissedWarnings: Set<string>;
}

export function PersonaWarnings({
  product,
  userPersona,
  onWarningDismiss,
  className
}: PersonaWarningsProps): JSX.Element;
```

## Data Models

### Compliance Rules (tools/phrase-checker/rules.json)
```json
{
  "ng": [
    {
      "pattern": "完治|治る|治す",
      "suggest": "改善が期待される"
    },
    {
      "pattern": "即効|速攻|すぐに効く",
      "suggest": "短期間での変化が報告されている"
    },
    {
      "pattern": "必ず痩せる|絶対痩せる",
      "suggest": "体重管理をサポートする可能性"
    },
    {
      "pattern": "病気が治る|疾患が治る",
      "suggest": "健康維持をサポートする"
    }
  ]
}
```

### Minimal Persona Rules
```typescript
const MINIMAL_PERSONA_RULES: PersonaRule[] = [
  {
    id: 'pregnancy-caffeine',
    personaTag: 'pregnancy',
    ingredientPattern: 'カフェイン|caffeine',
    severity: 'high',
    warningMessage: '妊娠中はカフェインの摂取に注意が必要です',
    recommendedAction: '医師に相談してください'
  },
  {
    id: 'lactation-herbs',
    personaTag: 'lactation',
    ingredientPattern: 'セントジョーンズワート|聖ヨハネ草',
    severity: 'medium',
    warningMessage: '授乳中は一部のハーブが母乳に影響する可能性があります',
    recommendedAction: '使用前に医師に相談してください'
  },
  {
    id: 'medication-interaction',
    personaTag: 'medication',
    ingredientPattern: 'ビタミンK|warfarin',
    severity: 'high',
    warningMessage: '服薬中の方は成分の相互作用にご注意ください',
    recommendedAction: '医師または薬剤師に相談してください'
  },
  {
    id: 'stimulant-sensitivity',
    personaTag: 'stimulant-sensitivity',
    ingredientPattern: 'カフェイン|テアニン|ガラナ',
    severity: 'medium',
    warningMessage: '刺激物に敏感な方は注意が必要な成分が含まれています',
    recommendedAction: '少量から始めることをお勧めします'
  }
];
```

## Error Handling

### Compliance Check Errors
1. **ルールファイル読み込みエラー**: rules.jsonが見つからない場合
2. **パターンマッチングエラー**: 正規表現が無効な場合
3. **テキスト処理エラー**: 商品説明が未定義の場合

### Persona Rule Errors
1. **ペルソナデータエラー**: ユーザーペルソナが無効な場合
2. **成分データエラー**: 商品成分情報が不完全な場合
3. **ルール適用エラー**: ペルソナルールの処理に失敗した場合

### UI Error Handling
- エラー時は警告機能を無効化（サイレントフェイル）
- ログにエラー詳細を記録
- ユーザーには「警告チェックを実行できませんでした」を表示

## Testing Strategy

### Unit Testing (lib/compliance.ts)

```typescript
describe('Compliance Checker', () => {
  describe('checkText', () => {
    it('NGフレーズを正確に検出する');
    it('複数のNGフレーズを検出する');
    it('適切な代替案を提案する');
    it('NGフレーズがない場合は空の結果を返す');
  });

  describe('loadRules', () => {
    it('rules.jsonを正しく読み込む');
    it('ファイルが存在しない場合エラーを処理する');
  });
});
```

### Unit Testing (lib/persona-rules.ts)

```typescript
describe('Persona Rules', () => {
  describe('checkPersonaRules', () => {
    it('妊娠中ペルソナで適切な警告を生成する');
    it('複数のペルソナタグで警告を統合する');
    it('該当しない成分では警告を生成しない');
    it('重要度順に警告をソートする');
  });
});
```

### Component Testing

```typescript
describe('WarningBanner', () => {
  it('コンプライアンス警告を正しく表示する');
  it('ペルソナ警告を重要度に応じて表示する');
  it('閉じるボタンで警告を非表示にする');
  it('アクセシビリティ属性が正しく設定される');
});

describe('PersonaWarnings', () => {
  it('商品とペルソナに基づいて警告を表示する');
  it('警告がない場合は何も表示しない');
  it('解除された警告は再表示しない');
});
```

## UI Design

### Warning Banner Styles

#### High Severity (赤系)
```css
.warning-high {
  @apply bg-red-50 border-red-200 text-red-800;
  @apply border-l-4 border-l-red-500;
}
```

#### Medium Severity (オレンジ系)
```css
.warning-medium {
  @apply bg-orange-50 border-orange-200 text-orange-800;
  @apply border-l-4 border-l-orange-500;
}
```

#### Low Severity (黄系)
```css
.warning-low {
  @apply bg-yellow-50 border-yellow-200 text-yellow-800;
  @apply border-l-4 border-l-yellow-500;
}
```

### Layout Structure

#### Desktop Layout
```
┌─────────────────────────────────────────────────┐
│ ⚠️ 警告: 妊娠中はカフェインの摂取に注意が必要です    │
│ 推奨: 医師に相談してください                      │
│                                            [×] │
└─────────────────────────────────────────────────┘
```

#### Mobile Layout
```
┌─────────────────────────────┐
│ ⚠️ 警告                      │
│ 妊娠中はカフェインの摂取に    │
│ 注意が必要です              │
│ 推奨: 医師に相談してください  │
│                        [×] │
└─────────────────────────────┘
```

## Performance Considerations

### Lazy Loading
- コンプライアンスチェックは商品データ読み込み後に実行
- ペルソナルールは必要時のみ読み込み
- 警告バナーは条件付きレンダリング

### Caching Strategy
- rules.jsonはメモリキャッシュ（セッション中）
- ペルソナルールは静的データとしてバンドル
- 警告結果はコンポーネントレベルでキャッシュ

### Bundle Optimization
- 使用されないペルソナルールは除外
- 正規表現パターンを最適化
- 動的インポートでコード分割

## Accessibility Considerations

### WCAG Compliance
- 警告バナーにrole="status"を設定（非緊急警告用）
- 重要度に応じたaria-levelを設定
- キーボードナビゲーション対応（Tab, Enter, Escape）
- フォーカス管理：Esc/×で閉じる、閉じたら呼出元へフォーカス返却
- スクリーンリーダー用の詳細説明

### Visual Design
- 色だけでなくアイコンでも重要度を表現
- 十分なコントラスト比を確保
- フォーカス状態の明確な表示
- アニメーション無効化オプション対応

## Security Considerations

### Input Sanitization
- 商品説明のXSS防止
- 正規表現インジェクション防止
- ユーザー入力の適切なエスケープ

### Data Privacy
- ペルソナ情報のローカル保存のみ
- 警告ログに個人情報を含めない
- 第三者への警告データ送信なし

## Integration Points

### Sanity CMS Integration
- 商品データから警告対象テキストを抽出
- 成分情報とペルソナルールのマッチング
- 商品更新時の警告再チェック

### User Persona Integration
- ユーザー設定からペルソナタグを取得
- ペルソナ変更時の警告更新
- ゲストユーザー向けの一般警告表示