# Requirements Document

## Introduction

商品詳細ページに4要素スコアリングシステム（エビデンス、安全性、コスト、実用性）を実装し、ユーザーがサプリメントの総合的な品質を簡単に評価できるようにします。各要素に重み付けを行い、総合スコアと個別スコアを表示することで、データに基づいた意思決定をサポートします。

## Requirements

### Requirement 1

**User Story:** サプリメント購入を検討するユーザーとして、商品の総合スコアを確認したい。そうすることで、複数の要素を総合的に判断して最適な商品を選択できる。

#### Acceptance Criteria

1. WHEN ユーザーが商品詳細ページを表示する THEN システムは4要素の重み付け総合スコア（0-100）を計算して表示する SHALL
2. WHEN 総合スコアを計算する THEN システムはエビデンス35%、安全性30%、コスト20%、実用性15%の重みを適用する SHALL
3. WHEN スコアが表示される THEN システムは視覚的に分かりやすい形式（数値+プログレスバー等）で表示する SHALL

### Requirement 2

**User Story:** サプリメント購入を検討するユーザーとして、4つの個別スコア（エビデンス、安全性、コスト、実用性）を確認したい。そうすることで、どの要素が優れているか劣っているかを理解できる。

#### Acceptance Criteria

1. WHEN ユーザーが商品詳細ページを表示する THEN システムは4つの個別スコア（0-100）を計算して表示する SHALL
2. WHEN エビデンススコアを計算する THEN システムはA=90, B=75, C=60の固定値を使用する SHALL
3. WHEN 安全性スコアを計算する THEN システムはnone=100, low=85, mid=70, high=40の固定値を使用する SHALL
4. WHEN コストスコアを計算する THEN システムは100*(minCostPerMgPerDay/productCostPerMgPerDay)を0..100にクランプする SHALL
5. WHEN 実用性スコアを計算する THEN システムは100 - dosageBurdenIndex（MVPは1日回数のみを指数化）を使用する SHALL
6. WHEN 総合スコアを計算する THEN システムは加重平均を使用し、表示は0.1刻み四捨五入する SHALL
7. WHEN 重み設定を検証する THEN システムは重み合計=1であることを確認する SHALL

### Requirement 3

**User Story:** 開発者として、スコアリング機能が正確に動作することを確認したい。そうすることで、ユーザーに信頼性の高いスコア情報を提供できる。

#### Acceptance Criteria

1. WHEN スコア計算関数をテストする THEN システムは各要素スコアが正確に計算される SHALL
2. WHEN 重み付け総合スコア関数をテストする THEN システムは指定された重みで正しく計算される SHALL
3. WHEN エッジケース（データ不足、異常値）をテストする THEN システムは適切にエラーハンドリングする SHALL
4. WHEN 境界値をテストする THEN システムはスコアが0-100の範囲内に収まる SHALL

### Requirement 4

**User Story:** サプリメント購入を検討するユーザーとして、スコア表示が見やすく理解しやすいことを期待する。そうすることで、スコアの意味を正しく理解して判断に活用できる。

#### Acceptance Criteria

1. WHEN スコアが表示される THEN システムは各要素の名称と説明を日本語で表示する SHALL
2. WHEN モバイルデバイスで表示する THEN システムはスコア表示をレスポンシブに最適化する SHALL
3. WHEN スコアが低い場合 THEN システムは改善ポイントや注意事項を表示する SHALL
4. WHEN アクセシビリティを考慮する THEN システムはスクリーンリーダー対応とキーボードナビゲーションを提供する SHALL

### Requirement 5

**User Story:** 開発者として、lib/scoring.tsに一元化されたスコアリングロジックを実装したい。そうすることで、システム全体で一貫したスコア計算を使用できる。

#### Acceptance Criteria

1. WHEN スコアリングライブラリを作成する THEN システムはapps/web/src/lib/scoring.tsにscore(product)関数を実装する SHALL
2. WHEN score関数を呼び出す THEN システムは商品データから4要素スコアと総合スコアを返す SHALL
3. WHEN 新しいスコアリング機能が必要な場合 THEN システムは適切な関数をscoring.tsに追加する SHALL
4. WHEN スコアリングロジックを変更する THEN システムは既存のテストが通ることを確認する SHALL

### Requirement 6

**User Story:** システム管理者として、スコア計算の透明性と説明可能性を確保したい。そうすることで、ユーザーがスコアの根拠を理解できる。

#### Acceptance Criteria

1. WHEN スコアを計算する THEN システムは各要素の計算根拠を記録する SHALL
2. WHEN スコアが表示される THEN システムは必要に応じて計算方法の説明を提供する SHALL
3. WHEN データが不足している THEN システムは「データ不足」として明示し、利用可能なデータのみでスコアを計算する SHALL
4. WHEN スコア計算にエラーが発生する THEN システムは適切なフォールバック値を提供する SHALL