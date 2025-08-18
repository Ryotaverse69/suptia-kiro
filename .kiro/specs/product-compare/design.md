# Product Compare Design Document

**specVersion**: 2025-08-15

## Overview

最大3製品のスコア・価格・警告を比較表示する機能の設計です。アクセシブルなテーブル形式で製品情報を並べて表示し、スコアBreakdownの要約、警告のハイライト、並べ替え機能、JSON-LD構造化データ対応を提供します。WCAG 2.1 AA準拠のアクセシビリティ、パフォーマンス予算の遵守、継続的な品質検証を実現する包括的なシステムです。

## Architecture

### Component Structure
```
components/compare/
├── ProductCompareTable.tsx (メインテーブルコンポーネント)
├── CompareTableHeader.tsx (ソート可能ヘッダー)
├── CompareTableRow.tsx (製品行コンポーネント)
├── ScoreSummaryRow.tsx (スコア要約行)
├── WarningHighlight.tsx (警告ハイライト)
└── CompareControls.tsx (並べ替えコントロール)

lib/compare/
├── compare-logic.ts (比較ロジック)
├── sort-utils.ts (並べ替えユーティリティ)
├── score-summary.ts (スコア要約計算)
└── warning-analyzer.ts (警告分析)

components/seo/
└── CompareItemListJsonLd.tsx (ItemList JSON-LD)
```

### Page Structure
```
app/compare/
├── page.tsx (比較ページメイン)
├── layout.tsx (比較ページレイアウト)
└── loading.tsx (ローディング状態)

app/products/compare/
└── route.ts (比較API エンドポイント)
```

### Testing Structure
```
__tests__/
├── components/compare/ (コンポーネントテスト)
├── lib/compare/ (ロジックテスト)
├── integration/compare.integration.test.tsx (統合テスト)
└── e2e/product-compare.e2e.test.ts (E2Eテスト)
```

## Components and Interfaces

### Product Compare Table

```typescript
// components/compare/ProductCompareTable.tsx
interface Product {
  id: string;
  name: string;
  price: number;
  totalScore: number;
  scoreBreakdown: ScoreBreakdown;
  warnings: Warning[];
  imageUrl?: string;
  url: string;
}

interface ProductCompareTableProps {
  products: Product[];
  sortBy?: 'score' | 'price' | 'name';
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  maxProducts?: number; // default: 3
}

interface CompareTableState {
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  selectedProducts: Product[];
}
```

### Score Summary Component

```typescript
// components/compare/ScoreSummaryRow.tsx
interface ScoreSummary {
  category: string;
  maxScore: number;
  minScore: number;
  averageScore: number;
  products: Array<{
    productId: string;
    score: number;
  }>;
}

interface ScoreSummaryRowProps {
  summary: ScoreSummary;
  products: Product[];
  highlightBest?: boolean;
  highlightWorst?: boolean;
}

// lib/compare/score-summary.ts
interface ScoreSummaryCalculator {
  calculateSummary(products: Product[]): ScoreSummary[];
  findBestPerformingProduct(category: string, products: Product[]): string;
  findWorstPerformingProduct(category: string, products: Product[]): string;
  calculateCategoryAverage(category: string, products: Product[]): number;
}
```

### Warning Analysis

```typescript
// lib/compare/warning-analyzer.ts
interface WarningAnalysis {
  totalWarnings: number;
  criticalWarnings: Warning[];
  mostImportantWarning?: Warning;
  warningsByProduct: Record<string, Warning[]>;
  warningsByCategory: Record<string, Warning[]>;
}

interface Warning {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  severity: number; // 1-10
  productId: string;
}

interface WarningAnalyzer {
  analyzeWarnings(products: Product[]): WarningAnalysis;
  findMostImportantWarning(warnings: Warning[]): Warning | undefined;
  groupWarningsByCategory(warnings: Warning[]): Record<string, Warning[]>;
  calculateWarningSeverityScore(warnings: Warning[]): number;
}
```

### Sorting Utilities

```typescript
// lib/compare/sort-utils.ts
type SortField = 'score' | 'price' | 'name' | 'warnings';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface ProductSorter {
  sortProducts(products: Product[], config: SortConfig): Product[];
  sortByScore(products: Product[], direction: SortDirection): Product[];
  sortByPrice(products: Product[], direction: SortDirection): Product[];
  sortByWarnings(products: Product[], direction: SortDirection): Product[];
}

// Accessible sort button component
interface SortButtonProps {
  field: SortField;
  currentSort?: SortConfig;
  onSort: (field: SortField, direction: SortDirection) => void;
  label: string;
  'aria-label'?: string;
}
```

