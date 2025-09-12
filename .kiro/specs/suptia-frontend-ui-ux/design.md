# Design Document

## Overview

サプティアのフロントエンドUI/UX再設計：**Trivago構造 + Apple/xAIテイスト**

**🎯 設計方針**
- **構造**: Trivago の検索→結果比較→絞り込み→詳細フローを踏襲
- **ビジュアル**: Apple/xAI の余白広め、洗練、静かなモーション、未来的トーン
- **技術**: Next.js 14 App Router + TypeScript + Tailwind CSS
- **品質**: 余白とタイポの美しさで勝負、「軽さ/安っぽさ」を徹底排除

**🧭 情報設計（ページ＆導線）**
- **/(home)**: HeroSearch（フルビューポート）→ PopularComparison → IngredientGuide → AIRecommendation
- **/search**: 左フィルター + 右結果リスト + 下比較トレイ
- **/compare**: 固定ヘッダー + 横スクロール比較テーブル
- **/ingredients**: グリッド一覧 → 詳細（効能・エビデンス・注意点）
- **/products/[slug]**: ヒーロー（商品名＋最安価格CTA）→ 価格一覧 → 成分ブロック → レビュー要約

## Architecture

### Frontend Architecture - Trivago構造対応

```
Next.js 14 App Router
├── app/
│   ├── (home)/page.tsx                    # HeroSearch + PopularComparison + IngredientGuide + AIRecommendation
│   ├── search/page.tsx                    # 検索結果（左フィルター + 右リスト + 下トレイ）
│   ├── compare/page.tsx                   # 比較テーブル（固定ヘッダー + 横スクロール）
│   ├── ingredients/
│   │   ├── page.tsx                       # 成分グリッド一覧
│   │   └── [slug]/page.tsx                # 成分詳細（効能・エビデンス・注意点）
│   ├── products/[slug]/page.tsx           # 商品詳細（ヒーロー + 価格 + 成分 + レビュー）
│   ├── about/page.tsx                     # サプティアとは
│   └── legal/
│       ├── privacy/page.tsx
│       ├── terms/page.tsx
│       └── disclaimer/page.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx                     # ロゴ + グロナビ + 言語通貨切替
│   │   └── Footer.tsx                     # 法的リンク + 重複ナビ
│   ├── home/
│   │   ├── HeroSearch.tsx                 # フルビューポート検索 + AIサジェスト
│   │   ├── PopularComparison.tsx          # 人気サプリ比較カード
│   │   ├── IngredientGuide.tsx            # 成分カードグリッド
│   │   └── AIRecommendation.tsx           # パーソナライズ枠
│   ├── search/
│   │   ├── SearchFilters.tsx              # stickyサイドバーフィルター
│   │   ├── ResultCard.tsx                 # 商品カード（比較追加ボタン付き）
│   │   └── CompareTray.tsx                # 画面下固定比較トレイ
│   ├── compare/
│   │   └── CompareTable.tsx               # Stickyヘッダー + 横スクロール
│   ├── ingredients/
│   │   ├── IngredientCard.tsx             # 効能バッジ + エビデンス強度
│   │   └── IngredientDetail.tsx           # 詳細情報表示
│   ├── products/
│   │   ├── ProductHero.tsx                # 商品名 + 最安価格CTA
│   │   ├── PriceList.tsx                  # 価格一覧
│   │   ├── IngredientBlock.tsx            # 成分ブロック
│   │   └── ReviewSummary.tsx              # レビュー要約
│   └── ui/                                # 共通UIコンポーネント
└── lib/
    ├── search-filters.ts                  # フィルタリングロジック
    ├── comparison-logic.ts                # 比較機能
    ├── ai-suggestions.ts                  # AIサジェスト
    └── price-calculations.ts              # 価格計算
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

## 🧩 コアコンポーネント（Next.js + Tailwind）

### Header Component - Apple風レイアウト

```typescript
interface HeaderProps {
  currentLocale: string;
  currentCurrency: string;
  onLocaleChange: (locale: string) => void;
  onCurrencyChange: (currency: string) => void;
}

