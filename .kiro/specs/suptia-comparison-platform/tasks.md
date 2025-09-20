# Implementation Plan

## 🚀 実装順序：suptia-comparison-platform

Trivagoの情報設計を踏襲し、Apple/xAIのミニマル＆上質感を実現するサプリメント比較プラットフォームの段階的実装計画。各タスクは要件定義と設計書に基づき、コード生成LLMが実行可能な具体的な指示として構成されている。

## Phase 1: 基盤構築（デザインシステム + レイアウト）

- [x] 1. デザインシステム基盤の構築
  - globals.cssにCSS変数（--color-_, --space-_, --shadow-_, --font-_）を定義
  - Tailwind設定でcontainer、card、focus-ringユーティリティクラスを実装
  - Inter + Noto Sans JPフォント設定とtracking（Hero: tight, Body: normal）
  - 8/12/16px三段階スペーシングシステムとApple風シャドウ（opacity<8%）
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 29.1, 29.3, 29.4, 29.5_

- [x] 2. 基本UIコンポーネントの実装
  - components/ui/Button.tsx（primary/secondary/ghost variants, sm/md/lg sizes）
  - components/ui/Card.tsx（product/ingredient/category variants, hover effects）
  - components/ui/Badge.tsx（ingredient/effect/price/rating variants）
  - components/ui/Input.tsx（検索入力、フォーカスリング、aria-label対応）
  - components/ui/Skeleton.tsx（カード/リスト/フィルタ用の3種類）
  - _Requirements: 8.1, 8.2, 8.3, 29.1, 29.2_

- [x] 3. レイアウト基盤コンポーネントの実装
  - components/layout/Header.tsx（sticky, 透明→白背景トランジション, Apple風backdrop-blur）
  - components/layout/LogoWordmark.tsx（「サプティア | Suptia」テキストロゴ、近未来感細身デザイン）
  - components/layout/Footer.tsx（法的リンク、言語/通貨切替重複設置）
  - components/layout/LangCurrencySwitcher.tsx（ja/en, JPY/USD切替、cookie保存）
  - app/layout.tsx（ルートレイアウト、Header/Footer統合、SEOメタデータ）
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.2, 7.3, 16.1, 16.2, 16.3, 16.4, 16.5_

## Phase 2: ホームページ実装（Hero + 人気比較 + 成分ガイド）

- [x] 4. ヒーローセクションの実装
  - components/search/HeroSearch.tsx（100dvh、中央配置、白ベース+微グラデ背景）
  - 「最適なサプリメントを科学的に比較」キャッチコピー（tracking-tight）
  - ScrollIndicator（下端中央、ゆっくりフェード）
  - 背景：白ベース+放射グラデ+微細ラインパターン（xAI風、淡色）
  - _Requirements: 3.1, 3.2, 3.6, 3.7, 12.1_

- [x] 5. ヒーロー検索フォームの実装
  - components/search/SearchForm.tsx（3列グリッド：フリーワード/カテゴリ/価格+検索ボタン）
  - SearchInput（オートサジェスト、300msデバウンス、最大5件表示）
  - CategorySelect（マルチセレクト、筋肥大/集中力/美容/睡眠等）
  - PriceSlider（予算レンジ、リアルタイム表示、通貨フォーマット）
  - URL生成：/search?q=&goal=&price_min=&price_max=&sort=
  - _Requirements: 3.3, 3.4, 3.5, 8.5, 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 6. 人気比較セクションの実装
  - components/sections/PopularComparisons.tsx（Fold直下、grid-cols-3 lg:grid-cols-4 xl:grid-cols-6）
  - ProductCard（サムネ/名前/主成分ピル最大3/想定効果ピル1個/最安値/比較CTA）
  - ホバー時持ち上げ+シャドウ強化、スペック行開示（用量/形状/容量）
  - 「すべて見る」ボタン（右上）、検索結果ページへの遷移
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 7. 成分ガイドセクションの実装
  - components/sections/IngredientGuide.tsx（成分タグクラウド+効果/安全性/エビデンス指標）
  - 成分タグクリック→/ingredients/[slug]遷移（利点/注意/代表商品3件）
  - 文字数制限：2行ellipsis、160-240字概要、80-120字TL;DR
  - 代表商品選定：人気×評価×関連性スコアリング
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 8. ホームページ統合とレスポンシブ対応
  - app/(marketing)/page.tsx（Hero + PopularComparisons + IngredientGuide統合）
  - レスポンシブグリッド：sm:1列→md:2列→lg:3列→xl:4列→2xl:6列
  - 360px幅対応：Hero検索フォームが1画面内収納
  - container max-w-[1280px] xl:max-w-[1440px]、左右24pxガター
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 35.5_

