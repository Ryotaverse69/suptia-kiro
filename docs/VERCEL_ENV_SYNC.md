# Vercel 環境変数同期ガイド

## 概要

Suptiaプロジェクトでは、Production（本番）とPreview（プレビュー）環境で一貫した環境変数設定を維持する必要があります。このドキュメントでは、環境変数の同期方法と管理手順を説明します。

## 環境変数の構成

### 必須環境変数

以下の環境変数は両環境で設定が必要です：

#### Public Variables (NEXT*PUBLIC*\*)

- `NEXT_PUBLIC_SANITY_PROJECT_ID`: SanityプロジェクトID
- `NEXT_PUBLIC_SANITY_DATASET`: Sanityデータセット名
- `NEXT_PUBLIC_SITE_URL`: サイトのベースURL

#### Private Variables (Server-only)

- `SANITY_API_TOKEN`: Sanity API トークン（書き込み権限）
- `SANITY_API_VERSION`: Sanity API バージョン

#### Optional Variables

- `SANITY_STUDIO_URL`: Sanity Studio URL（開発環境のみ）
- `NEXT_PUBLIC_BASE_URL`: レガシー設定（将来削除予定）

## Vercel環境での設定

### Production環境

```bash
# Vercel CLI を使用した設定例
vercel env add NEXT_PUBLIC_SANITY_PROJECT_ID production
vercel env add NEXT_PUBLIC_SANITY_DATASET production
vercel env add NEXT_PUBLIC_SITE_URL production
vercel env add SANITY_API_TOKEN production
vercel env add SANITY_API_VERSION production
```

### Preview環境

```bash
# Preview環境用の設定
vercel env add NEXT_PUBLIC_SANITY_PROJECT_ID preview
vercel env add NEXT_PUBLIC_SANITY_DATASET preview
vercel env add NEXT_PUBLIC_SITE_URL preview
vercel env add SANITY_API_TOKEN preview
vercel env add SANITY_API_VERSION preview
```

## 環境変数の値の違い

### Production vs Preview

| 変数名                       | Production           | Preview                                 |
| ---------------------------- | -------------------- | --------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`       | `https://suptia.com` | `https://suptia-*-git-dev-*.vercel.app` |
| `NEXT_PUBLIC_SANITY_DATASET` | `production`         | `production` または `preview`           |
| その他                       | 本番用の値           | 開発/テスト用の値                       |

## 自動チェック機能

### CI/CDでの検証

GitHub Actionsワークフローで環境変数の整合性をチェック：

```yaml
- name: Check environment variable synchronization
  run: node scripts/check-env-sync.mjs
```

### ローカル開発での検証

```bash
# 環境変数の同期チェック
npm run env:check

# pre-commitフックで自動実行
git commit -m "your changes"
```

## トラブルシューティング

### よくある問題

#### 1. 環境変数が見つからない

```
❌ Missing required environment variables in CI:
   - NEXT_PUBLIC_SANITY_PROJECT_ID
```

**解決方法:**

1. Vercelダッシュボードで環境変数を確認
2. 必要に応じて環境変数を追加
3. デプロイを再実行

#### 2. Production/Preview間の不整合

```
⚠️ Environment variable mismatch between environments
```

**解決方法:**

1. 両環境で同じキーが設定されているか確認
2. 値が適切に設定されているか確認
3. 必要に応じて環境変数を更新

#### 3. ローカル開発環境の設定不備

```
⚠️ Warning: .env.local not found
```

**解決方法:**

1. `.env.local.example`を`.env.local`にコピー
2. 適切な値を設定
3. `npm run env:check`で確認

## ベストプラクティス

### セキュリティ

- 機密情報は`NEXT_PUBLIC_*`プレフィックスを使用しない
- APIトークンは適切な権限レベルで設定
- 定期的にトークンをローテーション

### 管理

- 環境変数の変更は両環境で同期
- `.env.local.example`を最新の状態に保持
- 不要な環境変数は定期的に削除

### 監視

- CI/CDでの自動チェックを活用
- デプロイ失敗時は環境変数を最初に確認
- 環境変数の変更履歴を記録

## 関連ファイル

- `apps/web/.env.local.example`: 環境変数のテンプレート
- `scripts/check-env-sync.mjs`: 環境変数同期チェックスクリプト
- `.github/workflows/ci.yml`: CI/CDパイプライン設定
- `vercel.json`: Vercelデプロイ設定

## 参考リンク

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Sanity API Tokens](https://www.sanity.io/docs/api-tokens)
