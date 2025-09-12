# Design Document

## Overview

サプティア（Suptia）のホームページを、Apple・x.aiのようなリッチで洗練されたデザインに一新する。白を基調とし近未来的なブルーをアクセントカラーとして、シンプルでスタイリッシュな見た目を実現する。全画面検索窓を中心とした印象的なファーストビューと、スクロールで段階的に現れるコンテンツセクションにより、ユーザーに強い印象を与える高品質なブランド体験を提供する。

## Architecture

### デザインシステム基盤

**カラーパレット:**
```css
:root {
  /* 基調色 */
  --color-white: #FFFFFF;
  --color-gray-50: #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-900: #111827;
  
  /* 近未来的ブルー */
  --color-primary-400: #60A5FA;
  --color-primary-500: #3B82F6;
  --color-primary-600: #2563EB;
  --color-primary-700: #1D4ED8;
  
  /* アクセント */
  --color-accent-blue: #0066FF;
  --color-accent-cyan: #06B6D4;
  
  /* グラデーション */
  --gradient-primary: linear-gradient(135deg, #0066FF 0%, #3B82F6 100%);
  --gradient-glass: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
}
```

**タイポグラフィ:**
```css
/* Appleスタイルのフォント階層 */
.text-hero {
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.text-display {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.text-body-large {
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1.6;
}
```

**スペーシングシステム:**
```css
/* 8px基準のスペーシング */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-24: 6rem;    /* 96px */
```

### アニメーションシステム

**イージング関数:**
```css
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
--ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

**アニメーション定義:**
```css
/* フェードイン */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(2rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ガラス効果ホバー */
@keyframes glassHover {
  from {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.1);
  }
  to {
    backdrop-filter: blur(20px);
    background: rgba(255, 255, 255, 0.2);
  }
}
```

## Components and Interfaces

### 1. ページ全体構造

```typescript
interface HomePageProps {
  products: Product[];
  locale: 'ja' | 'en';
  currency: 'JPY' | 'USD';
}

interface Product {
  id: string;
  name: string;
  priceJPY: number;
  servingsPerContainer: number;
  servingsPerDay: number;
  slug: { current: string };
  imageUrl?: string;
  category?: string;
  isPopular?: boolean;
}
```

**レイアウト構造:**
```jsx
<div className="min-h-screen bg-white">
  <Header />
  <main>
    <HeroSection />           {/* 100vh */}
    <PopularSupplementsSection />
    <IngredientGuideSection />
  </main>
  <Footer />
</div>
```

### 2. ヘッダーコンポーネント

**デザイン仕様:**
```css
.header {
  position: fixed;
  top: 0;
  width: 100%;
  height: 4rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  z-index: 50;
  transition: background-color 0.3s ease;
}

.header-scrolled {
  background: rgba(255, 255, 255, 0.95);
}
```

**コンポーネント構造:**
```typescript
interface HeaderProps {
  isScrolled: boolean;
  locale: 'ja' | 'en';
  currency: 'JPY' | 'USD';
  onLocaleChange: (locale: 'ja' | 'en') => void;
  onCurrencyChange: (currency: 'JPY' | 'USD') => void;
}
```

**レイアウト:**
```jsx
<header className="header">
  <div className="container mx-auto px-6 h-full flex items-center justify-between">
    <Logo />
    <nav className="hidden md:flex space-x-8">
      <NavLink href="/compare">商品比較</NavLink>
      <NavLink href="/diagnosis">診断</NavLink>
      <NavLink href="/ingredients">成分ガイド</NavLink>
    </nav>
    <div className="flex items-center space-x-4">
      <LanguageCurrencySelector />
      <AboutButton />
    </div>
  </div>
</header>
```

### 3. ヒーローセクション（全画面検索）

**デザイン仕様:**
```css
.hero-section {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%);
  position: relative;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(0, 102, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
}
```

**コンポーネント構造:**
```typescript
interface HeroSectionProps {
  onSearch: (query: string) => void;
  locale: 'ja' | 'en';
}

