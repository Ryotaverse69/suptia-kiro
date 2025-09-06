# Requirements Document

## Introduction

サプティアのフロントエンド全体のUI/UX構成を実装する機能です。ユーザーがサプリメントを効率的に検索・比較・選択できる包括的なWebアプリケーションを構築します。AIレコメンド機能、詳細な商品分析、個人診断機能を含む近未来的でスタイリッシュなインターフェースを提供します。

### 技術スタック

- Next.js 14.2.5 (App Router)
- React 18.2.0
- TypeScript 5
- Tailwind CSS 4.1.12
- Sanity CMS 3.99.0 (GROQクエリ)
- Vitest / Playwright / ESLint / Prettier

### デザイン要件

- 背景色: 白ベース
- アクセントカラー: 近未来的な青
- フォント: Inter + Noto Sans JP
- UIスタイル: シンプル & リッチ、スタイリッシュ

## Requirements

### Requirement 1

**User Story:** サイト訪問者として、サプティアのブランドアイデンティティを即座に認識し、サービスの価値提案を理解したい

#### Acceptance Criteria

1. WHEN ユーザーがサイトにアクセス THEN ヘッダーに「サプティア」＋「Suptia」のロゴが近未来的でスタイリッシュなデザインで表示される
2. WHEN ユーザーがトップページを表示 THEN キャッチフレーズ「あなたに最も合うサプリを最も安い価格で。」が明確に表示される
3. WHEN ユーザーがヘッダーを確認 THEN ナビゲーションメニューに「ホーム / サプティアとは / 成分ガイド / 人気比較 / マイページ」が表示される
4. WHEN ユーザーがサイトを利用 THEN 言語・通貨切替ボタンが利用可能である

### Requirement 2

**User Story:** サプリメントを探しているユーザーとして、AIの支援を受けながら効率的に商品を検索したい

#### Acceptance Criteria

1. WHEN ユーザーがトップページにアクセス THEN ファーストビューに検索窓が中央に大きく表示される
2. WHEN ユーザーが検索窓を使用 THEN AIレコメンド機能が利用可能である
3. WHEN ユーザーがページをスクロール THEN 人気サプリ比較セクションが表示される
4. WHEN ユーザーがスクロール後のセクションを確認 THEN 成分ガイドへの導線がカテゴリ・目的別に表示される

### Requirement 3

**User Story:** サプリメント選択に迷うユーザーとして、簡単な質問に答えることで個人に最適化された推奨を受けたい

#### Acceptance Criteria

1. WHEN ユーザーが診断ページにアクセス THEN 目的・体質・ライフスタイルに関する簡易な質問が表示される
2. WHEN ユーザーが診断を完了 THEN 総合スコアが表示される
3. WHEN ユーザーが診断結果を確認 THEN エビデンス・安全・コスト・実用性の4つの内訳スコアが表示される
4. WHEN ユーザーが診断結果を確認 THEN 実効コスト/日が表示される
5. WHEN 危険成分が検出された場合 THEN 危険成分アラートが表示される

### Requirement 4

**User Story:** 商品を詳しく検討したいユーザーとして、成分・価格・安全性について詳細な情報を確認したい

#### Acceptance Criteria

1. WHEN ユーザーが商品詳細ページにアクセス THEN 成分一覧が配合量と共に表示される
2. WHEN ユーザーが価格を比較 THEN 正規化価格比較（mg/日あたり）が表示される
3. WHEN ユーザーが安全性を確認 THEN 相互作用・禁忌情報が表示される
4. WHEN ユーザーが商品の信頼性を確認 THEN 研究要約・口コミ要約が表示される
5. WHEN ユーザーが価格動向を確認 THEN 価格履歴グラフが表示される
6. WHEN ユーザーが商品を保存 THEN お気に入り保存機能が利用可能である

### Requirement 5

**User Story:** 成分について学習したいユーザーとして、体系的に整理された成分情報にアクセスしたい

#### Acceptance Criteria

1. WHEN ユーザーが成分ガイドにアクセス THEN ビタミン・ミネラル・ハーブ・アミノ酸などのカテゴリが表示される
2. WHEN ユーザーが目的別検索を利用 THEN 疲労回復・美容・免疫などの目的別カテゴリが表示される
3. WHEN ユーザーが商品を絞り込み THEN 形状別・価格帯別フィルタが利用可能である

### Requirement 6

**User Story:** 複数商品を検討しているユーザーとして、同じ条件で商品を横並び比較したい

#### Acceptance Criteria

1. WHEN ユーザーが比較ビューにアクセス THEN 複数商品の同条件での横比較表が表示される
2. WHEN ユーザーが比較項目を確認 THEN 成分・価格・スコアなどが統一された形式で比較可能である

### Requirement 7

**User Story:** 継続的にサービスを利用するユーザーとして、個人の利用履歴と設定を管理したい

#### Acceptance Criteria

1. WHEN ユーザーがマイページにアクセス THEN お気に入り商品一覧が表示される
2. WHEN ユーザーが履歴を確認 THEN 診断履歴が表示される
3. WHEN ユーザーが価格変動を追跡 THEN 価格アラート設定が利用可能である
4. WHEN ユーザーが有料会員の場合 THEN 有料会員特典が利用可能である

### Requirement 8

**User Story:** サイト利用者として、サービスの詳細情報と法的情報に簡単にアクセスしたい

#### Acceptance Criteria

1. WHEN ユーザーがフッターを確認 THEN 「サプティアとは」リンクが表示される
2. WHEN ユーザーが法的情報を確認 THEN プライバシーポリシー・免責事項・利用規約へのリンクが表示される
3. WHEN ユーザーがサポートを必要とする場合 THEN お問い合わせリンクが表示される

### Requirement 9

**User Story:** サイト運営者として、薬機法に準拠した安全なコンテンツ配信と高いパフォーマンスを維持したい

#### Acceptance Criteria

1. WHEN コンテンツが表示される THEN 薬機法チェック済みの表現のみがSanityから配信される
2. WHEN ユーザーがサイトを利用 THEN コンテンツサニタイズとCSP設定により安全性が確保される
3. WHEN サイトのパフォーマンスを測定 THEN Core Web Vitals合格基準を満たす
4. WHEN ページが読み込まれる THEN LCP（Largest Contentful Paint）が2.5秒以下である
5. WHEN ユーザーがインタラクション THEN FID（First Input Delay）が100ms以下である
6. WHEN レイアウトが表示される THEN CLS（Cumulative Layout Shift）が0.1以下である
