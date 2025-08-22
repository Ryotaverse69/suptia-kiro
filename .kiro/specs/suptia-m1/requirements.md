# Requirements Document

**specVersion**: 2025-08-16

## Introduction

Suptia M1（ユーザー体験拡張）では、M0で構築した基盤を拡張し、最安提示の精度と日常使いを強化します。Amazon/iHerbコネクタの追加、CompareView機能、Favorites機能、Price Alerts機能を通じて、ユーザーがより多くの選択肢から最適なサプリメントを見つけ、継続的に利用できる体験を提供します。

M1スコープ：Amazon/iHerbコネクタ追加 → 3ソース価格比較 → CompareView（並べ替え・フィルタ） → Favorites機能 → Price Alerts（通知キュー） → メール通知 → CI a11y強化 → ドキュメント更新。GTIN/JAN優先マッチング、信頼度スコア、テーブルa11y、通知の単発保証を含む。

## Requirements

### Requirement 1

**User Story:** ユーザーとして、Amazon・iHerbからも価格情報を取得して比較したい。そうすることで、より多くの選択肢から最安値のサプリメントを見つけることができる。

#### Acceptance Criteria

1. WHEN 商品価格を取得する THEN システムはAmazon・iHerbを含む4ソースから価格情報を取得する SHALL
2. WHEN Amazonコネクタを使用する THEN システムはProduct Advertising API v5を使用して商品情報を取得する SHALL
3. WHEN iHerbコネクタを使用する THEN システムはiHerb Affiliate APIを使用して商品情報を取得する SHALL
4. WHEN 価格データを正規化する THEN システムは4ソース全てで税込価格・送料・在庫状況・サブスク情報を統一形式で表示する SHALL
5. WHEN APIが利用できない場合 THEN システムはモックデータで開発・テストを継続できる SHALL

### Requirement 2

**User Story:** ユーザーとして、GTIN/JAN優先のマッチングで商品の信頼度を確認したい。そうすることで、同一商品であることを確信して価格比較できる。

#### Acceptance Criteria

1. WHEN 商品マッチングを行う THEN システムはGTIN/JAN優先でマッチングし、信頼度スコア（0-1）を表示する SHALL
2. WHEN GTIN/JANが一致する THEN システムは信頼度1.0として表示する SHALL
3. WHEN 商品名・容量・ブランドで一致する THEN システムは信頼度0.7-0.9として表示する SHALL
4. WHEN 信頼度が0.6未満の場合 THEN システムは警告表示と手動確認を促す SHALL
5. WHEN マッチング結果を表示する THEN システムは信頼度スコアを視覚的に分かりやすく表示する SHALL

### Requirement 3

**User Story:** ユーザーとして、3ソース以上で最安値を確実に表示したい。そうすることで、価格比較の信頼性を確保できる。

#### Acceptance Criteria

1. WHEN 商品詳細を表示する THEN システムは最低3ソースの価格情報を表示する SHALL
2. WHEN 最安値を表示する THEN システムは3ソース以上で比較した結果の最安値にバッジを表示する SHALL
3. WHEN 価格情報が3ソース未満の場合 THEN システムは「価格情報不足」の警告を表示する SHALL
4. WHEN 価格差が大きい場合 THEN システムは価格差の理由（送料・税込・サブスク等）を説明する SHALL
5. WHEN 価格を更新する THEN システムは全ソースの価格を同期的に更新する SHALL

### Requirement 4

**User Story:** ユーザーとして、商品比較ビューで複数商品を並べて比較したい。そうすることで、効率的に最適な商品を選択できる。

#### Acceptance Criteria

1. WHEN 比較ビューを表示する THEN システムは最大4商品を横並びで比較表示する SHALL
2. WHEN 比較項目を表示する THEN システムは価格・スコア・成分・容量・実効コスト/日を並べて表示する SHALL
3. WHEN 並べ替えを行う THEN システムは価格・スコア・実効コスト/日・信頼度で昇順・降順ソートできる SHALL
4. WHEN フィルタを適用する THEN システムはブランド・価格帯・容量・評価スコアでフィルタリングできる SHALL
5. WHEN 比較結果を保存する THEN システムは比較セットをURLで共有可能にする SHALL

### Requirement 5

**User Story:** ユーザーとして、お気に入り商品を保存・管理したい。そうすることで、継続的に購入する商品を簡単に見つけることができる。

#### Acceptance Criteria