## Phase 3: 検索結果ページ実装（フィルター + リスト + ソート）

- [x] 9. 検索結果ページ基盤の実装
  - app/search/page.tsx（URL params解析、検索実行、結果表示）
  - SearchParams型定義（query/goals/priceMin/priceMax/sort/page）
  - URL正規化：空文字/未選択パラメータ除外、適切なエンコーディング
  - ページネーション：20件/ページ、rel="prev/next"、canonical集約
  - _Requirements: 6.1, 6.4, 6.6, 11.1, 11.2, 11.3, 11.4, 11.5, 22.1, 22.2, 31.1, 31.2_

- [x] 10. フィルターサイドバーの実装
  - components/search/FilterSidebar.tsx（左280px、価格/成分/目的/在庫/ブランド/並び替え）
  - PriceRangeFilter（スライダー、min/max値表示）
  - IngredientFilter（マルチセレクト、検索機能付き）
  - BrandFilter、GoalFilter（チェックボックス群）
  - ActiveFilterChips（適用中フィルタ表示、個別削除可能）
  - _Requirements: 6.1, 6.2, 13.1, 13.2, 13.3, 13.4, 13.5, 31.3, 31.4, 31.5_

- [x] 11. 検索結果リストの実装
  - components/search/ProductCard.tsx（横並び：画像200x150 + 情報 + 価格）
  - 商品名/ブランド/評価/レビュー数/主成分タグ最大3/効果ピル1個
  - 複数サイト価格比較表示、「最安値を見る」「比較に追加」CTA
  - ホバー時スペック開示（用量/形状/容量）、キーボードアクセス対応
  - StarRating、PriceChip、効果Badge実装
  - _Requirements: 6.2, 6.3, 14.1, 14.2, 14.3, 14.4, 14.5, 35.3_

- [x] 12. ソート・ページネーション機能の実装
  - components/search/SortBar.tsx（おすすめ/価格/評価/人気/新着、sticky対応）
  - ソートロジック：popularity_desc（デフォルト）→rating_desc→price_asc→name_ascタイブレーク
  - ページネーション（20件/ページ、URL同期、戻る/進む対応）
  - 結果数表示、0件時代替提案3件（人気×近似カテゴリ）
  - _Requirements: 6.4, 6.5, 6.6, 21.1, 21.2, 21.3, 21.4, 21.5, 22.3, 22.4, 22.5, 30.1, 30.2_

## Phase 4: データ連携・API実装

- [x] 13. Sanityスキーマ定義の実装
  - Product schema（name/slug/brand/description/image/mainIngredients/prices/rating等）
  - Ingredient schema（name/slug/description/benefits/sideEffects/evidenceLevel等）
  - Brand schema（name/slug/logo/description/website/country）
  - Price embedded schema（store/storeUrl/price/currency/inStock/onSale/lastUpdated）
  - _Requirements: 全般データ要件_

- [x] 14. 検索・フィルタリングAPI実装
  - lib/sanity/queries.ts（GROQ検索クエリ、フィルター条件、ソート、ページング）
  - lib/search/api.ts（searchProducts関数、エラーハンドリング、フォールバック）
  - フリーワード検索：商品名/ブランド/主要成分/キャッチコピー対象
  - フィルター処理：価格帯/成分/目的/ブランド/在庫/セール
  - _Requirements: 21.2, 21.3, 21.4, 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 15. サジェスト・オートコンプリート実装
  - lib/search/suggestions.ts（直近検索/人気キーワード/成分候補）
  - GROQ prefix検索、300msデバウンス、最大5件制限
  - 検索履歴localStorage保存、人気度スコアリング
  - カテゴリ別サジェスト（商品/成分/ブランド）
  - _Requirements: 12.2, 12.3, 8.5_

