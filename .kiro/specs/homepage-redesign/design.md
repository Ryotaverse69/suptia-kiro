# Design Document

## Overview

トップページのデザイン一新により、ブランド想起と信頼感を高め、検索・比較・診断の主要導線のクリック率を改善する。既存の機能を維持しつつ、UI/UXの刷新・品質向上にフォーカスし、レスポンシブデザイン、アクセシビリティ、パフォーマンス、国際化を高基準で統一する。

## Architecture

### 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **スタイリング**: Tailwind CSS + カスタムCSS
- **状態管理**: React Context (LocaleContext)
- **国際化**: LocaleContext + ClientPrice
- **フォント**: Inter + Noto Sans JP
- **アイコン**: Emoji + 軽量SVG

### 既存アーキテクチャとの統合

- 既存のHeader.tsxコンポーネントを活用
- LocaleContext による言語・通貨切替機能を継承
- AIRecommendationSearchBar の検索機能を維持
- calculateEffectiveCostPerDay による価格計算ロジックを活用
- 既存のデザインシステム（globals.css, tailwind.config.js）を拡張

## Components and Interfaces

### 1. ページ構成（apps/web/src/app/page.tsx）

```typescript
interface HomePageProps {
  // サーバーサイドで取得される商品データ
  products: Product[];
}

interface Product {
  name: string;
  priceJPY: number;
  servingsPerContainer: number;
  servingsPerDay: number;
  slug: { current: string };
  imageUrl?: string;
}
```

**レイアウト構造:**

```
<main role="main">
  <HeroSection />
  <PrimaryActionsSection />
  <PopularProductsSection />
  <IngredientCategoriesSection />
  <TrustIndicatorsSection />
  <CTASection />
</main>
```

### 2. ヒーローセクション（刷新）

**コンポーネント**: `apps/web/src/components/HeroSection.tsx`

```typescript
interface HeroSectionProps {
  onSearch: (query: string) => void;
}
```

**デザイン仕様:**

- **レイアウト**: センタリング、最大幅1200px
- **背景**: 控えめなグラデーション（primary-50 → secondary-50）
- **見出し**: `text-6xl md:text-8xl font-bold` でブランド名「サプティア」
- **サブコピー**: `text-2xl md:text-3xl text-gray-700` で価値提案
- **検索バー**: AIRecommendationSearchBar（大型サイズ）
- **アニメーション**: フェードイン（0.6s ease-out）

### 3. 主要導線カード（新設）

**コンポーネント**: `apps/web/src/components/HomePrimaryActions.tsx`

```typescript
interface PrimaryAction {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji
  href: string;
  color: 'primary' | 'secondary' | 'accent';
}

interface HomePrimaryActionsProps {
  actions: PrimaryAction[];
}
```

**デザイン仕様:**

- **レイアウト**: 3列グリッド（タブレット2列、モバイル1列）
- **カードスタイル**: `glass-effect rounded-xl p-6 shadow-soft`
- **ホバー効果**: `hover:shadow-medium hover:-translate-y-2`
- **アクセシビリティ**: フォーカスリング、適切なARIA属性

**デフォルトアクション:**

```typescript
const defaultActions: PrimaryAction[] = [
  {
    id: 'compare',
    title: '商品を比較する',
    description: '科学的根拠に基づいた詳細比較',
    icon: '🔍',
    href: '/compare',
    color: 'primary',
  },
  {
    id: 'diagnosis',
    title: '診断を受ける',
    description: 'AIがあなたに最適なサプリを提案',
    icon: '🤖',
    href: '/diagnosis',
    color: 'secondary',
  },
  {
    id: 'ingredients',
    title: '成分ガイド',
    description: '成分の効果と安全性を詳しく学ぶ',
    icon: '📚',
    href: '/ingredients',
    color: 'accent',
  },
];
```

### 4. 人気・おすすめ商品（刷新）

**コンポーネント**: `apps/web/src/components/PopularProductsSection.tsx`

```typescript
interface PopularProductsSectionProps {
  products: Product[];
  maxProducts?: number;
}
```

**デザイン仕様:**