// 構成:
// 左：ロゴ「サプティア / Suptia」
// 中：グロナビ（サプティアとは / 成分ガイド / 比較）
// 右：言語・通貨切替（モーダル）、検索ショートカット
```

### HeroSearch Component - フルビューポート検索

```typescript
interface HeroSearchProps {
  onSearch: (query: string) => void;
  aiSuggestions: AISuggestion[];
  popularKeywords: string[];
  trendingCategories: string[];
}

interface AISuggestion {
  id: string;
  text: string;
  intent: 'purpose' | 'ingredient' | 'condition';
  confidence: number;
}

// Features:
// - 中央大検索（AIサジェスト / 最近の検索 / 人気キーワード）
// - 100vh、白背景、アクセント青のグラデ
// - 微粒子/微発光エフェクトはCSSのみ（低コスト）
```

### SearchFilters Component - stickyサイドバー

```typescript
interface SearchFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  aiSelectedConditions: string[];
}

interface FilterState {
  purpose: string[];        // 目的（疲労回復、美容、免疫等）
  ingredients: string[];    // 成分
  priceRange: [number, number];
  rating: number;
  brands: string[];
  form: string[];          // 形状（錠剤、カプセル等）
}

// Features:
// - チップ/スライダー/トグル
// - 開閉セクションと「条件クリア」ボタン
// - 「AIが選んだ条件」チップ（ワンタップで適用/解除）
```

### ResultCard Component - Trivago風商品カード

```typescript
interface ResultCardProps {
  product: ProductSummary;
  onAddToCompare: (productId: string) => void;
  onViewDetails: (productId: string) => void;
  isInCompareTray: boolean;
}

interface ProductSummary {
  id: string;
  name: string;
  brand: string;
  price: number;
  pricePerDay: number;
  rating: number;
  reviewCount: number;
  mainIngredients: string[];
  imageUrl: string;
  badges: ProductBadge[];
}

// Features:
// - 画像 / タイトル / 指標（価格・評価・容量） / CTA（比較に追加 / 最安を見る）
// - ホバーで影・微拡大（Apple寄り：上品で短い）
```

### CompareTray Component - 画面下固定

```typescript
interface CompareTrayProps {
  compareProducts: ProductSummary[];
  onRemoveProduct: (productId: string) => void;
  onGoToCompare: () => void;
  maxProducts: number; // 4件まで
}

// Features:
// - 追加中の商品を最大4件までプレビュー→「比較へ」ボタン
// - 画面下固定、スライドアップアニメーション
```

### CompareTable Component - Trivago風比較テーブル

```typescript
interface CompareTableProps {
  products: Product[];
  comparisonFields: ComparisonField[];
  onRemoveProduct: (productId: string) => void;
}

interface ComparisonField {
  key: keyof Product;
  label: string;
  type: 'text' | 'price' | 'rating' | 'ingredients' | 'chart';
  sticky?: boolean; // 主要指標は固定列
}

// Features:
// - Stickyヘッダー、カラム横スクロール、主要指標は固定列
// - 価格履歴/主要成分/容量/最安店舗
```

### IngredientCard Component - 成分グリッド

```typescript
interface IngredientCardProps {
  ingredient: IngredientSummary;
  onViewDetail: (ingredientId: string) => void;
}

interface IngredientSummary {
  id: string;
  name: string;
  category: 'vitamin' | 'mineral' | 'herb' | 'amino_acid';
  benefits: string[];
  evidenceLevel: 'A' | 'B' | 'C'; // エビデンス強度
  safetyRating: number;
  imageUrl: string;
}

// Features:
// - 効能バッジ、エビデンス強度（A/B/Cのラベル）
// - カテゴリ別カラーコーディング
```

### ProductHero Component - 商品詳細ヒーロー

```typescript
interface ProductHeroProps {
  product: Product;
  lowestPrice: PriceInfo;
  onBuyNow: (storeUrl: string) => void;
  aiRecommendationReason?: string;
}

interface PriceInfo {
  price: number;
  store: string;
  storeUrl: string;
  pricePerDay: number;
}

// Features:
// - ヒーロー（商品名＋最安価格CTA）
// - 「この製品が合う理由」を要約（Sanity/GROQから）
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

### Color Palette - Apple風デザインシステム

