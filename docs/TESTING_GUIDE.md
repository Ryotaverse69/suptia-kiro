# テストガイド

## 概要

Suptia Git ワークフローの統合テストとエンドツーエンドテストの実行方法について説明します。

## テストの種類

### 1. 統合テスト・エンドツーエンドテスト

完全なGitワークフロー（dev → Preview → PR → master → 本番）をテストします。

```bash
# 統合テスト・E2Eテストの実行
npm run test:integration

# または直接実行
node scripts/test-integration-e2e.mjs
```

**テスト内容:**

- dev → Preview環境デプロイフローの検証
- PR → master → 本番デプロイフローの検証
- CI/CD パイプラインの設定確認
- エンドツーエンドワークフローの整合性チェック

### 2. Preview環境ワークフローテスト

dev ブランチから Preview 環境へのデプロイフローをテストします。

```bash
# Preview ワークフローテスト
npm run preview:test

# または直接実行
node scripts/test-preview-workflow.mjs
```

**テスト内容:**

- Vercel設定の確認
- GitHub Actions ワークフローの確認
- 必要なスクリプトファイルの存在確認
- Preview URL生成機能の確認

### 3. 本番デプロイメントテスト

本番環境へのデプロイフローをテストします。

```bash
# 本番デプロイテスト
npm run deploy:test

# または直接実行
node scripts/test-production-deployment.mjs
```

**テスト内容:**

- 本番デプロイメントの健全性チェック
- PR ワークフローの設定確認
- ブランチ保護設定の確認
- 通知機能のテスト

### 4. 全ワークフローテスト

すべてのワークフローテストを順次実行します。

```bash
# 全ワークフローテスト
npm run test:workflow
```

## 環境変数

テストの完全な機能を利用するには、以下の環境変数を設定してください：

### 必須環境変数

```bash
# Vercel API アクセス用
export VERCEL_TOKEN="your-vercel-token"

# GitHub API アクセス用
export GITHUB_TOKEN="your-github-token"
```

### オプション環境変数

```bash
# Vercel プロジェクトID（デフォルト値あり）
export VERCEL_PROJECT_ID="your-project-id"

# GitHub リポジトリ（自動検出）
export GITHUB_REPOSITORY="owner/repo-name"
```

## テスト結果

### 成功例

```
🎉 Integration and E2E tests completed successfully!
✅ The Suptia Git workflow is properly implemented and tested.

📊 Test Results Summary
========================
Total tests: 30
Passed: 29
Failed: 0
Skipped: 1
Duration: 2s
```

### 結果ファイル

テスト実行後、詳細な結果が以下のファイルに保存されます：

- `test-results-integration-e2e.json` - 統合・E2Eテスト結果

## CI/CD での実行

GitHub Actions では以下のタイミングで自動実行されます：

### Pull Request 時

```yaml
# .github/workflows/ci.yml
integration-e2e-tests:
  if: github.event_name == 'pull_request'
  needs: [format, lint, test, typecheck, build, headers, jsonld, env-sync]
```

### master ブランチ push 時

```yaml
# .github/workflows/ci.yml
integration-e2e-tests:
  if: github.ref == 'refs/heads/master' && github.event_name == 'push'
  needs: [format, lint, test, typecheck, build, headers, jsonld, env-sync]
```

## トラブルシューティング

### よくある問題

#### 1. 環境変数が設定されていない

**症状:**

```
⚠️ VERCEL_TOKEN is not set (will skip related tests)
⚠️ GITHUB_TOKEN is not set (will skip related tests)
```

**解決方法:**

- 必要な環境変数を設定してください
- 環境変数なしでも基本的な設定チェックは実行されます

#### 2. ブランチが正しくない

**症状:**

```
⚠️ Current branch is 'feature-branch', not 'dev'
```

**解決方法:**

```bash
git switch dev
```

#### 3. 未コミットの変更がある

**症状:**

```
⚠️ There are uncommitted changes
```

**解決方法:**

```bash
git add .
git commit -m "Test changes"
```

#### 4. GitHub Actions ワークフローが見つからない

**症状:**

```
❌ CI workflow missing
```

**解決方法:**

- `.github/workflows/ci.yml` ファイルが存在することを確認
- ワークフローの設定を確認

### デバッグモード

詳細なログを表示するには、環境変数を設定してください：

```bash
export DEBUG=true
npm run test:integration
```

## 手動テストフロー

自動テストに加えて、以下の手動テストも推奨します：

### 1. dev → Preview フロー

```bash
# 1. dev ブランチに切り替え
git switch dev

# 2. 変更を加える
echo "Test change" >> README.md

# 3. コミット・プッシュ
git add .
git commit -m "Test preview deployment"
git push origin dev

# 4. GitHub Actions で Preview URL が生成されることを確認
# 5. Preview URL にアクセスして動作確認
```

### 2. PR → 本番フロー

```bash
# 1. GitHub UI で dev → master の PR を作成
# 2. CI/CD チェックが全て通過することを確認
# 3. PR が自動マージされることを確認
# 4. 本番環境が自動デプロイされることを確認
```

## 継続的改善

テスト結果を基に、以下の改善を継続的に行ってください：

1. **成功率の監視**: 90%以上を維持
2. **実行時間の最適化**: 15分以内を目標
3. **新機能のテスト追加**: 機能追加時にテストも更新
4. **エラーパターンの分析**: 失敗パターンを分析して改善

## 関連ドキュメント

- [開発ワークフロー](./DEVELOPMENT_WORKFLOW.md)
- [トラブルシューティング](./TROUBLESHOOTING.md)
- [メトリクス](./METRICS.md)
