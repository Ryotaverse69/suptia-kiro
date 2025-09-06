# Design Document

## Overview

サプティアのフロントエンドUI/UXは、ユーザーがサプリメントを効率的に発見・比較・選択できる包括的なWebアプリケーションです。Next.js 14のApp Routerを使用し、TypeScriptとTailwind CSSで実装します。AIレコメンド機能、詳細な商品分析、個人診断システムを統合した近未来的でスタイリッシュなインターフェースを提供します。

## Architecture

### Frontend Architecture

```
Next.js 14 App Router
├── app/
│   ├── page.tsx (トップページ)
│   ├── about/page.tsx (サプティアとは)
│   ├── ingredients/
│   │   ├── page.tsx (成分ガイド)
│   │   └── [category]/page.tsx (カテゴリ別成分)
│   ├── compare/page.tsx (人気比較・比較ビュー)
│   ├── diagnosis/page.tsx (診断ページ)
│   ├── products/[slug]/page.tsx (商品詳細)
│   ├── mypage/
│   │   ├── page.tsx (マイページ)
│   │   ├── favorites/page.tsx (お気に入り)
│   │   ├── history/page.tsx (診断履歴)
│   │   └── alerts/page.tsx (価格アラート)
│   └── legal/
│       ├── privacy/page.tsx
│       ├── terms/page.tsx
│       └── disclaimer/page.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Navigation.tsx
│   ├── search/
│   │   ├── SearchBar.tsx
│   │   └── AIRecommendation.tsx
│   ├── diagnosis/
│   │   ├── DiagnosisForm.tsx
│   │   ├── ScoreDisplay.tsx
│   │   └── ScoreBreakdown.tsx
│   ├── products/
│   │   ├── ProductCard.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── IngredientList.tsx
│   │   ├── PriceComparison.tsx
│   │   └── PriceHistory.tsx
│   ├── comparison/
│   │   ├── ComparisonTable.tsx
│   │   └── ComparisonFilters.tsx
│   └── ui/ (共通UIコンポーネント)
└── lib/
    ├── scoring.ts (スコアリングロジック)
    ├── ai-recommendations.ts
    ├── price-calculations.ts
    └── ingredient-data.ts
```

### State Management

- **React Server Components**: サーバーサイドでのデータフェッチ
- **useState/useReducer**: ローカル状態管理
- **Context API**: グローバル状態（ユーザー設定、言語・通貨）
- **Local Storage**: お気に入り、診断履歴の永続化

### Styling Strategy

- **Tailwind CSS**: ユーティリティファーストのスタイリング
- **CSS Modules**: コンポーネント固有のスタイル
- **Design System**: 一貫したカラーパレット、タイポグラフィ、スペーシング

## Components and Interfaces

### Core Layout Components

#### Header Component

```typescript
interface HeaderProps {
  currentLocale: string;
  currentCurrency: string;
  onLocaleChange: (locale: string) => void;
  onCurrencyChange: (currency: string) => void;
}

// Features:
// - サプティア + Suptia ロゴ
// - ナビゲーションメニュー
// - 言語・通貨切替
// - レスポンシブデザイン
```

#### SearchBar Component

```typescript
interface SearchBarProps {
  onSearch: (query: string) => void;
  aiRecommendations: Recommendation[];
  placeholder: string;
  size: 'small' | 'large';
}

interface Recommendation {
  id: string;
  title: string;
  reason: string;
  confidence: number;
}
```

### Diagnosis System Components

#### DiagnosisForm Component

```typescript
interface DiagnosisFormProps {
  onSubmit: (answers: DiagnosisAnswers) => void;
  questions: DiagnosisQuestion[];
}

interface DiagnosisQuestion {
  id: string;
  type: 'single' | 'multiple' | 'scale';
  category: 'purpose' | 'constitution' | 'lifestyle';
  question: string;
  options: string[];
}

interface DiagnosisAnswers {
  purpose: string[];
  constitution: string[];
  lifestyle: string[];
}
```

