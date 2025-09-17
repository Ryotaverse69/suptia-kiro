# Design Document

## Overview

トリバゴ完全クローン設計：**https://www.trivago.jp/ja の100%再現**

**🎯 設計方針**

- **完全模倣**: トリバゴのすべての要素を正確に再現
- **サプリ特化**: ホテル検索→サプリ検索に置き換え
- **同等品質**: 同じパフォーマンス・SEO・UX
- **段階実装**: ホーム→検索→比較の順で完成度重視

**🧭 ページ構成（トリバゴ準拠）**

- **/(home)**: ヒーロー → パートナー → 人気検索 → 価格グラフ → フッターリンク
- **/search**: 左フィルター + 右結果リスト + ページネーション
- **/compare**: 横スクロール比較テーブル + CTA
- **/[category]**: カテゴリ別商品一覧（ビタミンD、プロテイン等）

## Architecture

### Frontend Architecture - トリバゴ構造完全準拠

```
Next.js 14 App Router (トリバゴと同じSPA構成)
├── app/
│   ├── page.tsx                           # ホームページ（トリバゴメイン完全再現）
│   ├── search/page.tsx                    # 検索結果（左フィルター + 右リスト）
│   ├── compare/page.tsx                   # 比較ページ（横スクロールテーブル）
│   ├── [category]/
│   │   └── page.tsx                       # カテゴリページ（ビタミンD、プロテイン等）
│   ├── [category]/[product]/page.tsx      # 商品詳細ページ
│   └── layout.tsx                         # 共通レイアウト
├── components/
│   ├── layout/
│   │   ├── Header.tsx                     # トリバゴヘッダー完全再現
│   │   └── Footer.tsx                     # 大量SEOリンク完全再現
│   ├── home/
│   │   ├── HeroSection.tsx                # フルスクリーンヒーロー
│   │   ├── SearchBar.tsx                  # 中央大型検索バー
│   │   ├── PartnerLogos.tsx               # パートナーブランドロゴ
│   │   ├── PopularSearchCards.tsx         # 人気商品6列グリッド
│   │   ├── PriceChart.tsx                 # 価格推移グラフ
│   │   └── CategoryLinks.tsx              # 大量カテゴリリンク
│   ├── search/
│   │   ├── SearchFilters.tsx              # 左サイドバーフィルター
│   │   ├── ProductCard.tsx                # 商品結果カード
│   │   ├── SortOptions.tsx                # ソート・表示オプション
│   │   └── Pagination.tsx                 # ページネーション
│   ├── compare/
│   │   ├── ComparisonTable.tsx            # 横スクロール比較テーブル
│   │   ├── ComparisonHeader.tsx           # 比較ヘッダー
│   │   └── ComparisonCTA.tsx              # 購入CTAボタン
│   └── ui/                                # トリバゴ準拠UIコンポーネント
└── lib/
    ├── search.ts                          # 検索ロジック
    ├── filters.ts                         # フィルタリング
    ├── comparison.ts                      # 比較機能
    └── price-tracking.ts                  # 価格追跡
```

### Data Architecture

```typescript
// トリバゴのホテルデータ構造をサプリに適用
interface Product {
  id: string;
  name: string; // 商品名
  brand: string; // ブランド名
  category: string; // カテゴリ（ビタミンD、プロテイン等）
  image: string; // 商品画像
  prices: ProductPrice[]; // 複数サイトの価格
  averagePrice: number; // 平均価格
  productCount: number; // 同カテゴリ商品数
  rating: number; // 評価
  reviewCount: number; // レビュー数
  ingredients: Ingredient[]; // 成分情報
  specifications: Specification[]; // 仕様（容量、形状等）
}

interface ProductPrice {
  site: string; // 販売サイト（Amazon、iHerb等）
  price: number; // 価格
  url: string; // 購入URL
  availability: boolean; // 在庫状況
  shipping: number; // 送料
}

interface SearchFilters {
  category: string[]; // カテゴリ
  priceRange: [number, number]; // 価格帯
  brands: string[]; // ブランド
  rating: number; // 最低評価
  ingredients: string[]; // 成分
  form: string[]; // 形状（錠剤、カプセル等）
}
```

## Components Design

### 1. Header Component - トリバゴヘッダー完全再現

```typescript
interface HeaderProps {
  currentLocale: string;
}

// トリバゴと同じシンプル構成:
// 左：ロゴ「サプティア」
// 右：お気に入りリンク
// 背景：白、影なし、ボーダーのみ
```

**デザイン仕様（トリバゴ準拠）:**

- 高さ: 60px
- 背景: #ffffff
- ボーダー: 1px solid #e0e0e0
- ロゴ: 左寄せ、24px font-size
- お気に入り: 右寄せ、アイコン + テキスト

### 2. HeroSection Component - フルスクリーンヒーロー

```typescript
interface HeroSectionProps {
  onSearch: (query: string) => void;
}

// トリバゴと同じ構成:
// - フルスクリーン背景（グラデーション）
// - 中央にキャッチコピー
// - 大型検索バー
// - 下部にパートナーロゴ
```

