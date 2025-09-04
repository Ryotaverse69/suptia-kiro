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
  evidence: number;    // エビデンススコア (0-100)
  safety: number;      // 安全性スコア (0-100)
  cost: number;        // コストスコア (0-100)
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
  NETWORK_ERROR: 'ネットワークエラーが発生しました'
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
  { field: 'weight', required: false, pattern: /^\d+(\.\d+)?$/ }
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
  /* Primary Colors - 近未来的なブルー系 */
  --primary-50: #eff6ff;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  
  /* Secondary Colors - アクセント用 */
  --secondary-500: #10b981;
  --secondary-600: #059669;
  
  /* Neutral Colors */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-500: #6b7280;
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
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### Spacing System
```css
/* Spacing Scale (Tailwind compatible) */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
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

### Performance Optimizations
- **Image optimization**: Next.js Image component with WebP
- **Code splitting**: Route-based and component-based splitting
- **Lazy loading**: Below-the-fold content
- **Caching**: Static generation for product pages
- **CDN**: Static assets delivery

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
    currency: currency
  }).format(amount);
}
```