#### ScoreDisplay Component

```typescript
interface ScoreDisplayProps {
  totalScore: number;
  breakdown: ScoreBreakdown;
  costPerDay: number;
  dangerAlerts: DangerAlert[];
}

interface ScoreBreakdown {
  evidence: number; // エビデンススコア (0-100)
  safety: number; // 安全性スコア (0-100)
  cost: number; // コストスコア (0-100)
  practicality: number; // 実用性スコア (0-100)
}

interface DangerAlert {
  ingredient: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}
```

### Product Components

#### ProductDetail Component

```typescript
interface ProductDetailProps {
  product: Product;
  relatedProducts: Product[];
  userPersona?: UserPersona;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  ingredients: Ingredient[];
  pricing: PricingInfo;
  research: ResearchSummary;
  reviews: ReviewSummary;
  priceHistory: PricePoint[];
  interactions: Interaction[];
  contraindications: string[];
}

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  dailyValue?: number;
  form: string;
}

interface PricingInfo {
  price: number;
  currency: string;
  servingsPerContainer: number;
  normalizedPricePerMg: number;
  costPerDay: number;
}
```

#### ComparisonTable Component

```typescript
interface ComparisonTableProps {
  products: Product[];
  comparisonCriteria: ComparisonCriteria[];
  onProductRemove: (productId: string) => void;
  onCriteriaChange: (criteria: ComparisonCriteria[]) => void;
}

interface ComparisonCriteria {
  field: keyof Product;
  label: string;
  type: 'text' | 'number' | 'score' | 'price';
  sortable: boolean;
}
```

### Filter and Search Components

#### IngredientFilter Component

```typescript
interface IngredientFilterProps {
  categories: IngredientCategory[];
  purposes: Purpose[];
  priceRanges: PriceRange[];
  forms: ProductForm[];
  onFilterChange: (filters: FilterState) => void;
}

interface FilterState {
  categories: string[];
  purposes: string[];
  priceRange: [number, number];
  forms: string[];
  sortBy: 'price' | 'rating' | 'popularity';
  sortOrder: 'asc' | 'desc';
}
```

## Data Models

### User Data Models

```typescript
interface UserPersona {
  id: string;
  purposes: string[];
  constitution: ConstitutionType;
  lifestyle: LifestyleFactors;
  allergies: string[];
  medications: string[];
  preferences: UserPreferences;
}

interface UserPreferences {
  locale: string;
  currency: string;
  priceAlerts: boolean;
  emailNotifications: boolean;
  favoriteCategories: string[];
}

interface DiagnosisHistory {
  id: string;
  timestamp: Date;
  answers: DiagnosisAnswers;
  results: DiagnosisResults;
  recommendedProducts: string[];
}
```

### Product Data Models

```typescript
interface ResearchSummary {
  studyCount: number;
  evidenceLevel: 'high' | 'medium' | 'low';
  keyFindings: string[];
  lastUpdated: Date;
}

interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  sentimentScore: number;
  commonBenefits: string[];
  commonSideEffects: string[];
}

interface PricePoint {
  date: Date;
  price: number;
  source: string;
}
```

## Error Handling

### Client-Side Error Handling

```typescript
// Error Boundary for React components
class ProductErrorBoundary extends React.Component {
  // Handle product loading errors
  // Display fallback UI
  // Log errors for monitoring
}

// API Error Handling
interface APIError {
  code: string;
  message: string;
  details?: any;
}

// User-friendly error messages
const ERROR_MESSAGES = {
  PRODUCT_NOT_FOUND: '商品が見つかりませんでした',
  DIAGNOSIS_FAILED: '診断処理中にエラーが発生しました',
  SEARCH_TIMEOUT: '検索がタイムアウトしました',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
};
```

### Form Validation

