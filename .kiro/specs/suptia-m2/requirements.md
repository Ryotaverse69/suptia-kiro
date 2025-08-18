# Requirements Document

**specVersion**: 2025-08-16

## Introduction

Suptia M2（信頼性 & 収益化強化）では、M1で構築したユーザー体験基盤を拡張し、信頼性向上と収益化機能を強化します。口コミ要約（安全版）、価格履歴グラフ、アフィリエイト最適化、有料プラン機能を通じて、ユーザーがより信頼できる情報に基づいて商品選択を行い、持続可能なビジネスモデルを実現します。

M2スコープ：安全要約パイプライン → 価格履歴チャート → アフィリエイトリンク最適化 → Stripe+Entitlements有料プラン → JSON-LD拡張 → ドキュメント更新。禁止表現0、グラフ整合性、クリック計測重複なし、課金による機能解放を含む。

## Requirements

### Requirement 1

**User Story:** ユーザーとして、商品の口コミを安全に要約した情報を読みたい。そうすることで、薬機法に準拠した形で他のユーザーの体験を参考にできる。

#### Acceptance Criteria

1. WHEN 口コミ要約を表示する THEN システムは医療効果・疾患名・治療効果の断定表現を除去した要約を生成する SHALL
2. WHEN 要約を生成する THEN システムは「個人の感想です」「効果には個人差があります」等の免責事項を必ず含む SHALL
3. WHEN 禁止表現を検出する THEN システムは要約生成を停止し、代替表現での再生成を試行する SHALL
4. WHEN 要約パイプラインを実行する THEN システムは入力→フィルタリング→要約→コンプライアンスチェック→出力の順序で処理する SHALL
5. WHEN 要約が生成できない場合 THEN システムは「要約情報なし」として元の口コミ件数のみ表示する SHALL

### Requirement 2

**User Story:** ユーザーとして、商品の価格履歴をグラフで確認したい。そうすることで、価格変動パターンを把握し、購入タイミングを判断できる。

#### Acceptance Criteria

1. WHEN 価格履歴グラフを表示する THEN システムは過去3ヶ月・6ヶ月・1年の期間選択を提供する SHALL
2. WHEN グラフを描画する THEN システムは各ソース別の価格推移を異なる色・線種で表示する SHALL
3. WHEN 価格データを検証する THEN システムは異常値（前日比50%以上の変動）を検出し、確認マークを表示する SHALL
4. WHEN グラフにマウスオーバーする THEN システムは該当日の価格・ソース・日付をツールチップで表示する SHALL
5. WHEN 価格履歴データが不足する場合 THEN システムは「データ不足」の警告と利用可能期間を表示する SHALL

### Requirement 3

**User Story:** 開発者として、アフィリエイトリンクを最適化したい。そうすることで、収益性を向上させながらユーザー体験を損なわない仕組みを構築できる。

#### Acceptance Criteria

1. WHEN アフィリエイトリンクを生成する THEN システムは各ソース（楽天・Yahoo・Amazon・iHerb）の最適なアフィリエイトパラメータを付与する SHALL
2. WHEN リンククリックを計測する THEN システムは商品ID・ソース・ユーザーセッション・タイムスタンプを記録する SHALL
3. WHEN 重複クリックを検出する THEN システムは同一セッション・同一商品・同一ソースで5分以内の重複を除外する SHALL
4. WHEN コンバージョンを追跡する THEN システムはクリック→購入の成果を各アフィリエイトプログラムで追跡する SHALL
5. WHEN リンクが無効な場合 THEN システムは代替ソースへの自動フォールバックを実行する SHALL

### Requirement 4

**User Story:** ユーザーとして、有料プランで追加機能を利用したい。そうすることで、より詳細な分析や優先サポートを受けることができる。

#### Acceptance Criteria

1. WHEN 有料プラン登録を行う THEN システムはStripe決済による月額・年額プランを提供する SHALL
2. WHEN 機能制限を適用する THEN システムは無料プランで比較商品数3個・お気に入り10個・アラート5個に制限する SHALL
3. WHEN 有料機能を解放する THEN システムはEntitlementsによる機能制御で比較商品数10個・お気に入り100個・アラート50個を提供する SHALL
4. WHEN サブスクリプション状態を確認する THEN システムはリアルタイムで課金状態を検証し、機能アクセスを制御する SHALL
5. WHEN 課金エラーが発生する THEN システムは猶予期間（7日間）を設け、その後段階的に機能制限を適用する SHALL

### Requirement 5

**User Story:** 検索エンジンとして、商品レビューの構造化データを取得したい。そうすることで、検索結果にレビュー情報を表示できる。

#### Acceptance Criteria

