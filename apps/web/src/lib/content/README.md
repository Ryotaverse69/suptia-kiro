# Portable Text Content Processing

要件6.1-6.4に準拠した厳格なPortable Textサニタイゼーションとレンダリング機能。

## 概要

このモジュールは、SanityのPortable Textコンテンツを安全にサニタイズし、レンダリングするための機能を提供します。XSS攻撃を防止し、許可されたコンテンツのみを表示します。

## 主な機能

### 🛡️ セキュリティ機能

- **許可リストベースのサニタイゼーション** (要件6.1)
- **生HTML描画の完全禁止** (要件6.2)
- **外部リンクの安全な処理** (要件6.3)
- **画像alt属性の適切な処理** (要件6.4)

### 🎨 レンダリング機能

- Reactコンポーネントによる安全なレンダリング
- アクセシブルなHTML構造の生成
- レスポンシブ画像の表示
- プレーンテキスト抽出

## 使用方法

### 基本的な使用例

```tsx
import { PortableTextRenderer } from '@/lib/content';

function ArticleContent({ content }: { content: any[] }) {
  return (
    <div className="prose">
      <PortableTextRenderer 
        blocks={content} 
        className="article-content"
      />
    </div>
  );
}
```

### サニタイゼーションのみ使用

```typescript
import { sanitizePortableText, validateSanitizedPortableText } from '@/lib/content';

function processContent(rawBlocks: any[]) {
  // サニタイゼーション実行
  const sanitizedBlocks = sanitizePortableText(rawBlocks);
  
  // 検証
  if (!validateSanitizedPortableText(sanitizedBlocks)) {
    throw new Error('Content validation failed');
  }
  
  return sanitizedBlocks;
}
```

### プレーンテキスト抽出

```typescript
import { extractPlainText, countWords } from '@/lib/content';

function getContentSummary(blocks: any[]) {
  const plainText = extractPlainText(blocks);
  const wordCount = countWords(blocks);
  
  return {
    summary: plainText.substring(0, 200) + '...',
    wordCount,
  };
}
```

## 許可されたコンテンツ

### ブロックタイプ

- `block` - テキストブロック
- `image` - 画像ブロック
- `break` - 改行

### テキストマーク

- `strong` - 太字
- `em` - 斜体
- `code` - インラインコード
- `underline` - 下線

### ブロックスタイル

- `normal` - 通常の段落
- `h1`, `h2`, `h3`, `h4` - 見出し
- `blockquote` - 引用

## セキュリティ考慮事項

### 禁止されるコンテンツ

- **markDefs**: リンクやその他の参照定義は完全に除去
- **HTMLタグ**: すべてのHTMLタグを除去
- **JavaScriptコード**: スクリプトやイベントハンドラーを除去
- **危険なプロトコル**: javascript:, data:, ftp: などを拒否

### 自動サニタイゼーション

```typescript
// 危険なコンテンツの例
const maliciousBlocks = [
  {
    _type: 'block',
    children: [
      {
        _type: 'span',
        text: '<script>alert("XSS")</script>安全なテキスト',
        marks: ['link1']
      }
    ],
    markDefs: [
      {
        _key: 'link1',
        _type: 'link',
        href: 'javascript:alert("XSS")'
      }
    ]
  }
];

// サニタイゼーション後
const sanitized = sanitizePortableText(maliciousBlocks);
// 結果: テキストは "安全なテキスト" のみ、リンクは除去
```

## 画像の処理

### 安全な画像URL生成

```typescript
// Sanity画像の安全な処理
const imageBlock = {
  _type: 'image',
  asset: {
    _ref: 'image-abc123-800x600-jpg',
    _type: 'reference'
  },
  alt: '商品画像'
};

// 自動的に安全なCDN URLに変換
// https://cdn.sanity.io/images/project/dataset/abc123-800x600.jpg
```

### セキュリティ属性

- `referrerPolicy="no-referrer"` - リファラー情報を送信しない
- `loading="lazy"` - 遅延読み込み
- alt属性の長さ制限（200文字以内）

## パフォーマンス

### 最適化機能

- テキスト長の制限（10,000文字以内）
- 画像の遅延読み込み
- 効率的なサニタイゼーションアルゴリズム

### 大量データの処理

```typescript
// 大量のブロックでもパフォーマンスを維持
const largeContent = Array.from({ length: 1000 }, (_, i) => ({
  _type: 'block',
  _key: `block-${i}`,
  style: 'normal',
  children: [
    {
      _type: 'span',
      _key: `span-${i}`,
      text: `段落 ${i}`,
      marks: []
    }
  ]
}));

// 効率的に処理される
const rendered = <PortableTextRenderer blocks={largeContent} />;
```

## テスト

### 単体テスト

```bash
npm test -- src/lib/content/__tests__/portable-text-sanitizer.test.ts
npm test -- src/lib/content/__tests__/portable-text-renderer.test.tsx
```

### 統合テスト

```bash
npm test -- src/lib/content/__tests__/portable-text-integration.test.tsx
```

## 移行ガイド

### 既存のサニタイゼーション機能から

```typescript
// 旧実装（非推奨）
import { sanitizePortableText } from '@/lib/sanitize';

// 新実装（推奨）
import { sanitizePortableText } from '@/lib/content';
```

### @portabletext/reactから

```typescript
// 旧実装
import { PortableText } from '@portabletext/react';

// 新実装（より安全）
import { PortableTextRenderer } from '@/lib/content';

// 使用方法は同様
<PortableTextRenderer blocks={content} />
```

## 関連ドキュメント

- [セキュリティガイドライン](.kiro/steering/security.md)
- [要件仕様書](.kiro/specs/suptia-mvp/requirements.md)
- [設計書](.kiro/specs/suptia-mvp/design.md)