```css
:root {
  /* Background - 白基調 */
  --bg-primary: #ffffff; /* メイン背景 */
  --bg-secondary: #fbfbfd; /* セカンダリ背景 */
  --bg-tertiary: #f5f5f7; /* Apple風グレー背景 */

  /* Primary Colors - 近未来的なブルー系（Apple風） */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-200: #bfdbfe;
  --primary-300: #93c5fd;
  --primary-400: #60a5fa;
  --primary-500: #3b82f6; /* メインアクセントカラー */
  --primary-600: #2563eb; /* ホバー状態 */
  --primary-700: #1d4ed8; /* アクティブ状態 */
  --primary-800: #1e40af;
  --primary-900: #1e3a8a;

  /* Apple風ニュートラルカラー */
  --gray-50: #fafafa;
  --gray-100: #f4f4f5;
  --gray-200: #e4e4e7;
  --gray-300: #d4d4d8;
  --gray-400: #a1a1aa;
  --gray-500: #71717a;
  --gray-600: #52525b; /* Apple風テキストカラー */
  --gray-700: #3f3f46;
  --gray-800: #27272a;
  --gray-900: #18181b; /* Apple風ダークテキスト */

  /* Apple風フッター */
  --footer-bg: #1d1d1f; /* Apple風ダークグレー */
  --footer-text: #f5f5f7; /* Apple風ライトグレー */

  /* Status Colors */
  --success: #34d399; /* Apple風グリーン */
  --warning: #fbbf24; /* Apple風イエロー */
  --error: #f87171; /* Apple風レッド */
  --info: #3b82f6; /* プライマリブルー */
}
```

### Typography - Apple風フォントシステム

```css
/* Font Stack - Apple風 */
font-family: 'Noto Sans JP', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Apple風 Type Scale */
--text-xs: 0.75rem; /* 12px - キャプション */
--text-sm: 0.875rem; /* 14px - 小さなテキスト */
--text-base: 1rem; /* 16px - 本文 */
--text-lg: 1.125rem; /* 18px - 大きな本文 */
--text-xl: 1.25rem; /* 20px - 小見出し */
--text-2xl: 1.5rem; /* 24px - 見出し */
--text-3xl: 1.875rem; /* 30px - 大見出し */
--text-4xl: 2.25rem; /* 36px - ヒーロータイトル */
--text-5xl: 3rem; /* 48px - 大型ヒーロー */
--text-6xl: 3.75rem; /* 60px - 特大ヒーロー */

/* Apple風フォントウェイト */
--font-light: 300;
--font-normal: 400;
--font-medium: 500; /* Apple風ミディアム */
--font-semibold: 600; /* Apple風セミボールド */
--font-bold: 700;

/* Apple風行間 */
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

### Spacing System - Apple風余白システム

```css
/* Apple風 Spacing Scale - 余白を多用 */
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
--space-20: 5rem; /* 80px - Apple風大きな余白 */
--space-24: 6rem; /* 96px - セクション間 */
--space-32: 8rem; /* 128px - 大型セクション間 */
--space-40: 10rem; /* 160px - ヒーロー用 */

/* Apple風コンテナ幅 */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;

/* Apple風最大幅制限 */
--max-width-prose: 65ch; /* 読みやすいテキスト幅 */
--max-width-hero: 1200px; /* ヒーローセクション最大幅 */
```

### Component Variants - Apple風デザインシステム

```typescript
// Apple風 Button variants
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'apple-blue';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'; // Apple風大型ボタン追加

// Apple風 Card variants
type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass' | 'hero';

// Apple風 Badge variants
type BadgeVariant = 'high' | 'medium' | 'low' | 'danger' | 'success' | 'info';

// Apple風 Animation variants
type AnimationType = 'fade-in' | 'slide-up' | 'scale-in' | 'blur-in';
type TransitionDuration = 'fast' | 'normal' | 'slow' | 'apple-smooth';

// Apple風 Layout variants
type LayoutVariant = 'hero' | 'section' | 'card-grid' | 'comparison-table';
```

### Apple風アニメーションシステム

```css
/* Apple風トランジション */
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-normal: 300ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-apple: 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94); /* Apple風イージング */

