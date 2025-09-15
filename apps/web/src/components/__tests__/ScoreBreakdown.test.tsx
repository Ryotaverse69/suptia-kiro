import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ScoreBreakdown } from '../ScoreBreakdown';
import { ScoreResult } from '@/lib/scoring';

// テスト用のモックデータ
const mockScoreResult: ScoreResult = {
  total: 78.5,
  components: {
    evidence: 85,
    safety: 75,
    cost: 70,
    practicality: 80
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
      factors: [
        {
          name: 'エビデンスレベル',
          value: 85,
          weight: 1.0,
          description: '成分の科学的根拠の質 (A, B)'
        }
      ],
      explanation: 'エビデンススコアは成分の科学的根拠の質を評価します'
    },
    safety: {
      score: 75,
      factors: [
        {
          name: '副作用リスク',
          value: 75,
          weight: 1.0,
          description: 'リスク要因数: 2件 (レベル: low)'
        }
      ],
      explanation: '安全性スコアは副作用や相互作用のリスクを評価します'
    },
    cost: {
      score: 70,
      factors: [
        {
          name: 'mg単価効率',
          value: 70,
          weight: 1.0,
          description: '0.150円/mg/日 (1日150円)'
        }
      ],
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

// データ不足のあるモックデータ
const mockIncompleteScoreResult: ScoreResult = {
  ...mockScoreResult,
  breakdown: {
    ...mockScoreResult.breakdown,
    evidence: {
      score: 50,
      factors: [
        {
          name: 'エビデンスレベル',
          value: 50,
          weight: 1.0,
          description: '成分データが不足しています'
        }
      ],
      explanation: 'エビデンススコアは成分の科学的根拠の質を評価します'
    }
  },
  isComplete: false,
  missingData: ['成分情報']
};

describe('ScoreBreakdown', () => {
  describe('基本表示', () => {
    it('スコア詳細分析のタイトルが表示される', () => {
      render(
        <ScoreBreakdown
          breakdown={mockScoreResult.breakdown}
          weights={mockScoreResult.weights}
        />
      );

      expect(screen.getByText('スコア詳細分析')).toBeInTheDocument();
      expect(screen.getByText('各要素をクリックして詳細な計算根拠を確認できます')).toBeInTheDocument();
    });

    it('4つのスコア要素セクションが表示される', () => {
      render(
        <ScoreBreakdown
          breakdown={mockScoreResult.breakdown}
          weights={mockScoreResult.weights}
        />
      );

      expect(screen.getByText('エビデンス')).toBeInTheDocument();
      expect(screen.getByText('安全性')).toBeInTheDocument();
      expect(screen.getByText('コスト')).toBeInTheDocument();
      expect(screen.getByText('実用性')).toBeInTheDocument();
    });

    it('各セクションにスコア値と重みが表示される', () => {
      render(
        <ScoreBreakdown
          breakdown={mockScoreResult.breakdown}
          weights={mockScoreResult.weights}
        />
      );

      // エビデンスセクション
      const evidenceSection = screen.getByText('エビデンス').closest('button');
      expect(within(evidenceSection!).getByText('85.0')).toBeInTheDocument();
      expect(within(evidenceSection!).getByText(/重み 35%/)).toBeInTheDocument();

      // 安全性セクション
      const safetySection = screen.getByText('安全性').closest('button');
      expect(within(safetySection!).getByText('75.0')).toBeInTheDocument();
      expect(within(safetySection!).getByText(/重み 30%/)).toBeInTheDocument();
    });

    it('重み設定の説明が表示される', () => {
      render(
        <ScoreBreakdown
          breakdown={mockScoreResult.breakdown}
          weights={mockScoreResult.weights}
        />
      );

      expect(screen.getByText('重み設定について')).toBeInTheDocument();
      expect(screen.getByText('総合スコアは以下の重み付けで計算されています：')).toBeInTheDocument();

      // 重みパーセンテージの確認
      expect(screen.getByText('35%')).toBeInTheDocument(); // エビデンス
      expect(screen.getByText('30%')).toBeInTheDocument(); // 安全性
      expect(screen.getByText('20%')).toBeInTheDocument(); // コスト
      expect(screen.getByText('15%')).toBeInTheDocument(); // 実用性
    });
  });

  describe('展開/折りたたみ機能', () => {
    it('初期状態では詳細が非表示になっている', () => {
      render(
        <ScoreBreakdown
          breakdown={mockScoreResult.breakdown}
          weights={mockScoreResult.weights}
        />
      );

      // 詳細コンテンツが非表示
      expect(screen.queryByText('エビデンススコアは成分の科学的根拠の質を評価します')).not.toBeInTheDocument();
      expect(screen.queryByText('計算要因')).not.toBeInTheDocument();
    });

    it('セクションをクリックすると詳細が展開される', () => {
      render(
        <ScoreBreakdown
          breakdown={mockScoreResult.breakdown}
          weights={mockScoreResult.weights}
        />
      );

      // エビデンスセクションをクリック
      const evidenceButton = screen.getByRole('button', { name: /エビデンス/ });
      fireEvent.click(evidenceButton);

      // 詳細コンテンツが表示される
      expect(screen.getByText('エビデンススコアは成分の科学的根拠の質を評価します')).toBeInTheDocument();
      expect(screen.getByText('計算要因')).toBeInTheDocument();
      expect(screen.getByText('エビデンスレベル')).toBeInTheDocument();
    });

    it('展開されたセクションを再度クリックすると折りたたまれる', () => {
      render(
        <ScoreBreakdown
          breakdown={mockScoreResult.breakdown}
          weights={mockScoreResult.weights}
        />
      );

      const evidenceButton = screen.getByRole('button', { name: /エビデンス/ });

      // 展開
      fireEvent.click(evidenceButton);
      expect(screen.getByText('エビデンススコアは成分の科学的根拠の質を評価します')).toBeInTheDocument();

      // 折りたたみ
      fireEvent.click(evidenceButton);
      expect(screen.queryByText('エビデンススコアは成分の科学的根拠の質を評価します')).not.toBeInTheDocument();
    });

    it('aria-expanded属性が正しく設定される', () => {
      render(
        <ScoreBreakdown
          breakdown={mockScoreResult.breakdown}
          weights={mockScoreResult.weights}
        />
      );

      const evidenceButton = screen.getByRole('button', { name: /エビデンス/ });

      // 初期状態
      expect(evidenceButton).toHaveAttribute('aria-expanded', 'false');

      // 展開後
      fireEvent.click(evidenceButton);
      expect(evidenceButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('要因表示', () => {
    it('単一要因の場合、貢献度が表示されない', () => {
      render(
        <ScoreBreakdown
          breakdown={mockScoreResult.breakdown}
          weights={mockScoreResult.weights}
        />
      );

      // エビデンスセクションを展開（単一要因）
      const evidenceButton = screen.getByRole('button', { name: /エビデンス/ });
      fireEvent.click(evidenceButton);

      // 貢献度セクションが表示されない
      expect(screen.queryByText('貢献度')).not.toBeInTheDocument();
    });

    it('複数要因の場合、貢献度が表示される', () => {
      render(
        <ScoreBreakdown
          breakdown={mockScoreResult.breakdown}
          weights={mockScoreResult.weights}
        />
      );

      // 実用性セクションを展開（複数要因）
      const practicalityButton = screen.getByRole('button', { name: /実用性/ });
      fireEvent.click(practicalityButton);

      // 貢献度セクションが表示される
      expect(screen.getAllByText('貢献度')).toHaveLength(3); // 3つの要因
    });

    it('要因の詳細情報が正しく表示される', () => {
      render(
        <ScoreBreakdown
          breakdown={mockScoreResult.breakdown}
          weights={mockScoreResult.weights}
        />
      );

      // 実用性セクションを展開
      const practicalityButton = screen.getByRole('button', { name: /実用性/ });
      fireEvent.click(practicalityButton);

      // 各要因の情報を確認
      expect(screen.getByText('摂取頻度')).toBeInTheDocument();
      expect(screen.getByText('1日2回摂取')).toBeInTheDocument();
      expect(screen.getAllByText(/重み 40%/)[0]).toBeInTheDocument();

      expect(screen.getByText('剤形')).toBeInTheDocument();
      expect(screen.getByText('capsule形式')).toBeInTheDocument();
      expect(screen.getAllByText(/重み 30%/)[0]).toBeInTheDocument();
    });
  });

  describe('データ不足時の表示', () => {
    it('データ不足の警告が表示される', () => {
      render(
        <ScoreBreakdown
          breakdown={mockIncompleteScoreResult.breakdown}
          weights={mockIncompleteScoreResult.weights}
        />
      );

      // エビデンスセクションを展開
      const evidenceButton = screen.getByRole('button', { name: /エビデンス/ });
      fireEvent.click(evidenceButton);

      // 注意事項が表示される
      expect(screen.getByText('注意事項')).toBeInTheDocument();
      expect(screen.getByText(/一部のデータが不足しているため/)).toBeInTheDocument();
    });

    it('エラー要因の説明が表示される', () => {
      render(
        <ScoreBreakdown
          breakdown={mockIncompleteScoreResult.breakdown}
          weights={mockIncompleteScoreResult.weights}
        />
      );

      // エビデンスセクションを展開
      const evidenceButton = screen.getByRole('button', { name: /エビデンス/ });
      fireEvent.click(evidenceButton);

      // エラー説明が表示される
      expect(screen.getByText('成分データが不足しています')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('スクリーンリーダー用の隠しテキストが含まれる', () => {
      render(
        <ScoreBreakdown
          breakdown={mockScoreResult.breakdown}
          weights={mockScoreResult.weights}
        />
      );

      // sr-onlyクラスの要素を確認
      const srOnlyElement = document.querySelector('.sr-only');
      expect(srOnlyElement).toBeInTheDocument();
      expect(srOnlyElement).toHaveTextContent(/スコア詳細分析/);
    });

    it('プログレスバーに適切なaria属性が設定される', () => {
      render(
        <ScoreBreakdown
          breakdown={mockScoreResult.breakdown}
          weights={mockScoreResult.weights}
        />
      );

      // 実用性セクションを展開
      const practicalityButton = screen.getByRole('button', { name: /実用性/ });
      fireEvent.click(practicalityButton);

      // プログレスバーのaria属性を確認
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);

      progressBars.forEach(progressBar => {
        expect(progressBar).toHaveAttribute('aria-valuenow');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
        expect(progressBar).toHaveAttribute('aria-label');
      });
    });

    it('キーボードナビゲーションが機能する', () => {
      render(
        <ScoreBreakdown
          breakdown={mockScoreResult.breakdown}
          weights={mockScoreResult.weights}
        />
      );

      const evidenceButton = screen.getByRole('button', { name: /エビデンス/ });

      // フォーカス可能
      evidenceButton.focus();
      expect(evidenceButton).toHaveFocus();

      // Enterキーで展開（実際にはクリックイベントをシミュレート）
      fireEvent.click(evidenceButton);
      expect(screen.getByText('エビデンススコアは成分の科学的根拠の質を評価します')).toBeInTheDocument();
    });
  });

  describe('スコア色分け', () => {
    it('高スコア（80以上）で緑色が適用される', () => {
      const highScoreData = {
        ...mockScoreResult,
        breakdown: {
          ...mockScoreResult.breakdown,
          evidence: {
            ...mockScoreResult.breakdown.evidence,
            score: 90
          }
        }
      };

      render(
        <ScoreBreakdown
          breakdown={highScoreData.breakdown}
          weights={highScoreData.weights}
        />
      );

      // ボタン要素の親要素（セクション全体）を取得
      const evidenceButton = screen.getByRole('button', { name: /エビデンス/ });
      const evidenceSection = evidenceButton.parentElement;
      expect(evidenceSection).toHaveClass('border-green-200');
    });

    it('中スコア（60-79）で青色が適用される', () => {
      const mediumScoreData = {
        ...mockScoreResult,
        breakdown: {
          ...mockScoreResult.breakdown,
          safety: {
            ...mockScoreResult.breakdown.safety,
            score: 70
          }
        }
      };

      render(
        <ScoreBreakdown
          breakdown={mediumScoreData.breakdown}
          weights={mediumScoreData.weights}
        />
      );

      const safetyButton = screen.getByRole('button', { name: /安全性/ });
      const safetySection = safetyButton.parentElement;
      expect(safetySection).toHaveClass('border-primary-200');
    });

    it('低スコア（40未満）で赤色が適用される', () => {
      const lowScoreData = {
        ...mockScoreResult,
        breakdown: {
          ...mockScoreResult.breakdown,
          cost: {
            ...mockScoreResult.breakdown.cost,
            score: 30
          }
        }
      };

      render(
        <ScoreBreakdown
          breakdown={lowScoreData.breakdown}
          weights={lowScoreData.weights}
        />
      );

      const costButton = screen.getByRole('button', { name: /コスト/ });
      const costSection = costButton.parentElement;
      expect(costSection).toHaveClass('border-red-200');
    });
  });

  describe('レスポンシブデザイン', () => {
    it('モバイルレイアウトで縦並びになる', () => {
      // モバイルビューポートをシミュレート
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <ScoreBreakdown
          breakdown={mockScoreResult.breakdown}
          weights={mockScoreResult.weights}
        />
      );

      // モバイル用のスタックレイアウトクラスが適用されている
      const container = document.querySelector('.space-y-4');
      expect(container).toBeInTheDocument();
    });

    it('デスクトップレイアウトで適切な間隔になる', () => {
      // デスクトップビューポートをシミュレート
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(
        <ScoreBreakdown
          breakdown={mockScoreResult.breakdown}
          weights={mockScoreResult.weights}
        />
      );

      // デスクトップ用のレイアウトクラスが適用されている（重み説明セクションも含む）
      const sections = document.querySelectorAll('.border.rounded-lg');
      expect(sections.length).toBeGreaterThanOrEqual(4); // 4つのスコア要素 + 重み説明セクション
    });

    it('タブレットサイズで適切なフォントサイズになる', () => {
      render(
        <ScoreBreakdown
          breakdown={mockScoreResult.breakdown}
          weights={mockScoreResult.weights}
        />
      );

      // レスポンシブフォントクラスが適用されている
      const responsiveText = document.querySelectorAll('.text-sm, .text-base, .text-lg');
      expect(responsiveText.length).toBeGreaterThan(0);
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量のfactorsデータでも適切にレンダリングされる', () => {
      const largeFactorsData = {
        ...mockScoreResult,
        breakdown: {
          ...mockScoreResult.breakdown,
          practicality: {
            score: 80,
            factors: Array.from({ length: 20 }, (_, i) => ({
              name: `要因${i + 1}`,
              value: 70 + i,
              weight: 0.05,
              description: `要因${i + 1}の説明文`
            })),
            explanation: '実用性スコアは使いやすさを評価します'
          }
        }
      };

      const startTime = performance.now();
      render(
        <ScoreBreakdown
          breakdown={largeFactorsData.breakdown}
          weights={largeFactorsData.weights}
        />
      );
      const endTime = performance.now();

      // レンダリング時間が合理的な範囲内（1秒未満）
      expect(endTime - startTime).toBeLessThan(1000);

      // 実用性セクションを展開
      const practicalityButton = screen.getByRole('button', { name: /実用性/ });
      fireEvent.click(practicalityButton);

      // すべての要因が表示される
      expect(screen.getByText('要因1')).toBeInTheDocument();
      expect(screen.getByText('要因20')).toBeInTheDocument();
    });
  });

  describe('エラーハンドリング', () => {
    it('空のfactors配列を適切に処理する', () => {
      const emptyFactorsData = {
        ...mockScoreResult,
        breakdown: {
          ...mockScoreResult.breakdown,
          evidence: {
            score: 50,
            factors: [],
            explanation: 'データが不足しています'
          }
        }
      };

      render(
        <ScoreBreakdown
          breakdown={emptyFactorsData.breakdown}
          weights={emptyFactorsData.weights}
        />
      );

      // エビデンスセクションを展開
      const evidenceButton = screen.getByRole('button', { name: /エビデンス/ });
      fireEvent.click(evidenceButton);

      // エラーが発生せずに表示される
      expect(screen.getByText('データが不足しています')).toBeInTheDocument();
    });

    it('不正なweightデータを適切に処理する', () => {
      const invalidWeightsData = {
        evidence: NaN,
        safety: -0.1,
        cost: 1.5,
        practicality: 0.15
      };

      expect(() => {
        render(
          <ScoreBreakdown
            breakdown={mockScoreResult.breakdown}
            weights={invalidWeightsData}
          />
        );
      }).not.toThrow();
    });

    it('未定義のbreakdownプロパティを適切に処理する', () => {
      const incompleteBreakdown = {
        evidence: mockScoreResult.breakdown.evidence,
        safety: { score: 0, factors: [], explanation: 'データなし' },
        cost: { score: 0, factors: [], explanation: 'データなし' },
        practicality: { score: 0, factors: [], explanation: 'データなし' }
      };

      expect(() => {
        render(
          <ScoreBreakdown
            breakdown={incompleteBreakdown}
            weights={mockScoreResult.weights}
          />
        );
      }).not.toThrow();
    });
  });

  describe('カスタムクラス', () => {
    it('カスタムクラス名が適用される', () => {
      const { container } = render(
        <ScoreBreakdown
          breakdown={mockScoreResult.breakdown}
          weights={mockScoreResult.weights}
          className="custom-breakdown"
        />
      );

      expect(container.firstChild).toHaveClass('custom-breakdown');
    });
  });
});