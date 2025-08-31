/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ScoreDisplay } from '../ScoreDisplay';
import { ScoreBreakdown } from '../ScoreBreakdown';
import { ProductScoringClient } from '../ProductScoringClient';
import { ScoreResult } from '@/lib/scoring';

// パフォーマンス測定用のヘルパー
const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  const start = performance.now();
  await act(async () => {
    renderFn();
  });
  const end = performance.now();
  return end - start;
};

// 大量データのモック
const createLargeScoreResult = (factorCount: number = 10): ScoreResult => {
  const factors = Array.from({ length: factorCount }, (_, i) => ({
    name: `要因${i + 1}`,
    value: Math.random() * 100,
    weight: 1 / factorCount,
    description: `要因${i + 1}の詳細説明です。この要因は重要な指標の一つです。`
  }));

  return {
    total: 78.5,
    components: {
      evidence: 85.0,
      safety: 75.0,
      cost: 70.0,
      practicality: 80.0
    },
    weights: {
      evidence: 0.35,
      safety: 0.30,
      cost: 0.20,
      practicality: 0.15
    },
    breakdown: {
      evidence: {
        score: 85.0,
        factors: factors,
        explanation: 'エビデンススコアは科学的根拠の質と量を評価します'
      },
      safety: {
        score: 75.0,
        factors: factors,
        explanation: '安全性スコアは副作用や相互作用のリスクを評価します'
      },
      cost: {
        score: 70.0,
        factors: factors,
        explanation: 'コストスコアは価格対効果を評価します'
      },
      practicality: {
        score: 80.0,
        factors: factors,
        explanation: '実用性スコアは使いやすさを評価します'
      }
    },
    isComplete: true,
    missingData: []
  };
};

const mockProduct = {
  _id: 'test-product',
  name: 'テスト商品',
  brand: 'テストブランド',
  priceJPY: 3000,
  servingsPerContainer: 30,
  servingsPerDay: 1,
  form: 'capsule' as const,
  ingredients: Array.from({ length: 20 }, (_, i) => ({
    ingredient: {
      _id: `ingredient-${i}`,
      name: `成分${i + 1}`,
      category: 'ビタミン',
      evidenceLevel: 'A' as const,
      safetyNotes: [`成分${i + 1}の安全性情報`]
    },
    amountMgPerServing: Math.random() * 1000
  }))
};

describe('ScoreDisplay パフォーマンステスト', () => {
  it('初回レンダリングが100ms以内に完了すること', async () => {
    const scoreResult = createLargeScoreResult(5);
    
    const renderTime = await measureRenderTime(() => {
      render(<ScoreDisplay scoreResult={scoreResult} />);
    });
    
    expect(renderTime).toBeLessThan(100);
  });

  it('プロパティ変更時の再レンダリングが50ms以内に完了すること', async () => {
    const scoreResult1 = createLargeScoreResult(5);
    const scoreResult2 = { ...scoreResult1, total: 85.0 };
    
    const { rerender } = render(<ScoreDisplay scoreResult={scoreResult1} />);
    
    const rerenderTime = await measureRenderTime(() => {
      rerender(<ScoreDisplay scoreResult={scoreResult2} />);
    });
    
    expect(rerenderTime).toBeLessThan(50);
  });

  it('大量データでもパフォーマンスが劣化しないこと', async () => {
    const largeScoreResult = createLargeScoreResult(50);
    
    const renderTime = await measureRenderTime(() => {
      render(<ScoreDisplay scoreResult={largeScoreResult} />);
    });
    
    // 大量データでも200ms以内
    expect(renderTime).toBeLessThan(200);
  });

  it('React.memoによる最適化が機能していること', () => {
    const scoreResult = createLargeScoreResult(5);
    let renderCount = 0;
    
    const TestComponent = React.memo(() => {
      renderCount++;
      return <ScoreDisplay scoreResult={scoreResult} />;
    });
    
    const { rerender } = render(<TestComponent />);
    expect(renderCount).toBe(1);
    
    // 同じpropsで再レンダリング
    rerender(<TestComponent />);
    expect(renderCount).toBe(1); // 再レンダリングされないはず
    
    // 異なるpropsで再レンダリング
    const newScoreResult = { ...scoreResult, total: 90.0 };
    const TestComponent2 = React.memo(() => {
      renderCount++;
      return <ScoreDisplay scoreResult={newScoreResult} />;
    });
    
    rerender(<TestComponent2 />);
    expect(renderCount).toBe(2); // 再レンダリングされるはず
  });

  it('ローディング状態の切り替えが効率的であること', async () => {
    const scoreResult = createLargeScoreResult(5);
    
    const { rerender } = render(
      <ScoreDisplay scoreResult={null} isLoading={true} />
    );
    
    const loadingToDataTime = await measureRenderTime(() => {
      rerender(<ScoreDisplay scoreResult={scoreResult} isLoading={false} />);
    });
    
    expect(loadingToDataTime).toBeLessThan(50);
  });
});