**デザイン仕様（トリバゴ準拠）:**

- 高さ: 100vh
- 背景: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
- キャッチコピー: 中央、白文字、48px
- 検索バー: 幅800px、高さ60px、白背景、影付き

### 3. SearchBar Component - 中央大型検索バー

```typescript
interface SearchBarProps {
  placeholder: string;
  onSearch: (query: string) => void;
  suggestions?: string[];
}

// トリバゴと同じ検索バー:
// - 大型入力フィールド
// - 検索ボタン（右側）
// - オートコンプリート
// - サジェスト表示
```

**デザイン仕様（トリバゴ準拠）:**

- 幅: 800px (デスクトップ)
- 高さ: 60px
- 背景: #ffffff
- ボーダー: 2px solid #ff6b35
- 検索ボタン: #ff6b35背景、白文字

### 4. PartnerLogos Component - パートナーブランド

```typescript
interface PartnerLogosProps {
  partners: Partner[];
}

interface Partner {
  name: string;
  logo: string;
  url: string;
}

// トリバゴのパートナーセクション再現:
// - 「100を超えるサイトのサプリ価格をサプティアが比較」
// - ブランドロゴ横並び
// - Amazon、iHerb、楽天、DHC等
```

**デザイン仕様（トリバゴ準拠）:**

- 背景: #f8f9fa
- パディング: 40px 0
- ロゴサイズ: 120px × 60px
- 間隔: 40px
- グレースケール → カラー（ホバー時）

### 5. PopularSearchCards Component - 人気商品グリッド

```typescript
interface PopularSearchCardsProps {
  categories: ProductCategory[];
}

interface ProductCategory {
  name: string; // ビタミンD、プロテイン等
  image: string; // カテゴリ画像
  productCount: number; // 商品数
  averagePrice: number; // 平均価格
  url: string; // カテゴリURL
}

// トリバゴの人気検索カード完全再現:
// - 6列グリッド（デスクトップ）
// - 画像 + カテゴリ名 + 商品数 + 平均価格
// - ホバー効果
```

**デザイン仕様（トリバゴ準拠）:**

- グリッド: 6列（デスクトップ）、3列（タブレット）、2列（モバイル）
- カードサイズ: 258px × 258px
- 画像: 258px × 258px、object-cover
- テキスト: 下部オーバーレイ、白文字、影付き
- ホバー: transform: scale(1.05)

### 6. PriceChart Component - 価格推移グラフ

```typescript
interface PriceChartProps {
  category: string;
  priceData: PricePoint[];
}

interface PricePoint {
  month: string;
  price: number;
}

// トリバゴの価格グラフ完全再現:
// - 「サプリメントの購入に最適な時期をチェック」
// - カテゴリタブ切り替え
// - 月別価格推移グラフ
// - 3つ星平均価格基準
```

**デザイン仕様（トリバゴ準拠）:**

- 背景: #ffffff
- グラフ色: #ff6b35
- タブ: 上部、アクティブ時下線
- グラフサイズ: 800px × 300px

### 7. SearchFilters Component - 左サイドバーフィルター

```typescript
interface SearchFiltersProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  categories: string[];
  brands: string[];
  priceRange: [number, number];
}

// トリバゴの検索フィルター完全再現:
// - 左サイドバー固定
// - カテゴリ、価格帯、ブランド、評価
// - チェックボックス、スライダー
// - 結果数リアルタイム更新
```

**デザイン仕様（トリバゴ準拠）:**

- 幅: 280px
- 背景: #ffffff
- ボーダー: 1px solid #e0e0e0
- セクション間隔: 24px
- チェックボックス: トリバゴと同じスタイル

### 8. ProductCard Component - 商品結果カード

```typescript
interface ProductCardProps {
  product: Product;
  onCompare: (productId: string) => void;
  onFavorite: (productId: string) => void;
}

// トリバゴのホテルカード完全再現:
// - 商品画像（左）
// - 商品情報（中央）
// - 価格情報（右）
// - お気に入り、比較ボタン
```

**デザイン仕様（トリバゴ準拠）:**

- レイアウト: 横並び（画像 + 情報 + 価格）
- 画像サイズ: 200px × 150px
- カード高さ: 180px
- ホバー: 影の強化
- ボタン: トリバゴと同じスタイル

### 9. ComparisonTable Component - 商品比較テーブル

```typescript
interface ComparisonTableProps {
  products: Product[];
  onRemoveProduct: (productId: string) => void;
}

// トリバゴの比較テーブル完全再現:
// - 横スクロール対応
// - 商品画像ヘッダー
// - 価格、成分、仕様比較
// - 購入CTAボタン
```

**デザイン仕様（トリバゴ準拠）:**

- テーブル幅: 可変（商品数に応じて）
- 列幅: 250px（商品1つあたり）
- ヘッダー固定: sticky top
- CTAボタン: #ff6b35、各列下部