- **レイアウト**: 3列グリッド（タブレット2列、モバイル1列）
- **商品カード**: `ProductCard.tsx`（新規作成）
- **画像**: next/image、遅延読み込み、適切なalt
- **価格表示**: ClientPrice コンポーネント使用
- **実効コスト**: calculateEffectiveCostPerDay 使用

**ProductCard インターフェース:**

```typescript
interface ProductCardProps {
  product: Product;
  showEffectiveCost?: boolean;
  size?: 'small' | 'medium' | 'large';
}
```

### 5. 成分カテゴリガイド（改良）

**コンポーネント**: `apps/web/src/components/IngredientCategoriesSection.tsx`

```typescript
interface IngredientCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}

interface IngredientCategoriesSectionProps {
  categories: IngredientCategory[];
}
```

**デフォルトカテゴリ:**

```typescript
const defaultCategories: IngredientCategory[] = [
  {
    id: 'vitamins',
    name: 'ビタミン',
    description: 'ビタミンA、C、D、E、B群など必須ビタミン',
    icon: '🍊',
    href: '/ingredients?category=vitamins',
    color: 'orange',
  },
  {
    id: 'minerals',
    name: 'ミネラル',
    description: 'カルシウム、鉄、亜鉛、マグネシウム',
    icon: '⚡',
    href: '/ingredients?category=minerals',
    color: 'gray',
  },
  {
    id: 'herbs',
    name: 'ハーブ',
    description: 'ウコン、イチョウ、高麗人参など天然成分',
    icon: '🌿',
    href: '/ingredients?category=herbs',
    color: 'green',
  },
  {
    id: 'amino-acids',
    name: 'アミノ酸',
    description: 'BCAA、グルタミン、アルギニン',
    icon: '💪',
    href: '/ingredients?category=amino-acids',
    color: 'blue',
  },
];
```

### 6. 信頼性指標（新設）

**コンポーネント**: `apps/web/src/components/TrustIndicatorsSection.tsx`

```typescript
interface TrustIndicator {
  id: string;
  title: string;
  description: string;
  icon: string;
  metric?: string;
}

interface TrustIndicatorsSectionProps {
  indicators: TrustIndicator[];
}
```

**デフォルト指標:**

```typescript
const defaultIndicators: TrustIndicator[] = [
  {
    id: 'scientific',
    title: '科学的根拠準拠',
    description: 'エビデンスに基づく成分分析',
    icon: '🛡️',
    metric: '100%',
  },
  {
    id: 'price-monitoring',
    title: '価格監視',
    description: '常に最安値を追跡・更新',
    icon: '💰',
    metric: '24/7',
  },
  {
    id: 'user-feedback',
    title: 'ユーザーフィードバック',
    description: '実際の利用者の声を反映',
    icon: '⭐',
    metric: '1000+',
  },
];
```

## Data Models

### 既存データモデルの活用

```typescript
// 既存のProduct型を拡張
interface EnhancedProduct extends Product {
  imageUrl?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  isPopular?: boolean;
  isFeatured?: boolean;
}

// 検索・レコメンド用
interface SearchResult {
  products: EnhancedProduct[];
  totalCount: number;
  facets: {
    categories: string[];
    priceRanges: PriceRange[];
    brands: string[];
  };
}

interface PriceRange {
  min: number;
  max: number;
  label: string;
  count: number;
}
```

### 新規データモデル

```typescript
// ホームページ設定
interface HomePageConfig {
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
  };
  featuredProducts: {
    maxCount: number;
    sortBy: 'popularity' | 'price' | 'rating';
  };
  categories: IngredientCategory[];
  trustIndicators: TrustIndicator[];
}

// 多言語対応
interface LocalizedContent {
  ja: HomePageConfig;
  en: HomePageConfig;
}
```

## Error Handling

### クライアントサイドエラー処理

```typescript
// 検索エラー
interface SearchError {
  type: 'network' | 'validation' | 'server';
  message: string;
  retryable: boolean;
}

// 商品データ取得エラー
interface ProductLoadError {
  type: 'loading' | 'empty' | 'network';
  fallbackData?: Product[];
}

// エラーバウンダリ
class HomePageErrorBoundary extends React.Component {
  // エラー時のフォールバック表示
  // ローディング状態の管理
  // リトライ機能
}
```

### エラー表示パターン

