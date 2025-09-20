# 運用ガイド

## 概要

サプティア（Suptia）サプリメント比較プラットフォームの日常運用手順とベストプラクティスを説明します。

## 日常運用タスク

### 毎日のチェック項目

#### 1. サイト稼働状況確認

```bash
# サイトアクセス確認
curl -I https://suptia.com

# API稼働確認
curl https://suptia.com/api/health

# パフォーマンス確認
npm run lighthouse:quick
```

#### 2. エラー監視

```bash
# Vercel ログ確認
npx vercel logs --since=24h | grep ERROR

# Sentry エラー確認
# https://sentry.io/organizations/your-org/issues/

# Analytics 確認
# Google Analytics Dashboard
```

#### 3. コンテンツ更新確認

```bash
# Sanity 更新確認
# Sanity Studio > History

# ISR 動作確認
curl -I "https://suptia.com/products/vitamin-d" | grep "x-vercel-cache"
```

### 週次のチェック項目

#### 1. パフォーマンス監査

```bash
# Lighthouse 完全監査
npm run lighthouse:ci

# Core Web Vitals 確認
npm run vitals:report

# バンドルサイズ確認
npm run analyze
```

#### 2. セキュリティ確認

```bash
# 依存関係の脆弱性チェック
npm audit

# セキュリティヘッダー確認
npm run security:headers

# CSP 違反確認
# ブラウザ DevTools > Security
```

#### 3. データ品質確認

```bash
# Sanity データ整合性チェック
npm run sanity:validate

# 検索機能テスト
npm run test:search

# 価格データ更新確認
npm run price:validate
```

### 月次のチェック項目

#### 1. 依存関係更新

```bash
# 依存関係の更新確認
npm outdated

# セキュリティ更新の適用
npm update

# 互換性テスト
npm test
```

#### 2. バックアップ確認

```bash
# Sanity データバックアップ
sanity dataset export production backup-$(date +%Y%m%d).tar.gz

# 設定ファイルバックアップ
git tag monthly-backup-$(date +%Y%m%d)
git push origin --tags
```

#### 3. パフォーマンス分析

```bash
# 月次パフォーマンスレポート
npm run performance:monthly

# ユーザー行動分析
# Google Analytics > Behavior Flow

# 検索クエリ分析
npm run analytics:search
```

## コンテンツ管理

### Sanity Studio 運用

#### 1. コンテンツ更新フロー

1. **Draft作成**: Sanity Studio でドラフト作成
2. **プレビュー**: Preview モードで確認
3. **公開**: Publish でライブ環境に反映
4. **確認**: ISR による自動更新を確認

#### 2. コンテンツ品質チェック

```bash
# 必須フィールドの確認
*[_type == "product" && !defined(name)]

# 画像の確認
*[_type == "product" && !defined(image)]

# 価格データの確認
*[_type == "product" && !defined(prices)]
```

#### 3. SEO最適化

```bash
# メタデータ確認
*[_type == "product" && !defined(seoTitle)]

# 構造化データ確認
npm run seo:validate

# サイトマップ更新確認
curl https://suptia.com/sitemap.xml
```

### 商品データ管理

#### 1. 新商品追加手順

1. **基本情報入力**: 商品名、ブランド、説明
2. **成分情報入力**: 主要成分、含有量、効果
3. **価格情報入力**: 各ECサイトの価格
4. **画像アップロード**: 商品画像、成分表
5. **SEO設定**: タイトル、説明、キーワード
6. **公開**: Draft → Published

#### 2. 価格更新手順

```bash
# 価格データ更新スクリプト
npm run price:update

# 価格変動アラート確認
npm run price:alerts

# 価格履歴更新
npm run price:history
```

#### 3. 在庫状況管理

```bash
# 在庫状況確認
npm run inventory:check

# 在庫切れ商品の非表示
npm run inventory:hide-out-of-stock

# 在庫復活商品の表示
npm run inventory:show-in-stock
```

## パフォーマンス管理

### Core Web Vitals 監視

#### 目標値

| メトリクス | 目標値  | 警告値    | 危険値  |
| ---------- | ------- | --------- | ------- |
| LCP        | < 1.0s  | 1.0-2.5s  | > 2.5s  |
| CLS        | < 0.02  | 0.02-0.1  | > 0.1   |
| FID        | < 100ms | 100-300ms | > 300ms |
| TTFB       | < 200ms | 200-600ms | > 600ms |

#### 監視方法

```bash
# リアルタイム監視
npm run vitals:monitor

# 週次レポート
npm run vitals:weekly

# アラート設定
npm run vitals:alerts
```

### キャッシュ管理

#### 1. ISR キャッシュ

```bash
# キャッシュ状況確認
curl -I "https://suptia.com/products/vitamin-d" | grep cache

# 手動キャッシュクリア（開発環境）
curl "http://localhost:3000/api/revalidate?path=/products/vitamin-d"

# Webhook による自動更新確認
npm run webhook:test
```

#### 2. CDN キャッシュ

```bash
# Vercel キャッシュ確認
npx vercel inspect https://suptia.com

# キャッシュパージ
npx vercel --prod --force

# キャッシュヒット率確認
npm run cache:analytics
```

### 画像最適化

#### 1. 画像品質管理

```bash
# 画像サイズ確認
npm run images:analyze

# WebP/AVIF 変換確認
npm run images:formats

# 遅延読み込み確認
npm run images:lazy-loading
```

#### 2. 画像CDN設定