```typescript
interface ValidationRule {
  field: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
}

// Diagnosis form validation
const DIAGNOSIS_VALIDATION: ValidationRule[] = [
  { field: 'purpose', required: true },
  { field: 'age', required: true, pattern: /^\d+$/ },
  { field: 'weight', required: false, pattern: /^\d+(\.\d+)?$/ },
];
```

## Testing Strategy

### Unit Testing

- **Jest + React Testing Library**: コンポーネントテスト
- **MSW (Mock Service Worker)**: API モッキング
- **Testing targets**:
  - スコアリングロジック
  - 価格計算
  - フィルタリング機能
  - フォームバリデーション

### Integration Testing

- **Playwright**: E2Eテスト
- **Critical user flows**:
  - 商品検索から詳細表示まで
  - 診断フローの完了
  - 比較機能の利用
  - お気に入り登録・管理

### Performance Testing

- **Lighthouse CI**: パフォーマンス監視
- **Core Web Vitals**: LCP, FID, CLS の最適化
- **Bundle analysis**: バンドルサイズの監視

### Accessibility Testing

- **axe-core**: アクセシビリティ自動テスト
- **WCAG 2.1 AA準拠**:
  - キーボードナビゲーション
  - スクリーンリーダー対応
  - カラーコントラスト
  - フォーカス管理

## Design System

### Color Palette

```css
:root {
  /* Background - 白ベース */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;

  /* Primary Colors - 近未来的なブルー系 */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-200: #bfdbfe;
  --primary-300: #93c5fd;
  --primary-400: #60a5fa;
  --primary-500: #3b82f6; /* メインアクセントカラー */
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  --primary-800: #1e40af;
  --primary-900: #1e3a8a;

  /* Secondary Colors - アクセント用 */
  --secondary-500: #10b981;
  --secondary-600: #059669;

  /* Neutral Colors */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;

  /* Status Colors */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
}
```

### Typography

```css
/* Font Stack */
font-family: 'Inter', 'Noto Sans JP', sans-serif;

/* Type Scale */
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem; /* 36px */
```

### Spacing System

```css
/* Spacing Scale (Tailwind compatible) */
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-4: 1rem; /* 16px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
```

### Component Variants

```typescript
// Button variants
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

// Card variants
type CardVariant = 'default' | 'elevated' | 'outlined';

// Badge variants for scores
type BadgeVariant = 'high' | 'medium' | 'low' | 'danger';
```

## UI構成とワイヤーフレーム

### ホームページレイアウト

```html
<!-- ファーストビュー -->
<section
  class="min-h-screen bg-gradient-to-br from-white to-blue-50 flex flex-col justify-center items-center px-4"
>
  <!-- キャッチフレーズ -->
  <h1 class="text-4xl md:text-6xl font-bold text-gray-900 text-center mb-8">
    あなたに最も合うサプリを<br />
    <span class="text-primary-600">最も安い価格で。</span>
  </h1>

  <!-- 大型検索窓 -->
  <div class="w-full max-w-4xl">
    <div class="relative">
      <input
        class="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200"
        placeholder="サプリメントを検索（例：ビタミンD、疲労回復、美容）"
      />
      <button
        class="absolute right-2 top-2 px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
      >
        検索
      </button>
    </div>
  </div>
</section>

<!-- 人気サプリ比較セクション -->
<section class="py-16 bg-white">
  <div class="container mx-auto px-4">
    <h2 class="text-3xl font-bold text-center mb-12">人気サプリ比較</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <!-- 商品カード -->
      <div
        class="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
      >
        <div class="flex items-center justify-between mb-4">
          <span
            class="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium"
          >
            総合スコア 85
          </span>
          <button class="text-gray-400 hover:text-red-500">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <!-- ハートアイコン -->
            </svg>
          </button>
        </div>
        <h3 class="text-xl font-semibold mb-2">ビタミンD3 2000IU</h3>
        <p class="text-gray-600 mb-4">高品質ビタミンD3サプリメント</p>
        <div class="flex items-center justify-between">
          <span class="text-2xl font-bold text-primary-600">¥1,980</span>
          <span class="text-sm text-gray-500">¥66/日</span>
        </div>
      </div>
    </div>
  </div>
</section>
```