interface HeroContent {
  ja: {
    title: 'サプティア';
    subtitle: 'Suptia';
    description: 'あなたに最も合うサプリを最も安い価格で';
    searchPlaceholder: 'サプリメント名や成分名で検索...';
  };
  en: {
    title: 'Suptia';
    subtitle: 'サプティア';
    description: 'Find the best supplements at the best prices';
    searchPlaceholder: 'Search supplements or ingredients...';
  };
}
```

**レイアウト:**
```jsx
<section className="hero-section">
  <div className="hero-background" />
  <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
    <div className="mb-8 animate-fade-in-up">
      <h1 className="text-hero text-gray-900 mb-2">
        {content[locale].title}
      </h1>
      <p className="text-display text-gray-600 mb-4">
        {content[locale].subtitle}
      </p>
      <p className="text-body-large text-gray-500">
        {content[locale].description}
      </p>
    </div>
    
    <div className="max-w-2xl mx-auto animate-fade-in-up delay-200">
      <SearchBar 
        size="hero"
        placeholder={content[locale].searchPlaceholder}
        onSearch={onSearch}
      />
    </div>
  </div>
</section>
```

### 4. 検索バーコンポーネント

**デザイン仕様:**
```css
.search-bar-hero {
  height: 4rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(0, 102, 255, 0.1);
  border-radius: 2rem;
  box-shadow: 
    0 10px 25px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  transition: all 0.3s var(--ease-out-quart);
}

.search-bar-hero:focus-within {
  border-color: var(--color-accent-blue);
  box-shadow: 
    0 20px 40px rgba(0, 102, 255, 0.2),
    0 0 0 4px rgba(0, 102, 255, 0.1);
  transform: translateY(-2px);
}
```

**コンポーネント構造:**
```typescript
interface SearchBarProps {
  size: 'hero' | 'normal';
  placeholder: string;
  onSearch: (query: string) => void;
  className?: string;
}
```

### 5. 人気サプリ比較セクション

**デザイン仕様:**
```css
.popular-supplements-section {
  padding: 6rem 0;
  background: linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%);
}

.supplement-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 1.5rem;
  padding: 2rem;
  transition: all 0.3s var(--ease-out-quart);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.supplement-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 102, 255, 0.2);
}
```

**コンポーネント構造:**
```typescript
interface PopularSupplementsSectionProps {
  products: Product[];
  locale: 'ja' | 'en';
  currency: 'JPY' | 'USD';
}

interface SupplementCardProps {
  product: Product;
  locale: 'ja' | 'en';
  currency: 'JPY' | 'USD';
}
```

**レイアウト:**
```jsx
<section className="popular-supplements-section">
  <div className="container mx-auto px-6">
    <div className="text-center mb-16">
      <h2 className="text-display text-gray-900 mb-4">
        人気サプリ比較
      </h2>
      <p className="text-body-large text-gray-600">
        科学的根拠に基づいた詳細比較
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map(product => (
        <SupplementCard 
          key={product.id}
          product={product}
          locale={locale}
          currency={currency}
        />
      ))}
    </div>
  </div>
</section>
```

### 6. 成分ガイドセクション

**デザイン仕様:**
```css
.ingredient-guide-section {
  padding: 6rem 0;
  background: #FFFFFF;
}

.ingredient-category-card {
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(249,250,251,0.9) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 1.5rem;
  padding: 2.5rem;
  text-align: center;
  transition: all 0.3s var(--ease-out-quart);
  position: relative;
  overflow: hidden;
}

.ingredient-category-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient-primary);
  transform: scaleX(0);
  transition: transform 0.3s var(--ease-out-quart);
}

.ingredient-category-card:hover::before {
  transform: scaleX(1);
}

