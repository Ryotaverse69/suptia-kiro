# Kiro ↔ Codex IDE 連携ワークフロー

## 概要

KiroでタスクとSpeccを作成し、Codex IDEで実装・コードチェックを行う統合ワークフローです。

## ワークフロー手順

### 1. Kiroでタスク作成・設計

```bash
# 1. Specの作成・更新
# .kiro/specs/project-name/ でタスク定義

# 2. タスクをCodex用にエクスポート
node scripts/export-tasks-for-codex.mjs
```

### 2. Codex IDEでの実装

```bash
# Codex IDEで以下を実行:

# 1. タスクファイルを読み込み
codex import .codex-tasks/

# 2. タスクを実行（例）
codex execute task-popular-search-cards

# 3. 結果を指定ディレクトリに出力
codex export-results .codex-results/
```

### 3. Kiroで結果取り込み・レビュー

```bash
# 1. Codex結果を取り込み
node scripts/import-codex-results.mjs

# 2. コードレビュー結果を確認
cat .kiro/reviews/codex-summary-*.json

# 3. 必要に応じて追加修正
```

## ファイル構造

```
project/
├── .kiro/
│   ├── specs/                    # Kiroタスク定義
│   ├── reviews/                  # コードレビュー結果
│   ├── tests/                    # テスト結果
│   └── workflows/                # ワークフロー定義
├── .codex-tasks/                 # Codex用タスクファイル
├── .codex-results/               # Codex実行結果
└── scripts/
    ├── export-tasks-for-codex.mjs
    └── import-codex-results.mjs
```

## タスクファイル形式

### Kiro → Codex (エクスポート)

```json
{
  "id": "popular-search-cards",
  "title": "4.1 人気商品セクション実装",
  "status": "not started",
  "type": "implementation",

  "instructions": {
    "summary": "トリバゴ風の人気検索カードを実装",
    "requirements": "### 2.4 人気検索カード...",
    "design": "## PopularSearchCards...",
    "acceptance_criteria": [
      "コンポーネントが正常にレンダリングされる",
      "レスポンシブデザインが適用されている"
    ],
    "files_to_modify": ["apps/web/src/components/*.tsx"]
  },

  "code_review": {
    "enabled": true,
    "checks": ["typescript_errors", "react_best_practices", "accessibility"]
  }
}
```

### Codex → Kiro (インポート)

```json
{
  "task_id": "popular-search-cards",
  "execution_status": "success",
  "generated_files": [
    {
      "path": "apps/web/src/components/PopularSearchCards.tsx",
      "content": "...",
      "type": "component"
    }
  ],

  "code_review": {
    "overall_score": 8.5,
    "issues": [
      {
        "type": "accessibility",
        "severity": "warning",
        "message": "alt属性が不足しています",
        "file": "PopularSearchCards.tsx",
        "line": 25
      }
    ],
    "suggestions": ["useMemoを使用してパフォーマンスを向上させることを推奨"]
  },

  "test_results": {
    "total": 12,
    "passed": 11,
    "failed": 1,
    "coverage": {
      "lines": 85.2,
      "functions": 90.0,
      "branches": 78.5
    }
  }
}
```

## コードチェック項目

### 自動チェック項目

1. **TypeScript**
   - 型エラーの検出
   - 未使用変数・インポート
   - 型安全性の確認

2. **React**
   - Hooks使用ルール
   - パフォーマンス最適化
   - コンポーネント設計

3. **アクセシビリティ**
   - ARIA属性
   - キーボードナビゲーション
   - セマンティックHTML

4. **パフォーマンス**
   - バンドルサイズ
   - レンダリング最適化
   - 画像最適化

5. **セキュリティ**
   - XSS対策
   - 入力値検証
   - 依存関係の脆弱性

### 手動レビュー項目

1. **設計品質**
   - コンポーネント分割
   - 状態管理
   - データフロー

2. **保守性**
   - コードの可読性
   - ドキュメント
   - テストカバレッジ

## 品質基準

### 合格基準

- TypeScriptエラー: 0件
- テスト成功率: 95%以上
- コードカバレッジ: 80%以上
- アクセシビリティスコア: 90%以上
- パフォーマンススコア: 85%以上

### 警告基準

- 重要度「error」の問題: 0件
- 重要度「warning」の問題: 5件以下
- セキュリティ問題: 0件

## トラブルシューティング

### よくある問題

1. **タスクエクスポートエラー**

   ```bash
   # 権限エラーの場合
   chmod +x scripts/export-tasks-for-codex.mjs

   # パス問題の場合
   ls -la .kiro/specs/
   ```

2. **Codex結果インポートエラー**

   ```bash
   # 結果ディレクトリが存在しない
   mkdir -p .codex-results

   # JSONフォーマットエラー
   cat .codex-results/*.json | jq .
   ```

3. **TypeScriptエラー**

   ```bash
   # 型チェック実行
   npx tsc --noEmit

   # 依存関係更新
   npm install
   ```

## 設定ファイル

### .gitignore 追加

```gitignore
# Codex連携ファイル
.codex-tasks/
.codex-results/
.kiro/reviews/
.kiro/tests/
*.backup.*
```

### package.json スクリプト追加

```json
{
  "scripts": {
    "codex:export": "node scripts/export-tasks-for-codex.mjs",
    "codex:import": "node scripts/import-codex-results.mjs",
    "codex:workflow": "npm run codex:export && echo 'Codex IDEでタスクを実行してください' && npm run codex:import"
  }
}
```

## 次のステップ

1. **Codex IDE設定**: タスクインポート・エクスポート機能の確認
2. **品質基準調整**: プロジェクト固有の基準設定
3. **自動化**: GitHub Actionsでの連携自動化
4. **監視**: 品質メトリクスの継続的な監視

---

この連携により、Kiroの設計力とCodex IDEの実装力を組み合わせた効率的な開発が可能になります。
