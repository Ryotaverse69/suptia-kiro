# サプティア デザインシステム

サプティアのフロントエンドで使用する共通UIコンポーネントライブラリです。

## 概要

このデザインシステムは、一貫性のあるユーザーインターフェースを提供し、開発効率を向上させることを目的としています。近未来的でスタイリッシュなデザインを基調とし、アクセシビリティとユーザビリティを重視しています。

## デザイン原則

### 1. 近未来的でスタイリッシュ
- グラデーションとシャドウを効果的に使用
- 滑らかなアニメーションとトランジション
- モダンなタイポグラフィ

### 2. アクセシビリティ重視
- WCAG 2.1 AA準拠
- キーボードナビゲーション対応
- 適切なカラーコントラスト

### 3. レスポンシブデザイン
- モバイルファーストアプローチ
- 柔軟なレイアウトシステム
- タッチフレンドリーなインターフェース

## カラーパレット

### プライマリカラー（近未来的ブルー）
```css
primary-50: #eff6ff
primary-500: #3b82f6
primary-600: #2563eb
primary-700: #1d4ed8
```

### セカンダリカラー（アクセント用）
```css
secondary-500: #10b981
secondary-600: #059669
```

### ステータスカラー
```css
success: #10b981
warning: #f59e0b
error: #ef4444
info: #3b82f6
```

## タイポグラフィ

### フォントファミリー
```css
font-family: 'Inter', 'Noto Sans JP', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', sans-serif
```

### フォントサイズ
- `text-xs`: 12px
- `text-sm`: 14px
- `text-base`: 16px
- `text-lg`: 18px
- `text-xl`: 20px
- `text-2xl`: 24px
- `text-3xl`: 30px
- `text-4xl`: 36px

## コンポーネント

### Button

基本的なボタンコンポーネント。4つのバリアントと3つのサイズを提供。

```tsx
import { Button } from '@/components/ui';

// 基本的な使用法
<Button>クリック</Button>

// バリアント
<Button variant="primary">プライマリ</Button>
<Button variant="secondary">セカンダリ</Button>
<Button variant="outline">アウトライン</Button>
<Button variant="ghost">ゴースト</Button>

// サイズ
<Button size="sm">小</Button>
<Button size="md">中</Button>
<Button size="lg">大</Button>

// 無効状態
<Button disabled>無効</Button>
```

#### Props
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `disabled`: boolean
- `className`: string
- その他のHTMLButtonElement属性

### Card

コンテンツをグループ化するためのカードコンポーネント。

```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui';

<Card>
  <CardHeader>
    <h2>タイトル</h2>
  </CardHeader>
  <CardContent>
    <p>コンテンツ</p>
  </CardContent>
  <CardFooter>
    <Button>アクション</Button>
  </CardFooter>
</Card>

// バリアント
<Card variant="default">デフォルト</Card>
<Card variant="elevated">エレベート</Card>
<Card variant="outlined">アウトライン</Card>

// ホバー効果
<Card hover>ホバー効果付き</Card>
```

#### Props
- `variant`: 'default' | 'elevated' | 'outlined'
- `hover`: boolean
- `className`: string

### Badge

ステータスや分類を表示するためのバッジコンポーネント。

```tsx
import { Badge } from '@/components/ui';

// スコア用バリアント
<Badge variant="high">高スコア</Badge>
<Badge variant="medium">中スコア</Badge>
<Badge variant="low">低スコア</Badge>

// ステータス用バリアント
<Badge variant="success">成功</Badge>
<Badge variant="danger">危険</Badge>
<Badge variant="info">情報</Badge>

// サイズ
<Badge size="sm">小</Badge>
<Badge size="md">中</Badge>
<Badge size="lg">大</Badge>
```

#### Props
- `variant`: 'high' | 'medium' | 'low' | 'danger' | 'success' | 'info'
- `size`: 'sm' | 'md' | 'lg'
- `className`: string

## ユーティリティ関数

### cn (className utility)
Tailwind CSSクラスを結合し、競合を解決します。

```tsx
import { cn } from '@/lib/utils';

const className = cn(
  'base-class',
  condition && 'conditional-class',
  'p-4 p-6' // p-6が適用される
);
```

### formatPrice
価格をロケールに応じてフォーマットします。

```tsx
import { formatPrice } from '@/lib/utils';

formatPrice(1000); // "¥1,000"
formatPrice(1000, 'USD', 'en-US'); // "$1,000"
```

### getScoreBadgeVariant
スコアに基づいて適切なバッジバリアントを返します。

```tsx
import { getScoreBadgeVariant } from '@/lib/utils';

const variant = getScoreBadgeVariant(85); // "high"
```

## 使用例

### 商品カード
```tsx
import { Card, CardHeader, CardContent, CardFooter, Button, Badge } from '@/components/ui';
import { getScoreBadgeVariant, formatPrice } from '@/lib/utils';

function ProductCard({ product }) {
  return (
    <Card hover className="max-w-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">{product.name}</h3>
          <Badge variant={getScoreBadgeVariant(product.score)}>
            {product.score}点
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">{product.description}</p>
        <p className="text-2xl font-bold text-primary-600 mt-4">
          {formatPrice(product.price)}
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">詳細を見る</Button>
      </CardFooter>
    </Card>
  );
}
```

## 開発ガイドライン

### 新しいコンポーネントの追加
1. `src/components/ui/` ディレクトリに新しいコンポーネントファイルを作成
2. TypeScriptインターフェースを定義
3. `src/components/ui/index.ts` にエクスポートを追加
4. テストファイルを `__tests__/` ディレクトリに作成
5. このREADMEにドキュメントを追加

### スタイリング規則
- Tailwind CSSクラスを使用
- カスタムCSSは最小限に抑制
- `cn()` ユーティリティを使用してクラスを結合
- レスポンシブデザインを考慮

### アクセシビリティ
- 適切なARIA属性を使用
- キーボードナビゲーションをサポート
- カラーコントラストを確保
- スクリーンリーダー対応

## テスト

```bash
# UIコンポーネントのテストを実行
pnpm test src/components/ui

# 特定のコンポーネントのテスト
pnpm test Button.test.tsx
```

## 今後の拡張予定

- [ ] Input コンポーネント
- [ ] Select コンポーネント
- [ ] Modal コンポーネント
- [ ] Toast 通知システム
- [ ] Loading スピナー
- [ ] Tooltip コンポーネント
- [ ] Accordion コンポーネント
- [ ] Tab コンポーネント