1. WHEN 商品詳細ページを表示する THEN システムはJSON-LDにReview構造化データを追加する SHALL
2. WHEN レビュー要約を構造化データ化する THEN システムはreviewBody・author・datePublished・reviewRatingを含む SHALL
3. WHEN ItemList構造化データを生成する THEN システムは商品一覧・比較結果・お気に入り一覧でItemListを出力する SHALL
4. WHEN 構造化データを検証する THEN システムはGoogle Rich Results Testでの検証を自動実行する SHALL
5. WHEN 構造化データエラーを検出する THEN システムは具体的なエラー内容と修正提案を出力する SHALL

### Requirement 6

**User Story:** 開発者として、収益分析ダッシュボードを確認したい。そうすることで、アフィリエイト成果と有料プラン収益を把握できる。

#### Acceptance Criteria

1. WHEN 収益ダッシュボードを表示する THEN システムはアフィリエイト収益・サブスクリプション収益・総収益を表示する SHALL
2. WHEN クリック分析を表示する THEN システムはソース別・商品別・時間別のクリック数とコンバージョン率を表示する SHALL
3. WHEN サブスクリプション分析を表示する THEN システムは新規登録・解約・MRR・チャーン率を表示する SHALL
4. WHEN 収益予測を表示する THEN システムは過去データに基づく月次・年次収益予測を表示する SHALL
5. WHEN データエクスポートを実行する THEN システムはCSV・JSON形式での収益データエクスポートを提供する SHALL

### Requirement 7

**User Story:** 視覚障害者として、価格履歴グラフと口コミ要約が適切にアクセシブルであることを期待する。そうすることで、新機能をスクリーンリーダーで利用できる。

#### Acceptance Criteria

1. WHEN 価格履歴グラフを表示する THEN システムはグラフデータをテーブル形式でも提供する SHALL
2. WHEN グラフにフォーカスする THEN システムはキーボード操作（矢印キー）でデータポイント間を移動できる SHALL
3. WHEN 口コミ要約を表示する THEN システムは要約内容をaria-describedby属性で関連付ける SHALL
4. WHEN 有料プラン画面を表示する THEN システムは料金・機能比較テーブルに適切なcaption・scope属性を設定する SHALL
5. WHEN 収益ダッシュボードを表示する THEN システムは数値データにaria-label属性で詳細説明を提供する SHALL

### Requirement 8

**User Story:** 開発者として、M2機能のドキュメントを最新状態に保ちたい。そうすることで、口コミ要約・価格履歴・収益化機能の仕様を正確に伝えることができる。

#### Acceptance Criteria

1. WHEN ドキュメント更新を実行する THEN システムはREADME.mdにM2新機能（口コミ要約・価格履歴・有料プラン）を追記する SHALL
2. WHEN 収益化仕様書を作成する THEN システムはdocs/MONETIZATION.mdにアフィリエイト・サブスクリプション仕様を記載する SHALL
3. WHEN コンプライアンス仕様書を更新する THEN システムはdocs/COMPLIANCE.mdに口コミ要約の安全パイプライン仕様を記載する SHALL
4. WHEN JSON-LD仕様書を更新する THEN システムはdocs/SEO.mdにReview・ItemList構造化データ仕様を記載する SHALL
5. WHEN ドキュメント生成を実行する THEN システムは差分のみでPRを作成し、automergeラベルを付与する SHALL

### Requirement 9

**User Story:** 開発者として、M2品質基準を満たしたい。そうすることで、禁止表現0、グラフ整合性、クリック計測重複なし、課金機能解放を保証できる。

#### Acceptance Criteria

1. WHEN 口コミ要約を生成する THEN システムは薬機法違反表現が0件であることを自動検証する SHALL
2. WHEN 価格履歴グラフを表示する THEN システムは価格データの整合性（異常値検出・データ欠損処理）を検証する SHALL
3. WHEN アフィリエイトクリックを計測する THEN システムは重複クリック（5分以内・同一セッション・同一商品・同一ソース）が0件であることを検証する SHALL
4. WHEN 有料機能を提供する THEN システムは課金状態に応じた機能解放が正確に動作することを検証する SHALL
5. WHEN CI品質チェックを実行する THEN システムは上記4項目の自動検証をCIパイプラインで実行する SHALL

### Requirement 10

**User Story:** ユーザーとして、価格アラートの精度向上を体験したい。そうすることで、価格履歴に基づくより賢いアラート設定ができる。

#### Acceptance Criteria

1. WHEN 価格アラートを設定する THEN システムは価格履歴に基づく推奨目標価格を提案する SHALL
2. WHEN アラート条件を評価する THEN システムは過去の価格変動パターンを考慮した実現可能性を表示する SHALL
3. WHEN 価格予測を表示する THEN システムは過去データに基づく価格トレンド（上昇・下降・安定）を表示する SHALL
4. WHEN セール時期を予測する THEN システムは過去のセール履歴から次回セール時期を予測表示する SHALL
5. WHEN アラート精度を向上する THEN システムは履歴データが豊富な商品で精度の高いアラートを提供する SHALL