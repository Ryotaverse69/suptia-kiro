# Requirements Document

## Introduction

サプティアのWebアプリケーションを、現在の仮URLから本番ドメイン suptia.com に移行する機能を実装します。ドメインとDNS設定は既に完了しているため、Vercelプロジェクトでのカスタムドメイン設定と関連する設定更新を行います。

## Requirements

### Requirement 1

**User Story:** As a サプティア運営者, I want the application to be accessible at suptia.com, so that users can access the service using the official domain.

#### Acceptance Criteria

1. WHEN suptia.com にアクセスした時 THEN アプリケーションが正常に表示される
2. WHEN https://suptia.com にアクセスした時 THEN SSL証明書が有効で安全な接続が確立される
3. WHEN www.suptia.com にアクセスした時 THEN suptia.com にリダイレクトされる
4. WHEN 旧URL suptia-kiro.vercel.app にアクセスした時 THEN suptia.com にリダイレクトされる

### Requirement 2

**User Story:** As a 開発者, I want all environment variables and configurations to use the correct production domain, so that all features work correctly with the custom domain.

#### Acceptance Criteria

1. WHEN アプリケーションが起動した時 THEN NEXT_PUBLIC_SITE_URL が https://suptia.com に設定されている
2. WHEN サイトマップが生成される時 THEN すべてのURLが https://suptia.com ベースで生成される
3. WHEN OGP メタタグが生成される時 THEN canonical URL が https://suptia.com ベースで設定される
4. WHEN API エンドポイントが呼び出される時 THEN 正しいドメインでCORS設定が動作する

### Requirement 3

**User Story:** As a SEO担当者, I want proper redirects and canonical URLs to be set up, so that search engines recognize suptia.com as the primary domain.

#### Acceptance Criteria

1. WHEN 検索エンジンがサイトをクロールした時 THEN canonical URL が https://suptia.com に設定されている
2. WHEN 複数のドメインからアクセスされた時 THEN 301リダイレクトで suptia.com に統一される
3. WHEN robots.txt がアクセスされた時 THEN 正しいサイトマップURLが記載されている
4. WHEN sitemap.xml がアクセスされた時 THEN すべてのページが https://suptia.com ベースで記載されている

### Requirement 4

**User Story:** As a システム管理者, I want to verify that the custom domain setup is working correctly, so that I can confirm the migration was successful.

#### Acceptance Criteria

1. WHEN ヘルスチェックAPIが呼び出された時 THEN 正しいドメイン情報が返される
2. WHEN SSL証明書の有効性をチェックした時 THEN 証明書が有効で期限内である
3. WHEN DNS設定を確認した時 THEN 正しくVercelを指している
4. WHEN パフォーマンステストを実行した時 THEN カスタムドメインでも高速に動作する

### Requirement 5

**User Story:** As a ユーザー, I want all existing bookmarks and shared links to continue working, so that I don't lose access to saved content.

#### Acceptance Criteria

1. WHEN 旧URLのブックマークにアクセスした時 THEN 新しいドメインの対応ページにリダイレクトされる
2. WHEN SNSでシェアされた旧URLにアクセスした時 THEN 新しいドメインにリダイレクトされる
3. WHEN 検索結果の旧URLにアクセスした時 THEN 新しいドメインにリダイレクトされる
4. WHEN リダイレクトが発生した時 THEN ページの内容が正しく表示される