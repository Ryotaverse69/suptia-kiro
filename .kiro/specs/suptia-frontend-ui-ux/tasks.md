# Implementation Plan

## 🚀 実装順序：suptia-frontend-refresh

- [x] 1. デザインシステム基盤の構築
  - Tailwindプリセット＋globals.cssにCSS変数（--brand, --radius, --shadow-soft）を定義
  - Apple/xAI風デザイントークン（#2563EB、白基調、Inter + Noto Sans JP）
  - clsx + tailwind-mergeでユーティリティ統制システム
  - 共通UIコンポーネント（Button、Card、Badge）をApple風に実装
  - _Requirements: 7.1_

- [x] 2. レイアウト基盤（Header/Footer）の実装
  - [x] 2.1 Apple風Headerコンポーネントの作成
    - 左：「サプティア / Suptia」ロゴ（近未来ライティング表現）
    - 右：グロナビ（製品比較・成分ガイド・価格アラート・サプティアとは）
    - 言語/通貨スイッチャ（LangCurrencySwitcher）
    - sticky top-0 + backdrop-blur-mdでApple風効果
    - _Requirements: 6.1_

  - [x] 2.2 Apple風Footerコンポーネントの作成
    - ヘッダー同項目＋法的リンク（プライバシー・免責・利用規約・お問い合わせ）
    - Apple風のシンプルデザイン（白基調）
    - _Requirements: 6.2_

  - [x] 2.3 LangCurrencySwitcherコンポーネントの実装
    - ja/en・JPY/USD切替でテキスト/価格表示が切り替わる（モック）
    - 言語切替が視認・即反映される仕組み
    - _Requirements: 7.3_

- [x] 3. Hero Section（フルスクリーン検索）の実装
  - [x] 3.1 HeroSearchコンポーネントの作成
    - min-height: 100dvh でフルスクリーン表示
    - 中央に大型検索バー（AIレコメンドON）
    - Apple/xAI風ヒーローテキスト（font-light、tracking-tight）
    - _Requirements: 1.1, 1.2_

  - [x] 3.2 SearchBarコンポーネントの実装
    - AIサジェスト機能（フォーカス時にドロップダウン表示）
    - 検索入力とオートコンプリート
    - Apple風のスタイリング（shadow-sm、rounded-xl）
    - _Requirements: 1.3_

  - [x] 3.3 SuggestChipsコンポーネントの実装
    - 下部にカテゴリ/キーワードチップ
    - ホバー効果（hover:scale-105）とApple風トランジション
    - _Requirements: 1.2_

- [x] 4. Popular Comparisons セクションの実装
  - [x] 4.1 SectionHeaderコンポーネントの作成
    - 統一されたセクション見出しデザイン
    - Apple風のタイポグラフィ
    - _Requirements: 1.4_

  - [x] 4.2 CompareCardコンポーネントの作成
    - 画像・名称・最安値・主要成分バッジ・CTA
    - ホバーで影・微拡大（Apple寄り：上品で短い）
    - hover:shadow-lg hover:-translate-y-1
    - _Requirements: 1.4_

  - [x] 4.3 Popular Comparisons セクションの配置
    - カード3列レイアウト（sm:1→md:2→lg:3）
    - 適切な余白とスペーシング
    - _Requirements: 1.4_

- [x] 5. 成分ガイド セクションの実装
  - [x] 5.1 IngredientCardコンポーネントの作成
    - 成分カテゴリ別のカードデザイン
    - 効能バッジ、エビデンス強度表示
    - Apple風のカードスタイル
    - _Requirements: 1.4_

  - [x] 5.2 成分ガイド セクションの配置
    - カード3列グリッドレイアウト
    - セクション間の適切な余白
    - _Requirements: 1.4_

- [x] 6. アクセシビリティ対応の実装
  - [x] 6.1 フォーカス管理の実装
    - キーボードナビゲーション対応
    - フォーカスリング明示
    - skip-link の実装
    - _Requirements: 8.1, 8.2_

  - [x] 6.2 ARIA属性の実装
    - 適切なaria-label、aria-describedby
    - ランドマーク要素の設定
    - スクリーンリーダー対応
    - _Requirements: 8.1_

  - [x] 6.3 コントラスト・画像alt対応
    - コントラスト AA準拠の確認
    - 画像alt必須の実装
    - _Requirements: 7.2_

