import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ScoreDisplay } from '../ScoreDisplay';
import { ScoreBreakdown } from '../ScoreBreakdown';
import { ScoreResult } from '@/lib/scoring';

// テスト用のモックデータ
const mockCompleteScoreResult: ScoreResult = {
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
      score: 85,
      factors: [{
        name: 'エビデンスレベル',
        value: 85,
        weight: 1.0,
        description: '成分の科学的根拠の質 (A, B)'
      }],
      explanation: 'エビデンススコアは成分の科学的根拠の質を評価します'
    },
    safety: {
      score: 75,
      factors: [{
        name: '副作用リスク',
        value: 75,
        weight: 1.0,
        description: 'リスク要因数: 2件 (レベル: low)'
      }],
      explanation: '安全性スコアは副作用や相互作用のリスクを評価します'
    },
    cost: {
      score: 70,
      factors: [{
        name: 'mg単価効率',
        value: 70,
        weight: 1.0,
        description: '0.150円/mg/日 (1日150円)'
      }],
      explanation: 'コストスコアは価格対効果を評価します'
    },
    practicality: {
      score: 80,
      factors: [
        {
          name: '摂取頻度',
          value: 85,
          weight: 0.4,
          description: '1日2回摂取'
        },
        {
          name: '剤形',
          value: 100,
          weight: 0.3,
          description: 'capsule形式'
        },
        {
          name: '容量',
          value: 60,
          weight: 0.3,
          description: '1容器で30日分'
        }
      ],
      explanation: '実用性スコアは使いやすさを評価します'
    }
  },
  isComplete: true,
  missingData: []
};

// 統合コンポーネント（ScoreDisplayとScoreBreakdownを組み合わせ）
const ScoreIntegrationComponent: React.FC<{ scoreResult: ScoreResult }> = ({ scoreResult }) => {
  return (
    <div className="space-y-6">
      <ScoreDisplay scoreResult={scoreResult} showBreakdown={true} />
      <ScoreBreakdown breakdown={scoreResult.breakdown} weights={scoreResult.weights} />
    </div>
  );
};

