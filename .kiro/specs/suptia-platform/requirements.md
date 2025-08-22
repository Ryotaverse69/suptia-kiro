# Requirements Document

**specVersion**: 2025-08-15

## Introduction

Suptiaは「誰もが最も安全で最も安価な自分にピッタリのサプリメントに出会える場所」を実現するプラットフォームです。AI診断による個人最適化、複数通販サイトからの最安値比較、成分ガイドによる教育コンテンツを通じて、ユーザーが安全で効果的なサプリメント選択を行えるよう支援します。

顧客導線：サイト訪問 → AI診断 → 最安値比較表示 → 購入先案内 + 成分ガイドブログによる継続的な学習支援

## Requirements

### Requirement 1

**User Story:** ユーザーとして、AIによる個人診断を受けたい。そうすることで、自分の健康状態、生活習慣、目標に最適な成分やサプリメントを特定できる。

#### Acceptance Criteria

1. WHEN 診断を開始する THEN システムは健康状態、年齢、性別、生活習慣に関する質問を表示する SHALL
2. WHEN 質問に回答する THEN システムはAIアルゴリズムで個人プロファイルを分析する SHALL
3. WHEN 分析が完了する THEN システムは推奨成分リストと理由を提示する SHALL
4. WHEN 推奨成分を表示する THEN システムは各成分の効果、安全性、相互作用情報を含む SHALL
5. WHEN 診断結果を保存する THEN システムはユーザープロファイルとして記録し、再診断時に活用する SHALL

### Requirement 2

**User Story:** ユーザーとして、推奨されたサプリメントの最安値を比較したい。そうすることで、複数の通販サイトから最もコストパフォーマンスの良い商品を選択できる。

#### Acceptance Criteria

1. WHEN 推奨サプリメントを表示する THEN システムは複数通販サイトの価格情報を取得する SHALL
2. WHEN 価格比較を行う THEN システムは送料、ポイント還元を含む実質価格を計算する SHALL
3. WHEN 最安値を特定する THEN システムは最安値商品をハイライト表示する SHALL
4. WHEN 価格情報を表示する THEN システムは価格更新日時と在庫状況を含む SHALL
5. WHEN 購入リンクを提供する THEN システムは各通販サイトへの直接リンクを生成する SHALL

### Requirement 3

**User Story:** ユーザーとして、サプリメントの安全性を確認したい。そうすることで、自分の健康状態や服用中の薬との相互作用リスクを把握できる。

#### Acceptance Criteria

1. WHEN サプリメント詳細を表示する THEN システムは成分の安全性評価を表示する SHALL
2. WHEN 相互作用チェックを行う THEN システムは他のサプリメントや薬との相互作用を警告する SHALL
3. WHEN アレルギー情報を確認する THEN システムはユーザーのアレルギー情報と照合する SHALL
4. WHEN 摂取量を表示する THEN システムは推奨摂取量と上限摂取量を明示する SHALL
5. WHEN 注意事項を表示する THEN システムは妊娠中、授乳中、疾患別の注意事項を提示する SHALL

### Requirement 4

**User Story:** ユーザーとして、成分に関する詳細な情報を学習したい。そうすることで、サプリメント選択の根拠を理解し、継続的な健康管理に活用できる。

#### Acceptance Criteria

1. WHEN 成分ガイドを閲覧する THEN システムは各成分の効果、メカニズム、エビデンスを提供する SHALL
2. WHEN ブログ記事を表示する THEN システムは最新の研究結果と専門家の見解を含む SHALL
3. WHEN 関連記事を推奨する THEN システムはユーザーの診断結果に基づいて関連コンテンツを提案する SHALL
4. WHEN 記事を検索する THEN システムは成分名、効果、症状での検索機能を提供する SHALL
5. WHEN 記事を共有する THEN システムはSNS共有とブックマーク機能を提供する SHALL

### Requirement 5

**User Story:** ユーザーとして、個人の健康目標を設定・追跡したい。そうすることで、サプリメント摂取の効果を測定し、必要に応じて調整できる。

#### Acceptance Criteria

