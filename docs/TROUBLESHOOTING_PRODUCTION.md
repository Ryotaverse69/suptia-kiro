# 本番環境トラブルシューティングガイド

## 概要

サプティア本番環境で発生する可能性のある問題と解決方法を説明します。

## 緊急時対応フロー

### 1. 問題の特定

```bash
# サイトの状態確認
curl -I https://suptia.com

# Vercelステータス確認
npx vercel ls

# ログ確認
npx vercel logs --follow
```

### 2. 影響範囲の評価

- [ ] サイト全体がダウンしているか
- [ ] 特定の機能のみ影響があるか
- [ ] パフォーマンスの問題か
- [ ] データの問題か

### 3. 緊急対応

```bash
# 即座にロールバック
npx vercel rollback

# または前の安定版にロールバック
git revert HEAD
git push origin master
```

## よくある問題と解決方法

### 🚨 サイト全体がダウン

#### 症状

- サイトにアクセスできない
- 500エラーが表示される
- Vercelダッシュボードでエラーが表示される

#### 原因と解決方法

**1. ビルドエラー**

```bash
# ログ確認
npx vercel logs

# ローカルでビルドテスト
pnpm build

# 依存関係の問題の場合
rm -rf node_modules .next
pnpm install
pnpm build
```

**2. 環境変数の問題**

```bash
# 環境変数確認
npx vercel env ls

# 必須環境変数の確認
npx vercel env add NEXT_PUBLIC_SANITY_PROJECT_ID
npx vercel env add SANITY_API_TOKEN
```

**3. Sanity接続エラー**

```bash
# Sanity接続テスト
curl "https://your-project-id.api.sanity.io/v2021-03-25/data/query/production?query=*[_type=='product'][0]"

# APIトークンの確認
# Sanity Studio > Settings > API > Tokens
```

### 🐌 パフォーマンス問題

#### 症状

- ページの読み込みが遅い
- Lighthouse スコアが低下
- Core Web Vitals が悪化

#### 診断方法

```bash
# Lighthouse監査
npm run lighthouse:ci

# バンドルサイズ分析
npm run analyze

# パフォーマンス監視
npm run vitals:check
```

#### 解決方法

**1. 画像最適化**

```javascript
// next.config.mjs
images: {
  formats: ['image/webp', 'image/avif'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  minimumCacheTTL: 31536000,
}
```

**2. キャッシュ設定の確認**

```bash
# ISR設定確認
curl -I "https://suptia.com/products/vitamin-d"

# キャッシュヘッダー確認
curl -I "https://suptia.com/_next/static/css/app.css"
```

**3. バンドルサイズ最適化**

```bash
# 不要な依存関係の削除
npm run deps:analyze

# Tree shaking確認
npm run build:analyze
```

### 🔍 検索機能の問題

#### 症状

- 検索結果が表示されない
- 検索が遅い
- フィルターが動作しない

#### 診断方法

```bash
# Sanity クエリテスト
curl "https://your-project-id.api.sanity.io/v2021-03-25/data/query/production?query=*[_type=='product' && name match 'ビタミン*'][0...10]"

# 検索API確認
curl "https://suptia.com/api/search?q=ビタミン"
```

#### 解決方法

**1. Sanity接続問題**

```bash
# APIトークンの確認
echo $SANITY_API_TOKEN

# プロジェクトID確認
echo $NEXT_PUBLIC_SANITY_PROJECT_ID
```

**2. クエリ最適化**

```javascript
// lib/sanity/queries.ts
const searchQuery = `
  *[_type == "product" && (
    name match $query + "*" ||
    brand->name match $query + "*" ||
    mainIngredients[] match $query + "*"
  )] | order(_score desc) [0...$limit] {
    // 必要なフィールドのみ取得
  }
`;
```

### 💾 ISR（再検証）の問題

#### 症状

- コンテンツが更新されない
- Webhookが動作しない
- キャッシュが効かない

#### 診断方法

```bash
# Webhook テスト
curl -X POST "https://suptia.com/api/revalidate" \
  -H "Content-Type: application/json" \
  -H "x-sanity-signature: test" \
  -d '{"_type": "product", "slug": {"current": "test"}}'

# 再検証ログ確認
npx vercel logs --filter="revalidate"
```

#### 解決方法

**1. Webhook設定確認**

```bash
# Sanity Webhook設定
# URL: https://suptia.com/api/revalidate
# Secret: SANITY_WEBHOOK_SECRET環境変数と一致

# 環境変数確認
npx vercel env ls | grep SANITY_WEBHOOK_SECRET
```

**2. 手動再検証**

```bash
# 開発環境での手動再検証
curl "http://localhost:3000/api/revalidate?path=/products/vitamin-d"

# 本番環境では無効（セキュリティ上の理由）
```

### 🔒 セキュリティ問題

#### 症状

- CSPエラーが発生
- セキュリティヘッダーが設定されていない
- 外部リソースが読み込めない

#### 診断方法

