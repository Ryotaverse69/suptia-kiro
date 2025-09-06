# Requirements Document

## Introduction

トップページ（ホーム）のデザインを一新し、ブランド想起と信頼感を高め、検索・比較・診断の主要導線のクリック率を改善する。ファーストビューでの理解・行動（検索/比較/診断）を最短化し、レイアウト/モーション/アクセシビリティ/国際化/パフォーマンスを高基準に統一する。現在の機能は維持しつつ、UI/UXの刷新・品質向上にフォーカスする。

## Requirements

### Requirement 1

**User Story:** As a サイト訪問者, I want ファーストビューで価値提案を理解し主要機能にアクセスできる, so that 迷わずに目的の行動（検索/比較/診断）を開始できる

#### Acceptance Criteria

1. WHEN ユーザーがトップページにアクセス THEN システム SHALL ヒーローセクションにブランド見出し、サブコピー、大型検索バーを表示する
2. WHEN ユーザーがファーストビューを見る THEN システム SHALL 比較・診断・成分ガイドへの主要導線を1スクロール未満で視認可能にする
3. WHEN ユーザーが検索バーにフォーカス THEN システム SHALL AIサジェスト機能と人気商品を表示する
4. WHEN ユーザーがCTAボタンをクリック THEN システム SHALL 適切なページ（/compare, /diagnosis, /ingredients）に遷移する

### Requirement 2

**User Story:** As a サイト訪問者, I want レスポンシブで一貫したデザインシステム, so that どのデバイスでも快適に利用できる

#### Acceptance Criteria

1. WHEN ユーザーがモバイル（0-639px）でアクセス THEN システム SHALL 1列レイアウトで最適化表示する
2. WHEN ユーザーがタブレット（640-1023px）でアクセス THEN システム SHALL 2列レイアウトで表示する
3. WHEN ユーザーがデスクトップ（1024px以上）でアクセス THEN システム SHALL 3-4列レイアウトで表示する
4. WHEN ユーザーがページを表示 THEN システム SHALL 統一されたカラー・タイポグラフィ・スペーシング・シャドウ・角丸を適用する
5. WHEN ユーザーがインタラクション THEN システム SHALL 200-300msの標準化されたモーションを提供する

### Requirement 3

**User Story:** As a 検索ユーザー, I want AIサポート付きの高機能検索バー, so that 効率的に商品を見つけられる

#### Acceptance Criteria

1. WHEN ユーザーが検索バーに入力 THEN システム SHALL 300msデバウンスでAIサジェストを表示する
2. WHEN ユーザーが検索バーにフォーカス THEN システム SHALL 人気商品を最大5件表示する
3. WHEN ユーザーが上下矢印キーを押下 THEN システム SHALL サジェスト項目間を移動する
4. WHEN ユーザーがEnterキーを押下 THEN システム SHALL 選択された項目で検索を実行する
5. WHEN ユーザーがEscapeキーを押下 THEN システム SHALL サジェストを閉じる
6. WHEN ユーザーが検索を実行 THEN システム SHALL 適切な検索結果ページに遷移する

### Requirement 4

**User Story:** As a 商品比較検討者, I want 人気・おすすめ商品の情報, so that 効率的に商品を選択できる

#### Acceptance Criteria

1. WHEN ユーザーがトップページを表示 THEN システム SHALL 人気・おすすめ商品を最大6件表示する
2. WHEN ユーザーが商品カードを見る THEN システム SHALL 商品画像、名称、価格、回分/1日回数、実効コスト/日を表示する
3. WHEN ユーザーがデスクトップで表示 THEN システム SHALL 商品を3列で配置する
4. WHEN ユーザーがタブレットで表示 THEN システム SHALL 商品を2列で配置する
5. WHEN ユーザーがモバイルで表示 THEN システム SHALL 商品を1列で配置する
6. WHEN ユーザーが商品カードをクリック THEN システム SHALL 商品詳細ページに遷移する

### Requirement 5

**User Story:** As a 成分情報を求めるユーザー, I want 成分カテゴリガイド, so that 関心のある成分について学べる

#### Acceptance Criteria

1. WHEN ユーザーがトップページを表示 THEN システム SHALL ビタミン、ミネラル、ハーブ等の成分カテゴリカードを表示する
2. WHEN ユーザーがカテゴリカードを見る THEN システム SHALL アイコン、見出し、短い説明、リンクを表示する
3. WHEN ユーザーがカテゴリカードをクリック THEN システム SHALL /ingredients?category=... に遷移する
4. WHEN ユーザーがカテゴリカードにホバー THEN システム SHALL 視覚的フィードバックを提供する

### Requirement 6

**User Story:** As a サイト利用者, I want 言語・通貨切替機能, so that 自分の環境に合わせて利用できる

#### Acceptance Criteria