1. WHEN 健康目標を設定する THEN システムは具体的で測定可能な目標設定をサポートする SHALL
2. WHEN 摂取記録を入力する THEN システムはサプリメント摂取履歴を記録する SHALL
3. WHEN 効果を追跡する THEN システムは体調変化、目標達成度を可視化する SHALL
4. WHEN 再診断を提案する THEN システムは定期的な診断更新を推奨する SHALL
5. WHEN 進捗レポートを生成する THEN システムは個人の改善状況をレポート形式で提供する SHALL

### Requirement 6

**User Story:** 検索エンジンとして、Suptiaのコンテンツを適切にインデックスしたい。そうすることで、サプリメントや成分に関する検索で適切な情報を提供できる。

#### Acceptance Criteria

1. WHEN 商品ページを表示する THEN システムはProduct JSON-LDと価格情報を含む SHALL
2. WHEN 成分ガイドを表示する THEN システムはArticle JSON-LDと専門性を示すメタデータを含む SHALL
3. WHEN 診断ページを表示する THEN システムはWebApplication JSON-LDを含む SHALL
4. WHEN サイトマップを生成する THEN システムは全ページの構造化されたサイトマップを提供する SHALL
5. WHEN メタデータを設定する THEN システムは各ページに適切なtitle、description、canonicalを設定する SHALL

### Requirement 7

**User Story:** ユーザーとして、モバイルデバイスでも快適に利用したい。そうすることで、外出先でもサプリメント情報を確認し、購入判断を行える。

#### Acceptance Criteria

1. WHEN モバイルでアクセスする THEN システムはレスポンシブデザインで最適化された表示を提供する SHALL
2. WHEN タッチ操作を行う THEN システムは適切なタッチターゲットサイズを確保する SHALL
3. WHEN オフライン状態になる THEN システムは診断結果と基本情報をキャッシュ表示する SHALL
4. WHEN プッシュ通知を送信する THEN システムは価格変動や新商品情報を通知する SHALL
5. WHEN PWA機能を提供する THEN システムはホーム画面追加とアプリライクな体験を提供する SHALL

### Requirement 8

**User Story:** 管理者として、コンテンツと商品情報を効率的に管理したい。そうすることで、最新の情報を維持し、ユーザーに正確な情報を提供できる。

#### Acceptance Criteria

1. WHEN 商品情報を更新する THEN システムは複数通販サイトからの価格情報を自動取得する SHALL
2. WHEN 成分データを管理する THEN システムはCMS経由での成分情報編集機能を提供する SHALL
3. WHEN ブログ記事を投稿する THEN システムはSanity CMSでの記事作成・編集機能を提供する SHALL
4. WHEN データの整合性を確認する THEN システムは商品情報と成分データの自動検証を実行する SHALL
5. WHEN 分析レポートを生成する THEN システムはユーザー行動と診断結果の分析機能を提供する SHALL

### Requirement 9

**User Story:** ユーザーとして、個人情報が適切に保護されることを期待する。そうすることで、安心して健康情報を提供し、診断サービスを利用できる。

#### Acceptance Criteria

1. WHEN 個人情報を入力する THEN システムはSSL暗号化で通信を保護する SHALL
2. WHEN 診断データを保存する THEN システムは個人を特定できない形で匿名化する SHALL
3. WHEN データアクセスを制御する THEN システムは適切な認証・認可機能を実装する SHALL
4. WHEN プライバシーポリシーを表示する THEN システムは明確で理解しやすい形式で提示する SHALL
5. WHEN データ削除を要求される THEN システムはユーザーの削除要求に適切に対応する SHALL

### Requirement 10

**User Story:** 開発者として、システムの品質と性能を継続的に監視したい。そうすることで、ユーザー体験の向上と安定したサービス提供を実現できる。

#### Acceptance Criteria

1. WHEN パフォーマンスを測定する THEN システムはLighthouse予算（LCP≤2.5s、TBT≤200ms、CLS≤0.1）を遵守する SHALL
2. WHEN エラーを監視する THEN システムは診断エラー、価格取得エラーを自動検出・報告する SHALL
3. WHEN アクセシビリティを検証する THEN システムはWCAG 2.1 AA準拠を継続的に確認する SHALL
4. WHEN セキュリティを監査する THEN システムは定期的なセキュリティスキャンを実行する SHALL
5. WHEN 品質を保証する THEN システムはCI/CDパイプラインで自動テストを実行する SHALL