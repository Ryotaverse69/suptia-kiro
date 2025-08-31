import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductDetailPage from '../page';
import { sanityServerWithCache } from '@/lib/sanityServer';
import { checkCompliance } from '@/lib/compliance';

// モック設定
vi.mock('@/lib/sanityServer', () => ({
  sanityServerWithCache: {
    fetchProduct: vi.fn(),
  },
}));

vi.mock('@/lib/compliance', () => ({
  checkCompliance: vi.fn(),
  generateSampleDescription: vi.fn((name: string) => `${name}のサンプル説明`),
}));

vi.mock('@/components/PersonaWarnings', () => ({
  PersonaWarnings: ({ product, userPersona }: any) => (
    <div data-testid="persona-warnings">
      <div>Product: {product.name}</div>
      <div>Persona: {userPersona.join(', ')}</div>
    </div>
  ),
}));

vi.mock('@/components/LegacyWarningBanner', () => ({
  LegacyWarningBanner: ({ violations }: any) => (
    <div data-testid="legacy-warning">
      Violations: {violations.length}
    </div>
  ),
}));

vi.mock('@/components/PriceTable', () => ({
  PriceTable: ({ product }: any) => (
    <div data-testid="price-table">
      Price: ¥{product.priceJPY}
    </div>
  ),
}));

vi.mock('@/lib/seo', () => ({
  generateProductMetadata: vi.fn(),
}));

vi.mock('@/lib/seo/json-ld', () => ({
  generateProductJsonLd: vi.fn(() => ({})),
  generateBreadcrumbJsonLd: vi.fn(() => ({})),
}));

vi.mock('@/lib/sanitize', () => ({
  isValidSlug: vi.fn(() => true),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('Not Found');
  }),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: vi.fn(() => 'test-nonce'),
  })),
}));

