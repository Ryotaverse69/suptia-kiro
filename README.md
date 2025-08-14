# Suptia - サプリ意思決定エンジン MVP

安全性、価格、説明可能性を重視したサプリメント意思決定エンジンです。

## セットアップ

### 1. 依存関係のインストール

```bash
# ルートディレクトリで実行
npm install

# apps/webディレクトリで実行
cd apps/web
npm install
```

### 2. 環境変数の設定

```bash
# apps/webディレクトリで実行
cp .env.local.example .env.local
```

`.env.local`ファイルを編集して、SanityプロジェクトIDを設定してください。

### 3. MCP設定（Kiro IDE使用時）

```bash
# MCPテンプレートをコピー
cp .kiro/settings/mcp.json.template .kiro/settings/mcp.json
```

`.kiro/settings/mcp.json`ファイルを編集して、GitHub Personal Access Tokenを設定してください：

```json
{
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "your_github_pat_here"
  }
}
```

**注意**: このファイルは機密情報を含むため、Gitにコミットされません。

### 4. 開発サーバーの起動

```bash
# ルートディレクトリから実行
npm run dev

# または apps/webディレクトリから実行
cd apps/web
npm run dev
```

アプリケーションは http://localhost:3000 で起動します。

## リポジトリ設定の自動化

### Repository Bootstrap Script

リポジトリの設定（ブランチ保護、auto-merge、ラベル管理）を自動化するスクリプトが用意されています。

#### 使用方法

```bash
# GitHub CLIでの認証が必要
gh auth login

# スクリプトの実行
bash .tools/bootstrap_repo.sh OWNER REPO BRANCH

# 例: このリポジトリの場合
bash .tools/bootstrap_repo.sh Ryotaverse69 suptia-kiro master
```

#### スクリプトが実行する内容

1. **Auto-merge有効化**: リポジトリでauto-mergeを有効にします
2. **ラベル作成**: `automerge` ラベルを作成します
3. **ブランチ保護設定**: masterブランチに以下の保護ルールを適用：
   - 必須チェック: `format:check`, `lint`, `test`, `typecheck`, `build`, `headers`, `jsonld`
   - ブランチを最新に保つ: 有効
   - 会話の解決を必須: 有効
   - 線形履歴を必須: 有効
   - 強制プッシュ・削除を禁止: 有効
   - 承認は不要（個人開発用）
4. **PR管理**: PR #1, #2を以下のように処理：
   - Draft状態を解除（Ready for review）
   - `automerge` ラベルを適用
   - Auto-mergeを有効化
5. **ワークフロー再実行**: 失敗したワークフローがあれば再実行

#### 前提条件

- [GitHub CLI](https://cli.github.com/) がインストール済み
- GitHub CLIで認証済み（`gh auth login`）
- リポジトリへの管理者権限

## 利用可能なスクリプト

### ルートディレクトリから実行

- `npm run dev` - 開発サーバーを起動
- `npm run build` - プロダクションビルドを作成
- `npm run start` - プロダクションサーバーを起動
- `npm run test` - テストを実行
- `npm run test:watch` - ウォッチモードでテストを実行
- `npm run lint` - ESLintでコードをチェック
- `npm run format` - Prettierでコードをフォーマット
- `npm run type-check` - TypeScriptの型チェックを実行

### apps/webディレクトリから実行

同じスクリプトが利用可能です：

```bash
cd apps/web
npm run dev
npm run test
npm run lint
npm run format
```

## プロジェクト構造

```
├── .tools/                  # 開発・運用ツール
│   └── bootstrap_repo.sh    # リポジトリ設定自動化スクリプト
├── apps/
│   └── web/                 # Next.js アプリケーション
│       ├── src/
│       │   ├── app/         # Next.js App Router
│       │   ├── components/  # Reactコンポーネント
│       │   ├── lib/         # ユーティリティ関数
│       │   └── types/       # TypeScript型定義
│       └── package.json
├── packages/
│   └── schemas/             # Sanityスキーマ定義
└── package.json
```

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **CMS**: Sanity v3
- **テスト**: Vitest + Testing Library
- **リンティング**: ESLint + Prettier

## 主要機能

- 🔬 科学的エビデンスに基づく成分評価
- 💰 正確な価格比較（成分量正規化）
- ⚖️ 薬機法コンプライアンスチェック
- 🛡️ 安全性警告システム
- 📊 4要素スコア評価システム

## 開発ガイド

### テストの実行

```bash
# 全テストを実行
npm run test

# ウォッチモードで実行
npm run test:watch
```

### コード品質チェック

```bash
# リンティング
npm run lint

# フォーマット
npm run format

# 型チェック
npm run type-check
```

### ビルドとデプロイ

```bash
# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm run start
```

## ライセンス

MIT License