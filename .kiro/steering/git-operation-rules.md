# Git運用ルール

## 概要

個人開発に最適化した、シンプルかつ安全なGit運用を維持する。

## ブランチ構成

### 基本方針
- ブランチ構成は **master / dev の2本のみ**
- 複雑なfeatureブランチは作成しない
- シンプルで迅速な開発フローを重視

### ブランチの役割

| ブランチ | 用途 | デプロイ先 | 直接Push | 保護ルール |
|----------|------|------------|----------|------------|
| `master` | 本番環境 | Production (Vercel) | ❌ 禁止 | ✅ 有効 |
| `dev` | 開発環境 | Preview (Vercel) | ✅ 許可 | ❌ なし |

## masterブランチ保護ルール

### 必須チェック項目
masterブランチへのマージ時に必須となるチェック：

1. **build** - アプリケーションのビルド成功
2. **test** - 単体テストの実行成功

### 簡素化された設定
- ✅ **squash merge強制** - コミット履歴をクリーンに保つ
- ❌ **PR承認不要** - 個人開発のため承認プロセスを省略
- ❌ **複数チェック不要** - build/test以外のチェックは任意
- ❌ **管理者制限なし** - 個人開発のため制限を緩和

### 除外されたチェック項目
以下のチェックは任意実行（失敗してもマージ可能）：
- format:check
- lint
- typecheck
- headers
- jsonld
- pr-dod-check

## 開発フロー

### 日常の開発作業

```bash
# 1. devブランチで直接作業
git switch dev

# 2. コード修正・コミット
git add .
git commit -m "feat: 新機能を追加"

# 3. devブランチにプッシュ
git push origin dev
# → Vercel Previewが自動生成される

# 4. 動作確認後、PR作成
# GitHub UI: dev → master のPR作成

# 5. CI/CDチェック実行
# → build/testが成功すれば自動マージ

# 6. 本番デプロイ
# → masterブランチに自動デプロイ
```

### devブランチの運用

```bash
# ✅ 推奨: devブランチで直接作業
git switch dev
git add .
git commit -m "fix: バグ修正"
git push origin dev

# ❌ 非推奨: 不要なfeatureブランチ作成
git switch -c feature/new-feature  # 避ける
```

## CI/CD設定

### 必須チェックの設定
GitHub Settings > Branches > master で以下を設定：

```yaml
# 必須ステータスチェック
required_status_checks:
  strict: true
  contexts:
    - "build"
    - "test"

# マージ設定
allow_squash_merge: true
allow_merge_commit: false
allow_rebase_merge: false

# PR設定
required_reviews:
  required_approving_review_count: 0  # 承認不要
```

### ワークフロー実行条件

```yaml
# すべてのチェックを実行（情報提供目的）
on:
  push:
    branches: [master, dev]
  pull_request:
    branches: [master]

# 必須チェックのみ失敗時にマージブロック
required_checks:
  - build
  - test
```

## セキュリティ考慮事項

### 最小限の保護
- masterブランチへの直接pushは禁止
- build/testの成功を必須とする
- squash mergeによりコミット履歴をクリーンに保つ

### 個人開発での簡素化
- PR承認プロセスを省略（開発速度優先）
- 複数チェックを任意化（必要最小限のみ必須）
- 管理者制限を緩和（個人開発のため）

## 緊急時の対応

### 本番環境で問題が発生した場合

```bash
# 1. 即座にロールバック
npm run rollback:production

# 2. devブランチで修正
git switch dev
# 修正作業...
git push origin dev

# 3. 緊急PR作成・マージ
# GitHub UI: dev → master (緊急PR)
# build/testが成功すれば即座にマージ・デプロイ
```

### hotfixの場合

```bash
# 緊急修正もdevブランチで実施
git switch dev
git pull origin master  # 最新のmasterを取得
# 修正作業...
git commit -m "hotfix: 緊急修正"
git push origin dev
# PR作成 → 自動マージ → 本番デプロイ
```

## ベストプラクティス

### コミットメッセージ
```bash
# 良い例
git commit -m "feat: ユーザー認証機能を追加"
git commit -m "fix: 価格計算のバグを修正"
git commit -m "docs: READMEを更新"

# 避けるべき例
git commit -m "update"
git commit -m "fix"
git commit -m "WIP"
```

### PR作成時
- タイトル: 簡潔で分かりやすく
- 説明: 変更内容と影響範囲を記載
- build/testが成功すれば自動マージされることを理解

### 品質管理
- ローカルでのテスト実行を推奨
- devブランチでの動作確認を必須
- Preview環境での最終確認

## 運用メトリクス

### 成功指標
- PR作成からマージまでの時間短縮
- ビルド/テスト成功率の維持
- 本番デプロイの安定性

### 監視項目
- build/testの失敗率
- masterブランチの安定性
- デプロイメント頻度

---

**重要**: この運用ルールは個人開発に最適化されています。チーム開発に移行する場合は、承認プロセスや追加チェックの導入を検討してください。