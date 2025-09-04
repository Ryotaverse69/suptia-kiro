# セキュリティインシデント対応ガイド

## 🚨 機密情報漏洩時の対応手順

### 即座に実行すべき対応

1. **トークン・キーの無効化**
   - Vercelダッシュボード > Settings > Tokens
   - 漏洩したトークンを即座に削除
   - 新しいトークンを生成

2. **Git履歴の確認**

   ```bash
   # 機密情報がコミットされていないか確認
   git log --oneline --grep="token\|key\|secret" -i
   git log -p --all -S "NuA9LvmzALZRCpv0Oa9bhAZQ"
   ```

3. **環境変数の再設定**
   - 本番環境の環境変数を更新
   - 開発環境の.env.vercelを更新
   - チームメンバーに新しいトークンを共有

### 予防策

1. **.gitignoreの徹底**

   ```
   .env.vercel
   .env.local
   *.key
   *.pem
   ```

2. **pre-commitフックの設定**

   ```bash
   # 機密情報の検出
   npm install --save-dev @commitlint/cli
   ```

3. **定期的なトークンローテーション**
   - 月1回のトークン更新
   - アクセスログの監視

## 📋 チェックリスト

- [ ] 漏洩したトークンの無効化
- [ ] 新しいトークンの生成
- [ ] .gitignoreの更新
- [ ] 環境変数の再設定
- [ ] チームへの通知
- [ ] インシデントログの記録

## 🔗 関連リンク

- [Vercel Token Management](https://vercel.com/account/tokens)
- [GitHub Secrets Management](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
