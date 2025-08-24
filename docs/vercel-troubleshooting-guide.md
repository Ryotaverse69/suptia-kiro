# Vercel本番デプロイ トラブルシューティングガイド

## 概要

このガイドでは、Vercelでの本番デプロイメントに関する一般的な問題と解決方法を説明します。

## 🚨 緊急時の対応手順

### 1. 本番サイトがダウンしている場合

```bash
# 1. 現在の状況を確認
node scripts/diagnose-vercel-project.mjs

# 2. 最新のデプロイメント状況を確認
vercel ls

# 3. 自動復旧を試行
node scripts/auto-recovery.mjs

# 4. 手動でのロールバック（必要に応じて）
vercel rollback [deployment-url]
```

### 2. カスタムドメインにアクセスできない場合

```bash
# 1. ドメイン設定を確認
node scripts/verify-custom-domain.mjs

# 2. DNS設定を確認
dig suptia.com
dig www.suptia.com

# 3. Vercelドメイン設定を確認
vercel domains ls
```

## 🔍 問題の診断手順

### ステップ1: 基本情報の収集

```bash
# プロジェクト情報の確認
vercel whoami
vercel ls

# 環境変数の確認
vercel env ls production

# Git状況の確認
git status
git log --oneline -5
```

### ステップ2: エンドツーエンドテストの実行

```bash
# 全体的な状況を把握
node scripts/e2e-deployment-test.mjs

# 詳細な診断
node scripts/diagnose-vercel-project.mjs --verbose
```

### ステップ3: 問題の特定

テスト結果に基づいて、以下のカテゴリーで問題を分類：

1. **デプロイメント問題** - ビルドエラー、設定問題
2. **ドメイン問題** - DNS設定、SSL証明書
3. **環境変数問題** - 不足、設定ミス
4. **パフォーマンス問題** - レスポンス時間、リソース使用量

## 🛠️ 一般的な問題と解決方法

### デプロイメント関連の問題

#### 問題: ビルドエラーが発生する

**症状**:
- デプロイメントが `Error` 状態になる
- ビルドログにエラーメッセージが表示される

**診断方法**:
```bash
# 最新のデプロイメントログを確認
vercel logs [deployment-url]

# ローカルでビルドテスト
cd apps/web
npm run build
```

**解決方法**:

1. **依存関係の問題**:
   ```bash
   # package-lock.jsonを削除して再インストール
   rm -rf node_modules package-lock.json
   npm install
   
   # または pnpm の場合
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

2. **TypeScript エラー**:
   ```bash
   # 型チェックを実行
   npm run typecheck
   
   # 型定義を更新
   npm install @types/node @types/react @types/react-dom --save-dev
   ```

3. **環境変数の問題**:
   ```bash
   # 必要な環境変数を確認・設定
   node scripts/verify-env-variables.mjs
   ```

#### 問題: monorepo設定でビルドが失敗する

**症状**:
- "Cannot find package" エラー
- モジュール解決エラー

**解決方法**:

1. **vercel.json の Root Directory 設定**:
   ```json
   {
     "version": 2,
     "framework": "nextjs",
     "buildCommand": "cd ../.. && npm run build",
     "outputDirectory": "apps/web/.next",
     "installCommand": "npm install"
   }
   ```

2. **Vercelダッシュボードでの設定**:
   - Root Directory: `apps/web`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### ドメイン関連の問題

#### 問題: カスタムドメインで404エラーが発生する

**症状**:
- `suptia.com` にアクセスすると404エラー
- Vercelの直接URLは正常に動作

**診断方法**:
```bash
# ドメイン設定の確認
node scripts/verify-custom-domain.mjs

# DNS設定の確認
dig suptia.com A
dig www.suptia.com CNAME

# HTTPヘッダーの確認
curl -I https://suptia.com
```

**解決方法**:

1. **ドメインがVercelに追加されていない場合**:
   ```bash
   # ドメインを追加（成功したデプロイメントが必要）
   vercel domains add suptia.com
   vercel domains add www.suptia.com
   ```

2. **DNS設定が正しくない場合**:
   - A Record: `76.76.19.61` (Vercel IP)
   - CNAME Record (www): `cname.vercel-dns.com`

3. **SSL証明書の問題**:
   - Vercelダッシュボードでドメイン設定を確認
   - 証明書の自動更新を待つ（最大24時間）

#### 問題: ドメインを追加できない

**症状**:
- "Your project's latest production deployment has errored" エラー

**解決方法**:
```bash
# 1. 成功する本番デプロイメントを作成
vercel --prod

