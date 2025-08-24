# Git ワークフロー - 個人開発最適化版

## 🎯 基本方針

**シンプル・高速・安全** な個人開発フローを実現

## 📋 クイックリファレンス

### ブランチ構成
```
master (本番) ← PR ← dev (開発)
```

### 日常フロー
```bash
git switch dev          # 開発ブランチに切り替え
# コード修正...
git add .
git commit -m "feat: 新機能"
git push origin dev     # → Preview デプロイ
# GitHub で PR 作成: dev → master
# build/test 成功 → 自動マージ → 本番デプロイ
```

## ✅ 必須チェック（マージブロック）

| チェック | 内容 |
|----------|------|
| **build** | アプリケーションビルド成功 |
| **test** | 単体テスト実行成功 |

## ⚠️ 任意チェック（情報提供）

| チェック | 内容 |
|----------|------|
| format:check | コードフォーマット |
| lint | ESLint 静的解析 |
| typecheck | TypeScript 型チェック |
| headers | セキュリティヘッダー |
| jsonld | 構造化データ検証 |

## 🚀 特徴

- ✅ **PR承認不要** - 個人開発のため
- ✅ **squash merge強制** - クリーンな履歴
- ✅ **最小限チェック** - build/testのみ必須
- ✅ **高速デプロイ** - 不要な待機時間なし

## 🔧 ローカル開発

```bash
# 必須チェックのみ（推奨）
npm run test
npm run build

# 全チェック実行
npm run precommit

# 自動修正
npm run format
npm run lint:fix
```

## 🆘 トラブルシューティング

### 必須チェック失敗時
```bash
npm run test    # テスト修正
npm run build   # ビルド修正
git push origin dev  # 再実行
```

### 任意チェック失敗時
```bash
npm run lint:fix     # 自動修正
npm run format       # フォーマット
# または、そのままマージ可能（任意のため）
```

## 📊 GitHub設定

### masterブランチ保護ルール
```yaml
required_status_checks:
  contexts: ["build", "test"]
allow_squash_merge: true
required_reviews: 0  # 承認不要
```

---

**💡 ポイント**: このワークフローは個人開発に最適化されています。チーム開発時は承認プロセスの追加を検討してください。