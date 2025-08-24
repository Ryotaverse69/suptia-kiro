# メトリクス監視システム

Suptiaプロジェクトでは、CI/CDパイプラインとデプロイメントの品質を継続的に監視するためのメトリクス収集システムを導入しています。

## 概要

メトリクス監視システムは以下の3つの主要コンポーネントで構成されています：

1. **CI/CDメトリクス** - GitHub Actionsワークフローの実行時間と成功率
2. **デプロイメントメトリクス** - Vercelデプロイメントの成功率とパフォーマンス
3. **Pre-commitメトリクス** - ローカル開発環境でのコミット前チェック

## 利用可能なコマンド

### 基本コマンド

```bash
# 全メトリクスのサマリー表示
npm run metrics:summary

# 詳細ダッシュボード表示
npm run metrics:dashboard

# 全メトリクス分析実行
npm run metrics:all
```

### 個別メトリクス

```bash
# CI/CDメトリクス分析
npm run ci:metrics

# デプロイメントメトリクス分析
npm run deploy:metrics

# Pre-commitメトリクス表示
npm run commit:metrics
```

### メトリクス収集

```bash
# CI/CDメトリクス手動収集
npm run ci:metrics:collect

# デプロイメントメトリクス手動収集（レポート付き）
npm run deploy:metrics
```

## メトリクスの種類

### 1. CI/CDメトリクス

**収集データ:**

- ワークフロー実行時間
- ジョブ別実行時間
- 成功/失敗率
- テストカバレッジ
- ビルド時間

**保存場所:** `.git/ci-metrics/`

**自動収集タイミング:**

- GitHub Actionsワークフロー完了時
- 手動実行: `npm run ci:metrics:collect`

### 2. デプロイメントメトリクス

**収集データ:**

- デプロイ成功率（環境別）
- 平均ビルド時間
- 平均デプロイ時間
- 失敗パターン分析
- パフォーマンス統計

**保存場所:** `.git/deployment-metrics/`

**自動収集タイミング:**

- 本番デプロイ完了時
- 手動実行: `npm run deploy:metrics`

### 3. Pre-commitメトリクス

**収集データ:**

- 各チェックステップの実行時間
- 成功/失敗状況
- エラーパターン
- パフォーマンストレンド

**保存場所:** `.git/hooks-metrics/`

**自動収集タイミング:**

- 各コミット前（pre-commitフック実行時）

## ダッシュボードの見方

### メトリクスサマリー

```bash
npm run metrics:summary
```

各メトリクスの最新状況を簡潔に表示します：

- 🔧 **Pre-commit**: 最新のコミット前チェック結果
- 🚀 **CI/CD**: ワークフロー成功率（最新10回）
- 🎯 **デプロイ**: デプロイ成功率

### 詳細ダッシュボード

```bash
npm run metrics:dashboard
```

以下の情報を詳細に表示します：

- **CI/CDパフォーマンス**: 成功率、ジョブ実行時間統計
- **デプロイメントパフォーマンス**: 環境別成功率、平均実行時間
- **アラート & アクションアイテム**: 問題の検出と改善提案
- **利用可能なコマンド**: 詳細分析用のコマンド一覧

## アラートとしきい値

### 成功率のしきい値

- **優良**: 95%以上 ✅
- **警告**: 85-95% ⚠️
- **危険**: 85%未満 ❌

### 実行時間のしきい値

**CI/CDジョブ:**

- **優良**: 2分未満 ✅
- **警告**: 2-5分 ⚠️
- **危険**: 5分以上 ❌

**デプロイメント:**

- **ビルド時間**: 5分以上で警告
- **デプロイ時間**: 10分以上で警告

## 自動化された監視

### GitHub Actions統合

CI/CDワークフローでは以下が自動実行されます：

1. **メトリクス収集** (`collect-ci-metrics` ジョブ)
2. **分析レポート生成** (masterブランチのみ)
3. **GitHubコメント投稿** (メトリクスサマリー)

### アラート通知

以下の条件でアラートが発生します：

- ワークフロー成功率が90%を下回る
- デプロイ成功率が95%を下回る
- 本番環境デプロイ成功率が98%を下回る
- ジョブ実行時間が5分を超える
- 最近のデプロイ失敗が3件を超える

## トラブルシューティング

### メトリクスが表示されない

```bash
# メトリクスディレクトリの確認
ls -la .git/ci-metrics/
ls -la .git/deployment-metrics/
ls -la .git/hooks-metrics/

# 手動でメトリクス収集を実行
npm run ci:metrics:collect
npm run deploy:metrics
```

### 古いメトリクスデータのクリーンアップ

メトリクスファイルは自動的にクリーンアップされます：

- **CI/CDメトリクス**: 最新50件を保持
- **デプロイメントメトリクス**: 最新30件を保持
- **Pre-commitメトリクス**: 最新10件を保持

### パフォーマンス問題の調査

```bash
# 詳細な分析レポート生成
npm run ci:metrics -- --limit 100
npm run deploy:metrics

# 問題診断ツール実行
npm run diagnose:all
```

## 設定とカスタマイズ

### 環境変数

メトリクス収集には以下の環境変数が必要です：

```bash
# GitHub Actions (自動設定)
GITHUB_TOKEN=<token>
GITHUB_REPOSITORY=<owner/repo>
GITHUB_RUN_ID=<run_id>

# Vercel (Secretsで設定)
VERCEL_TOKEN=<token>
VERCEL_PROJECT_ID=<project_id>

# Slack通知 (オプション)
SLACK_WEBHOOK_URL=<webhook_url>
```

### メトリクス収集の無効化

緊急時にメトリクス収集を無効化する場合：

```bash
# 環境変数で無効化
export DISABLE_METRICS=true

# または個別のスクリプトをスキップ
export SKIP_CI_METRICS=true
export SKIP_DEPLOYMENT_METRICS=true
```

## ベストプラクティス

### 定期的な監視

- **毎日**: `npm run metrics:summary` で状況確認
- **毎週**: `npm run metrics:dashboard` で詳細分析
- **問題発生時**: `npm run diagnose:all` で原因調査

### パフォーマンス最適化

1. **実行時間の長いジョブを特定**

   ```bash
   npm run ci:metrics | grep "平均実行時間"
   ```

2. **失敗パターンの分析**

   ```bash
   npm run deploy:metrics | grep "最近の失敗"
   ```

3. **トレンド分析**
   ```bash
   npm run ci:metrics -- --limit 50
   ```

### アラート対応

アラートが発生した場合の対応手順：

1. **即座の対応**: 問題の影響範囲を確認
2. **根本原因分析**: ログとメトリクスを詳細分析
3. **修正実装**: 問題の修正とテスト
4. **予防策実装**: 同様の問題の再発防止

## 関連ドキュメント

- [開発ワークフロー](./DEVELOPMENT_WORKFLOW.md)
- [トラブルシューティング](./TROUBLESHOOTING.md)
- [CI/CD設定](../.github/workflows/ci.yml)
