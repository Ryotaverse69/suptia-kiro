# Requirements Document

## Introduction

サプティア（Suptia）のホームページを、Apple・x.aiのようなリッチで洗練されたデザインに一新する。白を基調とし近未来的なブルーをアクセントカラーとして、シンプルでスタイリッシュな見た目を実現する。トップページは検索窓を画面全体で強調し、スクロールしないと次のセクションが見えない設計とする。安っぽくない高品質なUIで、ブランドの信頼性と先進性を表現する。

## Requirements

### Requirement 1

**User Story:** As a サイト訪問者, I want Appleやx.aiのようなリッチで洗練されたファーストビュー, so that サプティアの先進性と信頼性を感じて利用したくなる

#### Acceptance Criteria

1. WHEN ユーザーがトップページにアクセス THEN システム SHALL 白を基調とした背景に近未来的なブルーアクセントを使用する
2. WHEN ユーザーがファーストビューを見る THEN システム SHALL 「サプティア（Suptia）」の両表記と近未来的ロゴを表示する
3. WHEN ユーザーがファーストビューを見る THEN システム SHALL 検索窓を画面全体で強調し、他の要素は最小限にする
4. WHEN ユーザーがファーストビューを見る THEN システム SHALL スクロールしないと次のセクションが見えない全画面設計にする
5. WHEN ユーザーがページを表示 THEN システム SHALL Appleのような洗練されたタイポグラフィとスペーシングを適用する

### Requirement 2

**User Story:** As a サイト訪問者, I want 近未来的で高品質なデザインシステム, so that 安っぽくない印象でサービスを信頼できる

#### Acceptance Criteria

1. WHEN ユーザーがページを表示 THEN システム SHALL 白（#FFFFFF）を基調カラーとして使用する
2. WHEN ユーザーがアクセント要素を見る THEN システム SHALL 近未来的なブルー（#0066FF系）をアクセントカラーとして使用する
3. WHEN ユーザーがインタラクション要素を操作 THEN システム SHALL 滑らかで上品なアニメーション（300-500ms ease-out）を提供する
4. WHEN ユーザーがコンテンツを見る THEN システム SHALL 十分な余白とエレガントなシャドウ効果を適用する
5. WHEN ユーザーがボタンやカードを見る THEN システム SHALL 微細なグラデーションとガラス効果を使用する

### Requirement 3

**User Story:** As a サイト訪問者, I want 全画面を活用した印象的な検索体験, so that 迷わずに商品検索を開始できる

#### Acceptance Criteria

1. WHEN ユーザーがファーストビューを見る THEN システム SHALL 検索窓を画面中央に大きく配置する
2. WHEN ユーザーが検索窓にフォーカス THEN システム SHALL 近未来的なブルーのフォーカスリングとアニメーションを表示する
3. WHEN ユーザーが検索窓を操作 THEN システム SHALL プレースホルダーテキスト「サプリメント名や成分名で検索...」を表示する
4. WHEN ユーザーが検索を実行 THEN システム SHALL 滑らかなトランジションで検索結果ページに遷移する
5. WHEN ユーザーがファーストビューを見る THEN システム SHALL 検索窓以外の要素（ナビゲーション等）は控えめに配置する

### Requirement 4

**User Story:** As a サイト訪問者, I want 洗練されたヘッダーナビゲーション, so that 必要な情報に素早くアクセスできる

#### Acceptance Criteria

1. WHEN ユーザーがページを表示 THEN システム SHALL ヘッダーにメニュー、言語・通貨切替、「サプティアとは」を配置する
2. WHEN ユーザーがヘッダーを見る THEN システム SHALL 透明度を活用した上品なデザインを適用する
3. WHEN ユーザーがメニュー項目にホバー THEN システム SHALL 近未来的なブルーのアンダーラインアニメーションを表示する
4. WHEN ユーザーが言語・通貨切替を操作 THEN システム SHALL エレガントなドロップダウンメニューを表示する
5. WHEN ユーザーがスクロール THEN システム SHALL ヘッダーの背景透明度を動的に調整する

### Requirement 5

**User Story:** As a サイト訪問者, I want スクロール後に現れる魅力的なコンテンツセクション, so that サプティアの価値を段階的に理解できる

#### Acceptance Criteria

1. WHEN ユーザーがスクロール THEN システム SHALL 人気サプリ比較セクションを表示する
2. WHEN ユーザーがさらにスクロール THEN システム SHALL 成分ガイドセクションを表示する
3. WHEN ユーザーがセクションを見る THEN システム SHALL 各セクションにフェードインアニメーションを適用する
4. WHEN ユーザーがコンテンツカードを見る THEN システム SHALL ガラス効果と微細なシャドウを使用する
5. WHEN ユーザーがカードにホバー THEN システム SHALL 持ち上がり効果と輝度変化を適用する

### Requirement 6

**User Story:** As a サイト訪問者, I want 人気サプリ比較セクションで商品を効率的に比較, so that 最適な商品を素早く見つけられる

#### Acceptance Criteria