```javascript
// next.config.mjs
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'cdn.sanity.io',
    }
  ],
  formats: ['image/webp', 'image/avif'],
  minimumCacheTTL: 31536000,
}
```

## セキュリティ管理

### 1. 定期セキュリティチェック

#### 依存関係の脆弱性

```bash
# npm audit
npm audit --audit-level=moderate

# 自動修正
npm audit fix

# 手動確認が必要な場合
npm audit --json | jq '.vulnerabilities'
```

#### セキュリティヘッダー

```bash
# ヘッダー確認
curl -I https://suptia.com | grep -E "(X-Frame-Options|X-Content-Type-Options|CSP)"

# セキュリティスコア確認
npm run security:score
```

### 2. CSP（Content Security Policy）管理

#### CSP 違反の監視

```bash
# CSP レポート確認
npm run csp:reports

# 違反の分析
npm run csp:analyze

# CSP 設定の更新
# middleware.ts で設定
```

#### 許可ドメインの管理

```javascript
// 許可されたドメイン
const allowedDomains = [
  'cdn.sanity.io',
  'images.unsplash.com',
  'vitals.vercel-insights.com',
];
```

### 3. API セキュリティ

#### レート制限

```bash
# API 使用量確認
npm run api:usage

# レート制限設定確認
npm run api:rate-limits

# 異常なアクセスの検出
npm run api:anomaly-detection
```

#### 認証・認可

```bash
# API トークンの確認
echo $SANITY_API_TOKEN | wc -c

# トークンの権限確認
curl -H "Authorization: Bearer $SANITY_API_TOKEN" \
  "https://your-project-id.api.sanity.io/v2021-03-25/users/me"
```

## 監視・アラート

### 1. アラート設定

#### パフォーマンスアラート

```yaml
# .github/workflows/performance-alert.yml
- name: Performance Alert
  if: steps.lighthouse.outputs.performance < 90
  uses: actions/github-script@v6
  with:
    script: |
      github.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: 'Performance Alert: Score below 90',
        body: 'Lighthouse performance score is below threshold'
      })
```

#### エラーアラート

```bash
# Sentry アラート設定
# Project Settings > Alerts > New Alert Rule

# Vercel アラート設定
# Project Settings > Notifications
```

### 2. ダッシュボード

#### パフォーマンスダッシュボード

- **Vercel Analytics**: リアルタイムメトリクス
- **Google Analytics**: ユーザー行動分析
- **Lighthouse CI**: 継続的パフォーマンス監視

#### エラーダッシュボード

- **Sentry**: エラー追跡・分析
- **Vercel Functions**: サーバーレス関数のログ
- **GitHub Actions**: CI/CD パイプラインの状況

## バックアップ・復旧

### 1. データバックアップ

#### Sanity データ

```bash
# 日次バックアップ
sanity dataset export production backup-daily-$(date +%Y%m%d).tar.gz

# 週次バックアップ
sanity dataset export production backup-weekly-$(date +%Y%W).tar.gz

# 月次バックアップ
sanity dataset export production backup-monthly-$(date +%Y%m).tar.gz
```

#### 設定ファイル

```bash
# Git タグによるバックアップ
git tag backup-$(date +%Y%m%d)
git push origin --tags

# 設定ファイルのアーカイブ
tar -czf config-backup-$(date +%Y%m%d).tar.gz \
  next.config.mjs \
  vercel.json \
  .env.local.example
```

### 2. 復旧手順

#### データ復旧

```bash
# Sanity データの復旧
sanity dataset import backup-20250126.tar.gz production --replace

# 設定の復旧
git checkout backup-20250126
```

#### サービス復旧

```bash
# 緊急ロールバック
npx vercel rollback

# 段階的復旧
git revert HEAD
git push origin master
```

## 運用メトリクス

### 1. KPI（重要業績評価指標）

#### パフォーマンス KPI

- **Lighthouse Score**: 90+ 維持
- **Core Web Vitals**: 全て Good 範囲
- **Uptime**: 99.9% 以上
- **TTFB**: 200ms 以下

#### ビジネス KPI

- **月間アクティブユーザー**: 成長率
- **検索成功率**: 検索→結果表示の成功率
- **コンバージョン率**: 検索→商品詳細→外部サイト
- **ページビュー**: 主要ページの閲覧数

### 2. レポート作成

#### 週次レポート

```bash
# パフォーマンスレポート
npm run report:performance:weekly

# エラーレポート
npm run report:errors:weekly

# 使用量レポート
npm run report:usage:weekly
```

#### 月次レポート

```bash
# 総合レポート
npm run report:monthly

# ビジネスメトリクス
npm run report:business:monthly

# 技術メトリクス
npm run report:technical:monthly
```

## チェックリスト

### 日次チェック

- [ ] サイト稼働確認
- [ ] エラーログ確認
- [ ] パフォーマンス確認
- [ ] コンテンツ更新確認

### 週次チェック

- [ ] Lighthouse 監査
- [ ] セキュリティチェック
- [ ] データ品質確認
- [ ] バックアップ確認

### 月次チェック

- [ ] 依存関係更新
- [ ] パフォーマンス分析
- [ ] セキュリティ監査
- [ ] 運用メトリクス分析

## 連絡先・エスカレーション

### 運用チーム

- **開発者**: [your-email@example.com]
- **運用責任者**: [ops@example.com]

### 外部サポート

- **Vercel サポート**: https://vercel.com/support
- **Sanity サポート**: https://www.sanity.io/support
- **緊急時**: [emergency@example.com]

---

**最終更新**: 2025年1月26日
**バージョン**: 1.0.0
