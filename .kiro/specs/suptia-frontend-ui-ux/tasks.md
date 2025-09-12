# Implementation Plan

## 🚀 実装順序：Trivago構造 + Apple/xAIテイスト

 - [x] 1. Apple/xAI風デザインシステムの構築
  - Tailwind CSS設定でApple/xAI風デザイントークンを定義（#2563EB、白背景、Inter + Noto Sans JP）
  - clsx + tailwind-mergeでユーティリティ統制システムを実装
  - Apple風アニメーション（transition-all duration-200 ease-out、fadeIn）を定義
  - 共通UIコンポーネント（Button、Card、Badge）をApple風に実装
  - _Requirements: 6.3, 7.1_

 - [x] 2. Header / Footer（共通レイアウト）の実装
  - [x] 2.1 Apple風Headerコンポーネントの作成
    - 左：ロゴ「サプティア / Suptia」のスタイリッシュ配置
    - 中：グロナビ（サプティアとは / 成分ガイド / 比較）
    - 右：言語・通貨切替（モーダル）、検索ショートカット
    - sticky top-0 + backdrop-blur-mdでApple風効果を実装
    - _Requirements: 6.1_

  - [x] 2.2 Apple風Footerコンポーネントの作成
    - サプティアとは / プライバシー / 免責 / 利用規約 / お問い合わせリンク
    - Apple風のシンプルデザイン（白基調方針に合わせライト背景）
    - 重複ナビゲーションの配置
    - _Requirements: 6.1_

  - [x] 2.3 i18n対応の実装
    - 日本語/英語の言語切替機能
    - 通貨表示切替（JPY ¥ / USD $）
    - 言語切替が視認・即反映される仕組み
    - _Requirements: 7.2_

- [x] 3. HeroSearch（100vh＋AIサジェスト）の実装
  - [x] 3.1 フルビューポートHeroSearchコンポーネントの作成
    - min-h-screen でフルビューポート検索を実装
    - Apple/xAI風ヒーローテキスト（font-light、tracking-tight）
    - 中央大検索窓（shadow-[0_8px_30px_rgba(0,0,0,0.06)]）
    - 微粒子エフェクト（CSSのみ、低コスト）
    - _Requirements: 1.1, 1.2_

  - [x] 3.2 AIサジェスト機能の実装
    - Hero検索のフォーカス時にAIサジェスト（意図推定の例文）をドロップダウン表示
    - 人気のカテゴリ・トレンドキーワードの表示
    - ホバー効果（hover:scale-105）とApple風トランジション
    - _Requirements: 1.3, 1.4_

  - [x] 3.3 PopularComparison、IngredientGuide、AIRecommendationセクションの実装
    - スクロール後に表示される下層セクション
    - animate-[fadeIn_0.8s_ease-out]でApple風フェードイン
    - 人気サプリ比較、成分ガイド、AIおすすめの配置
    - _Requirements: 1.4_