- [x] 16. 通貨・価格処理実装
  - lib/utils/currency.ts（JPY/USD変換、固定レート、フォーマット）
  - 税込計算（四捨五入）、千桁区切り、通貨記号位置
  - 日次レート更新（0:00 UTC、ビルド時固定/ISR）
  - 価格範囲計算、最安値検索、複数サイト比較
  - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 30.1, 30.3, 35.2_

## Phase 5: 成分詳細ページ・SEO・パフォーマンス

- [x] 17. 成分詳細ページの実装
  - app/ingredients/[slug]/page.tsx（概要160-240字/エビデンスレベル/推奨摂取量/注意事項）
  - 関連商品3件表示（人気×評価×関連性スコア）
  - A/B/Cエビデンスレベル表示、安全性注意書き
  - パンくずナビ、関連成分リンク、検索への戻り導線
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 23.1, 23.2, 23.3, 23.4, 23.5_

- [x] 18. SEO・メタデータ・構造化データ実装
  - lib/utils/seo.ts（JSON-LD生成：Product/ItemList/BreadcrumbList）
  - 動的sitemap.xml生成、robots.txt、canonical URL設定
  - OG/Twitter Card、適切なmeta description/title
  - 404/500軽量エラーページ、検索/ホームへの導線
  - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5, 33.1, 33.2, 33.3, 33.4, 33.5, 35.5_

- [x] 19. 画像最適化・パフォーマンス実装
  - public/placeholders/配下にダミー画像配置（1:1, 16:9アスペクト比）
  - next/image設定（AVIF/WebP、quality=80、適切なsizes属性）
  - LQIP blur効果、遅延読み込み、フォールバック画像
  - Core Web Vitals最適化：LCP<1.0s、CLS<0.02、TTFB<200ms
  - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5, 32.1, 32.2, 32.3, 32.4, 32.5, 18.1, 18.2, 18.3, 18.4, 18.5_

- [x] 20. セキュリティ・コンプライアンス実装
  - CSP設定（Sanity CDN/画像CDN/必須analytics限定）
  - Cookie同意機能（analytics有効化制御）
  - 医療免責表示（成分/商品詳細ページ）
  - プライバシーポリシー、利用規約ページ
  - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5_

## Phase 6: アクセシビリティ・テスト・品質保証

