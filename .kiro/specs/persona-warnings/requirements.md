# Requirements Document

## Introduction

商品詳細ページにペルソナベースの警告システムを実装し、ユーザーの健康状態や特性に応じて適切な注意喚起を行います。phrase-checker/rules.jsonを活用したコンプライアンスチェックと、ペルソナルールセットに基づく個別化された警告を表示することで、安全で適切なサプリメント選択をサポートします。

## Requirements

### Requirement 1

**User Story:** サプリメント購入を検討するユーザーとして、商品説明に薬事法に抵触する可能性のある表現が含まれている場合に警告を受けたい。そうすることで、誤解を招く情報に基づいた判断を避けることができる。

#### Acceptance Criteria

1. WHEN 商品詳細ページを表示する THEN システムは商品説明をphrase-checker/rules.jsonのパターンでチェックする SHALL
2. WHEN NGフレーズが検出される THEN システムは非ブロッキングな警告バナーを表示する SHALL
3. WHEN 警告バナーが表示される THEN システムは適切な代替表現を提案する SHALL
4. WHEN ユーザーが警告バナーを閉じる THEN システムは警告を非表示にする SHALL

### Requirement 2

**User Story:** 特定の健康状態を持つユーザーとして、自分のペルソナに適さない成分が含まれる商品について警告を受けたい。そうすることで、健康リスクを避けることができる。

#### Acceptance Criteria

1. WHEN ユーザーがペルソナを設定している THEN システムはペルソナルールに基づいて商品をチェックする SHALL
2. WHEN 商品にペルソナに適さない成分が含まれる THEN システムは警告メッセージを表示する SHALL
3. WHEN 警告が表示される THEN システムは具体的なリスクと推奨アクションを説明する SHALL
4. WHEN 複数の警告がある THEN システムはseverity降順で表示し、重複メッセージは折り畳む SHALL

### Requirement 3

**User Story:** 開発者として、コンプライアンスチェック機能が正確に動作することを確認したい。そうすることで、ユーザーに適切な警告を提供できる。

#### Acceptance Criteria

1. WHEN コンプライアンスチェック関数をテストする THEN システムはNGフレーズを正確に検出する SHALL
2. WHEN ペルソナルールチェック関数をテストする THEN システムは適切な警告を生成する SHALL
3. WHEN エッジケース（空文字、null値）をテストする THEN システムは適切にエラーハンドリングする SHALL

### Requirement 4

**User Story:** サプリメント購入を検討するユーザーとして、警告バナーが目立ちすぎず、かつ重要な情報を見落とさないデザインであることを期待する。そうすることで、快適に商品情報を確認できる。

#### Acceptance Criteria

1. WHEN 警告バナーが表示される THEN システムは非ブロッキングで目立つが邪魔にならないデザインで表示する SHALL
2. WHEN モバイルデバイスで表示する THEN システムは警告バナーをレスポンシブに表示する SHALL
3. WHEN 警告の重要度が高い THEN システムは視覚的に強調して表示する SHALL
4. WHEN アクセシビリティを考慮する THEN システムはrole="status"とフォーカス管理（Esc/×で閉じる、閉じたら呼出元へフォーカス返却）を実装する SHALL

### Requirement 5

**User Story:** 開発者として、tools/phrase-checker/rules.jsonとcompliance.tsを活用した一貫したコンプライアンスチェックを実装したい。そうすることで、システム全体で統一された警告機能を提供できる。

#### Acceptance Criteria

1. WHEN コンプライアンスチェックを実行する THEN システムはtools/phrase-checker/rules.jsonを読み込んで使用する SHALL
2. WHEN compliance.tsライブラリを使用する THEN システムは既存の関数を活用する SHALL
3. WHEN 新しいコンプライアンス機能が必要な場合 THEN システムは適切な関数をcompliance.tsに追加する SHALL
4. WHEN ルールファイルが更新される THEN システムは動的にルールを再読み込みする SHALL

### Requirement 6

**User Story:** システム管理者として、最小限のペルソナルールセットで基本的な警告機能を提供したい。そうすることで、MVPとして必要十分な安全機能を実装できる。

#### Acceptance Criteria

1. WHEN ペルソナルールセットを定義する THEN システムは{tag, ingredient, severity('low'|'mid'|'high'), message}の必須フィールドを含む SHALL
2. WHEN ペルソナルールを適用する THEN システムは成分レベルでのチェックを実行する SHALL
3. WHEN ルールに該当する THEN システムは具体的で実用的な警告メッセージを表示する SHALL
4. WHEN ペルソナが設定されていない THEN システムは一般的な注意事項のみを表示する SHALL