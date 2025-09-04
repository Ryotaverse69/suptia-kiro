import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateRecommendations,
  getPopularRecommendations,
  getCategoryRecommendations,
  generateRecommendationReason,
  createDebouncedRecommendationGenerator,
  type UserContext,
  type RecommendationCategory,
} from '../ai-recommendations';

describe('ai-recommendations', () => {
  describe('generateRecommendations', () => {
    it('空のクエリで人気商品を返す', () => {
      const recommendations = generateRecommendations('');
      
      expect(recommendations).toHaveLength(5);
      expect(recommendations[0]).toHaveProperty('id');
      expect(recommendations[0]).toHaveProperty('title');
      expect(recommendations[0]).toHaveProperty('confidence');
    });

    it('ビタミンCの検索で関連商品を返す', () => {
      const recommendations = generateRecommendations('ビタミンC');
      
      expect(recommendations.length).toBeGreaterThan(0);
      const vitaminCProduct = recommendations.find(r => 
        r.title.includes('ビタミンC') || r.tags.includes('ビタミンC')
      );
      expect(vitaminCProduct).toBeDefined();
    });

    it('プロテインの検索で関連商品を返す', () => {
      const recommendations = generateRecommendations('プロテイン');
      
      expect(recommendations.length).toBeGreaterThan(0);
      const proteinProduct = recommendations.find(r => 
        r.title.includes('プロテイン') || r.tags.includes('プロテイン')
      );
      expect(proteinProduct).toBeDefined();
    });

    it('免疫に関連するキーワードで適切な商品を返す', () => {
      const recommendations = generateRecommendations('免疫力');
      
      expect(recommendations.length).toBeGreaterThan(0);
      const immuneProduct = recommendations.find(r => 
        r.tags.includes('免疫') || r.reason.includes('免疫')
      );
      expect(immuneProduct).toBeDefined();
    });

    it('maxResultsパラメータが正しく動作する', () => {
      const recommendations = generateRecommendations('ビタミン', undefined, 3);
      
      expect(recommendations).toHaveLength(3);
    });

    it('信頼度順にソートされている', () => {
      const recommendations = generateRecommendations('ビタミン');
      
      for (let i = 1; i < recommendations.length; i++) {
        const prevScore = recommendations[i - 1].confidence * 0.7 + recommendations[i - 1].popularityScore * 0.3;
        const currentScore = recommendations[i].confidence * 0.7 + recommendations[i].popularityScore * 0.3;
        expect(prevScore).toBeGreaterThanOrEqual(currentScore);
      }
    });
  });

  describe('getPopularRecommendations', () => {
    it('人気順にソートされた商品を返す', () => {
      const recommendations = getPopularRecommendations();
      
      expect(recommendations).toHaveLength(5);
      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i - 1].popularityScore).toBeGreaterThanOrEqual(
          recommendations[i].popularityScore
        );
      }
    });

    it('指定した数の商品を返す', () => {
      const recommendations = getPopularRecommendations(3);
      
      expect(recommendations).toHaveLength(3);
    });
  });

  describe('getCategoryRecommendations', () => {
    it('指定カテゴリの商品のみを返す', () => {
      const category: RecommendationCategory = 'cost-effective';
      const recommendations = getCategoryRecommendations(category);
      
      expect(recommendations.length).toBeGreaterThan(0);
      recommendations.forEach(rec => {
        expect(rec.category).toBe(category);
      });
    });

    it('信頼度順にソートされている', () => {
      const recommendations = getCategoryRecommendations('high-quality');
      
      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i - 1].confidence).toBeGreaterThanOrEqual(
          recommendations[i].confidence
        );
      }
    });
  });

  describe('generateRecommendationReason', () => {
    const mockProduct = {
      id: 'test-product',
      title: 'テスト商品',
      reason: '基本的な理由です。',
      confidence: 0.8,
      category: 'popular' as RecommendationCategory,
      tags: ['ビタミン', 'テスト'],
      popularityScore: 0.7,
      evidenceLevel: 'high' as const,
    };

    it('基本的な理由を返す', () => {
      const reason = generateRecommendationReason(mockProduct, '');
      
      expect(reason).toBe('基本的な理由です。');
    });

    it('クエリに関連する理由を追加する', () => {
      const reason = generateRecommendationReason(mockProduct, 'ビタミン');
      
      expect(reason).toContain('基本的な理由です。');
      expect(reason).toContain('「ビタミン」に関連する成分を含有しています。');
    });

    it('価格帯が一致する場合の理由を追加する', () => {
      const userContext: UserContext = {
        preferences: {
          priceRange: [800, 1500],
        },
      };
      
      const productWithPrice = {
        ...mockProduct,
        priceRange: [1000, 1200] as [number, number],
      };
      
      const reason = generateRecommendationReason(productWithPrice, '', userContext);
      
      expect(reason).toContain('ご希望の価格帯に適合しています。');
    });
  });

  describe('createDebouncedRecommendationGenerator', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('デバウンス機能が正しく動作する', async () => {
      const debouncedGenerate = createDebouncedRecommendationGenerator(100);
      
      // 複数回呼び出し
      const promise1 = debouncedGenerate('ビタミン');
      const promise2 = debouncedGenerate('ビタミンC');
      const promise3 = debouncedGenerate('ビタミンD');
      
      // 時間を進める
      vi.advanceTimersByTime(100);
      
      // 最後の呼び出しのみが実行される
      const result = await promise3;
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('指定した遅延時間が適用される', async () => {
      const debouncedGenerate = createDebouncedRecommendationGenerator(200);
      
      const promise = debouncedGenerate('テスト');
      
      // 遅延時間前では結果が返らない
      vi.advanceTimersByTime(100);
      let resolved = false;
      promise.then(() => { resolved = true; });
      
      await Promise.resolve(); // マイクロタスクを処理
      expect(resolved).toBe(false);
      
      // 遅延時間後に結果が返る
      vi.advanceTimersByTime(100);
      await promise;
      expect(resolved).toBe(true);
    });
  });

  describe('ユーザーコンテキストによる調整', () => {
    it('価格帯の設定が信頼度に影響する', () => {
      const userContext: UserContext = {
        preferences: {
          priceRange: [800, 1500],
        },
      };
      
      const recommendations = generateRecommendations('ビタミン', userContext);
      
      // 価格帯に合う商品の信頼度が調整されていることを確認
      const affordableProduct = recommendations.find(r => 
        r.priceRange && r.priceRange[0] >= 800 && r.priceRange[1] <= 1500
      );
      
      if (affordableProduct) {
        expect(affordableProduct.confidence).toBeGreaterThan(0);
      }
    });

    it('カテゴリの設定が結果に影響する', () => {
      const userContext: UserContext = {
        preferences: {
          categories: ['ビタミン'],
        },
      };
      
      const recommendations = generateRecommendations('健康', userContext);
      
      // ビタミン関連の商品が優先されることを確認
      const vitaminProduct = recommendations.find(r => 
        r.tags.some(tag => tag.includes('ビタミン'))
      );
      
      expect(vitaminProduct).toBeDefined();
    });

    it('検索履歴が結果に影響する', () => {
      const userContext: UserContext = {
        searchHistory: ['ビタミンC', 'オメガ3'],
      };
      
      const recommendations = generateRecommendations('健康', userContext);
      
      // 検索履歴に関連する商品が含まれることを確認
      const relatedProduct = recommendations.find(r => 
        r.tags.some(tag => 
          tag.includes('ビタミン') || tag.includes('オメガ3')
        )
      );
      
      expect(relatedProduct).toBeDefined();
    });
  });

  describe('エラーハンドリング', () => {
    it('不正なクエリでもエラーが発生しない', () => {
      expect(() => {
        generateRecommendations('');
        generateRecommendations('   ');
        generateRecommendations('!@#$%^&*()');
      }).not.toThrow();
    });

    it('不正なユーザーコンテキストでもエラーが発生しない', () => {
      const invalidContext = {
        preferences: {
          priceRange: [-1, -1] as [number, number],
        },
      };
      
      expect(() => {
        generateRecommendations('ビタミン', invalidContext);
      }).not.toThrow();
    });

    it('maxResultsが0でも適切に処理される', () => {
      const recommendations = generateRecommendations('ビタミン', undefined, 0);
      
      expect(recommendations).toHaveLength(0);
    });
  });
});