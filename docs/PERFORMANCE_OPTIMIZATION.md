# CI/CD パフォーマンス最適化ガイド

## 概要

このドキュメントでは、SuptiaプロジェクトのCI/CDパイプラインにおけるパフォーマンス最適化戦略について説明します。

## 最適化戦略

### 1. キャッシュ戦略

#### 依存関係キャッシュ

- **pnpmストア**: `~/.local/share/pnpm/store`
- **node_modules**: プロジェクト固有の依存関係
- **キャッシュキー**: lockfileハッシュ + Node.jsバージョン

```yaml
# 最適化されたキャッシュ設定例
- name: Cache dependencies
  uses: actions/cache@v4
  with:
    path: |
      ~/.local/share/pnpm/store
      apps/web/node_modules
      node_modules
    key: deps-v2-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      deps-v2-${{ runner.os }}-
      deps-v1-${{ runner.os }}-
```

#### ビルドキャッシュ

- **Next.jsキャッシュ**: `.next/cache`
- **TypeScriptキャッシュ**: `.tsbuildinfo`
- **ESLintキャッシュ**: `.eslintcache`

### 2. 並列実行最適化

#### ジョブレベル並列化

```yaml
strategy:
  fail-fast: false
  max-parallel: 4
  matrix:
    check: [format, lint, typecheck]
```

#### 最適な並列数

- **CPU数の80%**: `Math.floor(cpus().length * 0.8)`
- **GitHub Actions制限**: 最大4並列
- **メモリ使用量**: 各ジョブ最大4GB

### 3. タイムアウト最適化

#### ジョブ別タイムアウト設定

```yaml
jobs:
  setup:
    timeout-minutes: 6
  quality-checks:
    timeout-minutes: 8
  test:
    timeout-minutes: 8
  build:
    timeout-minutes: 10
  runtime-checks:
    timeout-minutes: 6
```

### 4. 条件付き実行

#### PR専用ジョブ

```yaml
pr-dod-check:
  if: github.event_name == 'pull_request'
```

#### 本番デプロイ専用ジョブ

```yaml
production-deployment:
  if: github.ref == 'refs/heads/master' && github.event_name == 'push'
```

## パフォーマンス監視

### 1. メトリクス収集

#### 自動収集項目

- ワークフロー実行時間
- ジョブ別実行時間
- キャッシュヒット率
- 成功/失敗率

#### 収集コマンド

```bash
# パフォーマンス最適化実行
npm run perf:optimize

# パフォーマンスレポート生成
npm run perf:report

# CI/CDメトリクス収集
npm run ci:metrics:collect
```

### 2. パフォーマンス閾値

#### 警告レベル

- **ワークフロー実行時間**: 15分以上
- **ジョブ実行時間**: 10分以上
- **キャッシュヒット率**: 80%未満
- **成功率**: 95%未満

#### 監視コマンド

```bash
# パフォーマンス監視
node scripts/performance-monitor.mjs

# JSON形式でレポート出力
node scripts/performance-monitor.mjs --json --output=perf-report.json
```

## 最適化技術

### 1. Node.js最適化

#### メモリ設定

```bash
export NODE_OPTIONS="--max-old-space-size=4096"
```

#### 並列処理

```bash
export NEXT_BUILD_WORKERS=4
```

### 2. pnpm最適化

#### インストール最適化

```bash
pnpm install --frozen-lockfile --prefer-offline --ignore-scripts
```

#### キャッシュ活用

```bash
pnpm install --offline  # キャッシュのみ使用
```

### 3. Next.js最適化

#### ビルド最適化

```bash
export NEXT_TELEMETRY_DISABLED=1
export NEXT_BUILD_WORKERS=4
```

#### 実験的機能

```javascript
// next.config.js
module.exports = {
  experimental: {
    buildMode: "compile",
  },
};
```

### 4. テスト最適化

#### Vitest設定

```bash
vitest run --reporter=basic --coverage=false
```

#### 並列実行

```javascript
// vitest.config.ts
export default {
  test: {
    pool: "threads",
    poolOptions: {
      threads: {
        maxThreads: 4,
      },
    },
  },
};
```

## トラブルシューティング

### 1. 遅いジョブの特定

#### 実行時間分析

```bash
# CI/CDメトリクス分析
npm run ci:metrics

# 詳細分析
node scripts/analyze-ci-metrics.mjs --limit 50
```

#### ボトルネック特定

1. **依存関係インストール**: キャッシュヒット率確認
2. **ビルド処理**: 並列化設定確認
3. **テスト実行**: テストファイル数確認
4. **型チェック**: インクリメンタル設定確認

### 2. キャッシュ問題の解決

#### キャッシュミス原因

- lockfileの変更
- Node.jsバージョン変更
- キャッシュキーの変更
- キャッシュ有効期限切れ

#### 対処法

```bash
# キャッシュクリーンアップ
npm run perf:cleanup

# 新しいキャッシュキー生成
# .github/workflows/ci-performance-optimized.yml の CI_CACHE_VERSION を更新
```

### 3. メモリ不足の対処

#### Node.jsメモリ増加

```yaml
env:
  NODE_OPTIONS: "--max-old-space-size=6144"
```

#### 並列数削減

```yaml
strategy:
  max-parallel: 2 # 4から2に削減
```

## ベストプラクティス

### 1. キャッシュ戦略

#### DO

- ✅ 安定したキャッシュキーを使用
- ✅ 複数レベルのrestore-keysを設定
- ✅ 適切なキャッシュ有効期限を設定
- ✅ キャッシュヒット率を監視

#### DON'T

- ❌ 頻繁に変更されるファイルをキーに含める
- ❌ 過度に長いキャッシュ有効期限
- ❌ 不要なファイルをキャッシュ対象に含める

### 2. 並列実行

#### DO

- ✅ 独立したジョブを並列実行
- ✅ 適切なfail-fast設定
- ✅ リソース使用量を考慮した並列数
- ✅ 依存関係を明確に定義

#### DON'T

- ❌ 過度な並列実行によるリソース競合
- ❌ 依存関係のあるジョブの並列実行
- ❌ 不適切なタイムアウト設定

### 3. 監視とアラート

#### DO

- ✅ 定期的なパフォーマンス監視
- ✅ 閾値ベースのアラート設定
- ✅ トレンド分析による予防的対応
- ✅ メトリクスの可視化

#### DON'T

- ❌ 監視データの蓄積なし
- ❌ 問題発生後の事後対応のみ
- ❌ 不適切な閾値設定

## 継続的改善

### 1. 定期レビュー

#### 週次レビュー

```bash
# 週次パフォーマンスレポート
npm run metrics:summary
```

#### 月次レビュー

```bash
# 月次詳細分析
npm run metrics:dashboard
```

### 2. 最適化サイクル

1. **測定**: 現在のパフォーマンス測定
2. **分析**: ボトルネック特定
3. **改善**: 最適化実装
4. **検証**: 改善効果確認
5. **監視**: 継続的な監視

### 3. 新技術の導入

#### 評価項目

- パフォーマンス向上効果
- 導入コスト
- 保守性への影響
- チーム学習コスト

## 参考資料

### GitHub Actions最適化

- [GitHub Actions: Caching dependencies](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [GitHub Actions: Best practices](https://docs.github.com/en/actions/learn-github-actions/security-hardening-for-github-actions)

### Next.js最適化

- [Next.js: Build Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Next.js: Compiler](https://nextjs.org/docs/advanced-features/compiler)

### pnpm最適化

- [pnpm: CLI Commands](https://pnpm.io/cli/install)
- [pnpm: Configuration](https://pnpm.io/npmrc)