# 2. デプロイメント成功後にドメインを追加
vercel domains add suptia.com
```

### 環境変数関連の問題

#### 問題: 環境変数が読み込まれない

**症状**:
- アプリケーションで環境変数が `undefined`
- Sanity接続エラー

**診断方法**:
```bash
# 環境変数の設定状況を確認
node scripts/verify-env-variables.mjs

# Vercelでの設定を確認
vercel env ls production
```

**解決方法**:

1. **必要な環境変数を設定**:
   ```bash
   # 本番環境に環境変数を追加
   vercel env add NEXT_PUBLIC_SANITY_PROJECT_ID production
   vercel env add NEXT_PUBLIC_SANITY_DATASET production
   vercel env add NEXT_PUBLIC_SITE_URL production
   vercel env add SANITY_API_VERSION production
   vercel env add SANITY_API_TOKEN production
   ```

2. **環境変数の値を確認**:
   - `NEXT_PUBLIC_*` 変数はクライアントサイドで利用可能
   - 機密情報は `NEXT_PUBLIC_` プレフィックスを付けない

### パフォーマンス関連の問題

#### 問題: サイトの読み込みが遅い

**診断方法**:
```bash
# パフォーマンステストを実行
node scripts/e2e-deployment-test.mjs

# 詳細な監視
node scripts/monitor-deployment.mjs
```

**解決方法**:

1. **画像最適化の確認**:
   - Next.js Image コンポーネントの使用
   - 適切な画像フォーマット（WebP等）

2. **バンドルサイズの最適化**:
   ```bash
   # バンドル分析
   npm run analyze
   
   # 不要な依存関係の削除
   npm uninstall [unused-package]
   ```

3. **CDN設定の確認**:
   - Vercelの自動CDN設定を確認
   - 静的アセットのキャッシュ設定

## 🔧 予防的メンテナンス

### 定期的な確認項目

1. **週次チェック**:
   ```bash
   # 全体的なヘルスチェック
   node scripts/e2e-deployment-test.mjs
   
   # デプロイメント履歴の確認
   vercel ls
   ```

2. **月次チェック**:
   ```bash
   # 依存関係の更新
   npm audit
   npm update
   
   # パフォーマンス監視
   node scripts/monitor-deployment.mjs --detailed
   ```

### 監視とアラート

1. **GitHub Actions での自動監視**:
   - `.github/workflows/health-check.yml` で定期実行
   - 問題検出時の自動通知

2. **外部監視サービスの活用**:
   - UptimeRobot等でのアップタイム監視
   - パフォーマンス監視ツールの導入

## 📞 エスカレーション手順

### レベル1: 自動復旧

```bash
# 自動復旧スクリプトを実行
node scripts/auto-recovery.mjs
```

### レベル2: 手動対応

1. このトラブルシューティングガイドに従って診断
2. 問題の特定と修正の実行
3. 修正後の動作確認

### レベル3: 外部サポート

1. **Vercelサポートへの連絡**:
   - Vercelダッシュボードからサポートチケットを作成
   - 問題の詳細とこれまでの対応履歴を添付

2. **GitHub Issueの作成**:
   - 自動復旧スクリプトが作成するIssueを確認
   - 追加情報があれば更新

## 📚 関連リソース

### 公式ドキュメント
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Sanity Documentation](https://www.sanity.io/docs)

### 内部ツール
- `scripts/diagnose-vercel-project.mjs` - 総合診断
- `scripts/e2e-deployment-test.mjs` - エンドツーエンドテスト
- `scripts/auto-recovery.mjs` - 自動復旧
- `scripts/verify-custom-domain.mjs` - ドメイン検証
- `scripts/monitor-deployment.mjs` - デプロイメント監視

### ダッシュボード
- [Vercelプロジェクト](https://vercel.com/ryotaverses-projects/suptia-kiro)
- [GitHub Actions](https://github.com/ryotaverse/suptia-kiro/actions)
- [Sanity Studio](https://suptia-kiro.sanity.studio)

## 🔄 継続的改善

### フィードバックループ

1. **問題の記録**: 発生した問題と解決方法を記録
2. **ガイドの更新**: 新しい問題や解決方法をガイドに追加
3. **自動化の改善**: 繰り返し発生する問題の自動化を検討

### メトリクス

- デプロイメント成功率
- 平均復旧時間（MTTR）
- アップタイム
- パフォーマンス指標

---

**最終更新**: 2025年8月24日  
**バージョン**: 1.0  
**作成者**: Kiro AI Assistant