/* Apple風ホバー効果 */
.apple-hover {
  transition: all var(--transition-apple);
  transform: translateY(0);
}

.apple-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

/* Apple風フェードイン */
@keyframes apple-fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.apple-fade-in {
  animation: apple-fade-in var(--transition-apple) ease-out;
}
```

## 🎨 UI構成とワイヤーフレーム - Trivago構造 + Apple/xAIテイスト

### Header Layout - Apple風デザイン

```html
<!-- Apple風ヘッダー - backdrop-blur + sticky -->
<header class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/30">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <!-- 左：ロゴ「サプティア / Suptia」 -->
      <div class="flex items-center">
        <div class="text-xl font-medium text-gray-900">
          サプティア <span class="text-blue-600 font-light">/ Suptia</span>
        </div>
      </div>

      <!-- 中：グロナビ（サプティアとは / 成分ガイド / 比較） -->
      <nav class="hidden md:flex items-center space-x-8">
        <a href="/about" class="text-gray-600 hover:text-gray-900 transition-colors duration-200">サプティアとは</a>
        <a href="/ingredients" class="text-gray-600 hover:text-gray-900 transition-colors duration-200">成分ガイド</a>
        <a href="/compare" class="text-gray-600 hover:text-gray-900 transition-colors duration-200">比較</a>
      </nav>

      <!-- 右：言語・通貨切替（モーダル）、検索ショートカット -->
      <div class="flex items-center space-x-4">
        <button class="text-sm text-gray-600 hover:text-gray-900 transition-colors">
          日本語 / JPY ¥
        </button>
        <button class="p-2 text-gray-600 hover:text-gray-900 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</header>
```

### HeroSearch Layout - フルビューポート検索主導

```html
<!-- HeroSearch（フルビューポート、中央に大型検索＋AIサジェスト） -->
<section class="min-h-screen bg-white flex flex-col justify-center items-center px-4 relative">
  <!-- 微粒子エフェクト（CSSのみ） -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/20 rounded-full animate-pulse"></div>
    <div class="absolute top-3/4 right-1/3 w-1 h-1 bg-blue-500/30 rounded-full animate-pulse" style="animation-delay: 1s"></div>
  </div>

  <!-- Apple/xAI風ヒーローテキスト -->
  <div class="text-center max-w-4xl mx-auto mb-16 animate-[fadeIn_0.8s_ease-out]">
    <h1 class="text-4xl md:text-6xl lg:text-7xl font-light text-gray-900 mb-6 leading-[1.1] tracking-tight">
      あなたに最も合う<br />
      <span class="font-medium text-blue-600">サプリメント</span>を<br />
      <span class="font-medium">最も安い価格で。</span>
    </h1>
    <p class="text-lg md:text-xl text-gray-600 font-light max-w-2xl mx-auto">
      AIが分析する、あなただけの最適解
    </p>
  </div>

  <!-- 中央大検索（AIサジェスト / 最近の検索 / 人気キーワード） -->
  <div class="w-full max-w-4xl mx-auto animate-[fadeIn_0.8s_ease-out] [animation-delay:0.3s]">
    <div class="relative group">
      <input
        class="w-full px-8 py-6 text-lg bg-gray-50/80 border-2 border-transparent rounded-2xl 
               focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 
               transition-all duration-300 placeholder-gray-500 shadow-[0_8px_30px_rgba(0,0,0,0.06)]
               hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
        placeholder="サプリメントを検索（例：ビタミンD、疲労回復、美容）"
      />
      <button
        class="absolute right-2 top-2 px-6 py-4 bg-blue-600 text-white rounded-xl 
               hover:bg-blue-700 transition-all duration-200 font-medium text-sm
               hover:scale-[1.02] active:scale-[0.98] shadow-lg"
      >
        検索
      </button>
    </div>
    
    <!-- AIサジェスト（フォーカス時にドロップダウン表示） -->
    <div class="mt-4 hidden group-focus-within:block">
      <div class="bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-200/50 p-4">
        <p class="text-sm text-gray-500 mb-3">AIサジェスト</p>
        <div class="space-y-2">
          <button class="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-sm">
            疲労回復に効果的なビタミンB群を探す
          </button>
          <button class="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-sm">
            美容効果の高いコラーゲンサプリを比較
          </button>
        </div>
      </div>
    </div>
    
    <!-- 人気のカテゴリ・トレンドキーワード -->
    <div class="mt-12 text-center">
      <p class="text-gray-500 mb-6 text-sm">人気のカテゴリ</p>
      <div class="flex flex-wrap justify-center gap-3">
        <button class="px-4 py-2 bg-gray-100/80 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-all duration-200 hover:scale-105">ビタミンD</button>
        <button class="px-4 py-2 bg-gray-100/80 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-all duration-200 hover:scale-105">疲労回復</button>
        <button class="px-4 py-2 bg-gray-100/80 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-all duration-200 hover:scale-105">美容</button>
        <button class="px-4 py-2 bg-gray-100/80 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-all duration-200 hover:scale-105">免疫力</button>
      </div>
    </div>
  </div>
