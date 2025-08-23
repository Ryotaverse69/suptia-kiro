---
inclusion: always
---

# Git運用ルール

## 基本原則: Master一本化

### 1. 本番ブランチ
- **master** が唯一の本番ブランチ
- 常に本番環境にデプロイ可能な状態を維持
- ブランチ保護設定と必須チェックを適用

### 2. 作業ブランチパターン
すべての開発作業は以下のパターンの作業ブランチで実施：

- `feat/機能名` - 新機能開発
- `feature/機能名` - 新機能開発（別名）
- `chore/作業名` - 雑務・メンテナンス
- `fix/修正名` - バグ修正
- `hotfix/修正名` - 緊急修正
- `bugfix/修正名` - バグ修正（別名）
- `docs/文書名` - ドキュメント更新
- `style/スタイル名` - コードスタイル修正
- `refactor/リファクタ名` - リファクタリング
- `perf/パフォーマンス名` - パフォーマンス改善
- `test/テスト名` - テスト追加・修正
- `build/ビルド名` - ビルドシステム変更
- `ci/CI名` - CI設定変更

### 3. ワークフロー

#### 開発フロー
1. masterから作業ブランチを作成
2. 作業ブランチで開発・コミット
3. PRを作成してmasterへマージ申請
4. レビュー・CI通過後にマージ
5. **作業ブランチは自動削除**

#### 自動クリーンアップ
- PRマージ後、作業ブランチは自動的に削除される
- GitHub設定で「Automatically delete head branches」を有効化
- さらに `Auto Branch Cleanup` ワークフローが確実に削除を実行

## 自動化システム

### Auto Branch Cleanup Workflow
- **トリガー**: PR がmasterにマージされた時
- **対象**: 標準的な作業ブランチパターン（feat/, chore/, fix/ など）
- **動作**:
  1. masterブランチを最新化
  2. マージされた作業ブランチをリモートから削除
  3. 不要なリファレンスをクリーンアップ
  4. 実行レポートを生成

### Branch Cleanup Automation (Legacy)
- **対象**: 特定ブランチ（chore/checkpoint-commit）
- **用途**: 特別なクリーンアップタスク

## 期待される状態

### 理想的なリポジトリ状態
- **リモートブランチ**: masterのみ
- **ローカルブランチ**: 開発者の現在作業中ブランチのみ
- **履歴**: 線形で追跡可能な履歴

### 禁止事項
- masterへの直接プッシュ（保護ルールで防止）
- 長期間残存する作業ブランチ
- 命名規則に従わないブランチ

## トラブルシューティング

### 作業ブランチが残存している場合
1. 手動削除:
   ```bash
   git push origin --delete ブランチ名
   ```

2. ローカルクリーンアップ:
   ```bash
   git branch -D ブランチ名
   git fetch --prune
   ```

3. 自動クリーンアップの確認:
   - GitHub Actions の `Auto Branch Cleanup` ログを確認
   - `.kiro/reports/` の実行レポートを確認

### 緊急時の対応
- masterブランチに問題がある場合は、直ちに開発を停止
- 最新の安定したコミットから hotfix ブランチを作成
- 修正後、緊急PRでmasterに統合

## 設定確認項目

### GitHub リポジトリ設定
- [ ] Branch protection rules for master
- [ ] Require pull request reviews
- [ ] Require status checks to pass
- [ ] Automatically delete head branches: ✅ Enabled

### ワークフロー設定
- [ ] `Auto Branch Cleanup` workflow enabled
- [ ] `Branch Cleanup Automation` workflow enabled
- [ ] CI workflows configured for master protection

## 利点

### 開発効率
- シンプルで理解しやすいブランチ戦略
- 自動化によるメンテナンス負荷軽減
- 常にクリーンなリポジトリ状態

### 品質保証
- masterブランチの品質保証
- 必須チェックによる品質ゲート
- 履歴の追跡可能性

### 運用安定性
- 本番環境との一対一対応
- 予測可能なデプロイフロー
- 緊急対応時の明確な手順