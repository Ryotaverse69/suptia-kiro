# Product Price Table Design Document

**specVersion**: 2025-08-13

## Overview

商品詳細ページ（`/products/[slug]`）に正規化価格テーブルを実装し、実効コスト/日とmg/日あたりコストを表示します。この機能により、ユーザーはサプリメントのコストパフォーマンスを簡単に理解できるようになります。

## Architecture

### Component Structure
```
/products/[slug]/
├── page.tsx (商品詳細ページ)
├── components/
│   └── PriceTable.tsx (価格テーブルコンポーネント)
└── __tests__/
    └── PriceTable.test.tsx
```

### Service Layer
```
/lib/
├── cost.ts (価格計算ロジック)
└── __tests__/
    └── cost.test.ts
```

## Components and Interfaces

### Cost Calculation Service

```typescript
// lib/cost.ts
interface CostCalculationResult {
  effectiveCostPerDay: number;
  normalizedCostPerMgPerDay: number;
  totalMgPerDay: number;
  isCalculable: boolean;
  error?: string;
}

interface ProductCostData {
  priceJPY: number; // JPY固定、税込み
  servingsPerContainer: number;
  servingsPerDay: number;
  ingredients: Array<{
    amountMgPerServing: number;
  }>;
  slug: string; // 必須・ユニーク・kebab-case
}

// mg/日の定義: Σ(ingredients.amountMgPerServing) × servingsPerDay
export function calculateMgPerDay(product: ProductCostData): number;
export function calculateEffectiveCostPerDay(product: ProductCostData): number;
export function calculateNormalizedCostPerMgPerDay(product: ProductCostData): number;
export function calculateProductCosts(product: ProductCostData): CostCalculationResult;

// 異常系処理: servingsPerContainer <= 0 または mgPerDay <= 0 は例外
export class InsufficientDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientDataError';
  }
}
```

### Price Table Component

```typescript
// components/PriceTable.tsx
interface PriceTableProps {
  product: ProductCostData;
  className?: string;
}

interface PriceDisplayData {
  effectiveCostPerDay: string; // 四捨五入2桁表示
  normalizedCostPerMgPerDay: string; // 四捨五入2桁表示
  totalMgPerDay: string;
  isCalculable: boolean;
  error?: string;
}

// A11y対応: caption、scope="col"、aria-sort必須
export function PriceTable({ product, className }: PriceTableProps): JSX.Element;
```

## Data Models

### Product Cost Data
商品の価格計算に必要なデータ構造：

```typescript
interface ProductCostData {
  priceJPY: number;           // 商品価格（円）
  servingsPerContainer: number; // 1容器あたりの摂取回数
  servingsPerDay: number;     // 1日あたりの摂取回数
  ingredients: Array<{
    amountMgPerServing: number; // 1回摂取あたりのmg数
  }>;
}
```

### Calculation Results
計算結果の表示用データ構造：

```typescript
interface PriceDisplayData {
  effectiveCostPerDay: string;      // "¥100.00"
  normalizedCostPerMgPerDay: string; // "¥0.50"
  totalMgPerDay: string;            // "200mg"
  isCalculable: boolean;            // 計算可能かどうか
  error?: string;                   // エラーメッセージ
}
```

## Error Handling

### Calculation Errors
1. **ゼロ除算エラー**: servingsPerContainer または totalMgPerDay が0の場合
2. **データ不足エラー**: 必要なフィールドが未定義の場合
3. **負の値エラー**: 価格や数量が負の値の場合

### UI Error Display
- 計算不可の場合: "計算できません" を表示
- エラーメッセージがある場合: 具体的なエラー内容を表示
- データ読み込み中: スケルトンローダーを表示

## Testing Strategy

### Unit Testing (lib/cost.ts)

```typescript
describe('Cost Calculations', () => {
  describe('calculateEffectiveCostPerDay', () => {
    it('正常な商品データで正しく計算する');
    it('servingsPerContainerが0の場合エラーを投げる');
    it('負の価格の場合エラーを投げる');
  });

  describe('calculateNormalizedCostPerMgPerDay', () => {
    it('複数成分の商品で正しく計算する');
    it('totalMgPerDayが0の場合エラーを投げる');
    it('成分が空配列の場合エラーを投げる');
  });

  describe('calculateProductCosts', () => {
    it('正常なデータで完全な結果を返す');
    it('エラー時にisCalculable: falseを返す');
  });
});
```

### Component Testing (PriceTable.test.tsx)

```typescript
describe('PriceTable', () => {
  it('正常な商品データで価格テーブルを表示する');
  it('計算不可の場合エラーメッセージを表示する');
  it('モバイルでレスポンシブに表示される');
  it('通貨フォーマットが正しく適用される');
});
```

### Integration Testing
- 商品詳細ページでPriceTableが正しく表示される
- Sanityから取得した商品データで計算が動作する
- エラー状態が適切にハンドリングされる

## UI Design

### Desktop Layout
```
┌─────────────────────────────────────┐
│ 価格情報                              │
├─────────────────────────────────────┤
│ 実効コスト/日    │ ¥100.00           │
│ mg/日あたりコスト │ ¥0.50             │
│ 総mg/日         │ 200mg             │
└─────────────────────────────────────┘
```

### Mobile Layout
```
┌─────────────────────┐
│ 価格情報              │
├─────────────────────┤
│ 実効コスト/日         │
│ ¥100.00             │
├─────────────────────┤
│ mg/日あたりコスト     │
│ ¥0.50               │
├─────────────────────┤
│ 総mg/日              │
│ 200mg               │
└─────────────────────┘
```

### Styling Guidelines
- Tailwind CSSを使用
- テーブルは`border-collapse: collapse`
- 価格は右寄せ、通貨記号付き
- エラー状態は赤色テキスト
- レスポンシブデザイン（sm:以上でテーブル形式）

## Performance Considerations

### Calculation Optimization
- 計算結果をuseMemoでキャッシュ
- 商品データが変更された時のみ再計算
- 重い計算処理はWeb Workerを検討（将来的）

### Rendering Optimization
- React.memoでコンポーネントの不要な再レンダリングを防止
- 価格フォーマット処理をuseMemoでキャッシュ

## Accessibility Considerations

### WCAG Compliance
- テーブルに適切なheader属性を設定
- 価格情報にaria-labelを追加
- キーボードナビゲーション対応
- スクリーンリーダー対応

### Internationalization
- 通貨フォーマットはIntl.NumberFormat('ja-JP',{style:'currency',currency:'JPY'})を使用
- 内部計算はフル精度、表示時のみ四捨五入2桁で丸める
- 日本語UIテキストを適切に配置
- 将来的な多言語対応を考慮した構造

### Color Accessibility
- 色コントラスト4.5:1を確保
- 色だけでなくテキストでも情報を提供

## Security Considerations

### Input Validation
- 商品データの型チェック
- 数値の範囲チェック（負の値の防止）
- XSS防止のためのサニタイゼーション

### Error Information Disclosure
- エラーメッセージに機密情報を含めない
- ユーザーフレンドリーなエラー表示