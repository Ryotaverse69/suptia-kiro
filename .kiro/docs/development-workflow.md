# 開発ワークフロー

## 概要

このプロジェクトでは、**master/dev 2ブランチ体制**を採用しています。

- **master**: 本番デプロイ専用
- **dev**: 開発作業用（常設）

## 日常の開発フロー

### 1. 開発環境のセットアップ

```bash
# リポジトリをクローン
git clone https://github.com/Ryotaverse69/suptia-kiro.git
cd suptia-kiro

# devブランチに切り替え
git switch dev

# 依存関係をインストール
cd apps/web
pnpm install
```

### 2. 開発作業

```bash
# 最新の状態に更新
git pull origin dev

# 開発作業を実施
# - コード修正
# - テスト追加
# - ドキュメント更新

# 変更をコミット
git add .
git commit -m "feat: 新機能の実装"

# devブランチにプッシュ
git push origin dev
```

### 3. Preview環境での確認

devブランチにプッシュすると、Vercel Previewが自動的にデプロイされます。

- **Preview URL**: `https://your-app-git-dev-your-team.vercel.app`
- **確認項目**:
  - 機能が正常に動作するか
  - デザインが意図通りか
  - パフォーマンスに問題がないか

### 4. 本番環境への反映

Preview環境で問題がないことを確認したら、PRを作成します。

```bash
# GitHub UIでPRを作成
# Base: master
# Compare: dev
```

**PR作成時のチェックリスト**:
- [ ] Preview環境で動作確認済み
- [ ] テストが通過している
- [ ] コードレビューが完了している
- [ ] 必要に応じてドキュメントを更新している

### 5. 自動デプロイ

PRがマージされると、masterブランチが自動的に本番環境にデプロイされます。

## コミットメッセージ規約

### 基本形式

```
<type>: <description>

[optional body]

[optional footer]
```

### Type一覧

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント更新
- `style`: コードスタイル修正
- `refactor`: リファクタリング
- `perf`: パフォーマンス改善
- `test`: テスト追加・修正
- `chore`: 雑務・メンテナンス
- `ci`: CI設定変更

### 例

```bash
git commit -m "feat: ユーザー認証機能を追加"
git commit -m "fix: 価格計算のバグを修正"
git commit -m "docs: READMEにセットアップ手順を追加"
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. コミットが失敗する

```bash
# pre-commitフックをスキップ（緊急時のみ）
git commit --no-verify -m "your message"

# または Huskyを無効化
HUSKY=0 git commit -m "your message"
```

#### 2. devブランチが古い

```bash
# masterの最新を取り込み
git switch dev
git pull origin master
git push origin dev
```

#### 3. コンフリクトが発生

```bash
# コンフリクトを確認
git status

# ファイルを手動で修正後
git add .
git commit -m "resolve: merge conflict"
git push origin dev
```

#### 4. 間違ったブランチにコミット

```bash
# 最後のコミットを取り消し（ローカルのみ）
git reset --soft HEAD~1

# 正しいブランチに切り替えてコミット
git switch dev
git commit -m "your message"
```

## 品質チェック

### ローカルでの事前チェック

```bash
# フォーマット確認
pnpm run format:check

# リント確認
pnpm run lint

# 型チェック
pnpm run typecheck

# テスト実行
pnpm run test

# ビルド確認
pnpm run build
```

### CI/CDでの自動チェック

PRを作成すると、以下のチェックが自動実行されます：

- **format**: コードフォーマット確認
- **lint**: ESLint実行
- **test**: テスト実行
- **typecheck**: TypeScript型チェック
- **build**: ビルド確認
- **headers**: HTTPヘッダー確認
- **jsonld**: JSON-LD検証
- **pr-dod-check**: Definition of Done確認

## デプロイ環境

### Preview環境（dev）

- **URL**: `https://your-app-git-dev-your-team.vercel.app`
- **用途**: 開発中の機能確認
- **更新**: devブランチへのpush時

### 本番環境（master）

- **URL**: `https://suptia.com`
- **用途**: 本番サービス
- **更新**: masterブランチへのmerge時

## 緊急時の対応

### 本番環境に問題が発生した場合

1. **即座に開発を停止**
2. **devブランチで緊急修正**:
   ```bash
   git switch dev
   # 修正作業
   git commit -m "hotfix: 緊急修正"
   git push origin dev
   ```
3. **緊急PRを作成**（dev → master）
4. **レビュー・マージ後、自動デプロイ**

### ロールバックが必要な場合

```bash
# 前のコミットに戻す
git switch master
git revert HEAD
git push origin master
```

## 参考リンク

- [Git運用ルール](.kiro/steering/git-operation-rules.md)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)