- [x] 21. アクセシビリティ機能実装
  - キーボードナビゲーション（Tab順序：ヘッダー→検索→結果→フィルタ）
  - フォーカスリング（focus:ring-2 focus:ring-[#2563EB]）
  - ARIA属性（aria-label/describedby/expanded/controls/activedescendant）
  - スクリーンリーダー対応（role="region"/status、適切な見出し階層）
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 19.1, 19.2, 19.3, 35.7_

- [x] 22. エラーハンドリング・ローディング状態実装
  - ErrorBoundary（検索エラー、API失敗、フォールバックUI）
  - Suspense境界、Skeleton表示（カード/リスト/フィルタ）
  - 0件結果時の代替提案（3件、重複なし、在庫あり、価格昇順）
  - ネットワークエラー、タイムアウト処理
  - _Requirements: 22.4, 22.5, 33.3, 33.4, 35.4_

- [x] 23. 単体テスト実装
  - components/**tests**/（SearchForm/ProductCard/FilterSidebar/HeroSearch）
  - lib/**tests**/（currency/search/suggestions/seo utilities）
  - Jest + React Testing Library、モック設定
  - アクセシビリティテスト（axe-core統合）
  - _Requirements: テスト要件全般_

- [x] 24. E2Eテスト実装
  - tests/e2e/search-flow.spec.ts（検索→結果→フィルタ→詳細フロー）
  - tests/e2e/keyboard-navigation.spec.　２ts（キーボード完走テスト）
  - tests/e2e/performance.spec.ts（Core Web Vitals測定）
  - Playwright設定、CI統合
  - _Requirements: 35.7, 35.8, 28.1, 28.2, 28.3, 28.4, 28.5_

## Phase 7: 最終統合・監視・デプロイ

- [x] 25. 国際化・通貨切替最終実装
  - copy.json（ja/en静的辞書、全UI文言外部化）
  - 通貨切替時の±5%性能維持確認
  - Cookie/localStorage設定保存、ページリロード時復元
  - 全ページでの表記統一確認（JPY: ￥、3桁区切り、税込）
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 35.2, 35.8_

- [x] 26. 監視・アラート・メトリクス実装
  - Vercel Analytics統合（10%サンプリング）
  - Core Web Vitals監視、SLO違反時GitHub Issues自動作成
  - 検索→結果apdex、比較→詳細CVR追跡
  - パフォーマンスダッシュボード、アラート閾値設定
  - _Requirements: 28.1, 28.2, 28.3, 28.4, 28.5, 34.1, 34.2, 34.3, 34.4, 34.5_

- [x] 27. 最終品質チェック・受け入れテスト
  - Lighthouse監査（Performance/Best Practices/Accessibility 90+）
  - JSON-LD検証（Google Rich Results Test 0エラー）
  - URL復元テスト（フィルタ+ページ+ソート状態完全復元）
  - ソート安定性テスト（10回リロードで同順序）
  - CSP enforce移行（report-only→enforce、0ブロック確認）
  - _Requirements: 19.3, 19.4, 19.5, 35.1, 35.2, 35.3, 35.4, 35.5, 35.6, 35.7, 35.8_

- [x] 28. 本番デプロイ準備・ドキュメント整備
  - 環境変数設定（Sanity/Analytics/外部API）
  - ISR設定（product: 1h, listing: 10m revalidate）
  - CDN・キャッシュ戦略設定
  - 運用ドキュメント、トラブルシューティングガイド作成
  - _Requirements: 32.2, 32.4_

## 🎯 実装優先度

### Phase 1-2: 基盤＋ホームページ（タスク1-8）

デザインシステム、レイアウト、Hero検索、人気比較、成分ガイド

### Phase 3: 検索機能（タスク9-12）

検索結果ページ、フィルター、ソート、ページネーション

### Phase 4: データ連携（タスク13-16）

Sanityスキーマ、API、サジェスト、通貨処理

### Phase 5: SEO・パフォーマンス（タスク17-20）

成分詳細、構造化データ、画像最適化、セキュリティ

### Phase 6-7: 品質保証（タスク21-28）

アクセシビリティ、テスト、監視、デプロイ

## 📋 実装チェックリスト

### ✅ 受け入れ基準確認項目

#### デザイン品質

- [x] **色**: #2563EB アクセント、#FFFFFF背景、#0F172A本文の一貫使用
- [x] **フォント**: Inter + Noto Sans JP、Hero tracking-tight、Body normal
- [x] **レイアウト**: container max-w-[1280px] xl:max-w-[1440px]、24px左右ガター
- [x] **シャドウ**: opacity<8%、Apple風微細シャドウ

#### 機能完全性

- [x] **Hero**: 100dvh完結、下コンテンツ非表示
- [x] **検索**: フリーワード+カテゴリ+価格、URL /search?q=&goal=&price_min=&price_max=
- [x] **フィルター**: 価格/成分/目的/ブランド/在庫、URL同期
- [x] **ソート**: popularity_desc デフォルト、タイブレーク安定

#### パフォーマンス

- [x] **Lighthouse**: Performance/Best Practices/Accessibility 90+（モバイル）
- [x] **Core Web Vitals**: LCP<1.0s、CLS<0.02、TTFB<200ms
- [x] **画像**: next/image AVIF/WebP、quality=80、LQIP blur

#### アクセシビリティ

- [x] **キーボード**: 検索→結果→フィルタ完走可能
- [x] **フォーカス**: focus:ring-2 focus:ring-[#2563EB] 明示
- [x] **ARIA**: 適切なaria-label/describedby/expanded設定
- [x] **axe**: 重大違反0件

#### SEO・技術

- [x] **JSON-LD**: Product/ItemList/BreadcrumbList 0エラー
- [x] **URL復元**: フィルタ+ページ+ソート状態完全復元
- [x] **通貨**: JPY ￥3桁区切り税込統一、±5%性能維持
- [x] **CSP**: Sanity/画像CDN限定、0ブロック

---

**重要**: この実装計画は要件定義35項目と設計書の全要素を網羅し、各タスクがコード生成LLMによって実行可能な具体的指示として構成されています。Phase順に実装することで、段階的に機能を構築し、最終的にLighthouse 90+とTrivagoレベルの情報設計を両立させます。
