# ISR (Incremental Static Regeneration) Configuration

## 概要

SuptiaプロジェクトのISR設定により、パフォーマンスとコンテンツの新鮮さのバランスを最適化しています。

## ISR設定一覧

### ページタイプ別の再生成間隔

| ページタイプ | パス | 再生成間隔 | 理由 |
|-------------|------|-----------|------|
| 商品詳細 | `/products/[slug]` | 10分 (600秒) | 価格・在庫情報の更新頻度が高い |
| 商品一覧 | `/` | 30分 (1800秒) | 新商品追加や順序変更に対応 |
| 比較ページ | `/compare` | 1時間 (3600秒) | 静的コンテンツが中心 |

### キャッシュタグ戦略

```typescript
export const CACHE_TAGS = {
  PRODUCTS: 'products',           // 全商品関連
  PRODUCT_DETAIL: 'product-detail', // 商品詳細ページ
  PRODUCT_LIST: 'product-list',   // 商品一覧ページ
  COMPARE: 'compare',             // 比較ページ
} as const;
```

## キャッシュ無効化戦略

### 1. Webhookベースの自動無効化

Sanity CMSからのWebhookを受信して、関連するキャッシュを自動的に無効化：

```bash
POST /api/revalidate
Content-Type: application/json
X-Webhook-Secret: your-webhook-secret

{
  "_type": "product",
  "slug": { "current": "product-slug" },
  "action": "update"
}
```

### 2. 手動キャッシュ無効化

緊急時やメンテナンス時の手動キャッシュクリア：

```bash
# 特定ページの無効化
GET /api/revalidate?secret=your-secret&path=/products/specific-product

# 全ページの無効化
GET /api/revalidate?secret=your-secret
```

### 3. コンテンツ更新時の戦略

| 更新内容 | 無効化対象 | 実行タイミング |
|---------|-----------|---------------|
| 商品情報更新 | 該当商品ページ + 一覧ページ | 即座 |
| 商品削除 | 全商品ページ | 即座 |
| 新商品追加 | 一覧ページ + 比較ページ | 即座 |
| サイト全体更新 | 全ページ | 即座 |

## 実装詳細

### ページレベルのISR設定

```typescript
// apps/web/src/app/products/[slug]/page.tsx
export const revalidate = 600; // 10分

// apps/web/src/app/page.tsx  
export const revalidate = 1800; // 30分

// apps/web/src/app/compare/page.tsx
export const revalidate = 3600; // 1時間
```

### Sanityクライアントのキャッシュ設定

```typescript
// キャッシュタグ付きでデータ取得
const product = await sanityServerWithCache.fetchProduct(query, { slug });

// 内部的に以下のキャッシュ設定を適用
{
  next: {
    tags: [CACHE_TAGS.PRODUCTS, CACHE_TAGS.PRODUCT_DETAIL],
    revalidate: 600,
  },
}
```

## 環境変数設定

```bash
# .env.local
SANITY_WEBHOOK_SECRET=your-webhook-secret-for-cache-invalidation
REVALIDATE_SECRET=your-manual-revalidation-secret
```

## 監視とデバッグ

### ISRステータス確認

```bash
GET /api/isr-status
```

レスポンス例：
```json
{
  "success": true,
  "data": {
    "config": {
      "PRODUCT_DETAIL": 600,
      "PRODUCT_LIST": 1800,
      "STATIC_PAGES": 3600,
      "COMPARE_PAGES": 3600
    },
    "tags": {
      "PRODUCTS": "products",
      "PRODUCT_DETAIL": "product-detail",
      "PRODUCT_LIST": "product-list",
      "COMPARE": "compare"
    },
    "environment": "production",
    "timestamp": "2025-01-27T10:00:00.000Z"
  },
  "pages": {
    "/": {
      "revalidate": 1800,
      "description": "Product listing page - 30 minutes"
    },
    "/products/[slug]": {
      "revalidate": 600,
      "description": "Product detail pages - 10 minutes"
    },
    "/compare": {
      "revalidate": 3600,
      "description": "Compare page - 1 hour"
    }
  }
}
```

### ログ監視

キャッシュ無効化の実行ログを確認：

```bash
# Vercelログ
vercel logs

# ローカル開発
npm run dev
```

## パフォーマンス最適化

### 1. 階層的キャッシュ戦略

- **商品詳細**: 最も動的 (10分)
- **商品一覧**: 中程度の動的 (30分)  
- **静的ページ**: 最も静的 (1時間)

### 2. 効率的な無効化

- 商品更新時は該当ページのみ無効化
- 大量更新時は一括無効化
- タグベースの選択的無効化

### 3. CDNとの連携

- Vercel Edge Networkでの自動配信
- 地理的に最適化されたキャッシュ
- 自動的なstale-while-revalidate

## トラブルシューティング

### よくある問題

1. **キャッシュが更新されない**
   - Webhook設定を確認
   - 環境変数の設定を確認
   - ログでエラーを確認

2. **パフォーマンスが低下**
   - 再生成間隔を調整
   - キャッシュヒット率を確認
   - 不要な無効化を削減

3. **古いコンテンツが表示される**
   - 手動で無効化を実行
   - ISR設定を確認
   - CDNキャッシュをクリア

### デバッグコマンド

```bash
# ISRステータス確認
curl https://your-domain.com/api/isr-status

# 手動キャッシュクリア
curl "https://your-domain.com/api/revalidate?secret=your-secret"

# 特定ページのキャッシュクリア
curl "https://your-domain.com/api/revalidate?secret=your-secret&path=/products/test"
```

## 要件との対応

- **要件7.1**: ✅ 商品詳細ページに `revalidate: 600` を設定
- **要件7.2**: ✅ ページタイプ別に適切なISRポリシーを設定
- **要件7.3**: ✅ コンテンツ更新時のキャッシュ無効化戦略を実装

## 関連ドキュメント

- [Next.js ISR Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
- [Vercel ISR Guide](https://vercel.com/docs/concepts/incremental-static-regeneration)
- [Sanity Webhooks](https://www.sanity.io/docs/webhooks)