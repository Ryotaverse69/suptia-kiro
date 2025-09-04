# Design Document

## Overview

サプティアのブランドロゴを統合的に実装し、ファビコン、ヘッダーロゴ、メタデータに一貫したブランディングを適用します。提供されたロゴ（青からグリーンのグラデーション「S」デザイン）を基に、複数のサイズとフォーマットを生成し、Next.js App Routerのメタデータ機能を活用して最適化された実装を行います。

## Architecture

### ファイル構造

```
apps/web/
├── public/
│   ├── icons/
│   │   ├── favicon.ico
│   │   ├── favicon-16x16.png
│   │   ├── favicon-32x32.png
│   │   ├── apple-touch-icon.png (180x180)
│   │   ├── android-chrome-192x192.png
│   │   ├── android-chrome-512x512.png
│   │   └── logo.svg (オリジナルSVG)
│   ├── favicon.svg (既存を更新)
│   └── manifest.json (既存を更新)
├── src/
│   ├── app/
│   │   └── layout.tsx (メタデータ更新)
│   └── components/
│       ├── Header.tsx (ロゴ更新)
│       └── Logo.tsx (新規作成)
```

### コンポーネント設計

```
Logo Component
├── LogoIcon (SVGアイコン部分)
├── LogoText (テキスト部分)
└── LogoLink (リンク機能付きロゴ)
```

## Components and Interfaces

### 1. Logo Component

```typescript
interface LogoProps {
  variant?: 'full' | 'icon-only' | 'text-only';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
  href?: string;
}

interface LogoIconProps {
  size?: number;
  className?: string;
}
```

**責務:**

- ロゴの表示バリエーション管理
- レスポンシブサイズ調整
- アクセシビリティ対応
- リンク機能の提供

### 2. Favicon Management

```typescript
interface FaviconConfig {
  sizes: Array<{
    size: string;
    type: string;
    href: string;
  }>;
  appleTouchIcon: string;
  manifest: string;
}
```

**責務:**

- 複数サイズのファビコン管理
- ブラウザ互換性の確保
- PWA対応のアイコン設定

### 3. Header Integration

既存のHeaderコンポーネントを更新し、新しいLogoコンポーネントを統合します。

**変更点:**

- 現在のグラデーション「S」アイコンを実際のロゴSVGに置換
- ロゴのクリック領域とアクセシビリティの改善
- レスポンシブ表示の最適化

## Data Models

### Logo Asset Model

```typescript
interface LogoAsset {
  id: string;
  name: string;
  format: 'svg' | 'png' | 'ico';
  size: string;
  path: string;
  purpose: 'favicon' | 'header' | 'social' | 'pwa';
}
```

### Metadata Configuration

```typescript
interface IconMetadata {
  icon: Array<{
    url: string;
    sizes: string;
    type: string;
  }>;
  apple: Array<{
    url: string;
    sizes: string;
    type: string;
  }>;
  other: Array<{
    rel: string;
    url: string;
  }>;
}
```

## Error Handling

### ファビコン読み込みエラー

- フォールバック用のデフォルトファビコンを設定
- 404エラー時の代替表示
- ブラウザキャッシュ問題の対応

### ロゴ表示エラー

- SVG読み込み失敗時のフォールバック
- 画像最適化エラーの処理
- アクセシビリティ代替テキストの確保

### パフォーマンス考慮

- 画像の遅延読み込み
- 適切なキャッシュヘッダー設定
- SVGの最適化

## Testing Strategy

### Unit Tests

- Logoコンポーネントの各プロパティテスト
- ファビコンメタデータの正確性テスト
- アクセシビリティ属性の検証

### Integration Tests

- ヘッダーでのロゴ表示テスト
- ファビコンのブラウザ表示テスト
- レスポンシブ表示の確認

### Visual Regression Tests

- ロゴの視覚的一貫性テスト
- 異なるデバイスサイズでの表示テスト
- ダークモード対応テスト

### Accessibility Tests

- スクリーンリーダー対応テスト
- キーボードナビゲーションテスト
- コントラスト比の確認

## Implementation Phases

### Phase 1: Asset Preparation

1. 提供されたロゴからSVGファイルを作成
2. 複数サイズのPNG/ICOファイルを生成
3. ファイルの最適化とpublicディレクトリへの配置

### Phase 2: Component Development

1. Logoコンポーネントの作成
2. プロパティとバリエーションの実装
3. アクセシビリティ機能の追加

### Phase 3: Integration

1. Headerコンポーネントの更新
2. layout.tsxでのメタデータ設定
3. manifest.jsonの更新

### Phase 4: Optimization

1. パフォーマンス最適化
2. SEO設定の完善
3. PWA対応の強化

## SEO and Social Media Integration

### Open Graph

- og:imageにロゴを設定
- 適切なサイズ（1200x630）のソーシャル用画像生成
- Twitter Cardの最適化

### Structured Data

- Organization schemaにロゴ情報を追加
- WebSite schemaの強化
- 検索エンジン最適化

## Browser Compatibility

### サポート対象

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- iOS Safari 14+
- Android Chrome 90+

### フォールバック戦略

- SVG非対応ブラウザ用PNG代替
- 古いブラウザ用ICOファビコン
- プログレッシブエンハンスメント

## Performance Considerations

### 画像最適化

- SVGの軽量化（不要な要素の削除）
- PNGの圧縮最適化
- WebP形式の検討（将来的）

### 読み込み最適化

- ファビコンのプリロード
- 重要でない画像の遅延読み込み
- 適切なキャッシュ戦略

### バンドルサイズ

- SVGのインライン化検討
- 不要なアイコンサイズの削除
- Tree shakingの活用
