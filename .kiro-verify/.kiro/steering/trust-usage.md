# Trust承認ポリシー運用ガイド

## 概要

このガイドでは、Trust承認ポリシーシステムの運用方法について説明します。

## 設定ファイル

- **場所**: `.kiro/settings/trust-policy.json`
- **バックアップ**: `.kiro/backups/` に自動保存
- **デフォルト設定**: `.kiro/lib/trust-policy/default-policy.json`

## 基本的な使用方法

### 設定の確認
```bash
cat .kiro/settings/trust-policy.json
```

### 設定の初期化
```bash
node .kiro/scripts/init-trust-policy.mjs
```

### バックアップからの復元
```bash
cp .kiro/backups/trust-policy.backup.YYYY-MM-DD.json .kiro/settings/trust-policy.json
```

## 設定項目の説明

### autoApprove（自動承認対象）
- **gitOperations**: 自動承認するGit操作
- **fileOperations**: 自動承認するファイル操作
- **cliOperations**: 自動承認するCLI操作
- **scriptExecution**: 自動承認するスクリプト実行

### manualApprove（手動承認対象）
- **deleteOperations**: 削除系操作（危険）
- **forceOperations**: 強制系操作（危険）
- **productionImpact**: 本番環境影響操作（危険）

### security（セキュリティ設定）
- **maxAutoApprovalPerHour**: 1時間あたりの最大自動承認数
- **suspiciousPatternDetection**: 不審パターン検出の有効/無効
- **logAllOperations**: 全操作ログ記録の有効/無効

## トラブルシューティング

### 設定ファイルが破損した場合
1. バックアップから復元
2. 初期化スクリプトを実行
3. デフォルト設定を適用

### 自動承認が機能しない場合
1. 設定ファイルの構文チェック
2. ログファイルの確認
3. キャッシュのクリア

## ベストプラクティス

1. **定期的なバックアップ**: 設定変更前は必ずバックアップを作成
2. **段階的な変更**: 大きな変更は段階的に適用
3. **ログの監視**: 自動承認の動作を定期的に確認
4. **セキュリティ設定の見直し**: 定期的にセキュリティ設定を確認

## 関連ファイル

- 設定ファイル: `.kiro/settings/trust-policy.json`
- ログファイル: `.kiro/reports/auto-trust-log-*.md`
- バックアップ: `.kiro/backups/trust-policy.backup.*.json`
