# フロントエンドUI/UX刷新ドキュメント

## 概要

サプティアのフロントエンドUI/UX刷新プロジェクト「suptia-frontend-refresh」の実装詳細と仕様差分をまとめたドキュメントです。

## プロジェクト目標

- **情報設計**: Trivago の検索→結果比較→絞り込み→詳細フローを踏襲
- **ビジュアル**: Apple/xAI の余白広め、洗練、静かなモーション、近未来的トーン
- **品質**: Lighthouse Performance/Best Practices/Accessibility 90+（モバイル）

## 実装完了機能

### 1. デザインシステム基盤

- ✅ Tailwindプリセット + globals.cssにCSS変数定義
- ✅ Apple/xAI風デザイントークン（#2563EB、白基調、Inter + Noto Sans JP）
- ✅ clsx + tailwind-mergeでユーティリティ統制システム
- ✅ 共通UIコンポーネント（Button、Card、Badge）をApple風に実装

### 2. レイアウト基盤（Header/Footer）

- ✅ Apple風Headerコンポーネント（sticky + backdrop-blur）
- ✅ Apple風Footerコンポーネント（シンプルデザイン）
- ✅ LangCurrencySwitcherコンポーネント（ja/en・JPY/USD切替）

### 3. Hero Section（フルスクリーン検索）

- ✅ HeroSearchコンポーネント（min-height: 100dvh）
- ✅ SearchBarコンポーネント（AIサジェスト機能）
- ✅ SuggestChipsコンポーネント（カテゴリ/キーワードチップ）

### 4. Popular Comparisons セクション

- ✅ SectionHeaderコンポーネント（統一見出しデザイン）
- ✅ CompareCardコンポーネント（Apple風ホバー効果）
- ✅ カード3列レイアウト（sm:1→md:2→lg:3）

### 5. 成分ガイド セクション

- ✅ IngredientCardコンポーネント（効能バッジ、エビデンス強度表示）
- ✅ カード3列グリッドレイアウト

### 6. アクセシビリティ対応

- ✅ フォーカス管理（キーボードナビゲーション、skip-link）
- ✅ ARIA属性（aria-label、aria-describedby、ランドマーク要素）
- ✅ コントラスト・画像alt対応（AA準拠）

### 7. レスポンシブデザイン

- ✅ モバイル対応（縦積み、ハンバーガーメニュー）
- ✅ タブレット・デスクトップ対応（レスポンシブグリッド）

### 8. パフォーマンス最適化

- ✅ 画像最適化（Next/Image、WebP対応、遅延読み込み）
- ✅ Core Web Vitals最適化（LCP<2.5s、CLS<0.1、TBT<300ms）

### 9. テスト実装

- ✅ Unit Tests（vitest）- SearchBar、CompareCard、LangCurrencySwitcher
- ✅ E2E Tests（playwright）- Home初期描画、フォーカス管理、言語切替
- ✅ Accessibility Tests（axe-core自動テスト）

## デザインシステム仕様

### カラーパレット

```css
:root {
  --primary-600: #2563eb; /* メインアクセントカラー */
  --bg-primary: #ffffff; /* メイン背景 */
  --gray-600: #52525b; /* Apple風テキストカラー */
}
```

### タイポグラフィ

- **フォント**: Inter + Noto Sans JP
- **ウェイト**: light(300), normal(400), medium(500), semibold(600)
- **スケール**: text-4xl(36px)〜text-sm(14px)

### スペーシングシステム

- **基本単位**: 8px（space-2）
- **階層**: 8px / 12px（space-3）/ 16px（space-4）
- **セクション間**: 24px（space-6）〜 32px（space-8）

### コンポーネント間隔統一

- **カード間隔**: gap-6（24px）
- **セクション間隔**: py-24（96px）
- **コンテナ余白**: px-4 sm:px-6 lg:px-8

## パフォーマンス指標

### Lighthouse スコア（2025年9月14日測定）

- **Performance**: 100/100 ✅
- **Accessibility**: 98/100 ✅
- **Best Practices**: 96/100 ✅
- **SEO**: 100/100 ✅

### Core Web Vitals

- **LCP**: 1,123ms ✅ (基準: <2,500ms)
- **CLS**: 0.0 ✅ (基準: <0.1)
- **TBT**: 0ms ✅ (基準: <300ms)

## 技術スタック

- **Framework**: Next.js 14.2.5 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4.1.12
- **Testing**: Vitest, Playwright, axe-core
- **Performance**: Next/Image, Web Vitals monitoring

## ファイル構成

```
apps/web/src/
├── components/
│   ├── Header.tsx                    # Apple風ヘッダー
│   ├── Footer.tsx                    # Apple風フッター
│   ├── HeroSearch.tsx               # フルスクリーン検索
│   ├── PopularComparisonsSection.tsx # 人気比較セクション
│   ├── IngredientGuideSection.tsx   # 成分ガイドセクション
│   ├── CompareCard.tsx              # 比較カード
│   ├── IngredientCard.tsx           # 成分カード
│   ├── SectionHeader.tsx            # セクション見出し
│   ├── SuggestChips.tsx             # サジェストチップ
│   ├── LanguageCurrencySelector.tsx # 言語通貨切替
│   └── ui/                          # 共通UIコンポーネント
├── lib/
│   ├── accessibility.ts             # アクセシビリティユーティリティ
│   └── performance.ts               # パフォーマンス監視
└── hooks/
    └── usePerformance.ts            # パフォーマンスフック
```

## 今後の拡張予定

### Phase 2: 検索・比較機能

- 検索結果ページ（/search）
- 比較ページ（/compare）
- フィルタリング機能

### Phase 3: 詳細ページ

- 商品詳細ページ（/products/[slug]）
- 成分詳細ページ（/ingredients/[slug]）

## 運用・保守

### 品質保証

- Lighthouse CI による継続的パフォーマンス監視
- アクセシビリティテストの自動実行
- レスポンシブデザインの検証

### 更新手順

1. デザインシステムの変更は `globals.css` で一元管理
2. コンポーネント追加時は対応するテストも作成
3. パフォーマンス影響を考慮した実装

## 参考資料

- [要件定義](.kiro/specs/suptia-frontend-ui-ux/requirements.md)
- [設計書](.kiro/specs/suptia-frontend-ui-ux/design.md)
- [実装計画](.kiro/specs/suptia-frontend-ui-ux/tasks.md)
- [Lighthouse レポート](lighthouse-score-report.md)
