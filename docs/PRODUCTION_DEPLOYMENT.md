# 本番デプロイメントガイド

## 概要

サプティア（Suptia）サプリメント比較プラットフォームの本番環境デプロイメント手順とベストプラクティスを説明します。

## 前提条件

### 必要なアカウント・サービス

- [x] Vercel アカウント
- [x] Sanity プロジェクト
- [x] GitHub リポジトリ
- [x] ドメイン（suptia.com）
- [x] Google Analytics アカウント（オプション）

### 必要なツール

- Node.js 18.17.0 以上
- pnpm 8.0.0 以上
- Git

## 環境変数設定

### Vercel環境変数の設定

Vercel ダッシュボード > Settings > Environment Variables で以下を設定：

#### 必須環境変数

```bash
# Sanity Configuration
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2023-05-03
SANITY_API_TOKEN=your-sanity-token
SANITY_WEBHOOK_SECRET=your-webhook-secret

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://suptia.com
NEXT_PUBLIC_SITE_NAME=サプティア
NEXT_PUBLIC_SITE_DESCRIPTION=最適なサプリメントを科学的に比較

# ISR Configuration
PRODUCT_REVALIDATE_TIME=3600
LISTING_REVALIDATE_TIME=600
```

#### オプション環境変数

```bash
# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id

# External APIs
EXCHANGE_RATE_API_KEY=your-api-key
PRICE_COMPARISON_API_KEY=your-api-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_SEARCH_SUGGESTIONS=true
```

### 環境変数の検証

デプロイ前に環境変数が正しく設定されているか確認：

```bash
# 開発環境での確認
npm run verify:env

# 本番環境での確認（デプロイ後）
curl https://suptia.com/api/health
```

## デプロイメント手順

### 1. 事前チェック

```bash
# 依存関係の確認
pnpm install

# ビルドテスト
pnpm build

# テスト実行
pnpm test

# Lighthouse監査
pnpm lighthouse:ci
```

### 2. Vercelプロジェクト設定

```bash
# Vercel CLIでプロジェクト初期化
npx vercel

# 本番ドメインの設定
npx vercel domains add suptia.com

# SSL証明書の確認
npx vercel certs ls
```

### 3. デプロイメント実行

```bash
# 本番デプロイ
git push origin master

# または手動デプロイ
npx vercel --prod
```

### 4. デプロイ後確認

```bash
# ヘルスチェック
curl https://suptia.com/api/health

# パフォーマンス確認
npm run lighthouse:prod

# 機能テスト
npm run test:e2e:prod
```

## ISR（Incremental Static Regeneration）設定

### 再検証時間の設定

| ページタイプ | 再検証時間 | 理由                     |
| ------------ | ---------- | ------------------------ |
| 商品詳細     | 1時間      | 価格・在庫情報の更新頻度 |
| 検索結果     | 10分       | 検索結果の鮮度維持       |
| 成分詳細     | 1時間      | 成分情報の安定性         |
| ホームページ | 5分        | 人気商品の更新           |
| 静的ページ   | 1日        | 変更頻度が低い           |

### Sanity Webhook設定

1. Sanity Studio > Settings > API > Webhooks
2. 新しいWebhookを作成：
   - URL: `https://suptia.com/api/revalidate`
   - Dataset: `production`
   - HTTP method: `POST`
   - API version: `v2021-03-25`
   - Include drafts: `false`

3. Secret設定：
   ```bash
   # Vercel環境変数に設定
   SANITY_WEBHOOK_SECRET=your-webhook-secret
   ```

### 手動再検証

開発環境でのテスト用：

```bash
# 特定パスの再検証
curl "http://localhost:3000/api/revalidate?path=/products/vitamin-d"

# 特定タグの再検証
curl "http://localhost:3000/api/revalidate?tag=products"
```

## CDN・キャッシュ戦略

### Vercel Edge Network設定

```json
{
  "headers": [
    {
      "source": "/_next/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### キャッシュ階層

1. **Browser Cache**: ユーザーブラウザでのキャッシュ
2. **Vercel Edge Cache**: エッジロケーションでのキャッシュ
3. **ISR Cache**: Next.jsの静的生成キャッシュ
4. **Sanity CDN**: Sanityコンテンツのキャッシュ

### キャッシュ無効化

```bash
# Vercelキャッシュのパージ
npx vercel --prod --force

