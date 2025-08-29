---
inclusion: always
---

# MCP使用ガイドライン

## 概要

個人開発に最適化されたMCP（Model Context Protocol）の運用ガイドラインです。
開発効率を向上させつつ、本番環境への影響を最小限に抑える設定を採用しています。

## 個人開発最適化方針

### 基本理念
**「最大限自動化、ただし本番影響は手動承認」**

個人開発では開発速度が重要ですが、本番環境への影響は慎重に管理する必要があります。
この方針により、日常的な開発作業を効率化しつつ、リスクを最小限に抑えます。

### 自動承認対象（Trust不要）
- **filesystem**: ローカルファイル操作全般
  - レポート生成、ログ分析、テストファイル作成
  - 設定ファイル更新、ドキュメント作成
- **fetch**: 許可ドメインへの読み取りAPI
  - Sanity CMS、自社API、GitHub API（読み取り）
  - npm registry、開発環境API
- **brave-search/web-search**: 情報収集
  - 技術調査、市場分析、競合調査
  - 最新情報収集、ドキュメント参照

### 手動承認対象（Trust必須）
- **github**: リポジトリ変更
  - コミット・プッシュ、ブランチ操作
  - PR作成・マージ、設定変更
- **sanity-dev**: 本番CMS変更
  - コンテンツ作成・更新・削除
  - リリース管理、データセット操作
- **インフラ操作**: デプロイ・設定変更
  - ドメイン追加、環境変数設定
  - デプロイメント実行

### 監査ログ方針
- 自動承認操作も `.kiro/reports/` に要約ログを記録
- 直近100件の操作履歴を保持
- 問題発生時の追跡可能性を確保

## 自動承認ポリシー（最大効率版）

### 基本方針
- **最大限自動化**: 個人開発の効率を最優先
- **削除系操作のみ手動承認**: 本番破壊リスクのみを厳格管理
- **その他全操作自動承認**: Trustダイアログを最小化

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
  - テストファイル作成・実行
  - 設定ファイル更新

##### fetch
- **対象**: ドメインホワイトリスト内のAPI呼び出し
- **理由**: 許可されたドメインのみアクセス可能で安全
- **操作例**:
  - `*.sanity.io` - Sanity API呼び出し
  - `*.suptia.com` - 自社API呼び出し
  - `localhost`, `127.0.0.1` - 開発環境API
- **セキュリティ**: ドメインホワイトリストで制限済み

##### analytics（無効化中）
- **対象**: 分析・監視系操作
- **理由**: 読み取り専用の分析は本番環境に影響なし
- **操作例**:
  - パフォーマンス分析
  - ユーザー行動分析
  - エラー監視
  - メトリクス収集

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

##### brave-search
- **自動承認対象**: 
  - `brave_web_search` - Web検索
  - `brave_local_search` - ローカル検索
- **理由**: 情報収集系は読み取り専用で安全、開発・調査効率を向上
- **用途**: 
  - 成分ガイド記事作成
  - 最新研究・市場動向調査
  - 薬事法規制情報確認
  - 技術情報収集
  - 競合分析

##### web-search（無効化中）
- **自動承認対象**: 
  - `search` - 基本検索
  - `web_search` - Web検索
  - `search_with_sources` - 出典付き検索
  - `get_page_content` - ページコンテンツ取得
- **理由**: 情報収集系は読み取り専用で安全

#### 🟢 全操作自動承認（autoApprove: ["*"]）

##### github
- **対象**: 全GitHub操作（削除系除く）
- **理由**: 個人開発では開発速度を最優先
- **自動承認操作**:
  - コミット・プッシュ
  - ブランチ作成・切り替え
  - PR作成・マージ
  - ワークフロー実行
  - ファイル作成・更新
- **手動承認維持**:
  - `delete_file` - ファイル削除
  - `delete_repository` - リポジトリ削除
  - `delete_branch` - ブランチ削除
  - `force_push` - 強制プッシュ

##### sanity-dev
- **対象**: 全Sanity操作（削除系除く）
- **理由**: コンテンツ作成・更新の効率化
- **自動承認操作**:
  - ドキュメント作成・更新
  - リリース作成・公開
  - データセット操作（削除除く）
  - クエリ実行
- **手動承認維持**:
  - `delete_dataset` - データセット削除
  - `discard_version` - バージョン破棄
  - `document_action:delete` - ドキュメント削除
  - `release_action:delete` - リリース削除

##### vercel-mcp
- **対象**: 全Vercel操作（削除系除く）
- **理由**: デプロイ・監視の完全自動化
- **自動承認操作**:
  - デプロイメント実行・監視
  - 環境変数設定・取得
  - ドメイン追加・設定
  - プロジェクト管理
- **手動承認維持**:
  - `removeDomain` - ドメイン削除
  - `deleteProject` - プロジェクト削除
  - `envRemove` - 環境変数削除

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

- 2025-08-27: MCP自動承認「最大効率版」実装
  - 全MCPサーバーを `autoApprove: ["*"]` に設定
  - 削除系操作のみ手動承認を維持（本番破壊リスク対策）
  - Trustダイアログは削除系操作時のみ表示
  - 開発効率を最大化、煩わしさを最小化
  - 監査ログを `.kiro/reports/` に自動記録

- 2025-08-27: MCP自動承認最適化（個人開発効率化）v2
  - 個人開発最適化方針を明文化
  - fetch: 許可ドメインを拡張（github.com, api.github.com, registry.npmjs.org追加）
  - 監査ログ方針を追加（.kiro/reports/への自動記録）
  - セキュリティ運用ルールを明確化

- 2025-08-27: MCP自動承認最適化（個人開発効率化）
  - filesystem: 全操作自動承認（`["*"]`）- ローカルファイル操作の完全自動化
  - brave-search: 検索系自動承認（`["brave_web_search", "brave_local_search"]`）
  - fetch: 全API呼び出し自動承認（`["*"]`）- ドメインホワイトリスト内のみ
  - analytics: 全監視操作自動承認（`["*"]`）- 読み取り専用分析
  - github: 手動承認必須（`[]`）- 本番リポジトリ保護
  - sanity-dev: 手動承認必須（`[]`）- 本番CMS保護
  - 目的: 日常開発フローの煩わしさを削減、本番影響操作は厳格に管理

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