---
inclusion: always
---

# MCP使用ガイドライン

## 概要

個人開発に最適化されたMCP（Model Context Protocol）の運用ガイドラインです。
開発効率を向上させつつ、本番環境への影響を最小限に抑える設定を採用しています。

## 自動承認ポリシー

### 基本方針
- **日常的な安全な操作**: 自動承認で開発効率を向上
- **本番影響がある操作**: 手動承認必須でリスクを回避

### サーバー別設定

#### 🟢 自動承認（autoApprove: ["*"]）

##### filesystem
- **対象**: ローカルファイルシステム操作
- **理由**: 本番環境に影響せず、ログ分析・メトリクス収集等で頻繁に使用
- **操作例**: 
  - ファイル読み取り・書き込み
  - ディレクトリ作成・削除
  - ログファイル分析
  - レポート生成

##### vercel-mcp
- **対象**: Vercel REST API連携（読み取り系操作）
- **理由**: 読み取り専用の監視・情報取得操作で本番環境に影響なし
- **自動承認操作**:
  - `listDeployments` - デプロイメント一覧取得
  - `getDeployment` - デプロイメント詳細取得
  - `getProject` - プロジェクト情報取得
  - `listDomains` - ドメイン一覧取得
  - `envList` - 環境変数一覧取得
- **手動承認操作**:
  - `addDomain` - ドメイン追加（本番影響あり）
  - `envSet` - 環境変数設定（本番影響あり）

#### 🟡 部分自動承認

##### web-search
- **自動承認対象**: 
  - `search` - 基本検索
  - `web_search` - Web検索
  - `search_with_sources` - 出典付き検索
  - `get_page_content` - ページコンテンツ取得
- **理由**: 情報収集系は読み取り専用で安全
- **用途**: 
  - 成分ガイド記事作成
  - 最新研究・市場動向調査
  - 薬事法規制情報確認

#### 🔴 手動承認必須（autoApprove: []）

##### github
- **理由**: リポジトリ変更は本番環境に直接影響
- **危険操作例**:
  - `delete_file` - ファイル削除
  - `force_push` - 強制プッシュ
  - `reset_hard` - ハードリセット
  - `delete_branch` - ブランチ削除
  - `update_secrets` - シークレット更新
- **承認が必要な操作**:
  - コミット・プッシュ
  - ブランチ操作
  - PR作成・マージ
  - ワークフロー実行

##### sanity-dev
- **理由**: CMS更新は本番コンテンツに直接影響
- **危険操作例**:
  - `delete_dataset` - データセット削除
  - `discard_version` - バージョン破棄
  - `mark_version_for_unpublish` - 非公開マーク
- **承認が必要な操作**:
  - ドキュメント作成・更新・削除
  - リリース管理
  - データセット操作

## セキュリティ制限

### ドメイン制限
許可されたドメインのみアクセス可能：
- `*.sanity.io` - Sanity CMS
- `*.suptia.com` - 自社ドメイン
- `api.vercel.com` - Vercel REST API
- `localhost`, `127.0.0.1` - 開発環境

### 禁止ドメイン
以下のドメインは明示的に禁止：
- `bit.ly`, `tinyurl.com` - 短縮URL
- `goo.gl`, `t.co` - リダイレクトサービス

## 運用ベストプラクティス

### 開発時の効率化
1. **ローカル作業**: filesystem操作は自動承認で迅速に実行
2. **情報収集**: web-search操作は自動承認で効率的にリサーチ
3. **Vercel監視**: vercel-mcp読み取り系操作は自動承認で即座に確認

### 本番環境の安全性
1. **GitHub操作**: すべて手動承認でコードレビュー機会を確保
2. **Sanity操作**: すべて手動承認でコンテンツ変更を慎重に実行
3. **変更履歴**: 承認プロセスにより変更の意図と影響を明確化

### 承認時の確認事項

#### GitHub操作承認時
- [ ] 変更内容が意図通りか
- [ ] 本番環境への影響範囲
- [ ] ロールバック手順の確認
- [ ] テスト実行結果

#### Sanity操作承認時
- [ ] コンテンツ変更の妥当性
- [ ] 公開タイミングの適切性
- [ ] バックアップの存在確認
- [ ] 関連コンテンツへの影響

#### Vercel操作承認時（addDomain/envSet）
- [ ] 変更内容が意図通りか
- [ ] 本番環境への影響範囲
- [ ] DNS設定の確認
- [ ] 環境変数の機密性確認

## トラブルシューティング

### 自動承認が機能しない場合
1. `.kiro/settings/mcp.json`の設定確認
2. MCPサーバーの再起動
3. Kiro IDEの再起動

### 手動承認が頻繁に発生する場合
1. 操作内容の見直し（本当に本番影響があるか）
2. autoApproveリストへの追加検討
3. 操作の分割（安全な部分と危険な部分を分離）

## 設定変更履歴

- 2025-01-26: Vercel運用完全自動化
  - analytics: 削除（パッケージ存在しないため）
  - vercel-mcp: 無効化（代替としてVercel CLI使用）
  - Vercel CLI自動化スクリプト追加
    - `scripts/vercel-operations.mjs`: 基本操作
    - `scripts/vercel-dashboard.mjs`: 高度な監視・分析
    - `.github/workflows/vercel-monitoring.yml`: 自動監視
  - api.vercel.com: ドメイン許可リストに追加

- 2025-01-25: 個人開発最適化設定に変更
  - filesystem: 全操作自動承認
  - web-search: 情報収集系自動承認
  - github/sanity: 手動承認維持

## 関連ドキュメント

- [セキュリティガイドライン](.kiro/steering/security.md)
- [Git運用ルール](.kiro/steering/git-operation-rules.md)
- [MCP設定ファイル](.kiro/settings/mcp.json)
## V
ercel運用自動化

### 利用可能なコマンド

#### 基本操作
```bash
npm run vercel:health        # ヘルスチェック
npm run vercel:deployments  # デプロイメント一覧
npm run vercel:domains       # ドメイン一覧
npm run vercel:env           # 環境変数一覧
npm run vercel:status        # 全体監視
```

#### 高度な分析
```bash
npm run vercel:dashboard     # 包括的ダッシュボード
npm run vercel:security      # セキュリティ分析
npm run vercel:watch         # 継続監視モード
```

### 自動監視

- **GitHub Actions**: 毎日午前9時に自動実行
- **レポート生成**: `.kiro/reports/` に保存
- **問題検出時**: 自動でIssue作成

### 推奨運用フロー

1. **日次確認**: `npm run vercel:dashboard`
2. **デプロイ前**: `npm run vercel:health`
3. **問題発生時**: `npm run vercel:security`
4. **継続監視**: `npm run vercel:watch`