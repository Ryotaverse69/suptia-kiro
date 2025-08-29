/**
 * Strict Portable Text sanitization for XSS prevention
 * 要件6.1-6.4に準拠した厳格なサニタイゼーション
 */

// 許可されたReactコンポーネントのみ（要件6.1）
export const ALLOWED_BLOCK_TYPES = [
  'block',
  'image',
  'break'
] as const;

export const ALLOWED_MARKS = [
  'strong',
  'em', 
  'code',
  'underline'
] as const;

export const ALLOWED_STYLES = [
  'normal',
  'h1',
  'h2', 
  'h3',
  'h4',
  'blockquote'
] as const;

export const ALLOWED_LIST_TYPES = [
  'bullet',
  'number'
] as const;

export type AllowedBlockType = typeof ALLOWED_BLOCK_TYPES[number];
export type AllowedMark = typeof ALLOWED_MARKS[number];
export type AllowedStyle = typeof ALLOWED_STYLES[number];
export type AllowedListType = typeof ALLOWED_LIST_TYPES[number];

export interface SanitizedPortableTextBlock {
  _type: AllowedBlockType;
  _key: string;
  style?: AllowedStyle;
  listItem?: AllowedListType;
  level?: number;
  children?: SanitizedSpan[];
  markDefs?: never; // 要件6.2: markDefsを完全に禁止
  alt?: string; // 画像用
  asset?: {
    _ref: string;
    _type: 'reference';
  };
}

export interface SanitizedSpan {
  _type: 'span';
  _key: string;
  text: string;
  marks?: AllowedMark[];
}

/**
 * Portable Textブロックの厳格なサニタイゼーション
 * 要件6.1: 許可リストのReactコンポーネントのみで描画
 * 要件6.2: 生HTML描画を完全に禁止
 */
export function sanitizePortableText(blocks: any[]): SanitizedPortableTextBlock[] {
  if (!Array.isArray(blocks)) {
    return [];
  }

  return blocks
    .filter((block) => {
      // 許可されたブロックタイプのみ通す
      return block && 
             typeof block === 'object' && 
             ALLOWED_BLOCK_TYPES.includes(block._type);
    })
    .map((block) => sanitizeBlock(block))
    .filter((block): block is SanitizedPortableTextBlock => block !== null);
}

/**
 * 個別ブロックのサニタイゼーション
 */
function sanitizeBlock(block: any): SanitizedPortableTextBlock | null {
  if (!block || typeof block !== 'object') {
    return null;
  }

  const baseBlock = {
    _type: block._type as AllowedBlockType,
    _key: sanitizeKey(block._key),
  };

  switch (block._type) {
    case 'block':
      return sanitizeTextBlock(block, baseBlock);
    
    case 'image':
      return sanitizeImageBlock(block, baseBlock);
    
    case 'break':
      return baseBlock as SanitizedPortableTextBlock;
    
    default:
      return null;
  }
}

/**
 * テキストブロックのサニタイゼーション
 */
function sanitizeTextBlock(
  block: any, 
  baseBlock: { _type: AllowedBlockType; _key: string }
): SanitizedPortableTextBlock {
  return {
    ...baseBlock,
    style: ALLOWED_STYLES.includes(block.style) ? block.style : 'normal',
    listItem: ALLOWED_LIST_TYPES.includes(block.listItem) ? block.listItem : undefined,
    level: typeof block.level === 'number' && block.level >= 1 && block.level <= 6 
      ? block.level 
      : undefined,
    children: Array.isArray(block.children) 
      ? block.children.map(sanitizeSpan).filter(Boolean)
      : [],
    // markDefs は意図的に除外（要件6.2: リンク等の危険な要素を禁止）
  };
}

/**
 * 画像ブロックのサニタイゼーション
 * 要件6.4: 画像のalt属性を適切に処理
 */