</section>

<!-- Apple風人気サプリ比較セクション - Trivago風カードレイアウト -->
<section class="py-24 bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Apple風セクションヘッダー -->
    <div class="text-center mb-16">
      <h2 class="text-4xl md:text-5xl font-light text-gray-900 mb-4">
        人気サプリ比較
      </h2>
      <p class="text-xl text-gray-600 font-light max-w-2xl mx-auto">
        AIが厳選した、最も人気の高いサプリメントを比較
      </p>
    </div>

    <!-- Trivago風カードグリッド -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <!-- Apple風商品カード -->
      <div class="bg-white rounded-2xl p-8 hover:shadow-2xl transition-all duration-400 apple-hover group">
        <!-- スコアバッジ -->
        <div class="flex items-center justify-between mb-6">
          <div class="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full text-sm font-medium">
            総合スコア 85
          </div>
          <button class="text-gray-400 hover:text-red-500 transition-colors p-2">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <!-- 商品情報 -->
        <div class="mb-6">
          <h3 class="text-2xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
            ビタミンD3 2000IU
          </h3>
          <p class="text-gray-600 mb-4">高品質ビタミンD3サプリメント</p>
          
          <!-- 成分ハイライト -->
          <div class="flex flex-wrap gap-2 mb-4">
            <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">ビタミンD3</span>
            <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">高吸収</span>
          </div>
        </div>

        <!-- 価格情報 -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <span class="text-3xl font-bold text-primary-600">¥1,980</span>
            <span class="text-sm text-gray-500 ml-2">30日分</span>
          </div>
          <div class="text-right">
            <div class="text-lg font-semibold text-gray-900">¥66</div>
            <div class="text-sm text-gray-500">1日あたり</div>
          </div>
        </div>

        <!-- Apple風CTAボタン -->
        <button class="w-full bg-primary-600 text-white py-4 rounded-xl font-medium hover:bg-primary-700 transition-all duration-300 hover:scale-105 active:scale-95">
          詳細を見る
        </button>
      </div>
    </div>

    <!-- もっと見るボタン -->
    <div class="text-center mt-12">
      <button class="px-8 py-4 border-2 border-primary-600 text-primary-600 rounded-xl font-medium hover:bg-primary-600 hover:text-white transition-all duration-300">
        すべての比較を見る
      </button>
    </div>
  </div>
</section>

<!-- Apple風成分ガイドセクション - カード式でビジュアル -->
<section class="py-24 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-4xl md:text-5xl font-light text-gray-900 mb-4">
        成分ガイド
      </h2>
      <p class="text-xl text-gray-600 font-light max-w-2xl mx-auto">
        科学的根拠に基づいた成分情報をわかりやすく
      </p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
      <!-- 成分カテゴリカード -->
      <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300 apple-hover">
        <div class="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span class="text-white text-2xl">💊</span>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">ビタミン</h3>
        <p class="text-sm text-gray-600">必須栄養素</p>
      </div>

      <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300 apple-hover">
        <div class="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span class="text-white text-2xl">⚡</span>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">ミネラル</h3>
        <p class="text-sm text-gray-600">体の基盤</p>
      </div>

      <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300 apple-hover">
        <div class="w-16 h-16 bg-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span class="text-white text-2xl">🌿</span>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">ハーブ</h3>
        <p class="text-sm text-gray-600">自然の力</p>
      </div>

      <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300 apple-hover">
        <div class="w-16 h-16 bg-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span class="text-white text-2xl">🏃</span>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">アミノ酸</h3>
        <p class="text-sm text-gray-600">体作りの素</p>
      </div>
    </div>
  </div>