1. WHEN ユーザーが言語/通貨ボタンをクリック THEN システム SHALL ドロップダウンメニューを表示する
2. WHEN ユーザーが言語を選択 THEN システム SHALL LocaleContextを更新し表示言語を変更する
3. WHEN ユーザーが通貨を選択 THEN システム SHALL 価格表示をJPY/USDで切り替える
4. WHEN ユーザーが設定を変更 THEN システム SHALL localStorage（suptia-locale, suptia-currency）に保存する
5. WHEN ユーザーがページを再読み込み THEN システム SHALL 保存された設定を復元する

### Requirement 7

**User Story:** As a 障害のあるユーザー, I want アクセシブルなインターフェース, so that 支援技術を使って快適に利用できる

#### Acceptance Criteria

1. WHEN ユーザーがページを表示 THEN システム SHALL 適切なランドマーク（header, main, footer）を提供する
2. WHEN ユーザーがキーボード操作 THEN システム SHALL すべての機能にアクセス可能にする
3. WHEN ユーザーがフォーカス THEN システム SHALL 明確なフォーカスリングを表示する（マウス操作時は非表示）
4. WHEN ユーザーが画像を確認 THEN システム SHALL 適切な代替テキストを提供する
5. WHEN ユーザーがコンテンツを読む THEN システム SHALL 4.5:1以上のコントラスト比を維持する
6. WHEN ユーザーがナビゲーション THEN システム SHALL aria-current、aria-expanded等の適切なARIA属性を提供する
7. WHEN ユーザーが検索機能を使用 THEN システム SHALL combobox/listbox/optionパターンに準拠する

### Requirement 8

**User Story:** As a パフォーマンスを重視するユーザー, I want 高速なページ読み込み, so that ストレスなくサイトを利用できる

#### Acceptance Criteria

1. WHEN ユーザーがページにアクセス THEN システム SHALL LCP（Largest Contentful Paint）を2.0秒以下（理想1.8秒）で達成する
2. WHEN ユーザーがページを表示 THEN システム SHALL CLS（Cumulative Layout Shift）を0.05以下で維持する
3. WHEN ユーザーが初回アクセス THEN システム SHALL 初期JavaScriptバンドルを200KB gzip以下で配信する
4. WHEN ユーザーが画像を表示 THEN システム SHALL 遅延読み込みと適切なサイズ指定を実装する
5. WHEN ユーザーがページを操作 THEN システム SHALL 重要でないJavaScriptを遅延/分割読み込みする

### Requirement 9

**User Story:** As a 国際的なユーザー, I want 多言語・多通貨対応, so that 自分の言語・通貨で利用できる

#### Acceptance Criteria

1. WHEN ユーザーが日本語を選択 THEN システム SHALL すべてのUIテキストを日本語で表示する
2. WHEN ユーザーが英語を選択 THEN システム SHALL すべてのUIテキストを英語で表示する
3. WHEN ユーザーがJPYを選択 THEN システム SHALL 価格を日本円で表示する
4. WHEN ユーザーがUSDを選択 THEN システム SHALL ClientPriceでJPY→USD換算して表示する
5. WHEN ユーザーが言語を変更 THEN システム SHALL <html lang>属性を同期更新する

### Requirement 10

**User Story:** As a セキュリティを重視するユーザー, I want 安全なサイト, so that 安心して利用できる

#### Acceptance Criteria

1. WHEN ユーザーがページにアクセス THEN システム SHALL 既存のCSP（Content Security Policy）を順守する
2. WHEN ユーザーが外部リソースを読み込み THEN システム SHALL Google Fonts・Sanity等の必要なoriginのみを許可する
3. WHEN ユーザーがフォーム入力 THEN システム SHALL 適切な入力検証とサニタイゼーションを実装する

### Requirement 11

**User Story:** As a SEO担当者, I want 検索エンジン最適化, so that サイトの発見性を向上できる

#### Acceptance Criteria

1. WHEN 検索エンジンがページをクロール THEN システム SHALL 適切なタイトル・ディスクリプション・OGタグを提供する
2. WHEN ソーシャルメディアで共有 THEN システム SHALL Twitter Card・Open Graphメタデータを提供する
3. WHEN 検索エンジンが構造化データを読み取り THEN システム SHALL JSON-LDスキーマを維持する
4. WHEN ユーザーがページを表示 THEN システム SHALL 既存のSEO設定を維持する

### Requirement 12

**User Story:** As a 信頼性を重視するユーザー, I want サイトの信頼性指標, so that 安心してサービスを利用できる

#### Acceptance Criteria

1. WHEN ユーザーがトップページを表示 THEN システム SHALL 信頼性を示すステータス/バッジ/実績を表示する
2. WHEN ユーザーが実績帯を見る THEN システム SHALL 「科学的根拠準拠」「価格監視」「ユーザーフィードバック」等を3ポイント表示する
3. WHEN ユーザーが信頼指標を確認 THEN システム SHALL 簡潔なテキストと小アイコンで安心感を提供する