### 診断結果ページレイアウト

```html
<div class="container mx-auto px-4 py-8">
  <!-- 総合スコア表示 -->
  <div
    class="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white mb-8"
  >
    <div class="text-center">
      <h2 class="text-2xl font-bold mb-4">あなたの診断結果</h2>
      <div class="text-6xl font-bold mb-2">85</div>
      <p class="text-primary-100">総合適合スコア</p>
    </div>
  </div>

  <!-- スコア内訳 -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
    <div class="bg-white border border-gray-200 rounded-xl p-6 text-center">
      <div class="text-3xl font-bold text-green-600 mb-2">92</div>
      <p class="text-gray-600">エビデンス</p>
    </div>
    <div class="bg-white border border-gray-200 rounded-xl p-6 text-center">
      <div class="text-3xl font-bold text-blue-600 mb-2">88</div>
      <p class="text-gray-600">安全性</p>
    </div>
    <div class="bg-white border border-gray-200 rounded-xl p-6 text-center">
      <div class="text-3xl font-bold text-purple-600 mb-2">78</div>
      <p class="text-gray-600">コスト</p>
    </div>
    <div class="bg-white border border-gray-200 rounded-xl p-6 text-center">
      <div class="text-3xl font-bold text-orange-600 mb-2">82</div>
      <p class="text-gray-600">実用性</p>
    </div>
  </div>

  <!-- 実効コスト表示 -->
  <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-yellow-800">実効コスト/日</h3>
        <p class="text-yellow-600">推奨商品の1日あたりコスト</p>
      </div>
      <div class="text-3xl font-bold text-yellow-800">¥156</div>
    </div>
  </div>

  <!-- 危険成分アラート -->
  <div class="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
    <div class="flex items-start">
      <svg
        class="w-6 h-6 text-red-500 mt-1 mr-3"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <!-- 警告アイコン -->
      </svg>
      <div>
        <h3 class="text-lg font-semibold text-red-800 mb-2">
          注意が必要な成分
        </h3>
        <p class="text-red-600">
          あなたの体質・服用薬との相互作用の可能性があります
        </p>
        <ul class="mt-2 text-red-700">
          <li>• セント・ジョーンズ・ワート（抗うつ薬との相互作用）</li>
        </ul>
      </div>
    </div>
  </div>
</div>
```

### 商品詳細ページレイアウト

```html
<div class="container mx-auto px-4 py-8">
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- 商品基本情報 -->
    <div class="lg:col-span-2">
      <div class="bg-white border border-gray-200 rounded-xl p-8">
        <div class="flex items-start justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
              ビタミンD3 2000IU
            </h1>
            <p class="text-gray-600">Nature Made</p>
          </div>
          <button
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <!-- ハートアイコン -->
            </svg>
          </button>
        </div>

        <!-- 成分一覧 -->
        <div class="mb-8">
          <h3 class="text-xl font-semibold mb-4">成分配合</h3>
          <div class="overflow-x-auto">
            <table class="w-full border border-gray-200 rounded-lg">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left">成分名</th>
                  <th class="px-4 py-3 text-left">配合量</th>
                  <th class="px-4 py-3 text-left">1日推奨量比</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-t border-gray-200">
                  <td class="px-4 py-3">ビタミンD3</td>
                  <td class="px-4 py-3">2000 IU (50μg)</td>
                  <td class="px-4 py-3 text-green-600 font-semibold">1000%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- サイドバー（価格・購入情報） -->
    <div class="lg:col-span-1">
      <div class="bg-white border border-gray-200 rounded-xl p-6 sticky top-4">
        <div class="text-center mb-6">
          <div class="text-3xl font-bold text-primary-600 mb-2">¥1,980</div>
          <p class="text-gray-600">¥66/日 (30日分)</p>
        </div>

        <!-- 価格比較 -->
        <div class="mb-6">
          <h4 class="font-semibold mb-3">価格比較</h4>
          <div class="space-y-2">
            <div
              class="flex justify-between items-center p-3 bg-green-50 rounded-lg"
            >
              <span class="text-sm">Amazon</span>
              <span class="font-semibold text-green-600">¥1,980</span>
            </div>
            <div
              class="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <span class="text-sm">楽天市場</span>
              <span class="font-semibold">¥2,180</span>
            </div>
          </div>
        </div>

        <!-- 購入ボタン -->
        <button
          class="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors"
        >
          最安値で購入
        </button>
      </div>
    </div>
  </div>
</div>
```