</section>

### Search Results Layout - Trivago風フィルター + リスト

```html
<!-- /search（検索結果）- 左フィルター + 右結果リスト + 下比較トレイ -->
<div class="min-h-screen bg-gray-50/30">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- 「AIが選んだ条件」チップ（ワンタップで適用/解除） -->
    <div class="mb-6">
      <p class="text-sm text-gray-600 mb-3">AIが選んだ条件</p>
      <div class="flex flex-wrap gap-2">
        <button class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors">
          疲労回復 ×
        </button>
        <button class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors">
          ¥2000以下 ×
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- 左：SearchFilters（stickyサイドバー） -->
      <aside class="lg:col-span-1">
        <div class="sticky top-24 bg-white rounded-xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-medium text-gray-900">フィルター</h3>
            <button class="text-sm text-blue-600 hover:text-blue-700">条件クリア</button>
          </div>

          <!-- 目的フィルター -->
          <div class="mb-6">
            <h4 class="font-medium text-gray-900 mb-3">目的</h4>
            <div class="space-y-2">
              <label class="flex items-center">
                <input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="ml-2 text-sm text-gray-700">疲労回復</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="ml-2 text-sm text-gray-700">美容</span>
              </label>
            </div>
          </div>

          <!-- 価格レンジスライダー -->
          <div class="mb-6">
            <h4 class="font-medium text-gray-900 mb-3">価格帯</h4>
            <div class="px-3">
              <input type="range" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
              <div class="flex justify-between text-sm text-gray-500 mt-1">
                <span>¥500</span>
                <span>¥5000</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- 右：結果リスト（カード/リスト切替、並び替え、比較トレイに追加） -->
      <main class="lg:col-span-3">
        <!-- ソート・表示切替 -->
        <div class="flex items-center justify-between mb-6">
          <p class="text-gray-600">128件の商品が見つかりました</p>
          <div class="flex items-center space-x-4">
            <select class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option>価格の安い順</option>
              <option>評価の高い順</option>
              <option>人気順</option>
            </select>
            <div class="flex border border-gray-300 rounded-lg">
              <button class="px-3 py-2 bg-blue-600 text-white rounded-l-lg">カード</button>
              <button class="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-r-lg">リスト</button>
            </div>
          </div>
        </div>

        <!-- ResultCard グリッド -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <!-- ResultCard（比較追加ボタン付き） -->
          <div class="bg-white rounded-xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-1">
            <div class="flex items-center justify-between mb-4">
              <span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">評価4.8</span>
              <button class="text-gray-400 hover:text-red-500 transition-colors">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
            
            <h3 class="font-medium text-gray-900 mb-2">ビタミンD3 2000IU</h3>
            <p class="text-sm text-gray-600 mb-4">Nature Made</p>
            
            <div class="flex items-center justify-between mb-4">
              <div>
                <span class="text-xl font-bold text-blue-600">¥1,980</span>
                <span class="text-sm text-gray-500 ml-1">30日分</span>
              </div>
              <div class="text-right">
                <div class="text-sm font-medium text-gray-900">¥66/日</div>
              </div>
            </div>

            <div class="flex space-x-2">
              <button class="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                詳細を見る
              </button>
              <button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                比較に追加
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>

  <!-- CompareTray（画面下固定） -->
  <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transform translate-y-full transition-transform duration-300" id="compare-tray">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <span class="text-sm text-gray-600">比較中: 2/4商品</span>
        <div class="flex space-x-2">
          <div class="w-12 h-12 bg-gray-100 rounded border"></div>
          <div class="w-12 h-12 bg-gray-100 rounded border"></div>
        </div>
      </div>
      <button class="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
        比較する
      </button>
    </div>
  </div>
</div>
```
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

### Compare Table Layout - Trivago風比較テーブル