```bash
# セキュリティヘッダー確認
curl -I https://suptia.com

# CSPエラー確認
# ブラウザのDevTools > Console
```

#### 解決方法

**1. CSP設定の修正**

```javascript
// middleware.ts
const csp = [
  "default-src 'self'",
  "img-src 'self' https://cdn.sanity.io data:",
  "connect-src 'self' https://*.sanity.io https://vitals.vercel-insights.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  `script-src 'self' 'nonce-${nonce}'`,
].join('; ');
```

**2. セキュリティヘッダーの確認**

```bash
# セキュリティスキャン
npm run security:scan

# ヘッダー確認
curl -I https://suptia.com | grep -E "(X-Frame-Options|X-Content-Type-Options|Referrer-Policy)"
```

### 📊 Analytics・監視の問題

#### 症状

- Google Analytics データが取得できない
- Vercel Analytics が動作しない
- エラー監視が機能しない

#### 解決方法

**1. Google Analytics**

```bash
# GA ID確認
echo $NEXT_PUBLIC_GA_ID

# GA設定確認
curl "https://suptia.com" | grep "gtag"
```

**2. Vercel Analytics**

```bash
# Analytics ID確認
echo $NEXT_PUBLIC_VERCEL_ANALYTICS_ID

# Analytics有効化確認
# pages/_app.tsx または layout.tsx
```

**3. Sentry監視**

```bash
# Sentry設定確認
echo $SENTRY_DSN

# エラーテスト
curl "https://suptia.com/api/test-error"
```

## 監視・アラート設定

### 1. Uptime監視

```bash
# 外部監視サービス設定例
# - Pingdom
# - UptimeRobot
# - StatusCake

# 監視URL
https://suptia.com
https://suptia.com/api/health
```

### 2. パフォーマンス監視

```bash
# Lighthouse CI設定
# .github/workflows/lighthouse.yml

# Core Web Vitals監視
# Vercel Analytics Dashboard
```

### 3. エラー監視

```bash
# Sentry設定
# sentry.client.config.js
# sentry.server.config.js

# ログ監視
npx vercel logs --follow | grep ERROR
```

## 復旧手順

### 1. 緊急復旧

```bash
# 1. 即座にロールバック
npx vercel rollback

# 2. 問題の特定
npx vercel logs

# 3. 修正版のデプロイ
git revert HEAD
git push origin master
```

### 2. 段階的復旧

```bash
# 1. 修正版の準備
git checkout -b hotfix/issue-fix
# 修正作業...
git commit -m "hotfix: 緊急修正"

# 2. テスト環境での確認
git push origin hotfix/issue-fix
# Preview URLでの確認

# 3. 本番デプロイ
git checkout master
git merge hotfix/issue-fix
git push origin master
```

### 3. データ復旧

```bash
# Sanity データの復旧
# Sanity Studio > History > Restore

# バックアップからの復旧
# Sanity CLI を使用
sanity dataset import backup.tar.gz production
```

## 予防策

### 1. 定期的な監視

```bash
# 日次チェック
npm run health:check

# 週次チェック
npm run lighthouse:ci
npm run security:scan

# 月次チェック
npm run deps:audit
npm run performance:review
```

### 2. 自動テスト

```bash
# CI/CDパイプライン
# .github/workflows/ci.yml

# E2Eテスト
npm run test:e2e

# パフォーマンステスト
npm run test:performance
```

### 3. バックアップ

```bash
# Sanity データバックアップ
sanity dataset export production backup-$(date +%Y%m%d).tar.gz

# 設定ファイルのバックアップ
git tag v$(date +%Y%m%d)
git push origin --tags
```

## エスカレーション

### レベル1: 自動復旧

- ヘルスチェック失敗時の自動ロールバック
- パフォーマンス低下時のアラート

### レベル2: 開発者対応

- 機能障害の修正
- パフォーマンス問題の調査

### レベル3: 緊急対応

- サイト全体ダウン
- データ損失
- セキュリティインシデント

### 連絡先

- **開発者**: [your-email@example.com]
- **Vercel サポート**: https://vercel.com/support
- **Sanity サポート**: https://www.sanity.io/support

## ログ・監視ツール

### 1. Vercel ダッシュボード

- デプロイメント状況
- パフォーマンスメトリクス
- エラーログ

### 2. Sanity Studio

- コンテンツ更新履歴
- API使用状況
- Webhook ログ

### 3. 外部監視

- Google Analytics
- Lighthouse CI
- Sentry

## チェックリスト

### 問題発生時

- [ ] 影響範囲を特定
- [ ] ログを確認
- [ ] 必要に応じてロールバック
- [ ] 根本原因を調査
- [ ] 修正版をデプロイ
- [ ] 再発防止策を実施

### 定期メンテナンス

- [ ] パフォーマンス監視
- [ ] セキュリティ更新
- [ ] 依存関係の更新
- [ ] バックアップの確認
- [ ] 監視設定の見直し

---

**最終更新**: 2025年1月26日
**バージョン**: 1.0.0
