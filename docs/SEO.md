# SEO ガイド

## メタデータ管理

### 基本設定
`src/lib/seo.ts` でSEO関連のユーティリティを提供：

```typescript
import { generateMetadata, generateProductMetadata } from '@/lib/seo';

// 基本ページ
export const metadata = generateMetadata({
  title: 'ページタイトル',
  description: 'ページ説明',
  canonical: '/page-path',
  keywords: ['キーワード1', 'キーワード2']
});

// 商品ページ
export const metadata = generateProductMetadata(product);
```

### 動的メタデータ
商品詳細ページでは動的にメタデータを生成：
- タイトル: `商品名 - ブランド名 | サプティア`
- 説明: 商品情報と価格を含む自動生成
- OG画像: 商品画像または既定画像

## 構造化データ（JSON-LD）

### Product スキーマ
```typescript
import { generateProductJsonLd } from '@/lib/seo';

const jsonLd = generateProductJsonLd({
  name: product.name,
  brand: product.brand,
  priceJPY: product.priceJPY,
  slug: product.slug,
  description: product.description
});
```

### BreadcrumbList スキーマ
```typescript
import { generateBreadcrumbJsonLd } from '@/lib/seo';

const breadcrumbJsonLd = generateBreadcrumbJsonLd([
  { name: 'ホーム', url: '/' },
  { name: '商品', url: '/products' },
  { name: product.name, url: `/products/${product.slug}` }
]);
```

## サイトマップ生成

### 設定ファイル
`next-sitemap.config.js` で自動生成設定：

```javascript
module.exports = {
  siteUrl: 'https://suptia.com',
  generateRobotsText: true,
  changefreq: 'daily',
  priority: 0.7,
  exclude: ['/admin/*', '/api/*']
};
```

### 生成コマンド
```bash
npm run sitemap
```

### 出力ファイル
- `public/sitemap.xml`
- `public/robots.txt`

## 正規URL管理

### トラッキングパラメータ除去
`cleanUrl()` 関数で自動除去：
- utm_* パラメータ
- fbclid, gclid等のクリックID
- ref, source等の参照パラメータ

### 実装例
```typescript
import { cleanUrl } from '@/lib/seo';

const canonicalUrl = cleanUrl(request.url);
```

## Core Web Vitals 最適化

### 画像最適化
Next.js Image コンポーネントを使用：
```tsx
import Image from 'next/image';

<Image
  src={product.image}
  alt={product.name}
  width={400}
  height={300}
  loading="lazy"
  placeholder="blur"
/>
```

### フォント最適化
```tsx
import { getFontPreloadLinks } from '@/lib/seo';

// layout.tsx で使用
const fontLinks = getFontPreloadLinks();
```

### CLS防止
- 画像のwidth/height指定必須
- フォントのpreload設定
- レイアウトシフトの最小化

## パフォーマンス監視

### Lighthouse CI
```bash
npx lhci autorun
```

### 目標スコア
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

## 運用ルール

### 新規ページ追加時
1. メタデータの設定
2. 構造化データの追加
3. サイトマップの更新
4. パフォーマンステスト

### 商品データ更新時
1. 商品メタデータの確認
2. JSON-LD の検証
3. 画像最適化の確認

### 定期チェック項目

#### 週次
- [ ] サイトマップの更新確認
- [ ] 新規ページのインデックス状況
- [ ] Core Web Vitals スコア

#### 月次
- [ ] 構造化データの検証
- [ ] メタデータの最適化
- [ ] 競合サイトとの比較

#### 四半期
- [ ] SEO戦略の見直し
- [ ] キーワード分析
- [ ] コンテンツ最適化

## ツールとリソース

### 検証ツール
- [Google Search Console](https://search.google.com/search-console)
- [Rich Results Test](https://search.google.com/test/rich-results)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### 構造化データ
- [Schema.org](https://schema.org/)
- [Google Structured Data](https://developers.google.com/search/docs/guides/intro-structured-data)

### パフォーマンス
- [Web Vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)