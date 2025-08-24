# セキュリティ設定ガイド

## 概要

Suptiaプロジェクトにおけるセキュリティ設定の詳細ガイドです。自動化されたセキュリティチェック、シークレット管理、アクセス制御について説明します。

## 自動化されたセキュリティチェック

### 1. 依存関係スキャン

#### Dependabot設定

- **ファイル**: `.github/dependabot.yml`
- **実行頻度**: 毎週月曜日
- **対象**: npm依存関係、GitHub Actions

```yaml
# 主要設定
schedule:
  interval: "weekly"
  day: "monday"
  time: "09:00"
  timezone: "Asia/Tokyo"

# セキュリティアップデートの自動マージ
auto-merge:
  - match:
      dependency-type: "all"
      update-type: "security"
```

#### npm audit

- **実行**: CI/CDパイプライン内で自動実行
- **コマンド**: `pnpm audit --audit-level moderate`
- **閾値**: Critical/High レベルの脆弱性で失敗

### 2. コードスキャン

#### CodeQL分析

- **ファイル**: `.github/workflows/codeql.yml`
- **実行頻度**: 毎週火曜日 + プッシュ時
- **対象言語**: JavaScript, TypeScript

```yaml
# 分析設定
languages: ["javascript", "typescript"]
queries: security-extended,security-and-quality
```

#### 設定ファイル

- **ファイル**: `.github/codeql/codeql-config.yml`
- **除外パス**: テストファイル、ビルド成果物
- **クエリ**: セキュリティ拡張クエリを使用

### 3. シークレットスキャン

#### GitHub Secret Scanning

- **自動有効**: GitHubリポジトリで自動的に有効
- **対象**: 既知のシークレットパターン
- **通知**: プッシュ時に自動検出

#### カスタムシークレットスキャン

- **ツール**: Secretlint
- **実行**: CI/CDパイプライン内
- **設定**: `.secretlintrc.json`で設定

```json
{
  "rules": [
    {
      "id": "@secretlint/secretlint-rule-preset-recommend"
    }
  ]
}
```

### 4. ライセンスコンプライアンス

#### 許可ライセンス

```
MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause,
ISC, 0BSD, Unlicense, CC0-1.0
```

#### チェック方法

- **ツール**: license-checker
- **実行**: セキュリティワークフロー内
- **失敗条件**: 許可されていないライセンスの検出

## シークレット管理

### 環境変数の分類

#### パブリック環境変数（NEXT*PUBLIC*\*）

```bash
# フロントエンドで使用可能
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SITE_URL=https://suptia.com
```

#### プライベート環境変数

```bash
# サーバーサイドのみ
SANITY_API_TOKEN=your-secret-token
DATABASE_URL=postgresql://...
```

### 環境別設定

#### 開発環境

- **ファイル**: `apps/web/.env.local`
- **Git追跡**: ❌ 除外
- **用途**: ローカル開発用の設定

#### プレビュー環境

- **管理**: Vercel環境変数
- **ブランチ**: `dev`
- **ドメイン**: `*.vercel.app`

#### 本番環境

- **管理**: Vercel環境変数
- **ブランチ**: `master`
- **ドメイン**: `suptia.com`

### GitHub Secrets

#### 必須シークレット

```yaml
VERCEL_TOKEN: Vercelデプロイ用トークン
SANITY_API_TOKEN: Sanity CMS APIトークン
SLACK_WEBHOOK_URL: 通知用Slack Webhook（オプション）
```

#### 設定方法

1. GitHubリポジトリの「Settings」→「Secrets and variables」→「Actions」
2. 「New repository secret」をクリック
3. シークレット名と値を入力

## アクセス制御

### ブランチ保護

#### masterブランチ

```yaml
protection_rules:
  required_status_checks:
    strict: true
    contexts:
      - "secrets-scan"
      - "quality-checks"
      - "test"
      - "build"
  required_pull_request_reviews:
    required_approving_review_count: 1
    dismiss_stale_reviews: true
  enforce_admins: true
  required_linear_history: true
  allow_force_pushes: false
```

