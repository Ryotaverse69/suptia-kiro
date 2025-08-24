# Requirements Document

## Introduction

Suptiaプロジェクトにおける効率的で安全なGit運用フローを確立する。master/dev 2ブランチ体制により、開発の迅速性と本番環境の安定性を両立させる。開発者は常にdevブランチで作業し、Preview環境で確認後、自動化されたCI/CDパイプラインを通じて本番デプロイを行う。

## Requirements

### Requirement 1: ブランチ構成の確立

**User Story:** 開発者として、明確に役割分担されたブランチ構成で作業したい。そうすることで、開発環境と本番環境を混同することなく安全に開発できる。

#### Acceptance Criteria

1. WHEN プロジェクトを初期化する THEN システムは master と dev の2つのブランチを持つ SHALL
2. WHEN master ブランチを確認する THEN システムは本番環境専用ブランチとして設定されている SHALL
3. WHEN dev ブランチを確認する THEN システムは開発環境専用ブランチとして設定されている SHALL
4. WHEN ブランチ一覧を表示する THEN システムは master と dev 以外の常設ブランチを持たない SHALL

### Requirement 2: 開発フローの自動化

**User Story:** 開発者として、シンプルで一貫した開発フローで作業したい。そうすることで、複雑なブランチ操作に時間を取られることなく開発に集中できる。

#### Acceptance Criteria

1. WHEN 開発者がコード修正を行う THEN システムは dev ブランチへの直接 push を許可する SHALL
2. WHEN dev ブランチに push する THEN システムは自動的に Vercel Preview 環境にデプロイする SHALL
3. WHEN Preview 環境で動作確認が完了する THEN 開発者は GitHub UI で dev → master の PR を作成できる SHALL
4. WHEN PR が作成される THEN システムは必須チェックを自動実行する SHALL
5. WHEN 全ての必須チェックが通過する THEN システムは自動的に master にマージする SHALL
6. WHEN master にマージされる THEN システムは自動的に本番環境にデプロイする SHALL

### Requirement 3: ブランチ保護とセキュリティ

**User Story:** プロジェクト管理者として、本番環境の安全性を確保したい。そうすることで、未検証のコードが本番環境に影響を与えることを防げる。

#### Acceptance Criteria

1. WHEN master ブランチにアクセスする THEN システムは直接 push を禁止する SHALL
2. WHEN master ブランチへの変更を試みる THEN システムは PR 経由でのみ変更を許可する SHALL
3. WHEN PR が作成される THEN システムは最低1名の承認を必須とする SHALL
4. WHEN 新しいコミットが push される THEN システムは古いレビュー承認を無効化する SHALL
5. WHEN master ブランチの履歴を確認する THEN システムはリニア履歴を維持している SHALL
6. WHEN dev ブランチにアクセスする THEN システムは直接 push を許可する SHALL

### Requirement 4: CI/CDパイプラインの実装

**User Story:** 開発チームとして、品質を保証する自動化されたチェック機能が欲しい。そうすることで、手動チェックの漏れを防ぎ、一定の品質を維持できる。

#### Acceptance Criteria

1. WHEN コードが push される THEN システムは format チェックを実行する SHALL
2. WHEN コードが push される THEN システムは lint チェックを実行する SHALL
3. WHEN コードが push される THEN システムは test チェックを実行する SHALL
4. WHEN コードが push される THEN システムは typecheck を実行する SHALL
5. WHEN コードが push される THEN システムは build チェックを実行する SHALL
6. WHEN コードが push される THEN システムは headers チェックを実行する SHALL
7. WHEN コードが push される THEN システムは jsonld チェックを実行する SHALL
8. WHEN PR が作成される THEN システムは pr-dod-check を実行する SHALL
9. IF いずれかのチェックが失敗する THEN システムは master へのマージを阻止する SHALL

### Requirement 5: Vercel連携とデプロイ自動化

**User Story:** 開発者として、コード変更が即座に確認可能な環境が欲しい。そうすることで、開発サイクルを短縮し、問題を早期発見できる。

#### Acceptance Criteria

1. WHEN dev ブランチに push する THEN システムは Vercel Preview 環境を更新する SHALL
2. WHEN Preview デプロイが完了する THEN システムは一意の Preview URL を生成する SHALL
3. WHEN master ブランチが更新される THEN システムは本番環境を自動デプロイする SHALL
4. WHEN デプロイが失敗する THEN システムは開発者に通知する SHALL
5. WHEN 環境変数が必要な場合 THEN システムは Production と Preview で適切に設定されている SHALL

### Requirement 6: ブランチクリーンアップの自動化

**User Story:** プロジェクト管理者として、不要なブランチが蓄積されることを防ぎたい。そうすることで、リポジトリを整理された状態に保てる。

#### Acceptance Criteria

1. WHEN PR がマージされる THEN システムは自動的にソースブランチを削除する SHALL
2. WHEN 一時的な作業ブランチが作成される THEN システムは適切なタイミングで削除を促す SHALL
3. WHEN ブランチ一覧を確認する THEN システムは master と dev のみが常設ブランチとして存在する SHALL

### Requirement 7: 開発者体験の最適化

**User Story:** 開発者として、直感的で効率的な開発体験を得たい。そうすることで、学習コストを最小化し、生産性を最大化できる。

#### Acceptance Criteria

1. WHEN 新しい開発者がプロジェクトに参加する THEN システムは明確な開発フロー文書を提供する SHALL
2. WHEN 開発者が作業を開始する THEN システムは `git switch dev` のみで開発環境に切り替えられる SHALL
3. WHEN エラーが発生する THEN システムは明確なエラーメッセージと解決方法を提示する SHALL
4. WHEN 開発フローを確認する THEN システムは視覚的に理解しやすい図表を提供する SHALL

### Requirement 8: 監視と品質保証

**User Story:** プロジェクト管理者として、開発フローの健全性を監視したい。そうすることで、問題を早期発見し、継続的な改善を行える。

#### Acceptance Criteria

1. WHEN CI/CD パイプラインが実行される THEN システムは実行時間とステータスを記録する SHALL
2. WHEN デプロイが実行される THEN システムは成功/失敗の履歴を保持する SHALL
3. WHEN 品質メトリクスを確認する THEN システムはテストカバレッジとビルド成功率を表示する SHALL
4. WHEN パフォーマンス問題が発生する THEN システムは適切なアラートを発信する SHALL