describe('ProductDetailPage', () => {
  const mockProduct = {
    _id: 'product-1',
    name: 'テストサプリメント',
    brand: 'テストブランド',
    priceJPY: 3000,
    servingsPerContainer: 30,
    servingsPerDay: 1,
    description: 'テスト商品の説明',
    slug: { current: 'test-supplement' },
    images: [
      {
        asset: { url: 'https://example.com/image.jpg' },
        alt: 'テスト画像',
      },
    ],
    ingredients: [
      {
        ingredient: {
          _id: 'ingredient-1',
          name: 'ビタミンC',
          category: 'vitamin',
          synonyms: ['アスコルビン酸'],
          safetyNotes: ['過剰摂取注意'],
          tags: ['抗酸化'],
        },
        amountMgPerServing: 1000,
      },
      {
        ingredient: {
          _id: 'ingredient-2',
          name: 'カフェイン',
          category: 'other',
          synonyms: ['caffeine'],
          safetyNotes: ['妊娠中注意'],
          tags: ['刺激物'],
        },
        amountMgPerServing: 100,
      },
    ],
    warnings: ['妊娠中・授乳中の方は医師にご相談ください'],
    form: 'capsule',
    thirdPartyTested: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (sanityServerWithCache.fetchProduct as any).mockResolvedValue(mockProduct);
    (checkCompliance as any).mockResolvedValue({
      hasViolations: false,
      violations: [],
    });
  });

  it('商品詳細ページが正しくレンダリングされる', async () => {
    const params = { slug: 'test-supplement' };
    
    render(await ProductDetailPage({ params }));

    // 商品名とブランドが表示される（h1タグの方を確認）
    expect(screen.getByRole('heading', { level: 1, name: 'テストサプリメント' })).toBeInTheDocument();
    expect(screen.getByText('テストブランド')).toBeInTheDocument();

    // PersonaWarningsコンポーネントが表示される
    expect(screen.getByTestId('persona-warnings')).toBeInTheDocument();
    expect(screen.getByText('Product: テストサプリメント')).toBeInTheDocument();
    expect(screen.getByText('Persona: pregnancy, medication')).toBeInTheDocument();

    // PriceTableが表示される
    expect(screen.getByTestId('price-table')).toBeInTheDocument();
    expect(screen.getByText('Price: ¥3000')).toBeInTheDocument();
  });

  it('成分構成が正しく表示される', async () => {
    const params = { slug: 'test-supplement' };
    
    render(await ProductDetailPage({ params }));

    // 成分構成セクションが表示される
    expect(screen.getByText('成分構成')).toBeInTheDocument();
    
    // 各成分が表示される
    expect(screen.getByText('ビタミンC')).toBeInTheDocument();
    expect(screen.getByText('(vitamin)')).toBeInTheDocument();
    expect(screen.getByText('1000mg')).toBeInTheDocument();
    
    expect(screen.getByText('カフェイン')).toBeInTheDocument();
    expect(screen.getByText('(other)')).toBeInTheDocument();
    expect(screen.getByText('100mg')).toBeInTheDocument();
  });

  it('注意事項が正しく表示される', async () => {
    const params = { slug: 'test-supplement' };
    
    render(await ProductDetailPage({ params }));

    // 注意事項セクションが表示される
    expect(screen.getByText('注意事項')).toBeInTheDocument();
    expect(screen.getByText('妊娠中・授乳中の方は医師にご相談ください')).toBeInTheDocument();
  });

  it('コンプライアンス違反がある場合にLegacyWarningBannerが表示される', async () => {
    (checkCompliance as any).mockResolvedValue({
      hasViolations: true,
      violations: [
        {
          originalText: '完治します',
          suggestedText: '改善が期待されます',
          severity: 'high',
        },
      ],
    });

    const params = { slug: 'test-supplement' };
    
    render(await ProductDetailPage({ params }));

    // LegacyWarningBannerが表示される
    expect(screen.getByTestId('legacy-warning')).toBeInTheDocument();
    expect(screen.getByText('Violations: 1')).toBeInTheDocument();
  });

  it('商品が見つからない場合にnotFoundが呼ばれる', async () => {
    const { notFound } = await import('next/navigation');
    (sanityServerWithCache.fetchProduct as any).mockResolvedValue(null);

    const params = { slug: 'non-existent' };
    
    try {
      await ProductDetailPage({ params });
    } catch (error) {
      // notFound()が呼ばれることでエラーが発生する可能性があるため、try-catchで処理
    }

    expect(notFound).toHaveBeenCalled();
  });

  it('商品説明がない場合にサンプル説明が生成される', async () => {
    const productWithoutDescription = {
      ...mockProduct,
      description: undefined,
    };
    (sanityServerWithCache.fetchProduct as any).mockResolvedValue(productWithoutDescription);

    const params = { slug: 'test-supplement' };
    
    render(await ProductDetailPage({ params }));

    // サンプル説明が表示される
    expect(screen.getByText('テストサプリメントのサンプル説明')).toBeInTheDocument();
  });

  it('成分がない場合に成分構成セクションが表示されない', async () => {
    const productWithoutIngredients = {
      ...mockProduct,
      ingredients: undefined,
    };
    (sanityServerWithCache.fetchProduct as any).mockResolvedValue(productWithoutIngredients);

    const params = { slug: 'test-supplement' };
    
    render(await ProductDetailPage({ params }));

    // 成分構成セクションが表示されない
    expect(screen.queryByText('成分構成')).not.toBeInTheDocument();
  });

  it('警告がない場合に注意事項セクションが表示されない', async () => {
    const productWithoutWarnings = {
      ...mockProduct,
      warnings: undefined,
    };
    (sanityServerWithCache.fetchProduct as any).mockResolvedValue(productWithoutWarnings);

    const params = { slug: 'test-supplement' };
    
    render(await ProductDetailPage({ params }));

    // 注意事項セクションが表示されない
    expect(screen.queryByText('注意事項')).not.toBeInTheDocument();
  });
});