1. WHEN ユーザーが人気サプリ比較セクションを見る THEN システム SHALL 最大6つの人気商品をカード形式で表示する
2. WHEN ユーザーが商品カードを見る THEN システム SHALL 商品画像、名称、価格、実効コスト/日を表示する
3. WHEN ユーザーがデスクトップで表示 THEN システム SHALL 3列グリッドレイアウトを使用する
4. WHEN ユーザーがタブレットで表示 THEN システム SHALL 2列グリッドレイアウトを使用する
5. WHEN ユーザーがモバイルで表示 THEN システム SHALL 1列レイアウトを使用する
6. WHEN ユーザーが商品カードをクリック THEN システム SHALL 商品詳細ページに遷移する

### Requirement 7

**User Story:** As a サイト訪問者, I want 成分ガイドセクションで成分について学習, so that 科学的根拠に基づいた選択ができる

#### Acceptance Criteria

1. WHEN ユーザーが成分ガイドセクションを見る THEN システム SHALL ビタミン、ミネラル、ハーブ、アミノ酸のカテゴリを表示する
2. WHEN ユーザーがカテゴリカードを見る THEN システム SHALL アイコン、タイトル、説明文を含むエレガントなデザインを適用する
3. WHEN ユーザーがカテゴリカードをクリック THEN システム SHALL /ingredients?category=... に遷移する
4. WHEN ユーザーがカードにホバー THEN システム SHALL 近未来的なブルーのアクセント効果を表示する

### Requirement 8

**User Story:** As a サイト訪問者, I want 洗練されたフッター情報, so that サプティアについて詳しく知ることができる

#### Acceptance Criteria

1. WHEN ユーザーがフッターを見る THEN システム SHALL サプティアとは、プライバシーポリシー、免責事項、利用規約、お問い合わせのリンクを表示する
2. WHEN ユーザーがフッターを見る THEN システム SHALL 控えめで上品なデザインを適用する
3. WHEN ユーザーがフッターリンクにホバー THEN システム SHALL 近未来的なブルーのアンダーライン効果を表示する
4. WHEN ユーザーがフッターを見る THEN システム SHALL 適切なスペーシングと階層構造を維持する

### Requirement 9

**User Story:** As a モバイルユーザー, I want すべてのデバイスで一貫した高品質体験, so that どの環境でも快適に利用できる

#### Acceptance Criteria

1. WHEN ユーザーがモバイル（0-767px）でアクセス THEN システム SHALL 1列レイアウトで最適化表示する
2. WHEN ユーザーがタブレット（768-1023px）でアクセス THEN システム SHALL 2列レイアウトで表示する
3. WHEN ユーザーがデスクトップ（1024px以上）でアクセス THEN システム SHALL 3列レイアウトで表示する
4. WHEN ユーザーがタッチデバイスを使用 THEN システム SHALL 適切なタッチターゲットサイズ（44px以上）を提供する
5. WHEN ユーザーがモバイルで検索窓を操作 THEN システム SHALL 画面サイズに応じた最適なサイズで表示する

### Requirement 10

**User Story:** As a アクセシビリティを必要とするユーザー, I want 支援技術で利用可能なインターフェース, so that 障害があっても快適に利用できる

#### Acceptance Criteria

1. WHEN ユーザーがキーボード操作 THEN システム SHALL すべての機能にTabキーでアクセス可能にする
2. WHEN ユーザーがフォーカス THEN システム SHALL 明確で美しいフォーカスリング（近未来的ブルー）を表示する
3. WHEN ユーザーがスクリーンリーダーを使用 THEN システム SHALL 適切なARIA属性とランドマークを提供する
4. WHEN ユーザーがコンテンツを確認 THEN システム SHALL 4.5:1以上のコントラスト比を維持する
5. WHEN ユーザーが画像を確認 THEN システム SHALL 適切な代替テキストを提供する

### Requirement 11

**User Story:** As a パフォーマンスを重視するユーザー, I want 高速で滑らかなページ体験, so that ストレスなく利用できる

#### Acceptance Criteria

1. WHEN ユーザーがページにアクセス THEN システム SHALL LCP（Largest Contentful Paint）を2.0秒以下で達成する
2. WHEN ユーザーがページを表示 THEN システム SHALL CLS（Cumulative Layout Shift）を0.05以下で維持する
3. WHEN ユーザーがアニメーションを見る THEN システム SHALL 60FPSの滑らかなアニメーションを提供する
4. WHEN ユーザーが画像を表示 THEN システム SHALL 最適化された画像と遅延読み込みを実装する
5. WHEN ユーザーがページを操作 THEN システム SHALL 重要でないJavaScriptを遅延読み込みする

### Requirement 12

**User Story:** As a 国際的なユーザー, I want 多言語・多通貨対応, so that 自分の環境に合わせて利用できる

#### Acceptance Criteria

1. WHEN ユーザーが日本語を選択 THEN システム SHALL すべてのUIテキストを日本語で表示する
2. WHEN ユーザーが英語を選択 THEN システム SHALL すべてのUIテキストを英語で表示する
3. WHEN ユーザーがJPYを選択 THEN システム SHALL 価格を日本円で表示する
4. WHEN ユーザーがUSDを選択 THEN システム SHALL 価格を米ドルで表示する
5. WHEN ユーザーが設定を変更 THEN システム SHALL 選択内容をlocalStorageに保存する