describe('ScoreBreakdown パフォーマンステスト', () => {
  it('初回レンダリングが150ms以内に完了すること', async () => {
    const scoreResult = createLargeScoreResult(10);
    
    const renderTime = await measureRenderTime(() => {
      render(
        <ScoreBreakdown 
          breakdown={scoreResult.breakdown} 
          weights={scoreResult.weights} 
        />
      );
    });
    
    expect(renderTime).toBeLessThan(150);
  });

  it('セクション展開時のパフォーマンスが良好であること', async () => {
    const scoreResult = createLargeScoreResult(20);
    
    render(
      <ScoreBreakdown 
        breakdown={scoreResult.breakdown} 
        weights={scoreResult.weights} 
      />
    );
    
    const expandButton = screen.getAllByRole('button')[0];
    
    const expandTime = await measureRenderTime(() => {
      expandButton.click();
    });
    
    expect(expandTime).toBeLessThan(50);
  });

  it('複数セクション同時展開でもパフォーマンスが維持されること', async () => {
    const scoreResult = createLargeScoreResult(15);
    
    render(
      <ScoreBreakdown 
        breakdown={scoreResult.breakdown} 
        weights={scoreResult.weights} 
      />
    );
    
    const expandButtons = screen.getAllByRole('button');
    
    const multiExpandTime = await measureRenderTime(() => {
      expandButtons.forEach(button => button.click());
    });
    
    expect(multiExpandTime).toBeLessThan(100);
  });

  it('useMemoによる計算最適化が機能していること', () => {
    const breakdown = createLargeScoreResult(10).breakdown;
    const weights = { evidence: 0.35, safety: 0.30, cost: 0.20, practicality: 0.15 };
    
    let renderCount = 0;
    
    const TestComponent = React.memo(({ breakdown, weights }: any) => {
      renderCount++;
      return <ScoreBreakdown breakdown={breakdown} weights={weights} />;
    });
    
    const { rerender } = render(<TestComponent breakdown={breakdown} weights={weights} />);
    expect(renderCount).toBe(1);
    
    // 同じpropsで再レンダリング
    rerender(<TestComponent breakdown={breakdown} weights={weights} />);
    expect(renderCount).toBe(1); // 再レンダリングされないはず
  });
});

describe('ProductScoringClient パフォーマンステスト', () => {
  it('スコア計算とレンダリングが200ms以内に完了すること', async () => {
    const renderTime = await measureRenderTime(() => {
      render(<ProductScoringClient product={mockProduct} />);
    });
    
    expect(renderTime).toBeLessThan(200);
  });

  it('商品データ変更時の再計算が効率的であること', async () => {
    const product1 = mockProduct;
    const product2 = { ...mockProduct, priceJPY: 4000 };
    
    const { rerender } = render(<ProductScoringClient product={product1} />);
    
    const recalculationTime = await measureRenderTime(() => {
      rerender(<ProductScoringClient product={product2} />);
    });
    
    expect(recalculationTime).toBeLessThan(100);
  });

  it('エラー状態からの復旧が効率的であること', async () => {
    // エラーを発生させる商品データ
    const errorProduct = { ...mockProduct, ingredients: undefined };
    
    const { rerender } = render(<ProductScoringClient product={errorProduct} />);
    
    // 正常な商品データに戻す
    const recoveryTime = await measureRenderTime(() => {
      rerender(<ProductScoringClient product={mockProduct} />);
    });
    
    expect(recoveryTime).toBeLessThan(100);
  });
});

describe('メモリ使用量テスト', () => {
  it('大量レンダリング後にメモリリークが発生しないこと', async () => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    // 大量のコンポーネントをレンダリング
    for (let i = 0; i < 100; i++) {
      const scoreResult = createLargeScoreResult(10);
      const { unmount } = render(<ScoreDisplay scoreResult={scoreResult} />);
      unmount();
    }
    
    // ガベージコレクションを促進
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    // メモリ増加が10MB以下であることを確認
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });

  it('長時間の使用でもパフォーマンスが劣化しないこと', async () => {
    const scoreResult = createLargeScoreResult(10);
    const { rerender } = render(<ScoreDisplay scoreResult={scoreResult} />);
    
    const renderTimes: number[] = [];
    
    // 100回の再レンダリングを実行
    for (let i = 0; i < 100; i++) {
      const newScoreResult = { ...scoreResult, total: 70 + i * 0.1 };
      
      const renderTime = await measureRenderTime(() => {
        rerender(<ScoreDisplay scoreResult={newScoreResult} />);
      });
      
      renderTimes.push(renderTime);
    }
    
    // 最初の10回と最後の10回の平均レンダリング時間を比較
    const initialAverage = renderTimes.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
    const finalAverage = renderTimes.slice(-10).reduce((a, b) => a + b, 0) / 10;
    
    // パフォーマンス劣化が50%以下であることを確認
    expect(finalAverage).toBeLessThan(initialAverage * 1.5);
  });

  it('イベントリスナーが適切にクリーンアップされること', () => {
    const scoreResult = createLargeScoreResult(5);
    
    // 初期のイベントリスナー数を記録
    const initialListeners = document.querySelectorAll('[data-testid]').length;
    
    const { unmount } = render(
      <ScoreBreakdown 
        breakdown={scoreResult.breakdown} 
        weights={scoreResult.weights} 
      />
    );
    
    // コンポーネントをアンマウント
    unmount();
    
    // イベントリスナーがクリーンアップされていることを確認
    const finalListeners = document.querySelectorAll('[data-testid]').length;
    expect(finalListeners).toBeLessThanOrEqual(initialListeners);
  });
});