```html
<!-- /compare（比較）- 固定ヘッダー + 横スクロール比較テーブル -->
<div class="min-h-screen bg-gray-50/30">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- ページヘッダー -->
    <div class="mb-8">
      <h1 class="text-3xl font-light text-gray-900 mb-2">商品比較</h1>
      <p class="text-gray-600">選択した商品を詳細に比較できます</p>
    </div>

    <!-- CompareTable（Stickyヘッダー + 横スクロール） -->
    <div class="bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[800px]">
          <!-- Stickyヘッダー -->
          <thead class="bg-gray-50 sticky top-0 z-10">
            <tr>
              <!-- 主要指標は固定列 -->
              <th class="sticky left-0 bg-gray-50 px-6 py-4 text-left text-sm font-medium text-gray-900 border-r border-gray-200">
                項目
              </th>
              <th class="px-6 py-4 text-center min-w-[200px]">
                <div class="flex flex-col items-center">
                  <div class="w-16 h-16 bg-gray-200 rounded-lg mb-2"></div>
                  <div class="font-medium text-gray-900">ビタミンD3 2000IU</div>
                  <div class="text-sm text-gray-500">Nature Made</div>
                </div>
              </th>
              <th class="px-6 py-4 text-center min-w-[200px]">
                <div class="flex flex-col items-center">
                  <div class="w-16 h-16 bg-gray-200 rounded-lg mb-2"></div>
                  <div class="font-medium text-gray-900">ビタミンD3 1000IU</div>
                  <div class="text-sm text-gray-500">DHC</div>
                </div>
              </th>
              <th class="px-6 py-4 text-center min-w-[200px]">
                <div class="flex flex-col items-center">
                  <div class="w-16 h-16 bg-gray-200 rounded-lg mb-2"></div>
                  <div class="font-medium text-gray-900">ビタミンD3 4000IU</div>
                  <div class="text-sm text-gray-500">Now Foods</div>
                </div>
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-200">
            <!-- 価格行 -->
            <tr class="hover:bg-gray-50/50">
              <td class="sticky left-0 bg-white px-6 py-4 font-medium text-gray-900 border-r border-gray-200">
                価格
              </td>
              <td class="px-6 py-4 text-center">
                <div class="text-xl font-bold text-blue-600">¥1,980</div>
                <div class="text-sm text-gray-500">¥66/日</div>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="text-xl font-bold text-blue-600">¥1,200</div>
                <div class="text-sm text-gray-500">¥40/日</div>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="text-xl font-bold text-blue-600">¥2,800</div>
                <div class="text-sm text-gray-500">¥93/日</div>
              </td>
            </tr>

            <!-- 主要成分行 -->
            <tr class="hover:bg-gray-50/50">
              <td class="sticky left-0 bg-white px-6 py-4 font-medium text-gray-900 border-r border-gray-200">
                主要成分
              </td>
              <td class="px-6 py-4 text-center">
                <div class="text-sm">ビタミンD3: 2000IU</div>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="text-sm">ビタミンD3: 1000IU</div>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="text-sm">ビタミンD3: 4000IU</div>
              </td>
            </tr>

            <!-- 評価行 -->
            <tr class="hover:bg-gray-50/50">
              <td class="sticky left-0 bg-white px-6 py-4 font-medium text-gray-900 border-r border-gray-200">
                評価
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center">
                  <span class="text-yellow-400">★★★★★</span>
                  <span class="ml-1 text-sm text-gray-600">4.8</span>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center">
                  <span class="text-yellow-400">★★★★☆</span>
                  <span class="ml-1 text-sm text-gray-600">4.2</span>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center">
                  <span class="text-yellow-400">★★★★★</span>
                  <span class="ml-1 text-sm text-gray-600">4.6</span>
                </div>
              </td>
            </tr>

            <!-- 購入ボタン行 -->
            <tr>
              <td class="sticky left-0 bg-white px-6 py-4 font-medium text-gray-900 border-r border-gray-200">
                購入
              </td>
              <td class="px-6 py-4 text-center">
                <button class="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  最安値で購入
                </button>
              </td>
              <td class="px-6 py-4 text-center">
                <button class="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  最安値で購入
                </button>
              </td>
              <td class="px-6 py-4 text-center">
                <button class="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  最安値で購入
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
```