function sanitizeImageBlock(
  block: any,
  baseBlock: { _type: AllowedBlockType; _key: string }
): SanitizedPortableTextBlock {
  return {
    ...baseBlock,
    asset: block.asset && 
           typeof block.asset === 'object' && 
           typeof block.asset._ref === 'string'
      ? {
          _ref: block.asset._ref,
          _type: 'reference' as const,
        }
      : undefined,
    alt: sanitizeAltText(block.alt),
  };
}

/**
 * スパン要素のサニタイゼーション
 */
function sanitizeSpan(span: any): SanitizedSpan | null {
  if (!span || typeof span !== 'object' || span._type !== 'span') {
    return null;
  }

  return {
    _type: 'span',
    _key: sanitizeKey(span._key),
    text: sanitizeText(span.text),
    marks: Array.isArray(span.marks)
      ? span.marks.filter((mark: any) => ALLOWED_MARKS.includes(mark))
      : undefined,
  };
}

/**
 * テキストコンテンツのサニタイゼーション
 * 要件6.2: HTMLタグを完全に除去
 */
function sanitizeText(text: any): string {
  if (typeof text !== 'string') {
    return '';
  }

  // 段階的にサニタイゼーション
  let sanitized = text;
  
  // 1. HTMLタグを除去
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // 2. HTMLエンティティを除去
  sanitized = sanitized.replace(/&[a-zA-Z0-9#]+;/g, '');
  
  // 3. エンコードされたHTMLタグを除去
  sanitized = sanitized.replace(/&lt;[^&]*&gt;/g, '');
  
  // 4. 危険なプロトコルを除去
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  
  // 5. イベントハンドラーを除去
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // 6. スクリプト関連の文字列を除去
  sanitized = sanitized.replace(/alert\s*\(/gi, '');
  sanitized = sanitized.replace(/eval\s*\(/gi, '');
  sanitized = sanitized.replace(/document\./gi, '');
  sanitized = sanitized.replace(/window\./gi, '');
  
  return sanitized
    .trim()
    .substring(0, 10000); // 長すぎるテキストを制限
}

/**
 * alt属性のサニタイゼーション
 * 要件6.4: 画像のalt属性を適切に処理
 */
function sanitizeAltText(alt: any): string {
  if (typeof alt !== 'string') {
    return '';
  }

  return sanitizeText(alt).substring(0, 200); // alt属性は200文字以内に制限
}

/**
 * キー値のサニタイゼーション
 */
function sanitizeKey(key: any): string {
  if (typeof key !== 'string') {
    return `sanitized-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 英数字とハイフンのみ許可
  const sanitized = key.replace(/[^a-zA-Z0-9-]/g, '').substring(0, 50);
  return sanitized || `sanitized-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 外部リンクの安全な処理
 * 要件6.3: 外部リンクにrel="nofollow noopener noreferrer"属性を設定
 * 
 * 注意: markDefsは完全に禁止されているため、この関数は将来的な拡張用
 */
export function sanitizeExternalLink(url: string): {
  href: string;
  rel: string;
  target: string;
} | null {
  if (typeof url !== 'string') {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    
    // 危険なプロトコルを拒否
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return null;
    }

    return {
      href: parsedUrl.toString(),
      rel: 'nofollow noopener noreferrer',
      target: '_blank',
    };
  } catch {
    return null;
  }
}

/**
 * Portable Textの検証
 * サニタイゼーション後のデータが安全かどうかを確認
 */
export function validateSanitizedPortableText(
  blocks: SanitizedPortableTextBlock[]
): boolean {
  if (!Array.isArray(blocks)) {
    return false;
  }

  return blocks.every((block) => {
    // 基本構造の検証
    if (!block || typeof block !== 'object') {
      return false;
    }

    if (!ALLOWED_BLOCK_TYPES.includes(block._type)) {
      return false;
    }

    // markDefsが存在しないことを確認（要件6.2）
    if ('markDefs' in block) {
      return false;
    }

    // 子要素の検証
    if (block.children) {
      return block.children.every((child) => {
        return child && 
               child._type === 'span' && 
               typeof child.text === 'string' &&
               (!child.marks || child.marks.every(mark => ALLOWED_MARKS.includes(mark)));
      });
    }

    return true;
  });
}