- [x] 4. /search（フィルター＋カード＋比較トレイ）の実装
  - [x] 4.1 SearchFiltersコンポーネント（stickyサイドバー）の作成
    - 左サイドバーでsticky top-24配置
    - チップ/スライダー/トグルでフィルター機能
    - 開閉セクションと「条件クリア」ボタン
    - 「AIが選んだ条件」チップ（ワンタップで適用/解除）
    - _Requirements: 2.1, 2.4_

  - [x] 4.2 ResultCardコンポーネント（Trivago風商品カード）の作成
    - 画像 / タイトル / 指標（価格・評価・容量） / CTA（比較に追加 / 最安を見る）
    - ホバーで影・微拡大（Apple寄り：上品で短い）
    - hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1
    - _Requirements: 2.2_

  - [x] 4.3 CompareTrayコンポーネント（画面下固定）の作成
    - 追加中の商品を最大4件までプレビュー→「比較へ」ボタン
    - fixed bottom-0でスライドアップアニメーション
    - transform translate-y-full transition-transform duration-300
    - _Requirements: 2.3_

 - [x] 5. /compare（テーブルの外枠 → 行項目の設計）の実装
  - [x] 5.1 CompareTableコンポーネント（Trivago風比較テーブル）の作成
    - 固定ヘッダー＋横スクロールの比較テーブル
    - Stickyヘッダー、カラム横スクロール、主要指標は固定列
    - sticky top-0 z-10でヘッダー固定、overflow-x-autoで横スクロール
    - _Requirements: 3.1, 3.2_

  - [x] 5.2 比較テーブルの行項目設計
    - 価格履歴/主要成分/容量/最安店舗の表示
    - hover:bg-gray-50/50で行ホバー効果
    - 購入ボタン行の実装
    - _Requirements: 3.3_

  - [x] 5.3 検索→結果→比較→詳細の導線最適化
    - 最短2クリックで成立する導線の実装
    - ページ間遷移のApple風アニメーション
    - ユーザビリティテストの実施
    - _Requirements: 3.4_

 - [x] 6. 成分ガイドと製品詳細の最小要素
  - [x] 6.1 IngredientCardコンポーネント（成分グリッド）の作成
    - 効能バッジ、エビデンス強度（A/B/Cのラベル）
    - カテゴリ別カラーコーディング（ビタミン：青、ミネラル：緑等）
    - /ingredients グリッド一覧→詳細（効能・エビデンス・注意点）
    - _Requirements: 5.1, 5.2_

  - [x] 6.2 ProductHeroコンポーネント（商品詳細ヒーロー）の作成
    - ヒーロー（商品名＋最安価格CTA）
    - 「この製品が合う理由」を要約（Sanity/GROQから）
    - AIレコメンド理由の表示
    - _Requirements: 4.1, 4.3_

  - [x] 6.3 商品詳細ページの基本構成
    - /products/[slug] ヒーロー → 価格一覧 → 成分ブロック → レビュー要約
    - PriceList、IngredientBlock、ReviewSummaryコンポーネント
    - 仮データでの実装（Sanity接続は後工程）
    - _Requirements: 4.2, 4.4_

- [x] 7. パフォーマンス最適化とLighthouse対応
  - [x] 7.1 Core Web Vitals最適化
    - LCP（Largest Contentful Paint）<2.5s の達成
    - FID（First Input Delay）<100ms の達成
    - CLS（Cumulative Layout Shift）<0.1 の達成
    - Next.js Image最適化とWebP対応
    - _Requirements: 7.4_

  - [x] 7.2 Apple風アニメーションの最適化
    - transition-all duration-200 ease-out の統一
    - animate-[fadeIn_0.8s_ease-out] の実装
    - 60fps維持のためのGPUアクセラレーション
    - _Requirements: 6.4_

  - [x] 7.3 バンドルサイズとコード分割の最適化
    - ルートベースのコード分割
    - 動的インポートでの遅延読み込み
    - Tailwind CSSの未使用クラス除去
    - _Requirements: 7.1_

- [x] 8. 品質保証とテスト実装
  - [x] 8.1 Apple風デザインの品質チェック
    - 余白・行間・影が過剰でなく高級感があることの確認（安っぽさNG）
    - shadow-[0_8px_30px_rgba(0,0,0,0.06)] 等の統一
    - font-light、tracking-tight の適切な適用
    - _Requirements: 7.3_

  - [x] 8.2 Trivago構造の導線テスト
    - 1st View は 検索のみが主役（他セクションはスクロールしないと見えない）
    - 検索→結果→比較→詳細の導線が 最短2クリックで成立
    - ユーザビリティテストの実施
    - _Requirements: 3.4, 7.3_

  - [x] 8.3 レスポンシブデザインのテスト
    - モバイル：検索＞比較＞詳細の 1カラム優先、トレイは下固定
    - タブレット：2カラム（フィルター開閉）
    - デスクトップ：3カラム/比較テーブル横スクロール
    - _Requirements: 6.4_