### Accessibility Features

```typescript
// lib/compare/accessibility.ts
interface AccessibilityFeatures {
  generateTableCaption(products: Product[]): string;
  generateColumnHeaders(includeSort: boolean): Array<{
    key: string;
    label: string;
    scope: 'col';
    sortable?: boolean;
    'aria-sort'?: 'ascending' | 'descending' | 'none';
  }>;
  generateRowHeaders(products: Product[]): Array<{
    key: string;
    label: string;
    scope: 'row';
  }>;
  handleKeyboardNavigation(event: KeyboardEvent, context: 'table' | 'sort'): void;
}

// Keyboard navigation handler
interface KeyboardNavigationConfig {
  enableArrowKeys: boolean;
  enableTabNavigation: boolean;
  enableEnterActivation: boolean;
  enableSpaceActivation: boolean;
  focusManagement: 'auto' | 'manual';
}
```

### JSON-LD Integration

```typescript
// components/seo/CompareItemListJsonLd.tsx
interface CompareItemList {
  '@context': 'https://schema.org';
  '@type': 'ItemList';
  name: string;
  description: string;
  numberOfItems: number;
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    url: string;
    item: {
      '@type': 'Product';
      name: string;
      url: string;
      offers?: {
        '@type': 'Offer';
        price: number;
        priceCurrency: 'JPY';
      };
    };
  }>;
}

interface CompareItemListJsonLdProps {
  products: Product[];
  pageUrl: string;
  title?: string;
  description?: string;
}
```

## Data Models

### Product Comparison Model
```typescript
interface ProductComparison {
  id: string;
  products: Product[];
  createdAt: string;
  updatedAt: string;
  sortConfig: SortConfig;
  metadata: {
    title: string;
    description: string;
    canonicalUrl: string;
  };
}

interface ComparisonResult {
  products: Product[];
  scoreSummary: ScoreSummary[];
  warningAnalysis: WarningAnalysis;
  recommendations: Array<{
    type: 'best_score' | 'best_price' | 'least_warnings';
    productId: string;
    reason: string;
  }>;
}
```

### Accessibility State Model
```typescript
interface AccessibilityState {
  currentFocus: {
    row: number;
    column: number;
  };
  sortState: {
    field: SortField;
    direction: SortDirection;
  };
  announcements: string[];
  keyboardMode: boolean;
}

interface ScreenReaderContent {
  tableCaption: string;
  columnDescriptions: Record<string, string>;
  rowDescriptions: Record<string, string>;
  sortInstructions: string;
  navigationInstructions: string;
}
```

## Error Handling

### Product Loading Errors
1. **Missing Product Data**: 不完全な製品データの検出と適切なフォールバック
2. **Score Calculation Errors**: スコア計算失敗時のエラー処理とデフォルト値
3. **Image Loading Failures**: 製品画像の読み込み失敗時の代替表示

### Sorting and Filtering Errors
1. **Invalid Sort Parameters**: 不正な並べ替えパラメータの検証と修正
2. **Empty Result Sets**: 比較製品がない場合の適切な空状態表示
3. **Performance Degradation**: 大量データ処理時のパフォーマンス最適化

### Accessibility Errors
1. **Focus Management Failures**: フォーカス管理エラーの検出と回復
2. **Screen Reader Compatibility**: スクリーンリーダー対応の検証と修正
3. **Keyboard Navigation Issues**: キーボードナビゲーション問題の処理

### JSON-LD Validation Errors
1. **Schema Validation Failures**: 構造化データの検証エラー処理
2. **Missing Required Fields**: 必須フィールド不足の検出と補完
3. **Invalid Data Types**: データ型不整合の検出と修正

## Testing Strategy

### Component Testing
```typescript
describe('ProductCompareTable', () => {
  it('最大3製品まで表示する');
  it('適切なテーブル構造を生成する');
  it('アクセシビリティ属性が正しく設定される');
  it('並べ替え機能が正常に動作する');
  it('キーボードナビゲーションが機能する');
});

describe('ScoreSummaryRow', () => {
  it('スコア要約を正しく計算する');
  it('最高・最低スコアを適切にハイライトする');
  it('警告件数を正確に表示する');
});

describe('WarningHighlight', () => {
  it('最重要警告を適切にハイライトする');
  it('警告の重要度順に表示する');
  it('警告がない場合の表示を処理する');
});
```