.ingredient-category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 15px 35px rgba(0, 102, 255, 0.15);
}
```

**コンポーネント構造:**
```typescript
interface IngredientGuideSectionProps {
  locale: 'ja' | 'en';
}

interface IngredientCategory {
  id: string;
  icon: string;
  name: string;
  description: string;
  href: string;
  color: string;
}

const categories: IngredientCategory[] = [
  {
    id: 'vitamins',
    icon: '🍊',
    name: 'ビタミン',
    description: 'ビタミンA、C、D、E、B群など必須ビタミン',
    href: '/ingredients?category=vitamins',
    color: 'orange'
  },
  {
    id: 'minerals',
    icon: '⚡',
    name: 'ミネラル',
    description: 'カルシウム、鉄、亜鉛、マグネシウム',
    href: '/ingredients?category=minerals',
    color: 'gray'
  },
  {
    id: 'herbs',
    icon: '🌿',
    name: 'ハーブ',
    description: 'ウコン、イチョウ、高麗人参など天然成分',
    href: '/ingredients?category=herbs',
    color: 'green'
  },
  {
    id: 'amino-acids',
    icon: '💪',
    name: 'アミノ酸',
    description: 'BCAA、グルタミン、アルギニン',
    href: '/ingredients?category=amino-acids',
    color: 'blue'
  }
];
```

### 7. フッターコンポーネント

**デザイン仕様:**
```css
.footer {
  background: linear-gradient(180deg, #F9FAFB 0%, #F3F4F6 100%);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding: 4rem 0 2rem;
}

.footer-link {
  color: #6B7280;
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
}

.footer-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--color-accent-blue);
  transition: width 0.3s var(--ease-out-quart);
}

.footer-link:hover {
  color: var(--color-accent-blue);
}

.footer-link:hover::after {
  width: 100%;
}
```

## Data Models

### ページデータ構造

```typescript
interface HomePageData {
  hero: HeroContent;
  popularProducts: Product[];
  ingredientCategories: IngredientCategory[];
  seo: SEOData;
}

interface SEOData {
  title: string;
  description: string;
  ogImage: string;
  canonicalUrl: string;
}
```

### 状態管理

```typescript
interface HomePageState {
  isHeaderScrolled: boolean;
  searchQuery: string;
  selectedLocale: 'ja' | 'en';
  selectedCurrency: 'JPY' | 'USD';
  isSearchFocused: boolean;
}
```

## Error Handling

### エラー表示パターン

```typescript
interface ErrorState {
  type: 'loading' | 'network' | 'empty' | 'server';
  message: string;
  retryable: boolean;
}

// エラー表示コンポーネント
const ErrorDisplay: React.FC<{ error: ErrorState }> = ({ error }) => (
  <div className="text-center py-16">
    <div className="text-6xl mb-4">😔</div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">
      申し訳ございません
    </h3>
    <p className="text-gray-600 mb-6">{error.message}</p>
    {error.retryable && (
      <button className="btn-primary">
        再試行
      </button>
    )}
  </div>
);
```

### ローディング状態

```typescript
// スケルトンローダー
const SkeletonCard: React.FC = () => (
  <div className="supplement-card animate-pulse">
    <div className="w-full h-48 bg-gray-200 rounded-lg mb-4" />
    <div className="h-6 bg-gray-200 rounded mb-2" />
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
    <div className="h-8 bg-gray-200 rounded" />
  </div>
);
```

## Testing Strategy

### ビジュアルリグレッションテスト

```typescript
// Chromatic/Storybook設定
export default {
  title: 'Pages/HomePage',
  component: HomePage,
  parameters: {
    layout: 'fullscreen',
    chromatic: {
      viewports: [375, 768, 1200],
      delay: 1000, // アニメーション完了を待つ
    },
  },
};

export const Default = {
  args: {
    products: mockProducts,
    locale: 'ja',
    currency: 'JPY',
  },
};