## Responsive Design

### Breakpoint Strategy

```css
/* Mobile First Approach */
/* xs: 0px - 475px (default) */
/* sm: 476px - 639px */
/* md: 640px - 767px */
/* lg: 768px - 1023px */
/* xl: 1024px - 1279px */
/* 2xl: 1280px+ */
```

### Layout Adaptations

- **Mobile**: Single column, collapsible navigation, touch-optimized
- **Tablet**: Two-column layout, sidebar navigation
- **Desktop**: Multi-column layout, persistent navigation, hover states

### Tailwindクラス例

```css
/* レスポンシブグリッド */
.responsive-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8;
}

/* レスポンシブテキスト */
.responsive-heading {
  @apply text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold;
}

/* レスポンシブパディング */
.responsive-container {
  @apply px-4 md:px-6 lg:px-8 xl:px-12 py-8 md:py-12 lg:py-16;
}

/* レスポンシブカード */
.responsive-card {
  @apply bg-white border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-6 lg:p-8 hover:shadow-lg transition-shadow;
}
```

### Performance Optimizations

- **Image optimization**: Next.js Image component with WebP
- **Code splitting**: Route-based and component-based splitting
- **Lazy loading**: Below-the-fold content
- **Caching**: Static generation for product pages
- **CDN**: Static assets delivery

## Security and Compliance

### Content Security Policy (CSP)

```typescript
// next.config.js CSP設定
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' *.sanity.io;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: *.sanity.io;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;
```

### Content Sanitization

```typescript
// Sanityコンテンツのサニタイズ
interface SanitizedContent {
  _type: string;
  content: PortableTextBlock[];
  complianceChecked: boolean;
  lastReviewed: Date;
}

// 薬機法チェック済みコンテンツのみ表示
function validatePharmaceuticalCompliance(content: any): boolean {
  // 薬機法違反表現のチェック
  // 効果効能の過度な表現を検出
  // 医薬品的表現の除外
  return content.complianceChecked === true;
}
```

### Performance Requirements

```typescript
// Core Web Vitals目標値
interface PerformanceTargets {
  LCP: 2.5; // seconds - Largest Contentful Paint
  FID: 100; // milliseconds - First Input Delay
  CLS: 0.1; // score - Cumulative Layout Shift
}

// パフォーマンス監視
function trackWebVitals(metric: any) {
  // Vercel Analytics / Google Analytics 4 連携
  // リアルタイムパフォーマンス監視
  // アラート設定（閾値超過時）
}
```

## Internationalization (i18n)

### Supported Locales

- **Japanese (ja)**: Primary language
- **English (en)**: Secondary language

### Currency Support

- **JPY (¥)**: Primary currency
- **USD ($)**: Secondary currency

### Implementation

```typescript
// next-intl configuration
interface LocaleConfig {
  locale: string;
  currency: string;
  dateFormat: string;
  numberFormat: Intl.NumberFormatOptions;
}

// Price formatting
function formatPrice(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}
```
