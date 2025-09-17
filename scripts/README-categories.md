# カテゴリデータ投入ガイド

## 概要

トリバゴクローン用のサプリメントカテゴリデータをSanityに投入するためのスクリプトとガイドです。

## 前提条件

### 1. Sanity API トークンの設定

書き込み権限を持つSanity APIトークンが必要です。

```bash
# .env.local に追加
SANITY_API_TOKEN=your_sanity_api_token_here
```

### 2. 必要なパッケージのインストール

```bash
# プロジェクトルートで実行
npm install @sanity/client dotenv
```

## カテゴリデータ投入

### 1. スクリプト実行

```bash
# プロジェクトルートで実行
node scripts/seed-categories.mjs
```

### 2. 投入されるカテゴリ

以下の6つのカテゴリが投入されます：

| カテゴリ       | 商品数    | 平均価格 | 説明                             |
| -------------- | --------- | -------- | -------------------------------- |
| ビタミンD      | 1,234商品 | ¥2,980   | 骨の健康維持や免疫機能をサポート |
| プロテイン     | 2,156商品 | ¥4,580   | 筋肉の成長と回復をサポート       |
| マルチビタミン | 987商品   | ¥3,450   | 複数のビタミンをバランス良く配合 |
| オメガ3        | 756商品   | ¥3,780   | 心血管の健康をサポート           |
| コラーゲン     | 643商品   | ¥4,200   | 美容と関節の健康をサポート       |
| 鉄分           | 432商品   | ¥2,650   | 貧血予防と酸素運搬をサポート     |

### 3. 含まれるデータ

各カテゴリには以下のデータが含まれます：

- **基本情報**: 名前、スラッグ、説明
- **統計データ**: 商品数、平均価格
- **表示設定**: 表示順序、人気カテゴリフラグ
- **価格推移**: 12ヶ月分の月別平均価格データ
- **SEO設定**: タイトル、説明文

## Sanity Studio での確認

### 1. Studio にアクセス

```bash
# Sanity Studio を起動
npm run sanity:dev
```

### 2. カテゴリデータの確認

1. ブラウザで `http://localhost:3333` にアクセス
2. 左メニューの「カテゴリ」をクリック
3. 「全てのカテゴリ」で投入されたデータを確認

### 3. 画像のアップロード

各カテゴリに画像を追加してください：

1. カテゴリを選択
2. 「カテゴリ画像」フィールドに画像をアップロード
3. 推奨サイズ: 258px × 258px（トリバゴ準拠）

## フロントエンドでの使用

### 1. カテゴリライブラリの使用

```typescript
import { getPopularCategories, getCategoriesForCards } from '@/lib/categories';

// 人気カテゴリを取得
const popularCategories = await getPopularCategories();

// カード表示用データを取得
const categoryCards = await getCategoriesForCards();
```

### 2. 価格チャート用データ

```typescript
import { getCategoriesForPriceChart } from '@/lib/categories';

// 価格チャート用データを取得
const priceChartData = await getCategoriesForPriceChart();
```

## トラブルシューティング

### エラー: "Insufficient permissions"

**原因**: Sanity APIトークンに書き込み権限がない

**解決方法**:

1. Sanity管理画面でAPIトークンを確認
2. 書き込み権限（Editor以上）を付与
3. `.env.local`のトークンを更新

### エラー: "Project not found"

**原因**: プロジェクトIDが間違っている

**解決方法**:

1. `sanity.config.ts`のprojectIdを確認
2. スクリプト内のprojectIdを修正

### データが表示されない

**原因**: CDNキャッシュの影響

**解決方法**:

```typescript
// useCdn: false を設定
const client = createClient({
  // ...
  useCdn: false,
});
```

## 次のステップ

1. **画像アップロード**: 各カテゴリに適切な画像を設定
2. **商品データ連携**: 既存の商品データにカテゴリを関連付け
3. **フロントエンド実装**: PopularSearchCardsコンポーネントでカテゴリデータを使用
4. **価格チャート実装**: PriceChartコンポーネントで価格推移データを使用

## 関連ファイル

- `packages/schemas/category.ts` - カテゴリスキーマ定義
- `apps/web/src/lib/categories.ts` - カテゴリデータ取得ライブラリ
- `scripts/seed-categories.mjs` - データ投入スクリプト
- `packages/schemas/desk.ts` - Sanity Studio構成