### Footer Layout - Apple風シンプルデザイン

```html
<!-- Footer（サプティアとは / プライバシー / 免責 / 利用規約 / お問い合わせ） -->
<footer class="bg-gray-900 text-gray-300">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
      <div>
        <h3 class="text-white font-medium mb-4">サプティア</h3>
        <ul class="space-y-3 text-sm">
          <li><a href="/about" class="hover:text-white transition-colors">サプティアとは</a></li>
        </ul>
      </div>
      <div>
        <h3 class="text-white font-medium mb-4">サービス</h3>
        <ul class="space-y-3 text-sm">
          <li><a href="/ingredients" class="hover:text-white transition-colors">成分ガイド</a></li>
          <li><a href="/compare" class="hover:text-white transition-colors">比較</a></li>
        </ul>
      </div>
      <div>
        <h3 class="text-white font-medium mb-4">サポート</h3>
        <ul class="space-y-3 text-sm">
          <li><a href="/contact" class="hover:text-white transition-colors">お問い合わせ</a></li>
        </ul>
      </div>
      <div>
        <h3 class="text-white font-medium mb-4">法的情報</h3>
        <ul class="space-y-3 text-sm">
          <li><a href="/legal/privacy" class="hover:text-white transition-colors">プライバシーポリシー</a></li>
          <li><a href="/legal/terms" class="hover:text-white transition-colors">利用規約</a></li>
          <li><a href="/legal/disclaimer" class="hover:text-white transition-colors">免責事項</a></li>
        </ul>
      </div>
    </div>
    
    <div class="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
      <div class="text-sm mb-4 md:mb-0">
        © 2024 Suptia. All rights reserved.
      </div>
      <div class="text-sm">
        日本語 / JPY ¥
      </div>
    </div>
  </div>
</footer>
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

## 🧠 AIレコメンド（露出の仕方）

### Hero検索でのAIサジェスト
```typescript
interface AISuggestion {
  id: string;
  text: string;
  intent: 'purpose' | 'ingredient' | 'condition';
  confidence: number;
}

// Hero検索のフォーカス時にAIサジェスト（意図推定の例文）をドロップダウン表示
const aiSuggestions: AISuggestion[] = [
  {
    id: '1',
    text: '疲労回復に効果的なビタミンB群を探す',
    intent: 'purpose',
    confidence: 0.9
  },
  {
    id: '2', 
    text: '美容効果の高いコラーゲンサプリを比較',
    intent: 'purpose',
    confidence: 0.85
  }
];
```

### 検索結果でのAI条件チップ
```typescript
interface AISelectedCondition {
  id: string;
  label: string;
  applied: boolean;
  confidence: number;
}

// /search 上部に「AIが選んだ条件」チップ（ワンタップで適用/解除）
const aiConditions: AISelectedCondition[] = [
  { id: '1', label: '疲労回復', applied: true, confidence: 0.9 },
  { id: '2', label: '¥2000以下', applied: true, confidence: 0.8 }
];
```

### 商品詳細でのAI推奨理由
```typescript
interface AIRecommendationReason {
  productId: string;
  reason: string;
  matchingFactors: string[];
  confidence: number;
}

// /products/[slug] には「この製品が合う理由」を要約（Sanity/GROQから）
const recommendationReason: AIRecommendationReason = {
  productId: 'vitamin-d3-2000',
  reason: 'あなたの疲労回復目的と予算に最適です',
  matchingFactors: ['高エビデンス', '適正価格', '高吸収率'],
  confidence: 0.92
};
```

## ✅ 受け入れ基準（最重要）

1. **1st View は 検索のみが主役**（他セクションはスクロールしないと見えない）
2. **検索→結果→比較→詳細の導線が 最短2クリックで成立**
3. **余白・行間・影が過剰でなく 高級感がある**（安っぽさNG）
4. **Lighthouse/Next Best Practices 満たす**（CLS<0.1, LCP<2.5s 目標）
5. **Tailwindユーティリティは冗長禁止**：clsx + tailwind-mergeで統制
6. **文言（日本語/英語）は i18n 対応**（言語切替が視認・即反映）

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