export const English = {
  args: {
    products: mockProducts,
    locale: 'en',
    currency: 'USD',
  },
};
```

### アクセシビリティテスト

```typescript
// axe-core統合テスト
test('Homepage accessibility', async ({ page }) => {
  await page.goto('/');
  
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
    
  expect(results.violations).toEqual([]);
});

// キーボードナビゲーションテスト
test('Keyboard navigation', async ({ page }) => {
  await page.goto('/');
  
  // Tab順序の確認
  await page.keyboard.press('Tab'); // ヘッダーナビ
  await page.keyboard.press('Tab'); // 検索バー
  await page.keyboard.press('Tab'); // 商品カード1
  
  // フォーカス状態の確認
  const focusedElement = await page.locator(':focus');
  await expect(focusedElement).toBeVisible();
});
```

### パフォーマンステスト

```typescript
// Lighthouse CI設定
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/'],
      settings: {
        chromeFlags: '--no-sandbox',
      },
    },
    assert: {
      assertions: {
        'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'speed-index': ['error', { maxNumericValue: 2500 }],
      },
    },
  },
};
```

## レスポンシブデザイン戦略

### ブレークポイント定義

```css
/* モバイル: 0-767px */
@media (max-width: 767px) {
  .hero-section {
    padding: 2rem 1rem;
  }
  
  .text-hero {
    font-size: 3rem;
  }
  
  .search-bar-hero {
    height: 3.5rem;
  }
  
  .grid-responsive {
    grid-template-columns: 1fr;
  }
}

/* タブレット: 768-1023px */
@media (min-width: 768px) and (max-width: 1023px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* デスクトップ: 1024px+ */
@media (min-width: 1024px) {
  .grid-responsive {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### コンテナ戦略

```css
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 1.5rem;
}

@media (min-width: 640px) {
  .container {
    max-width: 640px;
  }
}

@media (min-width: 768px) {
  .container {
    max-width: 768px;
    padding: 0 2rem;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }
}

@media (min-width: 1280px) {
  .container {
    max-width: 1200px;
  }
}
```

## パフォーマンス最適化

### 画像最適化戦略

```typescript
// Next.js Image設定
const imageConfig = {
  domains: ['cdn.sanity.io'],
  formats: ['image/webp', 'image/avif'],
  sizes: {
    hero: '(max-width: 768px) 100vw, 50vw',
    card: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
  },
  quality: 85,
  priority: false, // ヒーロー画像以外は遅延読み込み
};
```

### コード分割戦略

```typescript
// 動的インポート
const SearchBar = dynamic(() => import('@/components/SearchBar'), {
  ssr: false,
  loading: () => <SearchBarSkeleton />,
});

const PopularSupplementsSection = dynamic(
  () => import('@/components/PopularSupplementsSection'),
  {
    loading: () => <SupplementsSkeleton />,
  }
);
```

### CSS最適化

```css
/* Critical CSS（インライン化） */
.hero-section,
.header,
.search-bar-hero {
  /* 重要なスタイルのみ */
}

/* Non-critical CSS（遅延読み込み） */
.supplement-card,
.ingredient-category-card,
.footer {
  /* 後から読み込み */
}
```

## 実装フェーズ

### フェーズ1: 基盤構築（1週間）
1. デザインシステム（カラー、タイポグラフィ、スペーシング）
2. ヘッダーコンポーネント
3. ヒーローセクション（全画面検索）
4. 基本的なレスポンシブ対応

### フェーズ2: コンテンツセクション（1週間）
1. 人気サプリ比較セクション
2. 成分ガイドセクション
3. フッターコンポーネント
4. アニメーション実装

### フェーズ3: 品質向上（1週間）
1. アクセシビリティ対応
2. パフォーマンス最適化
3. テスト実装
4. 最終調整

この設計により、Apple・x.aiのようなリッチで洗練されたデザインを実現し、ユーザーに強い印象を与える高品質なブランド体験を提供します。