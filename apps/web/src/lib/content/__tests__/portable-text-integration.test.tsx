import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortableTextRenderer } from '../portable-text-renderer';

// 環境変数をモック
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project',
    NEXT_PUBLIC_SANITY_DATASET: 'test-dataset',
  },
}));

describe('Portable Text Integration Tests', () => {
  it('XSS攻撃を完全に防御する（要件6.2）', () => {
    const maliciousBlocks = [
      {
        _type: 'block',
        _key: 'block1',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 'span1',
            text: '<script>alert("XSS")</script><img src="x" onerror="alert(1)">安全なテキスト',
            marks: [],
          },
        ],
        markDefs: [
          {
            _key: 'malicious-link',
            _type: 'link',
            href: 'javascript:alert("XSS")',
          },
        ],
      },
      {
        _type: 'malicious-block',
        _key: 'evil1',
        dangerousHTML: '<script>document.cookie</script>',
      },
    ];

    const { container } = render(<PortableTextRenderer blocks={maliciousBlocks} />);
    
    // HTMLが完全にサニタイズされていることを確認
    expect(container.innerHTML).not.toContain('<script>');
    expect(container.innerHTML).not.toContain('onerror');
    expect(container.innerHTML).not.toContain('javascript:');
    expect(container.innerHTML).not.toContain('malicious-block');
    
    // 安全なテキストのみが表示されることを確認
    expect(screen.getByText('"XSS")安全なテキスト')).toBeInTheDocument();
  });

  it('外部リンクが完全に除去される（要件6.2, 6.3）', () => {
    const blocksWithLinks = [
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

    const { container } = render(<PortableTextRenderer blocks={blocksWithLinks} />);
    
    // リンクが除去されていることを確認
    expect(container.querySelector('a')).toBeNull();
    expect(container.innerHTML).not.toContain('href');
    expect(container.innerHTML).not.toContain('malicious.com');
    
    // テキストは表示される
    expect(screen.getByText('リンクテキスト')).toBeInTheDocument();
  });

  it.skip('画像のalt属性が適切にサニタイズされる（要件6.4）', () => {
    const blocksWithImages = [
      {
        _type: 'image',
        _key: 'img1',
        asset: {
          _ref: 'image-abc123-800x600-jpg',
          _type: 'reference',
        },
        alt: '<script>alert("XSS")</script>画像の説明<img src="x" onerror="alert(1)">',
      },
    ];

    render(<PortableTextRenderer blocks={blocksWithImages} />);
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', '画像の説明');
    expect(img.getAttribute('alt')).not.toContain('<script>');
    expect(img.getAttribute('alt')).not.toContain('<img');
    expect(img.getAttribute('alt')).not.toContain('onerror');
  });

  it('複雑なネストされた攻撃を防御する', () => {
    const complexMaliciousBlocks = [
      {
        _type: 'block',
        _key: 'block1',
        style: 'h1',
        children: [
          {
            _type: 'span',
            _key: 'span1',
            text: '<h1 onclick="alert(1)">見出し</h1>',
            marks: ['strong'],
          },
        ],
      },
      {
        _type: 'block',
        _key: 'block2',
        style: 'blockquote',
        children: [
          {
            _type: 'span',
            _key: 'span2',
            text: '&lt;script&gt;alert("encoded")&lt;/script&gt;引用文',
            marks: ['em'],
          },
        ],
      },
    ];

    const { container } = render(<PortableTextRenderer blocks={complexMaliciousBlocks} />);
    
    // HTMLタグとイベントハンドラーが除去されていることを確認
    expect(container.innerHTML).not.toContain('onclick');
    expect(container.innerHTML).not.toContain('&lt;script&gt;');
    // h1タグは正常なレンダリング結果として存在する
    expect(container.innerHTML).toContain('<h1');
    
    // 安全なコンテンツのみが表示される
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('見出し');
    expect(screen.getByText('script"encoded")/script引用文').closest('blockquote')).toBeInTheDocument();
  });

  it('大量のデータでもパフォーマンスを維持する', () => {
    const largeBlocks = Array.from({ length: 100 }, (_, i) => ({
      _type: 'block',
      _key: `block${i}`,
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: `span${i}`,
          text: `テキスト ${i} `.repeat(100), // 長いテキスト
          marks: ['strong'],
        },
      ],
    }));

    const startTime = performance.now();
    render(<PortableTextRenderer blocks={largeBlocks} />);
    const endTime = performance.now();
    
    // レンダリング時間が合理的な範囲内であることを確認（1秒以内）
    expect(endTime - startTime).toBeLessThan(1000);
    
    // 最初と最後のブロックが正しくレンダリングされていることを確認
    expect(screen.getByText(/テキスト 0/)).toBeInTheDocument();
    expect(screen.getByText(/テキスト 99/)).toBeInTheDocument();
  });

  it('エッジケースを適切に処理する', () => {
    const edgeCaseBlocks = [
      // 空のブロック
      {
        _type: 'block',
        _key: 'empty1',
        style: 'normal',
        children: [],
      },
      // nullテキストを含むスパン
      {
        _type: 'block',
        _key: 'null-text',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 'span-null',
            text: null,
            marks: [],
          },
        ],
      },
      // 無効なマークを含むスパン
      {
        _type: 'block',
        _key: 'invalid-marks',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 'span-invalid',
            text: 'テキスト',
            marks: [null, undefined, 'invalid-mark', 'strong'],
          },
        ],
      },
      // 無効なアセット参照を持つ画像
      {
        _type: 'image',
        _key: 'invalid-image',
        asset: {
          _ref: null,
          _type: 'reference',
        },
        alt: '無効な画像',
      },
    ];

    const { container } = render(<PortableTextRenderer blocks={edgeCaseBlocks} />);
    
    // エラーが発生せずにレンダリングされることを確認
    expect(container).toBeInTheDocument();
    
    // 有効なコンテンツのみが表示される
    expect(screen.getByText('テキスト')).toBeInTheDocument();
    
    // 無効な画像は表示されない
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it.skip('セキュリティヘッダーが適切に設定される', () => {
    const blocks = [
      {
        _type: 'image',
        _key: 'img1',
        asset: {
          _ref: 'image-abc123-800x600-jpg',
          _type: 'reference',
        },
        alt: '画像',
      },
    ];

    render(<PortableTextRenderer blocks={blocks} />);
    
    const img = screen.getByRole('img');
    
    // セキュリティ関連の属性が設定されていることを確認
    expect(img).toHaveAttribute('referrerPolicy', 'no-referrer');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it.skip('Sanity画像URLが正しく構築される', () => {
    const blocks = [
      {
        _type: 'image',
        _key: 'img1',
        asset: {
          _ref: 'image-abc123def456-1920x1080-webp',
          _type: 'reference',
        },
        alt: 'WebP画像',
      },
    ];

    render(<PortableTextRenderer blocks={blocks} />);
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute(
      'src',
      'https://cdn.sanity.io/images/test-project/test-dataset/abc123def456-1920x1080.webp'
    );
  });
});