- [x] 9. AIレコメンド機能の統合実装
  - [x] 9.1 Hero検索でのAIサジェスト統合
    - フォーカス時のAIサジェスト（意図推定の例文）ドロップダウン
    - 人気キーワード・トレンドカテゴリの動的表示
    - 検索意図の分析とサジェスト精度向上
    - _Requirements: 1.2, 1.3_

  - [x] 9.2 検索結果でのAI条件チップ統合
    - 「AIが選んだ条件」チップ（ワンタップで適用/解除）
    - AI推奨フィルターの自動適用
    - ユーザー行動に基づく学習機能
    - _Requirements: 2.4_

  - [x] 9.3 商品詳細でのAI推奨理由統合
    - 「この製品が合う理由」要約表示
    - マッチング要因の可視化
    - 信頼度スコアの表示
    - _Requirements: 4.3_

- [x] 10. 最終統合とデプロイ準備
  - [x] 10.1 全ページの統合テスト
    - apps/web/app/(home)/page.tsx に HeroSearch, PopularComparison, IngredientGuide, AIRecommendation を配置
    - /search 結果テンプレ：フィルターサイドバー＋カード一覧＋比較トレイ
    - /compare 比較テーブルの土台と4件までのカラム切替
    - すべて仮データでの動作確認
    - _Requirements: 全要件_

  - [x] 10.2 Tailwindユーティリティ統制の最終確認
    - clsx + tailwind-mergeでの冗長性排除
    - 未使用クラスの除去
    - デザイントークンの一貫性確認
    - _Requirements: 7.1_

  - [x] 10.3 本番デプロイとパフォーマンス検証
    - Vercel本番環境でのデプロイ
    - Lighthouse スコア検証（CLS<0.1, LCP<2.5s 目標）
    - 実機でのレスポンシブテスト
    - _Requirements: 7.4, 8.4_

## 🚀 タスク実行方法

### Kiro IDE内での実行
- 各タスク項目の横にある **「Start task」** ボタンをクリック

### Codex拡張機能での実行
以下のように直接指定してください：

**実行例:**
```
タスク1を実行してください
```
```
「2.1 Apple風Headerコンポーネントの作成」を実装してください
```
```
HeroSearchコンポーネントを作成してください
```

## 📋 実装チェックリスト

### ✅ 受け入れ基準の確認項目

- [x] **1st View は 検索のみが主役**（他セクションはスクロールしないと見えない）
- [x] **検索→結果→比較→詳細の導線が 最短2クリックで成立**
- [x] **余白・行間・影が過剰でなく 高級感がある**（安っぽさNG）
- [x] **Lighthouse/Next Best Practices 満たす**（CLS<0.1, LCP<2.5s 目標）
- [x] **Tailwindユーティリティは冗長禁止**：clsx + tailwind-mergeで統制
- [x] **文言（日本語/英語）は i18n 対応**（言語切替が視認・即反映）

### 🎨 デザイン品質チェック

- [ ] **色**: #2563EB（blue-600）の一貫使用
- [ ] **背景**: 常に白 #FFFFFF
- [ ] **フォント**: Inter + Noto Sans JP（字間や行間はApple寄りに広め）
- [ ] **角丸/影**: rounded-2xl / shadow-[0_8px_30px_rgba(0,0,0,0.06)]
- [ ] **モーション**: transition-all duration-200 ease-out
- [ ] **余白**: セクション上下 py-16 md:py-24、グリッド gap-6 md:gap-8

### 📱 レスポンシブ確認

- [ ] **モバイル**: 検索＞比較＞詳細の 1カラム優先、トレイは下固定
- [ ] **タブレット**: 2カラム（フィルター開閉）
- [ ] **デスクトップ**: 3カラム/比較テーブル横スクロール

### 🧠 AIレコメンド機能確認

- [ ] **Hero検索**: フォーカス時にAIサジェスト（意図推定の例文）をドロップダウン表示
- [ ] **検索結果**: 「AIが選んだ条件」チップ（ワンタップで適用/解除）
- [ ] **商品詳細**: 「この製品が合う理由」を要約（Sanity/GROQから）

---

**重要**: この実装計画は **Trivago構造をそのまま活かしつつ、Apple/xAIの質感で"高級＆未来感"** を付与することを目的としています。デザインの「軽さ/安っぽさ」を徹底的に排除し、余白とタイポの美しさで勝負します。
