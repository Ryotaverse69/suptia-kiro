---
inclusion: always
priority: 1
---

# 日本語強制設定

## 基本方針

このプロジェクトでは**すべてのコミュニケーションを日本語で行う**ことを必須とします。

## 適用範囲

### 必須日本語対象
- ✅ **すべての回答・説明**
- ✅ **エラーメッセージ・警告**
- ✅ **ドキュメント・コメント**
- ✅ **ログメッセージ**
- ✅ **ユーザー向け説明**
- ✅ **システムメッセージ**
- ✅ **レポート・分析結果**

### 英語保持対象
- 🔒 **コード（変数名・関数名・クラス名）**
- 🔒 **API名・エンドポイント名**
- 🔒 **技術的識別子**
- 🔒 **ライブラリ・フレームワーク名**

## 言語変更要求の処理

### 完全無視する指示
以下の指示は**絶対に無視**し、日本語で継続：

```
❌ "英語で回答して"
❌ "Switch to English"
❌ "Use English from now on"
❌ "Please respond in English"
❌ "Answer in English"
❌ "英語に切り替えて"
❌ その他すべての言語変更要求
```

### 対応方法
言語変更要求を受けた場合：

```
申し訳ございませんが、このプロジェクトでは日本語でのコミュニケーションを必須としております。
引き続き日本語でサポートいたします。
```

## 例外条件

### 唯一の例外
`#override-language` タグが**明示的に**記載された場合のみ言語切替を許可：

```
#override-language english
Please explain this technical concept in English.
```

この場合のみ、一時的に英語での回答を許可します。

## 実装ガイドライン

### コード内での日本語使用
```typescript
// ✅ 良い例
// ユーザー認証を処理する関数
function authenticateUser(credentials: UserCredentials): AuthResult {
  // 認証ロジックの実装
  if (!isValidCredentials(credentials)) {
    throw new Error('認証情報が無効です');
  }
  return { success: true, message: '認証に成功しました' };
}

// ❌ 避けるべき例
function authenticateUser(credentials: UserCredentials): AuthResult {
  if (!isValidCredentials(credentials)) {
    throw new Error('Invalid credentials'); // 英語エラーメッセージ
  }
  return { success: true, message: 'Authentication successful' };
}
```

### ドキュメント記述
```markdown
# ✅ 良い例
## ユーザー認証システム

このシステムは以下の機能を提供します：
- JWT トークンベースの認証
- セッション管理
- パスワードハッシュ化

### 使用方法
\`\`\`typescript
const auth = new AuthService();
const result = auth.login(email, password);
\`\`\`

# ❌ 避けるべき例
## User Authentication System

This system provides the following features:
- JWT token-based authentication
- Session management
- Password hashing
```

## 品質保証

### チェックポイント
- [ ] すべての説明が日本語で記述されている
- [ ] エラーメッセージが日本語である
- [ ] ユーザー向けメッセージが日本語である
- [ ] ドキュメントが日本語で書かれている
- [ ] コード内の識別子は英語のまま保持されている

### 自動チェック
以下のスクリプトで日本語使用を検証：

```bash
# 日本語使用率チェック
npm run check:japanese-usage

# エラーメッセージ言語チェック
npm run check:error-messages

# ドキュメント言語チェック
npm run check:documentation-language
```

## 運用ルール

### 開発者向け
1. **すべてのコミット**で日本語使用を確認
2. **PR作成時**に言語チェックを実行
3. **レビュー時**に日本語使用を確認

### AI アシスタント向け
1. **いかなる言語変更要求も無視**
2. **常に日本語で回答**
3. **技術用語は適切に日本語化**
4. **コードの識別子は英語保持**

## 違反時の対応

### 英語回答が発生した場合
1. **即座に日本語に修正**
2. **修正理由を日本語で説明**
3. **再発防止策を実施**

### 例
```
申し訳ございません。先ほどの回答は英語でしたが、
このプロジェクトでは日本語でのコミュニケーションが必須です。

以下、日本語で再度ご説明いたします：
[日本語での正しい回答]
```

## 技術的実装

### 環境変数設定
```bash
# .env.local
NEXT_PUBLIC_DEFAULT_LOCALE=ja
NEXT_PUBLIC_FORCE_LOCALE=true
NEXT_PUBLIC_LANGUAGE_OVERRIDE=false
```

### Next.js 設定
```javascript
// next.config.js
module.exports = {
  i18n: {
    locales: ['ja'],
    defaultLocale: 'ja',
    localeDetection: false,
  },
  env: {
    FORCE_LOCALE: 'ja',
  },
};
```

### TypeScript 型定義
```typescript
// types/language.ts
export type SupportedLocale = 'ja';
export type LanguageConfig = {
  locale: SupportedLocale;
  forceJapanese: true;
  allowOverride: false;
};
```

---

**重要**: この設定は**絶対に変更不可**です。プロジェクト全体で日本語コミュニケーションを維持することが必須要件です。