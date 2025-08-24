# Requirements Document

## Introduction

GitHub masterブランチ更新時にVercel Productionデプロイが確実に実行され、https://www.suptia.com が常に最新状態を配信できるようにする。現在、masterプッシュ時にProductionデプロイが作成されず、カスタムドメインが404エラーになる問題を解決する。

## Requirements

### Requirement 1: 確実なProduction デプロイ実行

**User Story:** As a developer, I want master branch updates to automatically trigger Vercel Production deployments, so that the production site is always up-to-date.

#### Acceptance Criteria

1. WHEN master ブランチに push される THEN Vercel で Production デプロイが自動実行される SHALL
2. WHEN Production デプロイが開始される THEN GitHub Actions で実行状況を監視できる SHALL  
3. IF Production デプロイが失敗する THEN 自動リトライまたは通知が実行される SHALL
4. WHEN Production デプロイが完了する THEN デプロイ ID と URL が記録される SHALL

### Requirement 2: カスタムドメインの正常動作

**User Story:** As an end user, I want to access https://www.suptia.com and see the latest production content, so that I can use the most current version of the application.

#### Acceptance Criteria

1. WHEN Production デプロイが成功する THEN suptia.com ドメインが正しく紐付けられる SHALL
2. WHEN suptia.com にアクセスする THEN 404 エラーではなく正常なコンテンツが表示される SHALL
3. WHEN x-vercel-id ヘッダーを確認する THEN DEPLOYMENT_NOT_FOUND ではなく READY ステータスが返される SHALL
4. WHEN ドメイン設定を確認する THEN アクセス権エラーが発生しない SHALL

### Requirement 3: 監視と再発防止

**User Story:** As a developer, I want to monitor deployment status and prevent future issues, so that production deployments remain reliable.

#### Acceptance Criteria

1. WHEN master プッシュが発生する THEN デプロイ状況を自動監視する仕組みが動作する SHALL
2. WHEN デプロイが失敗する THEN 詳細なエラー情報とトラブルシューティング手順が提供される SHALL
3. WHEN 設定変更が必要な場合 THEN 変更内容が文書化され、再現可能な手順が提供される SHALL
4. WHEN 将来的な問題を予防する THEN 定期的なヘルスチェックが実行される SHALL

### Requirement 4: Monorepo 対応の最適化

**User Story:** As a developer, I want Vercel to correctly build and deploy the monorepo structure, so that all dependencies and configurations work properly.

#### Acceptance Criteria

1. WHEN Vercel がビルドを実行する THEN pnpm workspaces 構成が正しく認識される SHALL
2. WHEN ビルドコマンドが実行される THEN @suptia/web パッケージが正しくビルドされる SHALL
3. WHEN 環境変数が参照される THEN すべての必要な変数が正しく設定される SHALL
4. WHEN outputDirectory が指定される THEN apps/web/.next が正しく出力される SHALL

### Requirement 5: GitHub Actions との連携

**User Story:** As a developer, I want GitHub Actions to coordinate with Vercel deployments, so that CI/CD pipeline is fully integrated.

#### Acceptance Criteria

1. WHEN master ブランチの CI/CD が成功する THEN Vercel デプロイが確実に実行される SHALL
2. WHEN Vercel デプロイが完了する THEN GitHub Actions でステータスが確認できる SHALL
3. IF Vercel デプロイが失敗する THEN GitHub Actions で適切なエラーハンドリングが実行される SHALL
4. WHEN デプロイが成功する THEN 成功通知と URL が記録される SHALL