## Color Palette - トリバゴ完全準拠

```css
:root {
  /* トリバゴのメインカラー */
  --primary: #ff6b35; /* オレンジ（メインCTA） */
  --primary-dark: #e55a2b; /* ホバー時 */
  --primary-light: #ff8c69; /* 薄いオレンジ */

  /* トリバゴのグレースケール */
  --gray-50: #f8f9fa;
  --gray-100: #f1f3f4;
  --gray-200: #e8eaed;
  --gray-300: #dadce0;
  --gray-400: #bdc1c6;
  --gray-500: #9aa0a6;
  --gray-600: #80868b;
  --gray-700: #5f6368;
  --gray-800: #3c4043;
  --gray-900: #202124;

  /* トリバゴの背景色 */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-hero: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  /* トリバゴのボーダー */
  --border-light: #e0e0e0;
  --border-medium: #dadce0;
  --border-dark: #bdc1c6;
}
```

## Typography - トリバゴフォント準拠

```css
/* トリバゴのフォントスタック */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* トリバゴのタイプスケール */
--text-xs: 12px; /* 小さなラベル */
--text-sm: 14px; /* 本文 */
--text-base: 16px; /* 標準テキスト */
--text-lg: 18px; /* 大きなテキスト */
--text-xl: 20px; /* 小見出し */
--text-2xl: 24px; /* 見出し */
--text-3xl: 30px; /* 大見出し */
--text-4xl: 36px; /* ヒーロータイトル */
--text-5xl: 48px; /* 大型ヒーロー */

/* トリバゴのフォントウェイト */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## Layout System - トリバゴレイアウト準拠

```css
/* トリバゴのコンテナ幅 */
--container-sm: 540px;
--container-md: 720px;
--container-lg: 960px;
--container-xl: 1140px;
--container-xxl: 1320px;

/* トリバゴのブレークポイント */
--breakpoint-sm: 576px;
--breakpoint-md: 768px;
--breakpoint-lg: 992px;
--breakpoint-xl: 1200px;
--breakpoint-xxl: 1400px;

/* トリバゴのスペーシング */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
```

## Animation System - トリバゴアニメーション準拠

```css
/* トリバゴのトランジション */
--transition-fast: 150ms ease-in-out;
--transition-normal: 300ms ease-in-out;
--transition-slow: 500ms ease-in-out;

/* トリバゴのホバー効果 */
.trivago-hover {
  transition: all var(--transition-normal);
}

.trivago-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* トリバゴのカードホバー */
.trivago-card-hover:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}
```

## Responsive Design - トリバゴレスポンシブ準拠

### Desktop (1200px+)

- ヘッダー: フル幅、ロゴ左、メニュー右
- ヒーロー: フルスクリーン、中央検索バー
- 人気検索: 6列グリッド
- 検索結果: 左フィルター(280px) + 右リスト

### Tablet (768px - 1199px)

- ヘッダー: 同じレイアウト、少し縮小
- ヒーロー: 検索バー幅調整
- 人気検索: 3列グリッド
- 検索結果: フィルター折りたたみ可能

### Mobile (767px以下)

- ヘッダー: ハンバーガーメニュー
- ヒーロー: 縦積みレイアウト
- 人気検索: 2列グリッド
- 検索結果: フィルターモーダル

## SEO Strategy - トリバゴSEO準拠

### メタタグ構造

```html
<!-- トリバゴと同じメタタグ構造 -->
<title>サプリメント価格比較 - サプティア</title>
<meta
  name="description"
  content="100を超えるサイトのサプリメント価格をサプティアが比較。最安値でサプリを購入できます。"
/>
<meta
  name="keywords"
  content="サプリメント,価格比較,最安値,ビタミン,プロテイン"
/>
```

### 構造化データ

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "サプティア",
  "url": "https://suptia.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://suptia.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

### URL構造（トリバゴ準拠）

- `/` - ホームページ
- `/search?q={query}` - 検索結果
- `/compare?products={ids}` - 比較ページ
- `/{category}` - カテゴリページ
- `/{category}/{product}` - 商品詳細

## Performance Optimization

### Core Web Vitals目標（トリバゴレベル）

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### 最適化戦略

1. **画像最適化**: WebP形式、適切なサイズ
2. **コード分割**: ページ別バンドル
3. **キャッシュ戦略**: CDN + ブラウザキャッシュ
4. **プリロード**: 重要リソースの事前読み込み

## Testing Strategy

### Visual Regression Testing

- トリバゴとの見た目比較
- 各ブレークポイントでの表示確認
- ブラウザ間互換性テスト

### Functional Testing

- 検索機能テスト
- フィルタリング機能テスト
- 比較機能テスト
- レスポンシブ動作テスト

### Performance Testing

- Lighthouse CI
- Core Web Vitals監視
- 負荷テスト

---

**重要**: この設計はトリバゴの完全再現を目的としています。独自の改善や最適化は行わず、トリバゴと同じユーザー体験を提供することを最優先とします。
