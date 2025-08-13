# セキュリティガイド

## セキュリティヘッダー

### 自動配信ヘッダー
アプリケーションは `next.config.mjs` で以下のセキュリティヘッダーを自動配信：

```
Content-Security-Policy: default-src 'self'; img-src 'self' https://cdn.sanity.io data:; connect-src 'self' https://*.sanity.io; style-src 'self' 'unsafe-inline'; font-src 'self' data:; script-src 'self'; upgrade-insecure-requests
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 開発環境での調整
開発環境では `script-src 'unsafe-eval'` が自動追加されます。

## 環境変数管理

### 公開変数（NEXT_PUBLIC_*）
クライアントバンドルに含まれる変数：
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`

### 秘密変数
サーバーのみで利用される変数：
- `SANITY_API_TOKEN`
- その他の認証情報

### 検証機能
- 起動時の環境変数検証（`src/env.ts`）
- 同期チェック（`scripts/check-env-sync.mjs`）
- プレースホルダー値の検出

## API セキュリティ

### 入力検証
- Zodスキーマによる型安全な検証
- サニタイゼーション処理
- エラー情報の適切な隠蔽

### Rate Limiting
- IP単位のトークンバケット方式
- 設定可能なレート制限
- 429ステータスでの適切な応答

### 実装例
```typescript
import { withValidation, withRateLimit } from '@/lib/validate';
import { ProductQuerySchema } from '@/lib/validate';

export const GET = withRateLimit('api', 
  withValidation(ProductQuerySchema, async (req, data) => {
    // 検証済みデータでの処理
  })
);
```

## XSS対策

### Portable Text サニタイゼーション
- 許可リストベースのブロック/マーク制限
- HTMLインジェクション防止
- リンク定義の除去

### Slug正規化
- kebab-case強制
- 無効文字の除去
- 重複チェック機能

## Sanity クライアント分離

### 公開クライアント（sanityPublic.ts）
- トークンなし
- CDN有効
- 公開コンテンツのみ

### サーバークライアント（sanityServer.ts）
- server-only制限
- トークン利用可能
- プレビュー/ドラフト対応

## 監査とモニタリング

### 自動チェック
- npm audit（CI/CD）
- Semgrep静的解析
- 環境変数同期チェック

### 手動確認項目
- [ ] クライアントバンドルにトークンが含まれていない
- [ ] セキュリティヘッダーが正しく配信されている
- [ ] Rate limitが適切に動作している
- [ ] 入力検証が機能している

## インシデント対応

### 緊急時の手順
1. 影響範囲の特定
2. 一時的な機能停止
3. 根本原因の調査
4. 修正とテスト
5. 段階的な復旧

### 報告先
- セキュリティ問題: security@suptia.com
- 一般的な問題: support@suptia.com

## 定期的な見直し

### 月次チェック項目
- [ ] 依存関係の脆弱性確認
- [ ] セキュリティヘッダーの検証
- [ ] アクセスログの確認
- [ ] 環境変数の棚卸し

### 四半期チェック項目
- [ ] セキュリティポリシーの見直し
- [ ] 侵入テストの実施
- [ ] 災害復旧計画の確認