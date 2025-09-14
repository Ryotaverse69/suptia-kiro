# Apple/xAI風デザインシステム

サプティアのフロントエンドUI/UX刷新のための共通UIコンポーネントライブラリです。

## デザイン原則

- **色**: 白基調、アクセント#2563EB
- **フォント**: Inter + Noto Sans JP（Apple寄りのタイポ）
- **角丸**: lg～xl（過度でない範囲）
- **余白**: 広めに設定（Apple風）
- **影**: 極薄（shadow-sm/md程度）
- **モーション**: フェード/スライドは100–200ms

## CSS変数

デザインシステムの基盤となるCSS変数：

```css
:root {
  --brand: #2563eb; /* Apple/xAI風ブランドカラー */
  --radius: 1rem; /* Apple風角丸 */
  --shadow-soft: 0 8px 30px rgba(0, 0, 0, 0.06); /* Apple風極薄影 */
}
```

## ユーティリティ関数

### cn() - クラス統制システム

clsx + tailwind-mergeを組み合わせたユーティリティ関数：

```typescript
import { cn } from '@/lib/utils';

// 使用例
const className = cn(
  'base-classes',
  condition && 'conditional-classes',
  props.className
);
```

## コンポーネント

### Button

Apple/xAI風のボタンコンポーネント：

```tsx
import { Button } from "@/components/ui"

// 基本的な使用
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
<Button size="xl">特大</Button>

// ホバー効果
<Button hover="lift">リフト</Button>
<Button hover="scale">スケール</Button>
```

### Card

Apple風の洗練されたカードコンポーネント：

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui"

<Card>
  <CardHeader>
    <CardTitle>タイトル</CardTitle>
    <CardDescription>説明文</CardDescription>
  </CardHeader>
  <CardContent>
    メインコンテンツ
  </CardContent>
</Card>

// バリアント
<Card variant="elevated">エレベーテッド</Card>
<Card variant="glass">ガラス効果</Card>
<Card variant="hero">ヒーロー</Card>

// ホバー効果
<Card hover="lift">リフト</Card>
<Card hover="scale">スケール</Card>
<Card hover="glow">グロー</Card>
```

### Badge

成分バッジ、エビデンス強度表示用のコンポーネント：

```tsx
import { Badge, EvidenceBadge, ScoreBadge } from "@/components/ui"

// 基本的なバッジ
<Badge>デフォルト</Badge>
<Badge variant="primary">プライマリ</Badge>
<Badge variant="success">成功</Badge>
<Badge variant="warning">警告</Badge>
<Badge variant="error">エラー</Badge>

// エビデンス強度バッジ
<EvidenceBadge level="A" />  // エビデンス A
<EvidenceBadge level="B" />  // エビデンス B
<EvidenceBadge level="C" />  // エビデンス C

// スコアバッジ（自動的に色が決まる）
<ScoreBadge score={85} />    // 高スコア（緑）
<ScoreBadge score={70} />    // 中スコア（黄）
<ScoreBadge score={45} />    // 低スコア（赤）
```

## アクセシビリティ

すべてのコンポーネントはWCAG 2.1 AA準拠：

- キーボードナビゲーション対応
- フォーカス管理
- 適切なARIA属性
- カラーコントラスト AA準拠

## テスト

各コンポーネントには包括的なテストが含まれています：

```bash
# UIコンポーネントのテスト実行
pnpm test src/components/ui/__tests__
```

## 使用例

```tsx
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from '@/components/ui';

function ProductCard({ product }) {
  return (
    <Card hover='lift' className='max-w-sm'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>{product.name}</CardTitle>
          <Badge variant='success'>評価 {product.rating}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className='text-gray-600 mb-4'>{product.description}</p>
        <div className='flex gap-2 mb-4'>
          {product.ingredients.map(ingredient => (
            <Badge key={ingredient} variant='outline'>
              {ingredient}
            </Badge>
          ))}
        </div>
        <Button className='w-full'>詳細を見る</Button>
      </CardContent>
    </Card>
  );
}
```

## パフォーマンス

- Tree-shaking対応
- CSS-in-JSを避けTailwindを使用
- 最小限のJavaScript
- GPU加速対応のアニメーション
