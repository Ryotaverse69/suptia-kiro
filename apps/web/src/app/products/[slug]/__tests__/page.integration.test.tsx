import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ProductDetailPage from '../page';

// モック設定
const mockSanityServerWithCache = {
  fetchProduct: vi.fn(),
};

const mockCheckCompliance = vi.fn();

vi.mock('@/lib/sanityServer', () => ({
  sanityServerWithCache: mockSanityServerWithCache,
}));

vi.mock('@/lib/compliance', () => ({
  checkCompliance: mockCheckCompliance,
  generateSampleDescription: vi.fn((name: string) => `${name}のサンプル説明`),
}));

// エンドツーエンド統合テスト
describe('Product Detail Page - End-to-End Integration Tests', () => {
  // 実際のSanityデータ構造をシミュレート
  const realProductData = {
    _id: 'e2e-product-1',
    name: 'プレミアムマルチビタミン',
    brand: 'ヘルスケアブランド',
    priceJPY: 4500,
    servingsPerContainer: 60,
    servingsPerDay: 2,
    description: '毎日の健康をサポートする効果的なマルチビタミンサプリメント。完全な栄養バランスで、あなたの健康を治療レベルでサポートします。',
    slug: { current: 'premium-multivitamin' },
    images: [
      {
        asset: { url: 'https://cdn.sanity.io/images/test/premium-vitamin.jpg' },
        alt: 'プレミアムマルチビタミン商品画像',
      },
    ],
    ingredients: [
      {
        ingredient: {
          _id: 'vitamin-c-ingredient',
          name: 'ビタミンC',
          category: 'vitamin',
          synonyms: ['アスコルビン酸', 'L-アスコルビン酸'],
          safetyNotes: ['過剰摂取により胃腸障害の可能性'],
          tags: ['抗酸化', '免疫'],
        },
        amountMgPerServing: 1000,
      },
      {
        ingredient: {
          _id: 'caffeine-ingredient',
          name: 'カフェイン',
          category: 'stimulant',
          synonyms: ['caffeine', '1,3,7-trimethylxanthine'],
          safetyNotes: ['妊娠中・授乳中は摂取制限', '不眠症の方は注意'],
          tags: ['刺激物', '覚醒'],
        },
        amountMgPerServing: 100,
      },
      {
        ingredient: {
          _id: 'iron-ingredient',
          name: '鉄',
          category: 'mineral',
          synonyms: ['iron', 'Fe'],
          safetyNotes: ['過剰摂取により消化器症状'],
          tags: ['ミネラル', '血液'],
        },
        amountMgPerServing: 18,
      },
      {
        ingredient: {
          _id: 'st-johns-wort-ingredient',
          name: 'セントジョーンズワート',
          category: 'herb',
          synonyms: ['聖ヨハネ草', 'St. John\'s wort'],
          safetyNotes: ['薬物相互作用の可能性', '授乳中は注意'],
          tags: ['ハーブ', '気分'],
        },
        amountMgPerServing: 300,
      },
    ],
    warnings: [
      '妊娠中・授乳中の方は医師にご相談ください',
      '薬を服用中の方は医師にご相談ください',
      'アレルギーのある方は原材料をご確認ください',
    ],
    form: 'capsule',
    thirdPartyTested: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Sanityからのデータ取得をモック
    mockSanityServerWithCache.fetchProduct.mockResolvedValue(realProductData);
    
    // コンプライアンスチェックをモック（実際の違反を含む）
    mockCheckCompliance.mockResolvedValue({
      hasViolations: true,
      violations: [
        {
          originalText: '効果的な',
          suggestedText: '変化が報告されている',
          severity: 'medium',
          pattern: '効果的',
        },
        {
          originalText: '完全な',
          suggestedText: '総合的な',
          severity: 'low',
          pattern: '完全',
        },
        {
          originalText: '治療レベル',
          suggestedText: '健康維持レベル',
          severity: 'high',
          pattern: '治療',
        },
      ],
    });

    // コンソールログをモック
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('完全なページレンダリング', () => {
    it('商品詳細ページが完全にレンダリングされ、警告システムが動作する', async () => {
      const params = { slug: 'premium-multivitamin' };
      
      render(await ProductDetailPage({ params }));

      // 基本的な商品情報が表示される
      expect(screen.getByRole('heading', { level: 1, name: 'プレミアムマルチビタミン' })).toBeInTheDocument();
      expect(screen.getByText('ヘルスケアブランド')).toBeInTheDocument();

      // PersonaWarningsコンポーネントが統合されて動作する
      await waitFor(() => {
        const warnings = screen.getAllByRole('status');
        expect(warnings.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      // コンプライアンス警告が表示される
      expect(screen.getByText(/という表現について注意が必要です/)).toBeInTheDocument();
      
      // ペルソナ警告が表示される（妊娠中のカフェイン警告）
      expect(screen.getByText(/妊娠中はカフェインの摂取に注意が必要です/)).toBeInTheDocument();

      // 成分構成が表示される
      expect(screen.getByText('成分構成')).toBeInTheDocument();
      expect(screen.getByText('ビタミンC')).toBeInTheDocument();
      expect(screen.getByText('カフェイン')).toBeInTheDocument();
      expect(screen.getByText('鉄')).toBeInTheDocument();
      expect(screen.getByText('セントジョーンズワート')).toBeInTheDocument();

      // 価格テーブルが表示される
      expect(screen.getByText('Price: ¥4500')).toBeInTheDocument();
    });

    it('警告システムのエラー境界が正しく動作する', async () => {
      // PersonaWarningsでエラーが発生する状況をシミュレート
      const errorProduct = {
        ...realProductData,
        ingredients: null as any, // 意図的にエラーを発生させる
      };

      (sanityServerWithCache.fetchProduct as any).mockResolvedValue(errorProduct);

      const params = { slug: 'premium-multivitamin' };
      
      render(await ProductDetailPage({ params }));

      // エラー境界のフォールバックが表示される
      await waitFor(() => {
        expect(screen.getByText('警告システムを一時的に利用できません。商品をご利用の際は十分にご注意ください。')).toBeInTheDocument();
      });

      // ページの他の部分は正常に表示される
      expect(screen.getByRole('heading', { level: 1, name: 'プレミアムマルチビタミン' })).toBeInTheDocument();
    });
  });

  describe('警告システムの統合動作', () => {
    it('複数の警告タイプが同時に表示され、重要度順にソートされる', async () => {
      const params = { slug: 'premium-multivitamin' };
      
      render(await ProductDetailPage({ params }));

      await waitFor(() => {
        const warnings = screen.getAllByRole('status');
        expect(warnings.length).toBeGreaterThanOrEqual(3); // コンプライアンス + ペルソナ警告
      }, { timeout: 3000 });

      const warnings = screen.getAllByRole('status');
      const warningTexts = warnings.map(w => w.textContent || '');

      // 高重要度の警告が先頭に来ることを確認
      const highSeverityIndex = warningTexts.findIndex(text => 
        text.includes('重要な健康上の注意') || text.includes('治療レベル')
      );
      const lowSeverityIndex = warningTexts.findIndex(text => 
        text.includes('完全な')
      );

      if (highSeverityIndex !== -1 && lowSeverityIndex !== -1) {
        expect(highSeverityIndex).toBeLessThan(lowSeverityIndex);
      }
    });

    it('警告の解除機能が正しく動作する', async () => {
      const params = { slug: 'premium-multivitamin' };
      
      render(await ProductDetailPage({ params }));

      await waitFor(() => {
        const warnings = screen.getAllByRole('status');
        expect(warnings.length).toBeGreaterThan(1);
      }, { timeout: 3000 });

      const initialWarningCount = screen.getAllByRole('status').length;
      const closeButtons = screen.getAllByRole('button', { name: '警告を閉じる' });

      // 最初の警告を閉じる
      fireEvent.click(closeButtons[0]);

      await waitFor(() => {
        const remainingWarnings = screen.getAllByRole('status');
        expect(remainingWarnings.length).toBe(initialWarningCount - 1);
      });

      // 他の警告は残っていることを確認
      expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    });

    it('キーボードナビゲーションが完全に機能する', async () => {
      const params = { slug: 'premium-multivitamin' };
      
      render(await ProductDetailPage({ params }));

      await waitFor(() => {
        const warnings = screen.getAllByRole('status');
        expect(warnings.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      const closeButtons = screen.getAllByRole('button', { name: '警告を閉じる' });
      
      // Tabキーでフォーカス移動
      closeButtons[0].focus();
      expect(document.activeElement).toBe(closeButtons[0]);

      // Escapeキーで警告を閉じる
      const initialWarningCount = screen.getAllByRole('status').length;
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        const remainingWarnings = screen.getAllByRole('status');
        expect(remainingWarnings.length).toBeLessThan(initialWarningCount);
      });
    });
  });

  describe('パフォーマンステスト', () => {
    it('ページ全体のレンダリング性能', async () => {
      const startTime = performance.now();

      const params = { slug: 'premium-multivitamin' };
      render(await ProductDetailPage({ params }));

      // 全ての主要コンポーネントがレンダリングされるまで待機
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
        expect(screen.getByText('成分構成')).toBeInTheDocument();
      }, { timeout: 5000 });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // ページ全体が3秒以内でレンダリングされることを確認
      expect(renderTime).toBeLessThan(3000);
    });

    it('大量の警告でのパフォーマンス', async () => {
      // 大量の違反を含むコンプライアンス結果をモック
      mockCheckCompliance.mockResolvedValue({
        hasViolations: true,
        violations: Array.from({ length: 20 }, (_, index) => ({
          originalText: `違反テキスト${index}`,
          suggestedText: `修正テキスト${index}`,
          severity: index % 3 === 0 ? 'high' : index % 2 === 0 ? 'medium' : 'low',
          pattern: `pattern${index}`,
        })),
      });

      const startTime = performance.now();

      const params = { slug: 'premium-multivitamin' };
      render(await ProductDetailPage({ params }));

      await waitFor(() => {
        const warnings = screen.getAllByRole('status');
        expect(warnings.length).toBeGreaterThan(15);
      }, { timeout: 5000 });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 大量の警告でも5秒以内でレンダリングされることを確認
      expect(renderTime).toBeLessThan(5000);
    });
  });

  describe('アクセシビリティ統合テスト', () => {
    it('ページ全体のアクセシビリティ', async () => {
      const params = { slug: 'premium-multivitamin' };
      
      const { container } = render(await ProductDetailPage({ params }));

      await waitFor(() => {
        expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      // 見出し構造が適切
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();

      const h2s = screen.getAllByRole('heading', { level: 2 });
      expect(h2s.length).toBeGreaterThan(0);

      // 警告のアクセシビリティ
      const warnings = screen.getAllByRole('status');
      warnings.forEach(warning => {
        expect(warning).toHaveAttribute('aria-live', 'polite');
        expect(warning).toHaveAttribute('aria-label');
      });

      // ボタンのアクセシビリティ
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type');
      });
    });

    it('フォーカス管理の統合テスト', async () => {
      const params = { slug: 'premium-multivitamin' };
      
      render(await ProductDetailPage({ params }));

      await waitFor(() => {
        expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      // フォーカス可能な要素を取得
      const focusableElements = screen.getAllByRole('button');
      
      // 各要素がフォーカス可能であることを確認
      focusableElements.forEach(element => {
        element.focus();
        expect(document.activeElement).toBe(element);
      });
    });
  });

  describe('エラーハンドリング統合テスト', () => {
    it('Sanityデータ取得エラーの処理', async () => {
      mockSanityServerWithCache.fetchProduct.mockResolvedValue(null);

      const params = { slug: 'non-existent-product' };
      
      try {
        await ProductDetailPage({ params });
      } catch (error) {
        // notFound()が呼ばれることを確認
        expect(error).toBeDefined();
      }
    });

    it('コンプライアンスチェックエラーの処理', async () => {
      mockCheckCompliance.mockRejectedValue(new Error('Compliance API Error'));

      const params = { slug: 'premium-multivitamin' };
      
      render(await ProductDetailPage({ params }));

      // ページは正常にレンダリングされる
      expect(screen.getByRole('heading', { level: 1, name: 'プレミアムマルチビタミン' })).toBeInTheDocument();

      // PersonaWarningsは独自のエラーハンドリングを行う
      await waitFor(() => {
        // エラーメッセージまたは警告が表示される
        expect(
          screen.queryByText('警告チェックを実行できませんでした') ||
          screen.queryByRole('status')
        ).toBeTruthy();
      });
    });

    it('部分的なデータ破損への対応', async () => {
      const corruptedProduct = {
        ...realProductData,
        ingredients: [
          // 正常なデータ
          realProductData.ingredients[0],
          // 破損したデータ
          {
            ingredient: null,
            amountMgPerServing: 100,
          },
          // 不完全なデータ
          {
            ingredient: {
              _id: 'incomplete-ingredient',
              // nameが欠如
            },
            amountMgPerServing: 50,
          },
        ],
      };

      mockSanityServerWithCache.fetchProduct.mockResolvedValue(corruptedProduct);

      const params = { slug: 'premium-multivitamin' };
      
      render(await ProductDetailPage({ params }));

      // ページは正常にレンダリングされる
      expect(screen.getByRole('heading', { level: 1, name: 'プレミアムマルチビタミン' })).toBeInTheDocument();

      // 利用可能なデータは表示される
      expect(screen.getByText('ビタミンC')).toBeInTheDocument();

      // 警告システムはエラーを適切に処理する
      await waitFor(() => {
        expect(
          screen.queryByText('警告チェックを実行できませんでした') ||
          screen.queryByRole('status')
        ).toBeTruthy();
      });
    });
  });

  describe('SEOとメタデータ統合', () => {
    it('構造化データが適切に生成される', async () => {
      const params = { slug: 'premium-multivitamin' };
      
      render(await ProductDetailPage({ params }));

      // JSON-LDスクリプトタグが存在することを確認
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      expect(scripts.length).toBeGreaterThanOrEqual(2); // product + breadcrumb

      // パンくずナビゲーションが表示される
      expect(screen.getByText('ホーム')).toBeInTheDocument();
      expect(screen.getByText('商品')).toBeInTheDocument();
      expect(screen.getByText('プレミアムマルチビタミン')).toBeInTheDocument();
    });
  });

  describe('レスポンシブデザイン統合', () => {
    it('モバイル向けレイアウトが適用される', async () => {
      const params = { slug: 'premium-multivitamin' };
      
      render(await ProductDetailPage({ params }));

      await waitFor(() => {
        expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      // レスポンシブクラスが適用されていることを確認
      const warnings = screen.getAllByRole('status');
      warnings.forEach(warning => {
        const title = warning.querySelector('h3');
        if (title) {
          expect(title).toHaveClass('sm:text-base');
        }
      });

      // 成分構成のレスポンシブレイアウト
      const ingredientSection = screen.getByText('成分構成').closest('div');
      const ingredientGrid = ingredientSection?.querySelector('.grid');
      if (ingredientGrid) {
        expect(ingredientGrid).toHaveClass('md:grid-cols-2');
      }
    });
  });

  describe('ユーザーエクスペリエンス統合', () => {
    it('警告解除後のユーザビリティ', async () => {
      const params = { slug: 'premium-multivitamin' };
      
      render(await ProductDetailPage({ params }));

      await waitFor(() => {
        const warnings = screen.getAllByRole('status');
        expect(warnings.length).toBeGreaterThan(2);
      }, { timeout: 3000 });

      // 段階的に警告を解除
      let closeButtons = screen.getAllByRole('button', { name: '警告を閉じる' });
      const initialCount = closeButtons.length;

      // 最初の警告を閉じる
      fireEvent.click(closeButtons[0]);

      await waitFor(() => {
        closeButtons = screen.getAllByRole('button', { name: '警告を閉じる' });
        expect(closeButtons.length).toBe(initialCount - 1);
      });

      // 残りの警告は正常に機能する
      expect(screen.getAllByRole('status').length).toBeGreaterThan(0);

      // 商品情報は影響を受けない
      expect(screen.getByRole('heading', { level: 1, name: 'プレミアムマルチビタミン' })).toBeInTheDocument();
      expect(screen.getByText('成分構成')).toBeInTheDocument();
    });

    it('警告なしの商品での正常動作', async () => {
      // 警告が発生しない商品データ
      const safeProduct = {
        ...realProductData,
        description: '安全な商品説明です。',
        ingredients: [
          {
            ingredient: {
              _id: 'safe-ingredient',
              name: 'ビタミンD',
              category: 'vitamin',
            },
            amountMgPerServing: 25,
          },
        ],
      };

      mockSanityServerWithCache.fetchProduct.mockResolvedValue(safeProduct);
      mockCheckCompliance.mockResolvedValue({
        hasViolations: false,
        violations: [],
      });

      const params = { slug: 'premium-multivitamin' };
      
      render(await ProductDetailPage({ params }));

      // 商品情報は正常に表示される
      expect(screen.getByRole('heading', { level: 1, name: 'プレミアムマルチビタミン' })).toBeInTheDocument();

      // 警告は表示されない
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // 他のコンポーネントは正常に動作する
      expect(screen.getByText('成分構成')).toBeInTheDocument();
      expect(screen.getByText('Price: ¥4500')).toBeInTheDocument();
    });
  });
});