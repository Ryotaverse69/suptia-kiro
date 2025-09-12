# Requirements Document

## Introduction

サプティアのフロントエンドUI/UX再設計：**Trivago構造 + Apple/xAIテイスト**を実装する機能です。

**🎯 ゴール**
- 構造は Trivago をほぼ踏襲（検索→結果比較→絞り込み→詳細）
- ビジュアルと所作は Apple/xAI（余白広め、洗練、静かなモーション、未来的トーン）
- 1st View は 検索主導。以降は人気比較/成分ガイド/AIおすすめの順で下層に展開

**🚫 NG（はっきり禁止）**
- 濃色テーマ/ダーク背景（今回は白基調固定）
- ド派手なモーション、過度なグラデ、ギミックの入れ過ぎ
- 1st Viewに情報を詰め込みすぎる
- デザインの「軽さ/安っぽさ」を徹底的に排除

### 技術スタック

- Next.js 14.2.5 (App Router)
- React 18.2.0
- TypeScript 5
- Tailwind CSS 4.1.12
- Sanity CMS 3.99.0 (GROQクエリ)
- Vitest / Playwright / ESLint / Prettier

### デザイン要件

**🎨 デザイントークン（Tailwind）**
- **色**: --primary: #2563EB（blue-600 ベース、hover: blue-700）
- **テキスト**: --ink: #0A0A0A（本文濃灰） / --muted: #6B7280
- **背景**: 常に白 #FFFFFF
- **フォント**: Inter + Noto Sans JP（字間や行間はApple寄りに広め）
- **角丸/影**: rounded-2xl / shadow-[0_8px_30px_rgba(0,0,0,0.06)]
- **モーション**: transition-all duration-200 ease-out
- **余白**: セクション上下 py-16 md:py-24、グリッド gap-6 md:gap-8

**📱 レスポンシブ**
- **モバイル**: 検索＞比較＞詳細の 1カラム優先、トレイは下固定
- **タブレット**: 2カラム（フィルター開閉）
- **デスクトップ**: 3カラム/比較テーブル横スクロール

## Requirements

### Requirement 1

**User Story:** サイト訪問者として、Trivago風の検索主導インターフェースでサプリメントを効率的に発見したい

#### Acceptance Criteria

1. WHEN ユーザーがトップページにアクセス THEN HeroSearch（フルビューポート、中央に大型検索＋AIサジェスト）が表示される
2. WHEN ユーザーが検索窓にフォーカス THEN AIサジェスト（意図推定の例文）がドロップダウン表示される
3. WHEN ユーザーがスクロール THEN PopularComparison（人気サプリの比較一覧＋主要指標）が表示される
4. WHEN ユーザーがさらにスクロール THEN IngredientGuide（成分カードグリッド）とAIRecommendation（「あなた向け」パーソナライズ枠）が表示される

### Requirement 2

**User Story:** 検索結果を確認するユーザーとして、Trivago風のフィルタリングと比較機能で効率的に商品を絞り込みたい

#### Acceptance Criteria

1. WHEN ユーザーが検索を実行 THEN /search（検索結果）ページに遷移する
2. WHEN ユーザーが検索結果ページを確認 THEN 左：フィルター（目的、成分、価格、評価、ブランド等）、右：結果リスト（カード/リスト切替、並び替え、比較トレイに追加）が表示される
3. WHEN ユーザーが商品を比較に追加 THEN CompareTray（画面下固定）に追加中の商品を最大4件までプレビュー表示される
4. WHEN ユーザーが/search上部を確認 THEN 「AIが選んだ条件」チップ（ワンタップで適用/解除）が表示される

### Requirement 3

**User Story:** 複数商品を比較検討するユーザーとして、Trivago風の比較テーブルで詳細な横並び比較をしたい

#### Acceptance Criteria

1. WHEN ユーザーが比較トレイから「比較へ」ボタンをクリック THEN /compare（比較）ページに遷移する
2. WHEN ユーザーが比較ページを確認 THEN 固定ヘッダー＋横スクロールの比較テーブル（価格履歴/主要成分/容量/最安店舗）が表示される
3. WHEN ユーザーがテーブルを操作 THEN Stickyヘッダー、カラム横スクロール、主要指標は固定列で表示される
4. WHEN ユーザーが検索→結果→比較→詳細の導線を利用 THEN 最短2クリックで成立する

