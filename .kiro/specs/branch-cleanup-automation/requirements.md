# Requirements Document

## Introduction

PR #13 (chore/checkpoint-commit → master) のマージ完了を自動検知し、不要になったブランチの削除とリポジトリの整理を自動化する機能です。CI成功後のマージ完了をトリガーとして、ローカル・リモート両方でブランチクリーンアップを実行し、masterブランチのみが残る本番運用体制を確立します。

## Requirements

### Requirement 1

**User Story:** 開発者として、PR #13がマージされた後に手動でブランチ削除作業を行う必要がないよう、自動化されたクリーンアップ処理を実行したい

#### Acceptance Criteria

1. WHEN PR #13 (chore/checkpoint-commit → master) がCI成功後にマージされた THEN システム SHALL マージ完了を自動検知する
2. WHEN マージ完了が検知された THEN システム SHALL masterブランチを最新化する (`git switch master` && `git pull --ff-only`)
3. WHEN masterブランチの最新化が完了した THEN システム SHALL ローカルのchore/checkpoint-commitブランチを削除する (`git branch -D chore/checkpoint-commit || true`)
4. WHEN ローカルブランチ削除が完了した THEN システム SHALL リモートのchore/checkpoint-commitブランチを削除する (`git push origin --delete chore/checkpoint-commit || true`)
5. WHEN リモートブランチ削除が完了した THEN システム SHALL タグと不要リファレンスを整理する (`git fetch --prune --tags`)

### Requirement 2

**User Story:** 開発者として、ブランチクリーンアップ処理が失敗した場合でも、他の処理に影響を与えないよう、エラーハンドリングが適切に行われることを期待する

#### Acceptance Criteria

1. WHEN ブランチ削除コマンドが失敗した THEN システム SHALL `|| true` により処理を継続する
2. WHEN 任意のGitコマンドが失敗した THEN システム SHALL エラーログを記録し、次のステップに進む
3. WHEN 全体の処理が完了した THEN システム SHALL 実行結果のサマリーを提供する
4. IF masterブランチへの切り替えが失敗した THEN システム SHALL 処理を中断し、エラーを報告する

### Requirement 3

**User Story:** 開発者として、GitHub保護ルールや必須チェックを崩すことなく、安全にブランチクリーンアップが実行されることを確認したい

#### Acceptance Criteria

1. WHEN ブランチクリーンアップを実行する THEN システム SHALL GitHub保護ルールを遵守する
2. WHEN リモートブランチを削除する THEN システム SHALL 必要な権限チェックを通過する
3. WHEN masterブランチを操作する THEN システム SHALL fast-forward onlyマージのみを許可する
4. IF 保護ルールに違反する操作が検出された THEN システム SHALL 処理を中断し、安全な代替手段を提案する

### Requirement 4

**User Story:** 開発者として、クリーンアップ完了後にリポジトリがmasterブランチのみの一本化された状態になることを確認したい

#### Acceptance Criteria

1. WHEN 全てのクリーンアップ処理が完了した THEN システム SHALL ローカルリポジトリにmasterブランチのみが存在することを確認する
2. WHEN 全てのクリーンアップ処理が完了した THEN システム SHALL リモートリポジトリにmasterブランチのみが存在することを確認する
3. WHEN クリーンアップが完了した THEN システム SHALL 本番運用準備完了の状態を報告する
4. WHEN 処理完了後 THEN システム SHALL 不要なリファレンスが削除されていることを確認する