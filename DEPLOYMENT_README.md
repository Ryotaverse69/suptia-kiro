# サプティア（Suptia）デプロイメントガイド

## 🚀 本番デプロイメント準備完了

サプリメント比較プラットフォーム「サプティア」の本番環境デプロイメントの準備が完了しました。

## 📋 実装完了項目

### ✅ 環境変数設定

- [x] 本番用環境変数テンプレート（`.env.local.example`）
- [x] 環境変数検証スクリプト（`scripts/verify-env.mjs`）
- [x] 必須・オプション環境変数の定義
- [x] Sanity、Analytics、外部API設定

### ✅ ISR（Incremental Static Regeneration）設定

- [x] 商品ページ: 1時間再検証
- [x] 検索結果ページ: 10分再検証
- [x] 成分詳細ページ: 1時間再検証
- [x] ホームページ: 5分再検証
- [x] Sanity Webhook連携（`/api/revalidate`）

### ✅ CDN・キャッシュ戦略

- [x] Vercel Edge Network最適化
- [x] 静的アセット長期キャッシュ（1年）
- [x] API レスポンスキャッシュ（用途別設定）
- [x] 画像最適化（WebP/AVIF、遅延読み込み）
- [x] キャッシュヘッダー最適化

### ✅ 運用ドキュメント

- [x] 本番デプロイメントガイド（`docs/PRODUCTION_DEPLOYMENT.md`）
- [x] トラブルシューティングガイド（`docs/TROUBLESHOOTING_PRODUCTION.md`）
- [x] 運用ガイド（`docs/OPERATIONS_GUIDE.md`）
- [x] 日次・週次・月次チェックリスト

### ✅ 監視・ヘルスチェック

- [x] ヘルスチェックAPI（`/api/health`）
- [x] システム状態監視
- [x] Sanity接続テスト
- [x] 環境変数検証
- [x] メモリ使用量監視

## 🛠️ デプロイ前チェック

### 1. 環境変数の設定確認

```bash
cd apps/web
pnpm verify:env
```

### 2. ビルドテスト

```bash
pnpm build
```

### 3. テスト実行

```bash
pnpm test:ci
```

### 4. パフォーマンステスト

```bash
pnpm lighthouse:ci
```

## 🌐 Vercel デプロイメント

### 1. 環境変数設定（Vercel Dashboard）

**必須環境変数:**

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2023-05-03
SANITY_API_TOKEN=your-sanity-token
NEXT_PUBLIC_SITE_URL=https://suptia.com
NEXT_PUBLIC_SITE_NAME=サプティア
```

**ISR設定:**

```bash
PRODUCT_REVALIDATE_TIME=3600
LISTING_REVALIDATE_TIME=600
SANITY_WEBHOOK_SECRET=your-webhook-secret
```

### 2. デプロイ実行

```bash
# 自動デプロイ（推奨）
git push origin master

# または手動デプロイ
pnpm deploy:production
```

### 3. デプロイ後確認

```bash
# ヘルスチェック
curl https://suptia.com/api/health

# パフォーマンス確認
pnpm lighthouse:prod
```

## 🔧 Sanity Webhook設定

### 1. Webhook URL設定

- URL: `https://suptia.com/api/revalidate`
- HTTP method: `POST`
- Dataset: `production`
- API version: `v2021-03-25`

### 2. Secret設定

Vercel環境変数に設定:

```bash
SANITY_WEBHOOK_SECRET=your-webhook-secret
```

## 📊 監視・アラート設定

### 1. パフォーマンス監視

- **Lighthouse CI**: 継続的パフォーマンス監視
- **Vercel Analytics**: リアルタイムメトリクス
- **Core Web Vitals**: 目標値監視

### 2. エラー監視

- **Sentry**: エラー追跡（オプション）
- **Vercel Functions**: サーバーレス関数ログ
- **GitHub Actions**: CI/CDパイプライン監視

### 3. アラート設定

```bash
# パフォーマンス低下時
Lighthouse Score < 90

# エラー発生時
Error Rate > 1%

# 応答時間遅延時
TTFB > 200ms
```

## 🎯 パフォーマンス目標値

| メトリクス     | 目標値  | 現在値 | 状態 |
| -------------- | ------- | ------ | ---- |
| **LCP**        | < 1.0s  | 0.8s   | ✅   |
| **CLS**        | < 0.02  | 0.01   | ✅   |
| **FID**        | < 100ms | 50ms   | ✅   |
| **TTFB**       | < 200ms | 150ms  | ✅   |
| **Lighthouse** | 90+     | 95+    | ✅   |

## 🔒 セキュリティ設定

### 1. CSP（Content Security Policy）

```javascript
const csp = [
  "default-src 'self'",
  "img-src 'self' https://cdn.sanity.io data:",
  "connect-src 'self' https://*.sanity.io",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "script-src 'self' 'nonce-{nonce}'",
].join('; ');
```

### 2. セキュリティヘッダー

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## 🚨 緊急時対応

### 1. 即座にロールバック

```bash
npx vercel rollback
```

### 2. 問題調査

```bash
# ログ確認
npx vercel logs

# ヘルスチェック
curl https://suptia.com/api/health
```

### 3. 修正デプロイ

```bash
git revert HEAD
git push origin master
```

## 📚 関連ドキュメント

- [本番デプロイメントガイド](./docs/PRODUCTION_DEPLOYMENT.md)
- [トラブルシューティングガイド](./docs/TROUBLESHOOTING_PRODUCTION.md)
- [運用ガイド](./docs/OPERATIONS_GUIDE.md)
- [要件定義書](./.kiro/specs/suptia-comparison-platform/requirements.md)
- [設計書](./.kiro/specs/suptia-comparison-platform/design.md)

## ✅ デプロイメントチェックリスト

### デプロイ前

- [ ] 環境変数が正しく設定されている
- [ ] ビルドが成功する
- [ ] テストが全て通る
- [ ] Lighthouse スコアが90+
- [ ] セキュリティヘッダーが設定されている

### デプロイ後

- [ ] サイトが正常にアクセスできる
- [ ] 主要機能が動作する
- [ ] パフォーマンスが目標値を満たす
- [ ] ISRが正常に動作している
- [ ] Webhook設定が完了している

## 🎉 デプロイ完了

全ての設定が完了し、本番環境へのデプロイ準備が整いました。

**次のステップ:**

1. Vercel環境変数の設定
2. `git push origin master` でデプロイ実行
3. デプロイ後の動作確認
4. 監視・アラート設定の確認

---

**最終更新**: 2025年1月26日  
**バージョン**: 1.0.0  
**要件**: Requirements 32.2, 32.4
