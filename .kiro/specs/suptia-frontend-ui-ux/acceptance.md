# Acceptance Criteria

## 🎯 Core Acceptance Criteria

### Hero Section

- [ ] **Heroが1画面で完結し、スクロールしないと次セクションが見えない**
- [ ] **min-height: 100dvh でフルスクリーン表示**
- [ ] **中央に大型検索バー（AIレコメンドON）**
- [ ] **下部にカテゴリ/キーワードチップ**

### Layout & Spacing

- [ ] **1280px時に主コンテナが中央、左右余白が均等**
- [ ] **コンポーネントの間隔が8/12/16の階層で統一**
- [ ] **セクション間の余白が適切（py-16 md:py-24）**

### Performance

- [ ] **Lighthouse Performance 90+（モバイル）**
- [ ] **Lighthouse Best Practices 90+（モバイル）**
- [ ] **Lighthouse Accessibility 90+（モバイル）**
- [ ] **Core Web Vitals合格（CLS<0.1, LCP<2.5s）**

### Accessibility

- [ ] **キーボードのみで検索→比較→詳細カードCTAまで到達できる**
- [ ] **フォーカス管理/aria属性/skip-linkが適切に機能**
- [ ] **axeでアクセシビリティチェック時に重大違反なし**
- [ ] **コントラスト AA準拠**

### Internationalization

- [ ] **ja/en・JPY/USD切替でテキスト/価格表示が切り替わる（モック可）**
- [ ] **言語切替が視認・即反映される**
- [ ] **通貨表示が適切にフォーマットされる**

### Visual Design

- [ ] **白基調、アクセント#2563EB の一貫使用**
- [ ] **Apple/xAI風の余白広め、洗練されたデザイン**
- [ ] **影は極薄（shadow-sm/md程度）**
- [ ] **角丸は lg～xl（過度でない範囲）**
- [ ] **Inter + Noto Sans JP フォントの適用**

### Components

- [ ] **Header: 左ロゴ、右グロナビ＋言語/通貨スイッチャ**
- [ ] **Footer: 法的リンク＋重複ナビ**
- [ ] **SearchBar: AIサジェスト、タグチップ**
- [ ] **CompareCard: 画像・名称・最安値・主要成分バッジ・CTA**
- [ ] **SectionHeader: 統一されたセクション見出し**

### Responsive Design

- [ ] **カード列: sm:1→md:2→lg:3**
- [ ] **Hero: モバイルは縦積み**
- [ ] **ナビ: モバイルはハンバーガー**

### Motion & Interaction

- [ ] **フェード/スライドは100–200ms**
- [ ] **標準カーブのイージング**
- [ ] **ホバーで影・微拡大（Apple寄り：上品で短い）**

## 🧪 Testing Criteria

### Unit Tests (vitest)

- [ ] **SearchBarの表示/入力/サジェスト表示**
- [ ] **CompareCardのプロパティ表示**
- [ ] **LangCurrencySwitcherの切替動作**

### E2E Tests (playwright)

- [ ] **Home初期描画**
- [ ] **タブ移動でのフォーカス管理**
- [ ] **言語切替UI反映**
- [ ] **検索→比較→詳細の導線**

### Accessibility Tests

- [ ] **axe-core自動テスト**
- [ ] **キーボードナビゲーション**
- [ ] **スクリーンリーダー対応**

## 📦 Deliverables Checklist

### Files Structure

- [ ] **apps/web/src/app/(home)/page.tsx**
- [ ] **apps/web/src/components/layout/Header.tsx**
- [ ] **apps/web/src/components/layout/Footer.tsx**
- [ ] **apps/web/src/components/search/SearchBar.tsx**
- [ ] **apps/web/src/components/search/SuggestChips.tsx**
- [ ] **apps/web/src/components/compare/CompareCard.tsx**
- [ ] **apps/web/src/components/ui/SectionHeader.tsx**
- [ ] **apps/web/src/components/ui/LangCurrencySwitcher.tsx**

### Styles

- [ ] **apps/web/src/app/globals.css にCSS変数定義**
- [ ] **tailwind.config.js にカスタムトークン**

### Assets

- [ ] **public/placeholders/ にダミー画像**
- [ ] **SVGロゴダミー（後で置換しやすい構造）**

### Documentation

- [ ] **仕様差分がdocsに反映**
- [ ] **コンポーネントのJSDoc**
- [ ] **README更新**

## 🚀 Deployment Criteria

### Vercel Preview

- [ ] **PR作成・automerge有効**
- [ ] **Vercel Previewで確認URLをPRに掲示**
- [ ] **プレビュー環境での動作確認**

### Production Ready

- [ ] **本番環境でのパフォーマンステスト**
- [ ] **クロスブラウザテスト**
- [ ] **モバイル実機テスト**

---

**重要**: これらの受け入れ基準をすべて満たすことで、Trivagoの情報設計を踏襲しつつ、Apple/xAIのミニマルで高級感あるUIが完成します。