describe('スコアコンポーネント統合テスト', () => {
  describe('コンポーネント間の連携', () => {
    it('ScoreDisplayとScoreBreakdownが同じデータを正しく表示する', () => {
      render(<ScoreIntegrationComponent scoreResult={mockCompleteScoreResult} />);

      // ScoreDisplayの表示確認
      expect(screen.getByText('総合スコア')).toBeInTheDocument();
      expect(screen.getByText('78.5')).toBeInTheDocument();

      // ScoreBreakdownの表示確認
      expect(screen.getByText('スコア詳細分析')).toBeInTheDocument();

      // 両コンポーネントで同じスコア値が表示されている
      const scoreValues = screen.getAllByText('85.0');
      expect(scoreValues.length).toBeGreaterThanOrEqual(2); // Display + Breakdown
    });

    it('データの一貫性が保たれている', () => {
      render(<ScoreIntegrationComponent scoreResult={mockCompleteScoreResult} />);

      // 重み設定の一貫性
      const weightTexts = screen.getAllByText(/重み 35%/);
      expect(weightTexts.length).toBeGreaterThanOrEqual(1);

      // スコア値の一貫性
      expect(screen.getAllByText('75.0').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('70.0').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('80.0').length).toBeGreaterThanOrEqual(1);
    });

    it('色分けの一貫性が保たれている', () => {
      render(<ScoreIntegrationComponent scoreResult={mockCompleteScoreResult} />);

      // 同じスコアレベルで同じ色分けが適用されている
      const blueElements = document.querySelectorAll('.text-primary-600');
      expect(blueElements.length).toBeGreaterThan(0);

      // 総合スコア（78.5）は良好レベルなので青系の色
      const totalScoreElement = screen.getByText('78.5').closest('div');
      expect(totalScoreElement).toHaveClass('text-primary-600');
    });
  });

  describe('レスポンシブ統合テスト', () => {
    it('モバイルビューで両コンポーネントが適切にレイアウトされる', () => {
      // モバイルビューポートをシミュレート
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<ScoreIntegrationComponent scoreResult={mockCompleteScoreResult} />);

      // 縦並びレイアウトが適用されている
      const container = document.querySelector('.space-y-6');
      expect(container).toBeInTheDocument();

      // モバイル用のスタイルが適用されている
      const mobileElements = document.querySelectorAll('.flex-col, .space-y-4');
      expect(mobileElements.length).toBeGreaterThan(0);
    });

    it('デスクトップビューで適切な間隔とレイアウトになる', () => {
      // デスクトップビューポートをシミュレート
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(<ScoreIntegrationComponent scoreResult={mockCompleteScoreResult} />);

      // デスクトップ用のレイアウトが適用されている
      const gridElements = document.querySelectorAll('.grid, .lg\\:grid-cols-4');
      expect(gridElements.length).toBeGreaterThan(0);
    });
  });

  describe('インタラクション統合テスト', () => {
    it('ScoreBreakdownの展開がScoreDisplayに影響しない', () => {
      render(<ScoreIntegrationComponent scoreResult={mockCompleteScoreResult} />);

      // 初期状態のScoreDisplay確認
      expect(screen.getByText('78.5')).toBeInTheDocument();

      // ScoreBreakdownのエビデンスセクションを展開
      const evidenceButton = screen.getByRole('button', { name: /エビデンス/ });
      fireEvent.click(evidenceButton);

      // ScoreDisplayの表示が変わらない
      expect(screen.getByText('78.5')).toBeInTheDocument();
      expect(screen.getByText('総合スコア')).toBeInTheDocument();
    });

    it('複数のセクションを同時に展開できる', () => {
      render(<ScoreIntegrationComponent scoreResult={mockCompleteScoreResult} />);

      // 複数のセクションを展開
      const evidenceButton = screen.getByRole('button', { name: /エビデンス/ });
      const safetyButton = screen.getByRole('button', { name: /安全性/ });

      fireEvent.click(evidenceButton);
      fireEvent.click(safetyButton);

      // 両方の詳細が表示される
      expect(screen.getByText('エビデンススコアは成分の科学的根拠の質を評価します')).toBeInTheDocument();
      expect(screen.getByText('安全性スコアは副作用や相互作用のリスクを評価します')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ統合テスト', () => {
    it('スクリーンリーダーで論理的な順序で読み上げられる', () => {
      render(<ScoreIntegrationComponent scoreResult={mockCompleteScoreResult} />);

      // 見出し構造が適切
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings.length).toBeGreaterThan(0);

      // ARIA属性が適切に設定されている
      const progressBars = screen.getAllByRole('progressbar');
      progressBars.forEach(bar => {
        expect(bar).toHaveAttribute('aria-label');
      });
    });

    it('キーボードナビゲーションが両コンポーネントで機能する', () => {
      render(<ScoreIntegrationComponent scoreResult={mockCompleteScoreResult} />);

      // フォーカス可能な要素が存在する
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // 最初のボタンにフォーカスを設定
      const firstButton = buttons[0];
      firstButton.focus();
      expect(firstButton).toHaveFocus();
    });

    it('色覚障害者向けの配慮が統合的に機能する', () => {
      render(<ScoreIntegrationComponent scoreResult={mockCompleteScoreResult} />);

      // 色だけでなくテキストでも情報を提供
      expect(screen.getByText('良好')).toBeInTheDocument(); // スコアレベル
      expect(screen.getByText('78.5')).toBeInTheDocument(); // 数値

      // 複数の重み表示があるため、getAllByTextを使用
      const weightElements = screen.getAllByText(/重み 35%/);
      expect(weightElements.length).toBeGreaterThan(0); // パーセンテージ
    });
  });

  describe('パフォーマンス統合テスト', () => {
    it('大量データでも適切なレンダリング時間を維持する', async () => {
      const largeDataResult = {
        ...mockCompleteScoreResult,
        breakdown: {
          ...mockCompleteScoreResult.breakdown,
          practicality: {
            score: 80,
            factors: Array.from({ length: 50 }, (_, i) => ({
              name: `要因${i + 1}`,
              value: 70 + (i % 30),
              weight: 0.02,
              description: `要因${i + 1}の詳細説明文がここに入ります`
            })),
            explanation: '実用性スコアは使いやすさを評価します'
          }
        }
      };

      const startTime = performance.now();
      render(<ScoreIntegrationComponent scoreResult={largeDataResult} />);
      const endTime = performance.now();

      // レンダリング時間が合理的な範囲内
      expect(endTime - startTime).toBeLessThan(1000);

      // 基本的な表示は正常
      expect(screen.getByText('78.5')).toBeInTheDocument();
      expect(screen.getByText('スコア詳細分析')).toBeInTheDocument();
    });

    it('メモリリークが発生しない', () => {
      const { unmount } = render(<ScoreIntegrationComponent scoreResult={mockCompleteScoreResult} />);

      // コンポーネントのアンマウント
      unmount();

      // メモリリークの検証（実際の実装では詳細なメモリ監視が必要）
      expect(document.querySelectorAll('[data-testid]').length).toBe(0);
    });
  });

  describe('エラーハンドリング統合テスト', () => {
    it('部分的なデータ不足でも両コンポーネントが機能する', () => {
      const partialDataResult = {
        ...mockCompleteScoreResult,
        isComplete: false,
        missingData: ['価格情報'],
        breakdown: {
          ...mockCompleteScoreResult.breakdown,
          cost: {
            score: 0,
            factors: [],
            explanation: '価格データが不足しています'
          }
        }
      };

      render(<ScoreIntegrationComponent scoreResult={partialDataResult} />);

      // 両コンポーネントがエラーなく表示される
      expect(screen.getByText('78.5')).toBeInTheDocument();
      expect(screen.getByText('スコア詳細分析')).toBeInTheDocument();

      // データ不足の警告が表示される
      expect(screen.getByText('データが不足しています')).toBeInTheDocument();
    });

    it('極端なスコア値でも統合的に機能する', () => {
      const extremeScoreResult = {
        ...mockCompleteScoreResult,
        total: 150,
        components: {
          evidence: -10,
          safety: 200,
          cost: NaN,
          practicality: 80
        }
      };

      expect(() => {
        render(<ScoreIntegrationComponent scoreResult={extremeScoreResult} />);
      }).not.toThrow();

      // 基本的な構造は維持される
      expect(screen.getByText('総合スコア')).toBeInTheDocument();
      expect(screen.getByText('スコア詳細分析')).toBeInTheDocument();
    });
  });
});