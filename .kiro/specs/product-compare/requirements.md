# Requirements Document

**specVersion**: 2025-08-15

## Introduction

最大3製品のスコア・価格・警告を比較表示する機能を実装します。アクセシブルなテーブル形式で製品情報を並べて表示し、ユーザーが製品を効率的に比較検討できるようにします。スコアBreakdownの要約表示、警告のハイライト、並べ替え機能、JSON-LD構造化データ対応を通じて、使いやすく検索エンジンにも最適化された比較機能を提供します。

## Requirements

### Requirement 1

**User Story:** 視覚障害者として、製品比較テーブルが適切にアクセシブルであることを期待する。そうすることで、スクリーンリーダーやキーボードナビゲーションで比較情報を効率的に取得できる。

#### Acceptance Criteria

1. WHEN 比較テーブルを表示する THEN システムは適切な`<caption>`要素を含む SHALL
2. WHEN テーブルヘッダーを表示する THEN システムは`<th scope="col">`と`<th scope="row">`属性を適切に設定する SHALL
3. WHEN 並べ替え機能を提供する THEN システムは`aria-sort`属性を適切に設定する SHALL
4. WHEN キーボードナビゲーションを行う THEN システムはTab、Enter、Space、矢印キーでの操作を可能にする SHALL
5. WHEN スクリーンリーダーで読み上げる THEN システムは製品名、スコア、価格、警告情報を明確に識別できる構造を提供する SHALL

### Requirement 2

**User Story:** ユーザーとして、製品のスコアBreakdownを要約形式で確認したい。そうすることで、詳細な内訳を見る前に全体的な評価傾向を把握できる。

#### Acceptance Criteria

1. WHEN スコアBreakdownを表示する THEN システムは各カテゴリの要約行を表示する SHALL
2. WHEN 要約行を表示する THEN システムは最高スコア、最低スコア、平均スコアを含む SHALL
3. WHEN 警告がある場合 THEN システムは警告の総件数を表示する SHALL
4. WHEN 最重要警告がある場合 THEN システムは該当警告をハイライト表示する SHALL
5. WHEN 要約情報を表示する THEN システムは視覚的に分かりやすい形式で整理する SHALL

### Requirement 3

**User Story:** ユーザーとして、製品を並べ替えて比較したい。そうすることで、スコアや価格の順序で製品を効率的に比較検討できる。

#### Acceptance Criteria

1. WHEN 並べ替えボタンをクリックする THEN システムはスコア順（昇順・降順）で製品を並べ替える SHALL
2. WHEN 価格で並べ替える THEN システムは価格順（昇順・降順）で製品を並べ替える SHALL
3. WHEN 並べ替えを実行する THEN システムは現在の並べ替え状態を視覚的に表示する SHALL
4. WHEN 並べ替え状態を変更する THEN システムはaria-sort属性を適切に更新する SHALL
5. WHEN 並べ替えを行う THEN システムはキーボード操作でも同様の機能を提供する SHALL

### Requirement 4

**User Story:** 検索エンジンとして、製品比較ページの構造化データを取得したい。そうすることで、検索結果に比較情報を適切に表示できる。

#### Acceptance Criteria

1. WHEN 製品比較ページを表示する THEN システムはItemList JSON-LDを含む SHALL
2. WHEN ItemListを生成する THEN システムは比較対象の各製品をListItemとして含む SHALL
3. WHEN ListItemを生成する THEN システムは製品名、URL、位置情報を含む SHALL
4. WHEN 構造化データを出力する THEN システムはschema.orgの仕様に準拠する SHALL
5. WHEN JSON-LDを検証する THEN システムは構造化データテストツールで有効であることを確認する SHALL

### Requirement 5

**User Story:** ユーザーとして、最大3製品まで比較表示したい。そうすることで、適切な数の製品を効率的に比較検討できる。

#### Acceptance Criteria

1. WHEN 製品を比較に追加する THEN システムは最大3製品まで受け入れる SHALL
2. WHEN 3製品を超えて追加しようとする THEN システムは適切なエラーメッセージを表示する SHALL
3. WHEN 比較テーブルを表示する THEN システムは選択された製品数に応じてレイアウトを調整する SHALL
4. WHEN 製品を比較から削除する THEN システムはテーブルを動的に更新する SHALL
5. WHEN 比較製品がない場合 THEN システムは適切な空状態メッセージを表示する SHALL

### Requirement 6

**User Story:** 開発者として、パフォーマンス予算を遵守したい。そうすることで、比較機能が既存のパフォーマンス基準を満たすことを確保できる。

#### Acceptance Criteria

1. WHEN Lighthouse測定を実行する THEN システムはLCP≤2.5秒を維持する SHALL
2. WHEN パフォーマンス測定を行う THEN システムはTBT≤200msを維持する SHALL
3. WHEN レイアウトシフトを測定する THEN システムはCLS≤0.1を維持する SHALL
4. WHEN JavaScriptバンドルを測定する THEN システムはJS≤300KBを維持する SHALL
5. WHEN 予算を超過する場合 THEN システムは警告として扱い、ビルドを停止しない SHALL

### Requirement 7

**User Story:** 開発者として、アクセシビリティ検証を自動化したい。そうすることで、テーブルのa11y lintが無違反であることを継続的に確認できる。

#### Acceptance Criteria

1. WHEN eslint-plugin-jsx-a11yを実行する THEN システムはテーブル関連の違反を検出しない SHALL
2. WHEN アクセシビリティテストを実行する THEN システムはキーボードナビゲーションを検証する SHALL
3. WHEN スクリーンリーダーテストを実行する THEN システムは適切な読み上げ順序を確認する SHALL
4. WHEN ARIA属性を検証する THEN システムは適切な属性設定を確認する SHALL
5. WHEN a11y検証が完了する THEN システムは合否を明示的に報告する SHALL

### Requirement 8

**User Story:** 開発者として、E2Eテストで機能を検証したい。そうすることで、比較機能が実際のユーザー操作で正常に動作することを確認できる。

#### Acceptance Criteria

1. WHEN E2Eテストを実行する THEN システムは製品比較の基本フローを検証する SHALL
2. WHEN 並べ替え機能をテストする THEN システムはスコア・価格での並べ替えを検証する SHALL
3. WHEN キーボード操作をテストする THEN システムはTab、Enter、矢印キーでの操作を検証する SHALL
4. WHEN アクセシビリティをテストする THEN システムはスクリーンリーダー対応を検証する SHALL
5. WHEN テストが完了する THEN システムは1本のE2Eテストで主要機能をカバーする SHALL