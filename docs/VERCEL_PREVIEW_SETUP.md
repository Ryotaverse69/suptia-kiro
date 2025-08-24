# Vercel Preview 確実取得システム

## 概要

devプッシュでVercel Previewが確実に出る仕組みを実装しました。この文書では、実装内容と使用方法について説明します。

## 問題の特定

### 診断結果

診断スクリプト（`scripts/diagnose-vercel-preview.mjs`）により以下の問題が特定されました：

1. **基本的なCI.ymlにPreview URL取得ジョブがない**
2. **GitHub SecretsでVERCEL_TOKENとVERCEL_PROJECT_IDの設定が必要**

## 実装した解決策

### 1. 専用ワークフロー作成

**ファイル**: `.github/workflows/vercel-preview.yml`

- **dev ブランチプッシュ時**: 確実にPreview URLを取得
- **PR作成/更新時**: Preview URLを自動コメント
- **失敗時診断**: 自動的に問題を診断し、Issue作成
- **Preview検証**: URLの応答確認とヘルスチェック

### 2. 確実取得スクリプト

**ファイル**: `scripts/ensure-vercel-preview.mjs`

**機能**:

- 既存デプロイメントの検索
- 見つからない場合の新規デプロイメントトリガー
- デプロイメント完了の待機（最大10分）
- PRへの自動コメント投稿
- 詳細なログ出力

### 3. 診断スクリプト

**ファイル**: `scripts/diagnose-vercel-preview.mjs`

**診断項目**:

- Vercel設定ファイル（vercel.json）
- GitHub Actions設定
- 環境変数
- Git設定
- Vercel API接続テスト

### 4. Vercel設定最適化

**ファイル**: `vercel.json`

**改善点**:

- dev ブランチのデプロイ有効化
- GitHub通知有効化
- ビルドコマンド最適化
- 適切なディレクトリ設定

**ファイル**: `.vercelignore`

**除外設定**:

- 不要なファイルをデプロイから除外
- ビルド時間短縮
- デプロイサイズ最適化

### 5. 基本CI統合

**ファイル**: `.github/workflows/ci.yml`

**追加機能**:

- dev ブランチプッシュ時のPreview取得
- PR作成時のPreview コメント
- 品質チェック後の実行

## 使用方法

### 必要な設定

#### GitHub Secrets

以下のSecretsをGitHubリポジトリに設定してください：

```
VERCEL_TOKEN=your_vercel_token_here
VERCEL_PROJECT_ID=your_project_id_here
```

**VERCEL_TOKEN取得方法**:

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. Settings → Tokens
3. "Create Token" でトークン作成
4. 作成されたトークンをコピー

**VERCEL_PROJECT_ID確認方法**:

1. Vercel Dashboard でプロジェクトを選択
2. Settings → General
3. Project ID をコピー

### 利用可能なコマンド

```bash
# Preview URL確実取得
npm run preview:ensure

# 問題診断
npm run preview:diagnose

# Preview URL取得（既存）
npm run preview:get

# ワークフローテスト
npm run preview:test
```

### 自動実行トリガー

#### dev ブランチプッシュ時

```bash
git checkout dev
git add .
git commit -m "feat: new feature"
git push origin dev
```

→ 自動的にPreview URLが取得され、関連するPRにコメントされます

#### PR作成時

```bash
gh pr create --title "New Feature" --body "Description"
```

→ 自動的にPreview URLがPRにコメントされます

## ワークフロー詳細

### dev-preview ジョブ

1. **既存デプロイメント検索**: コミットSHAでデプロイメントを検索
2. **新規デプロイメントトリガー**: 見つからない場合は新規作成
3. **完了待機**: デプロイメントが完了するまで最大10分待機
4. **PR コメント**: 関連するPRにPreview URLをコメント
5. **結果保存**: 結果をアーティファクトとして保存

### pr-preview ジョブ

1. **待機**: Vercelの自動デプロイを60秒待機
2. **Preview取得**: 確実取得スクリプトを実行
3. **PR コメント**: Preview URLをPRにコメント
4. **結果保存**: 結果をアーティファクトとして保存

### preview-validation ジョブ

1. **URL応答確認**: Preview URLにアクセス可能か確認
2. **コンテンツ確認**: 期待されるコンテンツが含まれているか確認
3. **ヘルスチェック**: レスポンス時間とステータスコード確認

### preview-diagnosis ジョブ（失敗時）

1. **問題診断**: 診断スクリプトを実行
2. **レポート保存**: 診断結果をアーティファクトとして保存
3. **Issue作成**: 繰り返し失敗時に自動でIssue作成

## トラブルシューティング

### よくある問題

#### 1. Preview URLが取得できない

**原因**:

- VERCEL_TOKEN が設定されていない
- VERCEL_PROJECT_ID が間違っている
- Vercel プロジェクトでGitHub連携が設定されていない

**解決方法**:

```bash
npm run preview:diagnose
```

#### 2. デプロイメントが失敗する

**原因**:

- ビルドエラー
- 環境変数の不足
- 依存関係の問題

**解決方法**:

1. Vercel Dashboard でエラーログを確認
2. ローカルでビルドテスト: `npm run build`
3. 環境変数設定を確認

#### 3. PRにコメントされない

**原因**:

- GITHUB_TOKEN の権限不足
- PR が dev ブランチからではない

**解決方法**:

1. GitHub Actions の権限設定を確認
2. dev ブランチから PR を作成

### 診断コマンド

```bash
# 包括的な診断
npm run preview:diagnose

# ワークフロー設定テスト
npm run preview:test

# 手動でPreview取得テスト
VERCEL_TOKEN=your_token VERCEL_PROJECT_ID=your_id GITHUB_SHA=$(git rev-parse HEAD) npm run preview:ensure
```

## 監視とメンテナンス

### 定期チェック項目

1. **月次**: Vercel Token の有効期限確認
2. **週次**: Preview 成功率の確認
3. **日次**: 失敗時のIssue確認

### メトリクス

- Preview 取得成功率
- デプロイメント完了時間
- エラー発生頻度

### アラート

- 連続3回失敗時に自動Issue作成
- デプロイメント時間が10分超過時に警告
- API レート制限到達時に通知

## 今後の改善案

### 短期（1-2週間）

- [ ] Preview URL のパフォーマンステスト自動化
- [ ] Slack 通知機能追加
- [ ] デプロイメント履歴の可視化

### 中期（1-2ヶ月）

- [ ] 複数環境（staging, production）対応
- [ ] A/B テスト用Preview URL生成
- [ ] 自動的なPreview環境クリーンアップ

### 長期（3-6ヶ月）

- [ ] Preview環境での自動E2Eテスト
- [ ] Visual Regression Testing
- [ ] Preview環境のコスト最適化

## 関連ファイル

### 設定ファイル

- `vercel.json` - Vercel プロジェクト設定
- `.vercelignore` - デプロイ除外設定

### ワークフロー

- `.github/workflows/vercel-preview.yml` - 専用Preview ワークフロー
- `.github/workflows/ci.yml` - 基本CI（Preview機能統合済み）

### スクリプト

- `scripts/ensure-vercel-preview.mjs` - 確実取得メインスクリプト
- `scripts/diagnose-vercel-preview.mjs` - 問題診断スクリプト
- `scripts/get-preview-url.mjs` - 基本取得スクリプト
- `scripts/test-vercel-preview-workflow.mjs` - ワークフローテストスクリプト

### ドキュメント

- `docs/VERCEL_PREVIEW_SETUP.md` - このドキュメント

---

_このドキュメントは実装完了時点での情報です。最新の情報は各ファイルを直接確認してください。_
