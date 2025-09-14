# Requirements Document

## Introduction

**Codename: suptia-frontend-refresh**

サプティアのフロントエンドUI/UX刷新：**Trivagoの情報設計を踏襲しつつ、Apple/xAIのミニマルで高級感あるUIへ刷新**

**🎯 ゴール**

- 情報設計：Trivago の検索→結果比較→絞り込み→詳細フローを踏襲
- ビジュアル：Apple/xAI の余白広め、洗練、静かなモーション、近未来的トーン
- 優先度：まずトップと比較セクションを完成度高く実装
- 品質：Lighthouse Performance/Best Practices/Accessibility 90+（モバイル）

**🚫 NG（はっきり禁止）**

- 濃色テーマ/ダーク背景（白基調固定）
- 過度なモーション、グラデーション、ギミック
- 1st Viewに情報を詰め込みすぎる
- デザインの「軽さ/安っぽさ」を徹底的に排除

### 技術スタック

- Next.js 14.2.5 (App Router)
- React 18.2.0
- TypeScript 5
- Tailwind CSS 4.1.12
- Sanity CMS 3.99.0 (GROQクエリ)
- Vitest / Playwright / ESLint / Prettier

### レイアウト・デザイン要件

**📐 Layout**

- **コンテナ幅**: 1280px（xl）基準、最大1440px
- **左右余白**: モバイル16px / タブレット24px / デスクトップ32px
- **セクション間隔**: 8/12/16の階層で統一

**🎨 Visual Design**

- **色**: 白基調、アクセント#2563EB、極薄影
- **フォント**: Inter + Noto Sans JP（Apple寄りのタイポ）
- **角丸**: lg～xl（過度でない範囲）
- **余白**: 広めに設定（Apple風）
- **影**: 極薄（shadow-sm/md程度）

**🎬 Motion**

- **トランジション**: フェード/スライドは100–200ms
- **イージング**: 標準カーブ使用
- **制限**: パララックス等は抑制

**📱 Responsive**

- **カード列**: sm:1→md:2→lg:3
- **Hero**: モバイルは縦積み
- **ナビ**: モバイルはハンバーガー

## Requirements

### Requirement 1

**User Story:** サイト訪問者として、フルスクリーンHeroで検索主導の体験を得たい

#### Acceptance Criteria

1. WHEN ユーザーがトップページにアクセス THEN Hero（min-height: 100dvh）が1画面で完結し、スクロールしないと次セクションが見えない
2. WHEN ユーザーがHeroを確認 THEN 中央に大型検索バー（AIレコメンドON）と下部にカテゴリ/キーワードチップが表示される
3. WHEN ユーザーが検索窓にフォーカス THEN AIサジェスト（意図推定の例文）がドロップダウン表示される
4. WHEN ユーザーがスクロール THEN Popular Comparisons セクション → 成分ガイド セクション（カード3列）が順次表示される

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

1. WHEN ユーザーがHeaderを確認 THEN 左：「サプティア / Suptia」ロゴ（近未来ライティング表現）、右：グロナビ（製品比較・成分ガイド・価格アラート・サプティアとは）と言語/通貨スイッチャが表示される
2. WHEN ユーザーがFooterを確認 THEN ヘッダー同項目＋「サプティアとは」「プライバシー」「免責」「利用規約」「お問い合わせ」が表示される
3. WHEN ユーザーが1280px時にサイトを確認 THEN 主コンテナが中央、左右余白が均等、コンポーネントの間隔が8/12/16の階層で統一される
4. WHEN ユーザーがインタラクション THEN ホバーで影・微拡大（Apple寄り：上品で短い）が適用される

### Requirement 7

**User Story:** 開発者として、高品質なコードベースとアクセシビリティを維持したい

#### Acceptance Criteria

1. WHEN コンポーネントを実装 THEN Tailwindプリセット＋globals.cssにCSS変数（--brand, --radius, --shadow-soft）が定義される
2. WHEN アクセシビリティを確認 THEN コントラスト AA、キーボード操作、フォーカスリング明示、画像alt必須、ariaラベル完備される
3. WHEN 言語/通貨を切替 THEN ja/en・JPY/USD切替でテキスト/価格表示が切り替わる（モック可）
4. WHEN パフォーマンスを測定 THEN Lighthouse Performance/Best Practices/Accessibility 90+（モバイル）を達成する

### Requirement 8

**User Story:** ユーザーとして、キーボードのみでサイト全体を操作できるアクセシブルな体験を得たい

#### Acceptance Criteria

1. WHEN ユーザーがキーボードのみで操作 THEN 検索→比較→詳細カードCTAまで到達できる
2. WHEN ユーザーがフォーカス移動 THEN フォーカス管理/aria属性/skip-linkが適切に機能する
3. WHEN ユーザーがaxeでアクセシビリティチェック THEN 重大違反がない
4. WHEN ユーザーがサイト全体を利用 THEN Trivago構造 + Apple/xAI風の高級感あるデザインが一貫して適用される

## 🚀 Build Phase 1 (Deliverables)

### Pages

- **/** : Hero（検索バー＋タグチップ）→ Popular Comparisons セクション → 成分ガイド セクション（カード3列）

### Components

- **Header, Footer, SearchBar, SuggestChips, CompareCard, SectionHeader, LangCurrencySwitcher**

### Styles

- **Tailwindプリセット＋globals.cssにCSS変数（--brand, --radius, --shadow-soft）**

### Accessibility

- **フォーカス管理/aria属性/skip-link**

### Placeholder

- **ロゴ**: SVGダミー（後で置換しやすい構造）
- **画像**: Next/Imageでダミー（/public/placeholders/\*）

### Tests

- **vitest**: SearchBarの表示/入力/サジェスト表示
- **playwright**: Home初期描画、タブ移動、言語切替UI反映

## ✅ Definition of Done

- 仕様差分がdocsに反映
- Homeトップ＆比較セクションが完成、Lighthouse 90+（モバイル）
- A11yチェック（axe）に重大違反なし
- i18n/通貨はモックで切替動作
- PR作成・automerge有効、Vercel Previewで確認URLをPRに掲示