1. **検索エラー**: インライン表示、リトライボタン
2. **商品読み込みエラー**: スケルトン → エラーメッセージ → リトライ
3. **画像読み込みエラー**: プレースホルダー画像表示
4. **ネットワークエラー**: トースト通知 + オフライン表示

## Testing Strategy

### 単体テスト（Vitest + React Testing Library）

```typescript
// コンポーネントテスト
describe('HeroSection', () => {
  it('should render title and subtitle', () => {});
  it('should handle search input', () => {});
  it('should be accessible', () => {});
});

describe('ProductCard', () => {
  it('should display product information', () => {});
  it('should calculate effective cost', () => {});
  it('should handle price formatting', () => {});
});

describe('HomePrimaryActions', () => {
  it('should render all action cards', () => {});
  it('should navigate to correct URLs', () => {});
  it('should support keyboard navigation', () => {});
});
```

### 統合テスト（Playwright）

```typescript
// E2Eテスト
test('Homepage user journey', async ({ page }) => {
  // ページ読み込み
  await page.goto('/');

  // ヒーローセクション表示確認
  await expect(page.locator('h1')).toContainText('サプティア');

  // 検索機能テスト
  await page.fill('[data-testid="search-input"]', 'ビタミンD');
  await page.press('[data-testid="search-input"]', 'Enter');

  // 主要導線テスト
  await page.click('[data-testid="compare-cta"]');
  await expect(page).toHaveURL('/compare');
});
```

### アクセシビリティテスト（axe-core）

```typescript
// 自動アクセシビリティテスト
test('Homepage accessibility', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

### パフォーマンステスト（Lighthouse CI）

```yaml
# lighthouserc.js
ci:
  collect:
    url: ['http://localhost:3000/']
  assert:
    assertions:
      'largest-contentful-paint': ['error', { maxNumericValue: 2000 }]
      'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }]
      'total-blocking-time': ['error', { maxNumericValue: 300 }]
```

## レスポンシブデザイン仕様

### ブレークポイント戦略

```css
/* モバイル: 0-639px */
.mobile-layout {
  grid-template-columns: 1fr;
  padding: 1rem;
  font-size: 1rem;
}

/* タブレット: 640-1023px */
.tablet-layout {
  grid-template-columns: repeat(2, 1fr);
  padding: 1.5rem;
  font-size: 1.125rem;
}

/* デスクトップ: 1024px+ */
.desktop-layout {
  grid-template-columns: repeat(3, 1fr);
  padding: 2rem;
  font-size: 1.25rem;
}
```

### コンテナ戦略

```typescript
// レスポンシブコンテナ
const containerClasses = {
  base: 'container mx-auto px-4',
  sm: 'sm:px-6',
  lg: 'lg:px-8',
  xl: 'xl:max-w-7xl',
};

// セクションスペーシング
const sectionSpacing = {
  mobile: 'py-10',
  tablet: 'md:py-16',
  desktop: 'lg:py-20',
};
```

## パフォーマンス最適化

### 画像最適化

```typescript
// next/image設定
const imageConfig = {
  sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority: false, // ヒーロー画像以外は遅延読み込み
  placeholder: 'blur',
  quality: 85,
};

// 商品画像の最適化
const productImageSizes = {
  small: '(max-width: 640px) 150px, 200px',
  medium: '(max-width: 640px) 200px, 300px',
  large: '(max-width: 640px) 300px, 400px',
};
```

### コード分割

```typescript
// 動的インポート
const AIRecommendationSearchBar = dynamic(
  () => import('@/components/AIRecommendationSearchBar'),
  {
    ssr: false,
    loading: () => <SearchBarSkeleton />
  }
);

const PopularProductsSection = dynamic(
  () => import('@/components/PopularProductsSection'),
  {
    loading: () => <ProductsSkeleton />
  }
);
```

### バンドル最適化

```javascript
// next.config.mjs
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@/components', '@/lib'],
  },
  webpack: config => {
    config.optimization.splitChunks.chunks = 'all';
    return config;
  },
};
```

## アクセシビリティ仕様

### WCAG 2.1 AA準拠

```typescript
// フォーカス管理
const useFocusManagement = () => {
  const trapFocus = (element: HTMLElement) => {
    // フォーカストラップ実装
  };

  const restoreFocus = (element: HTMLElement) => {
    // フォーカス復元実装
  };

  return { trapFocus, restoreFocus };
};