### Logic Testing
```typescript
describe('Compare Logic', () => {
  it('製品比較データを正しく処理する');
  it('スコア計算が正確である');
  it('並べ替えロジックが正常に動作する');
});

describe('Sort Utils', () => {
  it('スコア順並べ替えが正しく動作する');
  it('価格順並べ替えが正しく動作する');
  it('複数条件での並べ替えを処理する');
});

describe('Warning Analyzer', () => {
  it('警告分析が正確である');
  it('最重要警告を正しく特定する');
  it('警告カテゴリ分類が適切である');
});
```

### Accessibility Testing
```typescript
describe('Accessibility', () => {
  it('eslint-plugin-jsx-a11yが違反を検出しない');
  it('適切なARIA属性が設定される');
  it('キーボードナビゲーションが完全に機能する');
  it('スクリーンリーダーで適切に読み上げられる');
  it('フォーカス管理が正常に動作する');
});
```

### Integration Testing
```typescript
describe('Product Compare Integration', () => {
  it('製品データの取得から表示まで正常に動作する');
  it('並べ替え操作が状態を正しく更新する');
  it('警告表示が適切に統合される');
  it('JSON-LD出力が正しく生成される');
});
```

### E2E Testing
```typescript
describe('Product Compare E2E', () => {
  it('製品比較の基本フローが動作する', async () => {
    // 製品選択 → 比較表示 → 並べ替え → 詳細確認
  });
  
  it('キーボード操作で完全に操作できる', async () => {
    // Tab, Enter, Space, 矢印キーでの操作
  });
  
  it('スクリーンリーダーで適切に読み上げられる', async () => {
    // アクセシビリティツールでの検証
  });
});
```

## Performance Considerations

### Lighthouse Budget Compliance
- **LCP**: 製品画像の最適化と遅延読み込み
- **TBT**: JavaScript実行の最適化とコード分割
- **CLS**: テーブルレイアウトの安定化
- **Bundle Size**: 必要最小限のコンポーネント読み込み

### Rendering Optimization
- **Virtual Scrolling**: 大量製品データの効率的な表示
- **Memoization**: 計算結果のキャッシュ化
- **Lazy Loading**: 非表示コンテンツの遅延読み込み

### Data Processing Optimization
- **Score Calculation**: 効率的なスコア計算アルゴリズム
- **Sorting Performance**: 大量データの高速並べ替え
- **Warning Analysis**: 警告分析の最適化

## Accessibility Considerations

### WCAG 2.1 AA Compliance
- **Table Structure**: 適切なcaption、th、scope属性
- **Keyboard Navigation**: 完全なキーボード操作対応
- **Screen Reader Support**: 適切な読み上げ順序と説明
- **Focus Management**: 論理的なフォーカス移動

### Assistive Technology Support
- **ARIA Attributes**: 適切なaria-sort、aria-label設定
- **Live Regions**: 動的コンテンツ更新の通知
- **High Contrast**: 十分なコントラスト比の確保
- **Text Scaling**: 200%拡大時の表示維持

## Security Considerations

### Data Validation
- **Input Sanitization**: ユーザー入力の適切なサニタイゼーション
- **XSS Prevention**: クロスサイトスクリプティング対策
- **Data Integrity**: 製品データの整合性検証

### Performance Security
- **DoS Prevention**: 過度なリクエストの制限
- **Resource Limits**: メモリ使用量の制限
- **Rate Limiting**: API呼び出し頻度の制限

## Definition of Done (DoD)

### Functionality
- [ ] 最大3製品の比較表示が動作
- [ ] スコア・価格での並べ替えが機能
- [ ] スコア要約と警告ハイライトが表示
- [ ] JSON-LD ItemListが出力される

### Accessibility
- [ ] eslint-plugin-jsx-a11yが無違反
- [ ] キーボードナビゲーションが完全に機能
- [ ] スクリーンリーダーテストが通過
- [ ] WCAG 2.1 AA準拠が確認される

### Performance
- [ ] Lighthouse予算が警告以下（LCP≤2.5s, TBT≤200ms, CLS≤0.1, JS≤300KB）
- [ ] パフォーマンステストが通過
- [ ] バンドルサイズが予算内

### Testing
- [ ] 全コンポーネントテストが通過
- [ ] 統合テストが通過
- [ ] E2Eテスト1本が通過
- [ ] アクセシビリティテストが通過

### Code Quality
- [ ] TypeScript型チェックが通過
- [ ] ESLint/Prettierが通過
- [ ] テストカバレッジが基準を満たす
- [ ] コードレビューが完了