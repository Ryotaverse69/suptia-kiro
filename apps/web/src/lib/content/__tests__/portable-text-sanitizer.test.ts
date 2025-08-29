import { describe, it, expect } from 'vitest';
import {
  sanitizePortableText,
  validateSanitizedPortableText,
  sanitizeExternalLink,
  ALLOWED_BLOCK_TYPES,
  ALLOWED_MARKS,
  ALLOWED_STYLES,
} from '../portable-text-sanitizer';

describe('Portable Text Sanitizer', () => {
  describe('sanitizePortableText', () => {
    it('許可されたブロックタイプのみを保持する（要件6.1）', () => {
      const blocks = [
        {
          _type: 'block',
          _key: 'block1',
          style: 'normal',
          children: [
            {
              _type: 'span',
              _key: 'span1',
              text: '安全なテキスト',
              marks: ['strong'],
            },
          ],
        },
        {
          _type: 'malicious',
          _key: 'evil1',
          script: '<script>alert("xss")</script>',
        },
        {
          _type: 'image',
          _key: 'img1',
          asset: { _ref: 'image-abc123-800x600-jpg', _type: 'reference' },
          alt: '画像の説明',
        },
      ];

      const sanitized = sanitizePortableText(blocks);

      expect(sanitized).toHaveLength(2);
      expect(sanitized[0]._type).toBe('block');
      expect(sanitized[1]._type).toBe('image');
      expect(sanitized.find(b => b._type === 'malicious')).toBeUndefined();
    });

    it('markDefsを完全に除去する（要件6.2）', () => {
      const blocks = [
        {
          _type: 'block',
          _key: 'block1',
          style: 'normal',
          children: [
            {
              _type: 'span',
              _key: 'span1',
              text: 'リンクテキスト',
              marks: ['link1'],
            },
          ],
          markDefs: [
            {
              _key: 'link1',
              _type: 'link',
              href: 'https://malicious.com',
            },
          ],
        },
      ];

      const sanitized = sanitizePortableText(blocks);

      expect(sanitized[0]).not.toHaveProperty('markDefs');
      expect(sanitized[0].children[0].marks).toEqual([]);
    });

    it('HTMLタグを完全に除去する（要件6.2）', () => {
      const blocks = [
        {
          _type: 'block',
          _key: 'block1',
          style: 'normal',
          children: [
            {
              _type: 'span',
              _key: 'span1',
              text: '<script>alert("xss")</script>安全なテキスト<img src="x" onerror="alert(1)">',
              marks: [],
            },
          ],
        },
      ];

      const sanitized = sanitizePortableText(blocks);

      expect(sanitized[0].children[0].text).toBe('"xss")安全なテキスト');
      expect(sanitized[0].children[0].text).not.toContain('<script>');
      expect(sanitized[0].children[0].text).not.toContain('<img');
      expect(sanitized[0].children[0].text).not.toContain('alert');
    });

    it('画像のalt属性を適切に処理する（要件6.4）', () => {
      const blocks = [
        {
          _type: 'image',
          _key: 'img1',
          asset: { _ref: 'image-abc123-800x600-jpg', _type: 'reference' },
          alt: '<script>alert("xss")</script>画像の説明',
        },
        {
          _type: 'image',
          _key: 'img2',
          asset: { _ref: 'image-def456-400x300-png', _type: 'reference' },
          alt: null,
        },
      ];

      const sanitized = sanitizePortableText(blocks);

      expect(sanitized[0].alt).toBe('"xss")画像の説明');
      expect(sanitized[0].alt).not.toContain('<script>');
      expect(sanitized[0].alt).not.toContain('alert');
      expect(sanitized[1].alt).toBe('');
    });

    it('許可されたマークのみを保持する', () => {
      const blocks = [
        {
          _type: 'block',
          _key: 'block1',
          style: 'normal',
          children: [
            {
              _type: 'span',
              _key: 'span1',
              text: 'テキスト',
              marks: ['strong', 'em', 'malicious', 'code'],
            },
          ],
        },
      ];

      const sanitized = sanitizePortableText(blocks);

      expect(sanitized[0].children[0].marks).toEqual(['strong', 'em', 'code']);
      expect(sanitized[0].children[0].marks).not.toContain('malicious');
    });

    it('許可されたスタイルのみを保持する', () => {
      const blocks = [
        {
          _type: 'block',
          _key: 'block1',
          style: 'malicious-style',
          children: [
            {
              _type: 'span',
              _key: 'span1',
              text: 'テキスト',
              marks: [],
            },
          ],
        },
        {
          _type: 'block',
          _key: 'block2',
          style: 'h1',
          children: [
            {
              _type: 'span',
              _key: 'span2',
              text: 'ヘッダー',
              marks: [],
            },
          ],
        },
      ];

      const sanitized = sanitizePortableText(blocks);

      expect(sanitized[0].style).toBe('normal'); // フォールバック
      expect(sanitized[1].style).toBe('h1'); // 許可されたスタイル
    });

    it('無効な入力を適切に処理する', () => {
      expect(sanitizePortableText(null as any)).toEqual([]);
      expect(sanitizePortableText(undefined as any)).toEqual([]);
      expect(sanitizePortableText('not an array' as any)).toEqual([]);
      expect(sanitizePortableText([])).toEqual([]);
    });

    it('長すぎるテキストを制限する', () => {
      const longText = 'a'.repeat(20000);
      const blocks = [
        {
          _type: 'block',
          _key: 'block1',
          style: 'normal',
          children: [
            {
              _type: 'span',
              _key: 'span1',
              text: longText,
              marks: [],
            },
          ],
        },
      ];

      const sanitized = sanitizePortableText(blocks);

      expect(sanitized[0].children[0].text.length).toBeLessThanOrEqual(10000);
    });

    it('alt属性の長さを制限する', () => {
      const longAlt = 'a'.repeat(500);
      const blocks = [
        {
          _type: 'image',
          _key: 'img1',
          asset: { _ref: 'image-abc123-800x600-jpg', _type: 'reference' },
          alt: longAlt,
        },
      ];

      const sanitized = sanitizePortableText(blocks);

      expect(sanitized[0].alt.length).toBeLessThanOrEqual(200);
    });
  });

  describe('validateSanitizedPortableText', () => {
    it('有効なサニタイズ済みデータを承認する', () => {
      const validBlocks = [
        {
          _type: 'block' as const,
          _key: 'block1',
          style: 'normal' as const,
          children: [
            {
              _type: 'span' as const,
              _key: 'span1',
              text: 'テキスト',
              marks: ['strong' as const],
            },
          ],
        },
      ];

      expect(validateSanitizedPortableText(validBlocks)).toBe(true);
    });

    it('markDefsを含むデータを拒否する（要件6.2）', () => {
      const invalidBlocks = [
        {
          _type: 'block' as const,
          _key: 'block1',
          style: 'normal' as const,
          children: [],
          markDefs: [], // これがあると無効
        },
      ] as any;

      expect(validateSanitizedPortableText(invalidBlocks)).toBe(false);
    });

    it('許可されていないブロックタイプを拒否する', () => {
      const invalidBlocks = [
        {
          _type: 'malicious',
          _key: 'block1',
        },
      ] as any;

      expect(validateSanitizedPortableText(invalidBlocks)).toBe(false);
    });

    it('無効な入力を拒否する', () => {
      expect(validateSanitizedPortableText(null as any)).toBe(false);
      expect(validateSanitizedPortableText('not an array' as any)).toBe(false);
    });
  });

  describe('sanitizeExternalLink', () => {
    it('外部リンクに適切な属性を設定する（要件6.3）', () => {
      const result = sanitizeExternalLink('https://example.com');

      expect(result).toEqual({
        href: 'https://example.com/',
        rel: 'nofollow noopener noreferrer',
        target: '_blank',
      });
    });

    it('危険なプロトコルを拒否する', () => {
      expect(sanitizeExternalLink('javascript:alert(1)')).toBeNull();
      expect(sanitizeExternalLink('data:text/html,<script>alert(1)</script>')).toBeNull();
      expect(sanitizeExternalLink('ftp://example.com')).toBeNull();
    });

    it('無効なURLを拒否する', () => {
      expect(sanitizeExternalLink('not a url')).toBeNull();
      expect(sanitizeExternalLink('')).toBeNull();
      expect(sanitizeExternalLink(null as any)).toBeNull();
    });

    it('HTTPSとHTTPのみを許可する', () => {
      expect(sanitizeExternalLink('https://example.com')).not.toBeNull();
      expect(sanitizeExternalLink('http://example.com')).not.toBeNull();
    });
  });

  describe('定数の検証', () => {
    it('ALLOWED_BLOCK_TYPESが適切に定義されている', () => {
      expect(ALLOWED_BLOCK_TYPES).toContain('block');
      expect(ALLOWED_BLOCK_TYPES).toContain('image');
      expect(ALLOWED_BLOCK_TYPES).toContain('break');
      expect(ALLOWED_BLOCK_TYPES.length).toBe(3);
    });

    it('ALLOWED_MARKSが適切に定義されている', () => {
      expect(ALLOWED_MARKS).toContain('strong');
      expect(ALLOWED_MARKS).toContain('em');
      expect(ALLOWED_MARKS).toContain('code');
      expect(ALLOWED_MARKS).toContain('underline');
      expect(ALLOWED_MARKS.length).toBe(4);
    });

    it('ALLOWED_STYLESが適切に定義されている', () => {
      expect(ALLOWED_STYLES).toContain('normal');
      expect(ALLOWED_STYLES).toContain('h1');
      expect(ALLOWED_STYLES).toContain('h2');
      expect(ALLOWED_STYLES).toContain('h3');
      expect(ALLOWED_STYLES).toContain('h4');
      expect(ALLOWED_STYLES).toContain('blockquote');
      expect(ALLOWED_STYLES.length).toBe(6);
    });
  });
});