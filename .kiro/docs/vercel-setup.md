# Vercel設定ガイド

## 概要

このプロジェクトでは、Vercelを使用して以下の環境を自動デプロイしています：

- **本番環境**: masterブランチ → `https://suptia.com`
- **Preview環境**: devブランチ → `https://your-app-git-dev-your-team.vercel.app`

## 初期設定

### 1. Vercelプロジェクトの作成

```bash
# Vercel CLIをインストール
npm i -g vercel

# プロジェクトをVercelに接続
vercel

# 設定を確認
vercel env ls
```

### 2. ブランチ設定

Vercelダッシュボードで以下を設定：

#### Production Branch

- **Branch**: `master`
- **Domain**: `suptia.com`
- **Auto Deploy**: ✅ Enabled

#### Preview Branch

- **Branch**: `dev`
- **Domain**: `your-app-git-dev-your-team.vercel.app`
- **Auto Deploy**: ✅ Enabled

### 3. 環境変数の設定

#### Production環境

```bash
# 本番用の環境変数を設定
vercel env add NEXT_PUBLIC_SANITY_PROJECT_ID production
vercel env add NEXT_PUBLIC_SANITY_DATASET production
vercel env add NEXT_PUBLIC_SITE_URL production
vercel env add SANITY_API_TOKEN production
vercel env add SANITY_API_VERSION production
```

#### Preview環境

```bash
# Preview用の環境変数を設定
vercel env add NEXT_PUBLIC_SANITY_PROJECT_ID preview
vercel env add NEXT_PUBLIC_SANITY_DATASET preview
vercel env add NEXT_PUBLIC_SITE_URL preview
vercel env add SANITY_API_TOKEN preview
vercel env add SANITY_API_VERSION preview
```

## デプロイフロー

### 自動デプロイ

#### 本番環境（master）

```bash
# PRをマージすると自動デプロイ
git switch dev
# 開発作業...
git push origin dev
# GitHub UIでPR作成: dev → master
# マージ後、自動的に本番環境にデプロイ
```

#### Preview環境（dev）

```bash
# devにプッシュすると自動デプロイ
git switch dev
git add .
git commit -m "feat: 新機能追加"
git push origin dev
# 自動的にPreview環境にデプロイ
```

### 手動デプロイ

```bash
# 本番環境に手動デプロイ
vercel --prod

# Preview環境に手動デプロイ
vercel
```

## 環境変数同期

### 自動チェック機能

プロジェクトには環境変数の同期をチェックする自動化機能が組み込まれています：

```bash
# ローカルで環境変数同期をチェック
npm run env:check

# CI環境で環境変数同期をチェック
npm run env:check:ci
```

### 同期チェックの内容

1. **ローカル環境**: `.env.local` と `.env.local.example` の同期確認
2. **CI環境**: 必須環境変数の存在確認
3. **Vercel環境**: Production/Preview環境の設定検証

### Production vs Preview 環境変数設定

#### Production環境の設定例

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=abc123def
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SITE_URL=https://suptia.com
SANITY_API_TOKEN=sk_production_token_here
SANITY_API_VERSION=2023-05-03
```

#### Preview環境の設定例

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=abc123def
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SITE_URL=https://your-app-git-dev-your-team.vercel.app
SANITY_API_TOKEN=sk_preview_token_here
SANITY_API_VERSION=2023-05-03
```

### 重要な注意点

- **NEXT_PUBLIC_SITE_URL**: Production では `suptia.com`、Preview では `vercel.app` ドメインを使用
- **SANITY_API_TOKEN**: Production と Preview で異なるトークンを使用することを推奨
- **プレースホルダー値**: `demo`, `your-project-id` などの値は本番環境では使用禁止

## 環境変数一覧

### 必須環境変数

| 変数名                          | 説明                 | Production例         | Preview例                             |
| ------------------------------- | -------------------- | -------------------- | ------------------------------------- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | SanityプロジェクトID | `abc123def`          | `abc123def`                           |
| `NEXT_PUBLIC_SANITY_DATASET`    | Sanityデータセット   | `production`         | `production`                          |
| `NEXT_PUBLIC_SITE_URL`          | サイトURL            | `https://suptia.com` | `https://app-git-dev-team.vercel.app` |
| `SANITY_API_TOKEN`              | Sanity APIトークン   | `sk_prod_...`        | `sk_preview_...`                      |
| `SANITY_API_VERSION`            | Sanity APIバージョン | `2023-05-03`         | `2023-05-03`                          |

### オプション環境変数

| 変数名              | 説明              | 例                      |
| ------------------- | ----------------- | ----------------------- |
| `SANITY_STUDIO_URL` | Sanity Studio URL | `http://localhost:3333` |

## ビルド設定

### vercel.json

```json
{
  "buildCommand": "cd apps/web && pnpm run build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["nrt1"],
  "functions": {
    "apps/web/src/app/api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## トラブルシューティング

### よくある問題

#### 1. ビルドエラー

```bash
# ローカルでビルドを確認
cd apps/web
pnpm run build

# 型エラーの確認
pnpm run typecheck

# リントエラーの確認
pnpm run lint
```

#### 2. 環境変数が反映されない

```bash
# 環境変数を確認
vercel env ls

# 環境変数を再設定
vercel env rm VARIABLE_NAME
vercel env add VARIABLE_NAME

# 環境変数同期チェックを実行
npm run env:check

# CI環境での環境変数チェック
npm run env:check:ci
```

#### 5. 環境変数同期エラー

```bash
# ローカル環境変数の同期確認
npm run env:check

# .env.local.example と .env.local の差分確認
diff apps/web/.env.local.example apps/web/.env.local

# 不足している環境変数を .env.local に追加
cp apps/web/.env.local.example apps/web/.env.local
# 実際の値に編集

# Vercel環境での環境変数確認
vercel env ls
```

#### 6. Production/Preview環境の設定ミス

```bash
# Production環境の環境変数確認
vercel env ls --environment production

# Preview環境の環境変数確認
vercel env ls --environment preview

# 環境別に正しい値を設定
vercel env add NEXT_PUBLIC_SITE_URL production
# Production: https://suptia.com

vercel env add NEXT_PUBLIC_SITE_URL preview
# Preview: https://your-app-git-dev-your-team.vercel.app
```

#### 3. デプロイが失敗する

```bash
# デプロイログを確認
vercel logs

# 手動でデプロイを試行
vercel --debug
```

#### 4. ドメイン設定の問題

```bash
# ドメインを確認
vercel domains ls

# ドメインを追加
vercel domains add suptia.com
```

## 監視とメトリクス

### パフォーマンス監視

- **Core Web Vitals**: Vercelダッシュボードで確認
- **Build Time**: デプロイ履歴で確認
- **Function Duration**: Functions タブで確認

### アラート設定

- **Build Failure**: Slack/Email通知
- **Performance Degradation**: しきい値アラート
- **Error Rate**: エラー率監視

## セキュリティ設定

### Headers設定

```javascript
// next.config.js
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
];
```

### CSP設定

```javascript
// Content Security Policy
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-scripts.com;
  child-src *.youtube.com *.google.com *.twitter.com;
  style-src 'self' 'unsafe-inline' *.googleapis.com;
  img-src * blob: data:;
  media-src 'none';
  connect-src *;
  font-src 'self' *.googleapis.com *.gstatic.com;
`;
```

## 参考リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