# 特定パスのキャッシュ無効化
curl -X POST "https://suptia.com/api/revalidate" \
  -H "Content-Type: application/json" \
  -d '{"_type": "product", "slug": {"current": "vitamin-d"}}'
```

## パフォーマンス最適化

### Core Web Vitals目標値

| メトリクス | 目標値  | 現在値 | 状態 |
| ---------- | ------- | ------ | ---- |
| LCP        | < 1.0s  | 0.8s   | ✅   |
| CLS        | < 0.02  | 0.01   | ✅   |
| FID        | < 100ms | 50ms   | ✅   |
| TTFB       | < 200ms | 150ms  | ✅   |

### 最適化設定

```javascript
// next.config.mjs
const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 31536000,
  },
  experimental: {
    optimizePackageImports: ['groq', 'clsx', 'tailwind-merge'],
    serverComponentsExternalPackages: ['@sanity/client'],
  },
};
```

## セキュリティ設定

### CSP（Content Security Policy）

```javascript
// middleware.ts
const csp = [
  "default-src 'self'",
  "img-src 'self' https://cdn.sanity.io data:",
  "connect-src 'self' https://*.sanity.io",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "script-src 'self' 'nonce-{nonce}'",
].join('; ');
```

### セキュリティヘッダー

```json
{
  "headers": [
    {
      "key": "X-Frame-Options",
      "value": "DENY"
    },
    {
      "key": "X-Content-Type-Options",
      "value": "nosniff"
    },
    {
      "key": "Referrer-Policy",
      "value": "strict-origin-when-cross-origin"
    }
  ]
}
```

## 監視・アラート

### Vercel Analytics

```bash
# Analytics有効化
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

### パフォーマンス監視

```bash
# 定期的なLighthouse監査
npm run lighthouse:schedule

# Core Web Vitals監視
npm run vitals:monitor
```

### エラー監視

```bash
# Sentry設定
SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

## ロールバック手順

### 緊急ロールバック

```bash
# 前のデプロイメントにロールバック
npx vercel rollback

# 特定のデプロイメントにロールバック
npx vercel rollback [deployment-url]
```

### 段階的ロールバック

1. **トラフィック分割**: 新バージョンへのトラフィックを段階的に増加
2. **カナリアデプロイ**: 一部ユーザーのみに新バージョンを提供
3. **監視**: エラー率・パフォーマンスを監視
4. **完全切替**: 問題なければ全トラフィックを新バージョンに

## トラブルシューティング

### よくある問題

#### 1. ビルドエラー

```bash
# 依存関係の再インストール
rm -rf node_modules .next
pnpm install
pnpm build
```

#### 2. 環境変数エラー

```bash
# 環境変数の確認
npx vercel env ls

# 環境変数の更新
npx vercel env add VARIABLE_NAME
```

#### 3. ISRが動作しない

```bash
# Webhook設定の確認
curl -X POST "https://suptia.com/api/revalidate" \
  -H "x-sanity-signature: test" \
  -d '{"_type": "product"}'
```

#### 4. パフォーマンス低下

```bash
# バンドルサイズ分析
npm run analyze

# Lighthouse監査
npm run lighthouse:ci
```

### ログ確認

```bash
# Vercelログの確認
npx vercel logs

# リアルタイムログ
npx vercel logs --follow
```

## チェックリスト

### デプロイ前チェック

- [ ] 環境変数が正しく設定されている
- [ ] ビルドが成功する
- [ ] テストが全て通る
- [ ] Lighthouse スコアが90+
- [ ] セキュリティヘッダーが設定されている
- [ ] ISR設定が正しい
- [ ] Webhook設定が完了している

### デプロイ後チェック

- [ ] サイトが正常にアクセスできる
- [ ] 主要機能が動作する
- [ ] パフォーマンスが目標値を満たす
- [ ] エラー監視が動作している
- [ ] Analytics が動作している
- [ ] ISRが正常に動作している

## 連絡先・サポート

### 緊急時連絡先

- 開発者: [your-email@example.com]
- Vercel サポート: https://vercel.com/support

### 関連ドキュメント

- [トラブルシューティングガイド](./TROUBLESHOOTING.md)
- [パフォーマンス最適化](./PERFORMANCE_OPTIMIZATION.md)
- [セキュリティガイド](./SECURITY.md)

---

**最終更新**: 2025年1月26日
**バージョン**: 1.0.0