- [x] 7. レスポンシブデザインの実装
  - [x] 7.1 モバイル対応
    - Hero: モバイルは縦積み
    - ナビ: モバイルはハンバーガー
    - カード: sm:1列表示
    - _Requirements: 6.4_

  - [x] 7.2 タブレット・デスクトップ対応
    - md:2列、lg:3列のレスポンシブグリッド
    - 1280px時の中央配置・左右余白均等
    - _Requirements: 6.3_

- [x] 8. パフォーマンス最適化
  - [x] 8.1 画像最適化
    - Next/Imageでダミー画像（/public/placeholders/\*）
    - WebP対応、遅延読み込み
    - _Requirements: 7.4_

  - [x] 8.2 Core Web Vitals最適化
    - LCP（Largest Contentful Paint）<2.5s
    - CLS（Cumulative Layout Shift）<0.1
    - FID（First Input Delay）<100ms
    - _Requirements: 7.4_

- [x] 9. テスト実装
  - [x] 9.1 Unit Tests (vitest)
    - SearchBarの表示/入力/サジェスト表示
    - CompareCardのプロパティ表示
    - LangCurrencySwitcherの切替動作
    - _Requirements: Tests_

  - [x] 9.2 E2E Tests (playwright)
    - Home初期描画
    - タブ移動でのフォーカス管理
    - 言語切替UI反映
    - _Requirements: Tests_

  - [x] 9.3 Accessibility Tests
    - axe-core自動テスト（重大違反なし）
    - キーボードナビゲーションテスト
    - _Requirements: 8.3_

- [x] 10. 最終統合とデプロイ準備
  - [x] 10.1 Lighthouse スコア検証
    - Performance/Best Practices/Accessibility 90+（モバイル）
    - Core Web Vitals合格基準の確認
    - _Requirements: 7.4_

  - [x] 10.2 品質チェック
    - 仕様差分がdocsに反映
    - コンポーネントの間隔が8/12/16の階層で統一
    - Apple/xAI風の高級感あるデザインの一貫性
    - _Requirements: 6.3, 6.4_

  - [x] 10.3 デプロイ準備
    - PR作成・automerge有効
    - Vercel Previewで確認URLをPRに掲示
    - 本番環境での最終確認
    - _Requirements: DoD_

## 🎯 実装優先度

### Phase 1: 基盤構築

- タスク1: デザインシステム基盤
- タスク2: レイアウト基盤（Header/Footer）

### Phase 2: コア機能

- タスク3: Hero Section（フルスクリーン検索）
- タスク4: Popular Comparisons セクション

### Phase 3: 拡張機能

- タスク5: 成分ガイド セクション
- タスク6: アクセシビリティ対応

### Phase 4: 品質保証

- タスク7: レスポンシブデザイン
- タスク8: パフォーマンス最適化
- タスク9: テスト実装
- タスク10: 最終統合とデプロイ

## 📋 実装チェックリスト

### ✅ 受け入れ基準の確認項目

- [x] **Heroが1画面で完結し、スクロールしないと次セクションが見えない**
- [x] **1280px時に主コンテナが中央、左右余白が均等**
- [x] **コンポーネントの間隔が8/12/16の階層で統一**
- [x] **Lighthouse Performance/Best Practices/Accessibility 90+（モバイル）**
- [x] **キーボードのみで検索→比較→詳細カードCTAまで到達できる**
- [x] **ja/en・JPY/USD切替でテキスト/価格表示が切り替わる（モック可）**

### 🎨 デザイン品質チェック

- [x] **色**: #2563EB（アクセント）の一貫使用
- [x] **背景**: 常に白 #FFFFFF
- [x] **フォント**: Inter + Noto Sans JP（Apple寄りのタイポ）
- [x] **角丸**: lg～xl（過度でない範囲）
- [x] **影**: 極薄（shadow-sm/md程度）
- [x] **余白**: 広めに設定（Apple風）

### 📱 レスポンシブ確認

- [x] **カード列**: sm:1→md:2→lg:3
- [x] **Hero**: モバイルは縦積み
- [x] **ナビ**: モバイルはハンバーガー

### 🧠 機能確認

- [x] **Hero検索**: 中央に大型検索バー（AIレコメンドON）
- [x] **AIサジェスト**: フォーカス時にドロップダウン表示
- [x] **カテゴリチップ**: 下部にカテゴリ/キーワードチップ
- [x] **比較カード**: 画像・名称・最安値・主要成分バッジ・CTA

---

**重要**: この実装計画は **Trivagoの情報設計を踏襲しつつ、Apple/xAIのミニマルで高級感あるUI** を実現することを目的としています。まずトップと比較セクションを完成度高く実装し、段階的に機能を拡張していきます。
