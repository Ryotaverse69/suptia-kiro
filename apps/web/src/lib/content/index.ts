/**
 * Portable Text Content Processing
 * 要件6.1-6.4に準拠した安全なコンテンツ処理
 */

// サニタイゼーション機能
export {
  sanitizePortableText,
  validateSanitizedPortableText,
  sanitizeExternalLink,
  ALLOWED_BLOCK_TYPES,
  ALLOWED_MARKS,
  ALLOWED_STYLES,
  ALLOWED_LIST_TYPES,
  type AllowedBlockType,
  type AllowedMark,
  type AllowedStyle,
  type AllowedListType,
  type SanitizedPortableTextBlock,
  type SanitizedSpan,
} from './portable-text-sanitizer';

// レンダリング機能
export {
  PortableTextRenderer,
  extractPlainText,
  countCharacters,
  countWords,
  type PortableTextRendererProps,
} from './portable-text-renderer';