// ARIA属性管理
const ariaAttributes = {
  navigation: {
    role: 'navigation',
    'aria-label': 'メインナビゲーション',
  },
  search: {
    role: 'combobox',
    'aria-expanded': 'false',
    'aria-haspopup': 'listbox',
  },
  productGrid: {
    role: 'grid',
    'aria-label': '人気商品一覧',
  },
};
```

### キーボードナビゲーション

```typescript
// キーボードイベント処理
const useKeyboardNavigation = () => {
  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        // メニュー・モーダルを閉じる
        break;
      case 'Tab':
        // フォーカス移動の管理
        break;
      case 'Enter':
      case ' ':
        // アクション実行
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        // リスト内ナビゲーション
        break;
    }
  };

  return { handleKeyDown };
};
```

## 国際化対応

### 多言語コンテンツ管理

```typescript
// 言語別コンテンツ
const content = {
  ja: {
    hero: {
      title: 'サプティア',
      subtitle: 'あなたに最も合うサプリを最も安い価格で',
      searchPlaceholder: 'サプリメント名や成分名で検索...',
    },
    actions: {
      compare: '商品を比較する',
      diagnosis: '診断を受ける',
      ingredients: '成分ガイド',
    },
  },
  en: {
    hero: {
      title: 'Suptia',
      subtitle: 'Find the best supplements at the best prices',
      searchPlaceholder: 'Search supplements or ingredients...',
    },
    actions: {
      compare: 'Compare Products',
      diagnosis: 'Get Diagnosis',
      ingredients: 'Ingredient Guide',
    },
  },
};

// 通貨フォーマット
const formatPrice = (amount: number, locale: string, currency: string) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount);
};
```

## セキュリティ考慮事項

### Content Security Policy

```typescript
// CSP設定（既存を維持）
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'img-src': ["'self'", 'data:', 'https://cdn.sanity.io'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'connect-src': ["'self'", 'https://api.sanity.io'],
};
```

### 入力検証

```typescript
// 検索クエリのサニタイゼーション
const sanitizeSearchQuery = (query: string): string => {
  return query
    .trim()
    .replace(/[<>\"']/g, '') // XSS対策
    .substring(0, 100); // 長さ制限
};

// URLパラメータの検証
const validateUrlParams = (params: URLSearchParams) => {
  const allowedParams = ['search', 'category', 'sort', 'page'];
  // パラメータ検証ロジック
};
```

## モニタリング・分析

### パフォーマンス監視

```typescript
// Web Vitals収集
const collectWebVitals = (metric: any) => {
  switch (metric.name) {
    case 'LCP':
      // Largest Contentful Paint
      analytics.track('performance.lcp', { value: metric.value });
      break;
    case 'CLS':
      // Cumulative Layout Shift
      analytics.track('performance.cls', { value: metric.value });
      break;
    case 'FID':
      // First Input Delay
      analytics.track('performance.fid', { value: metric.value });
      break;
  }
};
```

### ユーザー行動分析

```typescript
// イベント追跡
const trackUserActions = {
  searchPerformed: (query: string) => {
    analytics.track('search.performed', { query });
  },
  ctaClicked: (action: string) => {
    analytics.track('cta.clicked', { action });
  },
  productViewed: (productId: string) => {
    analytics.track('product.viewed', { productId });
  },
};
```

## 実装フェーズ

### フェーズ1: 基盤構築（1-2週間）

1. ヒーローセクションの刷新
2. 主要導線カードの実装
3. レスポンシブレイアウトの確立
4. 基本的なアクセシビリティ対応

### フェーズ2: 機能拡張（2-3週間）

1. 人気商品セクションの刷新
2. 成分カテゴリガイドの改良
3. 信頼性指標の追加
4. パフォーマンス最適化

### フェーズ3: 品質向上（1-2週間）

1. 詳細なアクセシビリティテスト
2. 多言語対応の完成
3. モーション・アニメーションの調整
4. 最終的なパフォーマンスチューニング

この設計により、要件定義で定めた12の要件すべてを満たし、既存システムとの互換性を保ちながら、モダンで使いやすいホームページを実現します。