#### devブランチ

- **直接プッシュ**: ✅ 許可
- **保護ルール**: なし
- **自動デプロイ**: Vercel Preview環境

### GitHub Actions権限

#### GITHUB_TOKEN権限

```yaml
permissions:
  actions: read
  contents: read
  security-events: write
  pull-requests: write
```

#### 最小権限の原則

- 各ジョブに必要最小限の権限のみ付与
- セキュリティ関連ジョブは`security-events: write`権限

## セキュリティ監視

### 自動監視

#### 日次チェック

- **セキュリティワークフロー**: 毎日午前3時（JST）
- **対象**: 依存関係、シークレット、ライセンス

#### 週次チェック

- **CodeQL分析**: 毎週火曜日午前2時（JST）
- **Dependabot**: 毎週月曜日午前9時（JST）

### 手動監視

#### セキュリティ監査スクリプト

```bash
# 包括的なセキュリティチェック
npm run security:audit

# 依存関係のみチェック
npm run security:deps

# すべてのセキュリティチェック
npm run security:all
```

#### 監査項目

1. 環境変数・シークレットセキュリティ
2. 依存関係脆弱性チェック
3. ライセンスコンプライアンス
4. セキュリティヘッダー設定
5. GitHub設定セキュリティ

## インシデント対応

### 脆弱性検出時の対応フロー

1. **自動検出**
   - CI/CDパイプラインでの自動失敗
   - GitHub Security Advisoriesでの通知
   - Dependabotによる自動PR作成

2. **手動対応**
   - 脆弱性の影響範囲確認
   - 修正版への更新
   - テストの実行
   - デプロイ

3. **事後対応**
   - インシデントレポートの作成
   - 再発防止策の実施
   - セキュリティ設定の見直し

### 緊急時の連絡先

- **セキュリティチーム**: security@suptia.com
- **開発チーム**: dev@suptia.com
- **GitHub Issues**: 緊急度に応じてラベル付け

## セキュリティベストプラクティス

### 開発時の注意点

#### ✅ 推奨事項

- 環境変数は`.env.local`で管理
- シークレットはハードコードしない
- 定期的な依存関係の更新
- セキュリティヘッダーの設定
- 入力値の適切なバリデーション

#### ❌ 避けるべき事項

- `.env`ファイルのGitコミット
- APIキーのコード内記述
- 古い依存関係の放置
- セキュリティチェックのスキップ
- 不適切な権限設定

### コードレビューでのチェックポイント

- [ ] 機密情報がハードコードされていない
- [ ] 新しい依存関係のセキュリティ確認
- [ ] 入力値のバリデーション実装
- [ ] エラーハンドリングの適切性
- [ ] セキュリティヘッダーの設定

## トラブルシューティング

### よくある問題と解決方法

#### 1. Dependabotが動作しない

```bash
# 設定ファイルの確認
cat .github/dependabot.yml

# 手動でのDependabot実行（GitHub UI）
# Settings > Security & analysis > Dependabot
```

#### 2. CodeQL分析が失敗する

```bash
# ビルドエラーの確認
cd apps/web && npm run build

# 設定ファイルの確認
cat .github/codeql/codeql-config.yml
```

#### 3. シークレットスキャンで誤検出

```bash
# .gitignoreの確認
cat .gitignore | grep -E '\.env'

# 追跡されているファイルの確認
git ls-files | grep -E '\.env'
```

#### 4. セキュリティ監査スクリプトのエラー

```bash
# 依存関係の確認
npm install

# 手動実行でのデバッグ
node scripts/security-audit.mjs --help
```

## 更新履歴

| 日付       | バージョン | 変更内容 |
| ---------- | ---------- | -------- |
| 2024-01-XX | 1.0        | 初版作成 |

---

**注意**: セキュリティ設定は定期的に見直し、最新の脅威に対応するよう更新してください。
