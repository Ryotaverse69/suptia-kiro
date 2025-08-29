/**
 * 安全なPortable Textレンダリングコンポーネント
 * 要件6.1-6.4に準拠した厳格なレンダリング
 */

import React from 'react';
import { 
  sanitizePortableText, 
  validateSanitizedPortableText,
  type SanitizedPortableTextBlock,
  type SanitizedSpan 
} from './portable-text-sanitizer';

export interface PortableTextRendererProps {
  blocks: any[];
  className?: string;
}

/**
 * メインのPortable Textレンダラー
 * 要件6.1: 許可リストのReactコンポーネントのみで描画
 * 要件6.2: 生HTML描画を完全に禁止
 */
export function PortableTextRenderer({ blocks, className }: PortableTextRendererProps) {
  // サニタイゼーション実行
  const sanitizedBlocks = sanitizePortableText(blocks);
  
  // 検証
  if (!validateSanitizedPortableText(sanitizedBlocks)) {
    console.warn('Portable Text validation failed, rendering empty content');
    return <div className={className}></div>;
  }

  return (
    <div className={className}>
      {sanitizedBlocks.map((block) => (
        <BlockRenderer key={block._key} block={block} />
      ))}
    </div>
  );
}

/**
 * 個別ブロックのレンダラー
 */
function BlockRenderer({ block }: { block: SanitizedPortableTextBlock }) {
  switch (block._type) {
    case 'block':
      return <TextBlockRenderer block={block} />;
    
    case 'image':
      return <ImageBlockRenderer block={block} />;
    
    case 'break':
      return <br />;
    
    default:
      return null;
  }
}

/**
 * テキストブロックのレンダラー
 */
function TextBlockRenderer({ block }: { block: SanitizedPortableTextBlock }) {
  if (!block.children || block.children.length === 0) {
    return null;
  }

  const content = (
    <>
      {block.children.map((span) => (
        <SpanRenderer key={span._key} span={span} />
      ))}
    </>
  );

  // リストアイテムの処理
  if (block.listItem) {
    const ListTag = block.listItem === 'bullet' ? 'ul' : 'ol';
    return (
      <ListTag>
        <li>{content}</li>
      </ListTag>
    );
  }

  // 通常のブロック要素
  switch (block.style) {
    case 'h1':
      return <h1 className="text-3xl font-bold mb-4">{content}</h1>;
    
    case 'h2':
      return <h2 className="text-2xl font-bold mb-3">{content}</h2>;
    
    case 'h3':
      return <h3 className="text-xl font-bold mb-2">{content}</h3>;
    
    case 'h4':
      return <h4 className="text-lg font-bold mb-2">{content}</h4>;
    
    case 'blockquote':
      return (
        <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4">
          {content}
        </blockquote>
      );
    
    case 'normal':
    default:
      return <p className="mb-4">{content}</p>;
  }
}

/**
 * スパン要素のレンダラー
 */
function SpanRenderer({ span }: { span: SanitizedSpan }) {
  let content: React.ReactNode = span.text;

  // マークの適用（ネストに対応）
  if (span.marks && span.marks.length > 0) {
    content = span.marks.reduce((acc: React.ReactNode, mark) => {
      switch (mark) {
        case 'strong':
          return <strong>{acc}</strong>;
        
        case 'em':
          return <em>{acc}</em>;
        
        case 'code':
          return <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{acc}</code>;
        
        case 'underline':
          return <u>{acc}</u>;
        
        default:
          return acc;
      }
    }, content as React.ReactNode);
  }

  return <>{content}</>;
}

/**
 * 画像ブロックのレンダラー
 * 要件6.4: 画像のalt属性を適切に処理
 */
function ImageBlockRenderer({ block }: { block: SanitizedPortableTextBlock }) {
  if (!block.asset?._ref) {
    console.warn('Image block missing asset reference');
    return null;
  }

  // Sanity画像URLの構築（安全な方法）
  const imageUrl = buildSanityImageUrl(block.asset._ref);
  
  if (!imageUrl) {
    console.warn('Failed to build image URL for asset:', block.asset._ref);
    return null;
  }

  return (
    <figure className="my-6">
      <img
        src={imageUrl}
        alt={block.alt || ''}
        className="max-w-full h-auto rounded-lg"
        loading="lazy"
        // セキュリティ属性
        referrerPolicy="no-referrer"
      />
      {block.alt && (
        <figcaption className="text-sm text-gray-600 mt-2 text-center">
          {block.alt}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Sanity画像URLの安全な構築
 */
function buildSanityImageUrl(assetRef: string): string | null {
  if (typeof assetRef !== 'string') {
    return null;
  }

  // Sanity asset referenceの形式を検証
  const match = assetRef.match(/^image-([a-f0-9]+)-(\d+x\d+)-(\w+)$/);
  if (!match) {
    return null;
  }

  const [, id, dimensions, format] = match;
  
  // 環境変数からプロジェクトIDとデータセットを取得
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

  if (!projectId || !dataset) {
    return null;
  }

  // 安全なSanity CDN URLを構築
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${dimensions}.${format}`;
}

/**
 * プレーンテキスト抽出（検索やメタデータ用）
 */
export function extractPlainText(blocks: any[]): string {
  const sanitizedBlocks = sanitizePortableText(blocks);
  
  return sanitizedBlocks
    .filter((block) => block._type === 'block' && block.children)
    .flatMap((block) => block.children || [])
    .map((span) => span.text)
    .join(' ')
    .trim();
}

/**
 * 文字数カウント
 */
export function countCharacters(blocks: any[]): number {
  return extractPlainText(blocks).length;
}

/**
 * 単語数カウント（日本語対応）
 */
export function countWords(blocks: any[]): number {
  const text = extractPlainText(blocks);
  
  // 日本語文字（ひらがな、カタカナ、漢字）をカウント
  const japaneseChars = (text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length;
  
  // 英数字の単語をカウント
  const englishWords = (text.match(/[a-zA-Z0-9]+/g) || []).length;
  
  return japaneseChars + englishWords;
}