1. WHEN お気に入りに追加する THEN システムはローカルストレージに商品IDを保存する SHALL
2. WHEN お気に入り一覧を表示する THEN システムは保存された商品の最新価格情報を表示する SHALL
3. WHEN お気に入りを管理する THEN システムは追加・削除・並べ替え機能を提供する SHALL
4. WHEN お気に入りをエクスポートする THEN システムはJSON形式でエクスポート・インポート機能を提供する SHALL
5. WHEN お気に入りが多数ある場合 THEN システムはカテゴリ別・ブランド別でグループ化表示する SHALL

### Requirement 6

**User Story:** ユーザーとして、価格変動アラートを設定したい。そうすることで、お得なタイミングで商品を購入できる。

#### Acceptance Criteria

1. WHEN 価格アラートを設定する THEN システムは目標価格・割引率・在庫復活の3種類のアラートを設定できる SHALL
2. WHEN 価格変動を検知する THEN システムは設定条件に合致した場合に通知キューに追加する SHALL
3. WHEN 通知を送信する THEN システムは同一商品・同一条件で24時間以内の重複通知を防止する SHALL
4. WHEN アラート履歴を表示する THEN システムは過去の通知履歴と価格推移を表示する SHALL
5. WHEN アラートを管理する THEN システムは有効・無効・削除・一時停止機能を提供する SHALL

### Requirement 7

**User Story:** ユーザーとして、メール通知で価格アラートを受け取りたい。そうすることで、サイトを訪問しなくても価格変動を把握できる。

#### Acceptance Criteria

1. WHEN メール通知を設定する THEN システムはメールアドレス登録とオプトイン確認を行う SHALL
2. WHEN 通知メールを送信する THEN システムは商品名・現在価格・目標価格・商品リンクを含む SHALL
3. WHEN メール配信を行う THEN システムは配信失敗時のリトライ機能を実装する SHALL
4. WHEN 配信頻度を制御する THEN システムは1日最大5通、週最大20通の制限を設ける SHALL
5. WHEN 配信停止を行う THEN システムはワンクリック配信停止機能を提供する SHALL

### Requirement 8

**User Story:** 開発者として、CI a11y強化でより厳密なアクセシビリティを確保したい。そうすることで、WCAG 2.1 AAの完全準拠を実現できる。

#### Acceptance Criteria

1. WHEN A11y検証を実行する THEN システムはaxe-coreによる自動テストを全ページで実行する SHALL
2. WHEN テーブルa11yを検証する THEN システムはPriceTable・CompareViewでcaption・scope・aria-sort属性を確認する SHALL
3. WHEN キーボードナビゲーションを検証する THEN システムは全インタラクティブ要素でTab・Enter・Space・Arrow操作を確認する SHALL
4. WHEN スクリーンリーダー対応を検証する THEN システムはNVDA・JAWSでの読み上げテストを自動化する SHALL
5. WHEN A11y違反を検出する THEN システムはCIで失敗させ、具体的な修正提案を出力する SHALL

### Requirement 9

**User Story:** 開発者として、ドキュメントを最新状態に保ちたい。そうすることで、新機能の使用方法と技術仕様を正確に伝えることができる。

#### Acceptance Criteria

1. WHEN ドキュメント更新を実行する THEN システムはREADME.mdにM1新機能（Compare・Favorites・Alerts）を追記する SHALL
2. WHEN API仕様書を更新する THEN システムはdocs/API.mdにAmazon・iHerb連携仕様を記載する SHALL
3. WHEN A11y仕様書を更新する THEN システムはdocs/A11Y.mdにテーブルa11y・キーボードナビ仕様を記載する SHALL
4. WHEN 通知仕様書を作成する THEN システムはdocs/NOTIFICATIONS.mdに通知キュー・メール配信仕様を記載する SHALL
5. WHEN ドキュメント生成を実行する THEN システムは差分のみでPRを作成し、automergeラベルを付与する SHALL

### Requirement 10

**User Story:** 視覚障害者として、CompareView・Favorites・Alertsが適切にアクセシブルであることを期待する。そうすることで、新機能をスクリーンリーダーで利用できる。

#### Acceptance Criteria

1. WHEN CompareViewを表示する THEN システムは商品比較テーブルに適切なcaption・rowheader・columnheader属性を設定する SHALL
2. WHEN Favoritesを操作する THEN システムはお気に入り追加・削除でaria-pressed・aria-labelを適切に更新する SHALL
3. WHEN Alertsを設定する THEN システムは価格アラート設定フォームでaria-describedby・aria-invalid属性を設定する SHALL
4. WHEN 通知を表示する THEN システムは価格変動通知でrole="alert"・aria-live="assertive"属性を設定する SHALL
5. WHEN キーボード操作を行う THEN システムは全ての新機能でTab・Enter・Space・Escapeキーでの操作を保証する SHALL