### Requirement 4

**User Story:** 商品詳細を確認するユーザーとして、ヒーロー型レイアウトで価格・成分・レビューを効率的に把握したい

#### Acceptance Criteria

1. WHEN ユーザーが/products/[slug]（製品詳細）にアクセス THEN ヒーロー（商品名＋最安価格CTA）が表示される
2. WHEN ユーザーがスクロール THEN 価格一覧 → 成分ブロック → レビュー要約の順で表示される
3. WHEN ユーザーが製品詳細を確認 THEN 「この製品が合う理由」を要約（Sanity/GROQから）が表示される
4. WHEN ユーザーがAIレコメンドを確認 THEN 意図推定に基づく推奨理由が表示される

### Requirement 5

**User Story:** 成分について学習したいユーザーとして、/ingredientsでグリッド一覧から詳細情報にアクセスしたい

#### Acceptance Criteria

1. WHEN ユーザーが/ingredients（成分ガイド）にアクセス THEN グリッド一覧が表示される
2. WHEN ユーザーが成分を選択 THEN 詳細（効能・エビデンス・注意点）が表示される
3. WHEN ユーザーがIngredientCardを確認 THEN 効能バッジ、エビデンス強度（A/B/Cのラベル）が表示される
4. WHEN ユーザーがIngredientDetailを確認 THEN 科学的根拠と安全性情報が表示される

### Requirement 6

**User Story:** サイト全体を利用するユーザーとして、Apple/xAI風の洗練されたレイアウトとナビゲーションを体験したい

#### Acceptance Criteria

1. WHEN ユーザーがHeaderを確認 THEN 左：ロゴ「サプティア / Suptia」、中：グロナビ（サプティアとは / 成分ガイド / 比較）、右：言語・通貨切替（モーダル）、検索ショートカットが表示される
2. WHEN ユーザーがFooterを確認 THEN サプティアとは / プライバシー / 免責 / 利用規約 / お問い合わせが表示される
3. WHEN ユーザーがページ遷移 THEN セクション表示時 animate-[fadeIn_.5s_ease-out]が適用される
4. WHEN ユーザーがインタラクション THEN ホバーで影・微拡大（Apple寄り：上品で短い）が適用される

### Requirement 7

**User Story:** 開発者として、Tailwindユーティリティを統制し、高品質なコードベースを維持したい

#### Acceptance Criteria

1. WHEN コンポーネントを実装 THEN Tailwindユーティリティは冗長禁止：clsx + tailwind-mergeで統制される
2. WHEN 文言を表示 THEN 日本語/英語は i18n 対応（言語切替が視認・即反映）される
3. WHEN デザインを適用 THEN 余白・行間・影が過剰でなく高級感がある（安っぽさNG）
4. WHEN パフォーマンスを測定 THEN Lighthouse/Next Best Practices 満たす（CLS<0.1, LCP<2.5s 目標）

### Requirement 8

**User Story:** サイト運営者として、薬機法に準拠した安全なコンテンツ配信と高いパフォーマンスを維持したい

#### Acceptance Criteria

1. WHEN コンテンツが表示される THEN 薬機法チェック済みの表現のみがSanityから配信される
2. WHEN ユーザーがサイトを利用 THEN コンテンツサニタイズとCSP設定により安全性が確保される
3. WHEN サイトのパフォーマンスを測定 THEN Core Web Vitals合格基準を満たす（CLS<0.1, LCP<2.5s 目標）
4. WHEN ユーザーがサイト全体を利用 THEN Trivago構造 + Apple/xAI風の高級感あるデザインが一貫して適用される

## 🧪 サンプル実装の期待（最低限）

1. **apps/web/app/(home)/page.tsx** に HeroSearch, PopularComparison, IngredientGuide, AIRecommendation を配置
2. **/search** 結果テンプレ：フィルターサイドバー＋カード一覧＋比較トレイ
3. **/compare** 比較テーブルの土台と4件までのカラム切替
4. すべて **仮データでOK**（Sanity接続は後工程）

## 🚀 実装順の提案（小さく成功）

1. Header / Footer（共通レイアウト）
2. HeroSearch（100vh＋AIサジェスト）
3. /search（フィルター＋カード＋比較トレイ）
4. /compare（テーブルの外枠 → 行項目の設計）
5. 成分ガイドと製品詳細の最小要素
