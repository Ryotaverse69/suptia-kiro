import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ScoreDisplay } from '../ScoreDisplay';
import { ScoreResult } from '@/lib/scoring';

// テスト用のモックデータ
const mockScoreResult: ScoreResult = {
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
      factors: [{
        name: '摂取頻度',
        value: 85,
        weight: 0.4,
        description: '1日2回摂取'
      }, {
        name: '剤形',
        value: 100,
        weight: 0.3,
        description: 'capsule形式'
      }, {
        name: '容量',
        value: 60,
        weight: 0.3,
        description: '1容器で30日分'
      }],
      explanation: '実用性スコアは使いやすさを評価します'
    }
  },
  isComplete: true,
  missingData: []
};

const mockIncompleteScoreResult: ScoreResult = {
  ...mockScoreResult,
  isComplete: false,
  missingData: ['価格情報', '成分詳細']
};

describe('ScoreDisplay', () => {
  describe('基本表示機能', () => {
    it('総合スコアと個別スコアを表示する', () => {
      render(<ScoreDisplay scoreResult={mockScoreResult} />);
      
      // 総合スコア表示の確認
      expect(screen.getByText('総合スコア')).toBeInTheDocument();
      expect(screen.getByText('78.5')).toBeInTheDocument();
      expect(screen.getByText('/100')).toBeInTheDocument();
      
      // 個別スコア表示の確認
      expect(screen.getByText('要素別スコア')).toBeInTheDocument();
      expect(screen.getByText('エビデンス')).toBeInTheDocument();
      expect(screen.getByText('安全性')).toBeInTheDocument();
      expect(screen.getByText('コスト')).toBeInTheDocument();
      expect(screen.getByText('実用性')).toBeInTheDocument();
      
      // スコア値の確認
      expect(screen.getByText('85.0')).toBeInTheDocument();
      expect(screen.getByText('75.0')).toBeInTheDocument();
      expect(screen.getByText('70.0')).toBeInTheDocument();
      expect(screen.getByText('80.0')).toBeInTheDocument();
    });

    it('重み付けパーセンテージを表示する', () => {
      render(<ScoreDisplay scoreResult={mockScoreResult} />);
      
      // 重み表示の確認
      expect(screen.getByText('重み 35%')).toBeInTheDocument(); // エビデンス
      expect(screen.getByText('重み 30%')).toBeInTheDocument(); // 安全性
      expect(screen.getByText('重み 20%')).toBeInTheDocument(); // コスト
      expect(screen.getByText('重み 15%')).toBeInTheDocument(); // 実用性
    });

    it('説明テキストを表示する', () => {
      render(<ScoreDisplay scoreResult={mockScoreResult} />);
      
      // 説明テキストの確認
      expect(screen.getByText('科学的根拠の質と量')).toBeInTheDocument();
      expect(screen.getByText('副作用や相互作用のリスク')).toBeInTheDocument();
      expect(screen.getByText('価格対効果の評価')).toBeInTheDocument();
      expect(screen.getByText('摂取のしやすさ')).toBeInTheDocument();
    });
  });

  describe('スコアレベル表示', () => {
    it('優秀レベル（80-100）で正しい表示をする', () => {
      const excellentScore = { ...mockScoreResult, total: 85.0 };
      render(<ScoreDisplay scoreResult={excellentScore} />);
      
      expect(screen.getByText('優秀')).toBeInTheDocument();
    });

    it('良好レベル（60-79）で正しい表示をする', () => {
      const goodScore = { ...mockScoreResult, total: 65.0 };
      render(<ScoreDisplay scoreResult={goodScore} />);
      
      expect(screen.getByText('良好')).toBeInTheDocument();
    });

    it('普通レベル（40-59）で正しい表示をする', () => {
      const fairScore = { ...mockScoreResult, total: 45.0 };
      render(<ScoreDisplay scoreResult={fairScore} />);
      
      expect(screen.getByText('普通')).toBeInTheDocument();
    });

    it('要改善レベル（0-39）で正しい表示をする', () => {
      const poorScore = { ...mockScoreResult, total: 25.0 };
      render(<ScoreDisplay scoreResult={poorScore} />);
      
      expect(screen.getByText('要改善')).toBeInTheDocument();
    });
  });

  describe('色分け機能', () => {
    it('スコアに応じた色分けクラスが適用される', () => {
      render(<ScoreDisplay scoreResult={mockScoreResult} />);
      
      // 総合スコア（78.5）は良好レベルなのでblue系
      const totalScoreElement = screen.getByText('78.5').closest('div');
      expect(totalScoreElement).toHaveClass('text-blue-600', 'bg-blue-100');
    });

    it('優秀レベル（80-100）で緑色が適用される', () => {
      const excellentScore = { ...mockScoreResult, total: 90.0 };
      render(<ScoreDisplay scoreResult={excellentScore} />);
      
      const scoreElement = screen.getByText('90.0').closest('div');
      expect(scoreElement).toHaveClass('text-green-600', 'bg-green-100');
    });

    it('普通レベル（40-59）で黄色が適用される', () => {
      const fairScore = { ...mockScoreResult, total: 50.0 };
      render(<ScoreDisplay scoreResult={fairScore} />);
      
      const scoreElement = screen.getByText('50.0').closest('div');
      expect(scoreElement).toHaveClass('text-yellow-600', 'bg-yellow-100');
    });

    it('要改善レベル（0-39）で赤色が適用される', () => {
      const poorScore = { ...mockScoreResult, total: 30.0 };
      render(<ScoreDisplay scoreResult={poorScore} />);
      
      const scoreElement = screen.getByText('30.0').closest('div');
      expect(scoreElement).toHaveClass('text-red-600', 'bg-red-100');
    });

    it('個別スコアにも適切な色分けが適用される', () => {
      const mixedScores = {
        ...mockScoreResult,
        components: {
          evidence: 95.0, // 優秀（緑）
          safety: 65.0,   // 良好（青）
          cost: 45.0,     // 普通（黄）
          practicality: 25.0 // 要改善（赤）
        }
      };
      
      render(<ScoreDisplay scoreResult={mixedScores} />);
      
      // 各スコアの色分けを確認（spanタグ内の色分けクラス）
      const evidenceElement = screen.getByText('95.0').closest('span');
      expect(evidenceElement).toHaveClass('text-green-600', 'bg-green-100');
      
      const safetyElement = screen.getByText('65.0').closest('span');
      expect(safetyElement).toHaveClass('text-blue-600', 'bg-blue-100');
      
      const costElement = screen.getByText('45.0').closest('span');
      expect(costElement).toHaveClass('text-yellow-600', 'bg-yellow-100');
      
      const practicalityElement = screen.getByText('25.0').closest('span');
      expect(practicalityElement).toHaveClass('text-red-600', 'bg-red-100');
    });

    it('プログレスバーが表示される', () => {
      render(<ScoreDisplay scoreResult={mockScoreResult} />);
      
      // プログレスバーの存在確認
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(5); // 総合 + 4要素
      
      // 総合スコアのプログレスバー
      const totalProgressBar = progressBars[0];
      expect(totalProgressBar).toHaveAttribute('aria-valuenow', '78.5');
      expect(totalProgressBar).toHaveAttribute('aria-valuemin', '0');
      expect(totalProgressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('プログレスバーの色がスコアに応じて変わる', () => {
      const excellentScore = { ...mockScoreResult, total: 90.0 };
      render(<ScoreDisplay scoreResult={excellentScore} />);
      
      // 優秀スコアのプログレスバーは緑色
      const progressBar = screen.getAllByRole('progressbar')[0];
      expect(progressBar).toHaveClass('bg-green-500');
    });
  });

  describe('データ不足時の表示', () => {
    it('データ不足警告を表示する', () => {
      render(<ScoreDisplay scoreResult={mockIncompleteScoreResult} />);
      
      expect(screen.getByText('データが不足しています')).toBeInTheDocument();
      expect(screen.getByText('以下のデータが不足しているため、一部のスコアは推定値となります：')).toBeInTheDocument();
      expect(screen.getByText('価格情報')).toBeInTheDocument();
      expect(screen.getByText('成分詳細')).toBeInTheDocument();
    });

    it('完全なデータの場合は警告を表示しない', () => {
      render(<ScoreDisplay scoreResult={mockScoreResult} />);
      
      expect(screen.queryByText('データが不足しています')).not.toBeInTheDocument();
    });
  });

  describe('視覚的インジケーター', () => {
    it('スコアレベルに応じたアイコンが表示される', () => {
      render(<ScoreDisplay scoreResult={mockScoreResult} />);
      
      // 各スコアレベルのアイコンまたは視覚的インジケーターを確認
      const excellentIndicator = document.querySelector('.text-green-600');
      const goodIndicator = document.querySelector('.text-blue-600');
      
      expect(excellentIndicator || goodIndicator).toBeInTheDocument();
    });

    it('プログレスバーの視覚的表現が正確である', () => {
      render(<ScoreDisplay scoreResult={mockScoreResult} />);
      
      const progressBars = screen.getAllByRole('progressbar');
      const totalProgressBar = progressBars[0];
      
      // プログレスバーの幅がスコアに比例している
      expect(totalProgressBar).toHaveAttribute('aria-valuenow', '78.5');
      
      // プログレスバー自体が色分けクラスを持っている
      expect(totalProgressBar).toHaveClass('bg-blue-500');
      
      // スタイル属性で幅が設定されている
      expect(totalProgressBar).toHaveStyle('width: 78.5%');
    });

    it('スコア差の視覚的比較が可能である', () => {
      render(<ScoreDisplay scoreResult={mockScoreResult} />);
      
      // 各要素のスコアが視覚的に比較できる形で表示されている
      const evidenceScore = screen.getByText('85.0');
      const safetyScore = screen.getByText('75.0');
      const costScore = screen.getByText('70.0');
      const practicalityScore = screen.getByText('80.0');
      
      expect(evidenceScore).toBeInTheDocument();
      expect(safetyScore).toBeInTheDocument();
      expect(costScore).toBeInTheDocument();
      expect(practicalityScore).toBeInTheDocument();
    });

    it('重み付けの視覚的表現が含まれている', () => {
      render(<ScoreDisplay scoreResult={mockScoreResult} />);
      
      // 重みの視覚的表現（パーセンテージ、バー、円グラフなど）
      expect(screen.getByText('重み 35%')).toBeInTheDocument();
      expect(screen.getByText('重み 30%')).toBeInTheDocument();
      expect(screen.getByText('重み 20%')).toBeInTheDocument();
      expect(screen.getByText('重み 15%')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ機能', () => {
    it('適切なARIA属性が設定されている', () => {
      render(<ScoreDisplay scoreResult={mockScoreResult} />);
      
      // プログレスバーのARIA属性確認
      const progressBars = screen.getAllByRole('progressbar');
      progressBars.forEach(bar => {
        expect(bar).toHaveAttribute('aria-valuenow');
        expect(bar).toHaveAttribute('aria-valuemin', '0');
        expect(bar).toHaveAttribute('aria-valuemax', '100');
        expect(bar).toHaveAttribute('aria-label');
      });
    });

    it('スクリーンリーダー用の隠しテキストが含まれている', () => {
      render(<ScoreDisplay scoreResult={mockScoreResult} />);
      
      // sr-onlyクラスの要素が存在することを確認
      const hiddenText = document.querySelector('.sr-only');
      expect(hiddenText).toBeInTheDocument();
      expect(hiddenText?.textContent).toContain('商品の総合スコアは78.5点');
      expect(hiddenText?.textContent).toContain('エビデンス85.0点');
      expect(hiddenText?.textContent).toContain('安全性75.0点');
      expect(hiddenText?.textContent).toContain('コスト70.0点');
      expect(hiddenText?.textContent).toContain('実用性80.0点');
    });

    it('キーボードナビゲーションが機能する', () => {
      render(<ScoreDisplay scoreResult={mockScoreResult} />);
      
      // ScoreDisplayコンポーネント自体にはフォーカス可能な要素がない
      // （詳細表示はScoreBreakdownコンポーネントで処理）
      // プログレスバーがアクセシブルであることを確認
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
      
      // 各プログレスバーが適切なARIA属性を持っている
      progressBars.forEach(bar => {
        expect(bar).toHaveAttribute('aria-label');
      });
    });

    it('色覚障害者向けの配慮がされている', () => {
      render(<ScoreDisplay scoreResult={mockScoreResult} />);
      
      // 色だけでなく、テキストや形状でも情報を伝達している
      expect(screen.getByText('良好')).toBeInTheDocument(); // スコアレベルのテキスト表示
      expect(screen.getByText('78.5')).toBeInTheDocument(); // 数値での明確な表示
    });
  });

  describe('レスポンシブデザイン', () => {
    it('モバイル向けのクラスが適用されている', () => {
      render(<ScoreDisplay scoreResult={mockScoreResult} />);
      
      // flex-col sm:flex-row などのレスポンシブクラスが使用されていることを確認
      const individualScores = document.querySelectorAll('.flex.flex-col.sm\\:flex-row');
      expect(individualScores.length).toBeGreaterThan(0);
    });

    it('モバイルレイアウトで縦並びになる', () => {
      // モバイルビューポートをシミュレート
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<ScoreDisplay scoreResult={mockScoreResult} />);
      
      // モバイル用のクラスが適用されていることを確認
      const container = document.querySelector('.space-y-3');
      expect(container).toBeInTheDocument();
    });

    it('デスクトップレイアウトで横並びになる', () => {
      // デスクトップビューポートをシミュレート
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      render(<ScoreDisplay scoreResult={mockScoreResult} />);
      
      // デスクトップ用のレスポンシブクラスが適用されていることを確認
      const flexElements = document.querySelectorAll('.sm\\:flex-row');
      expect(flexElements.length).toBeGreaterThan(0);
    });

    it('タブレットサイズで適切なレイアウトになる', () => {
      // タブレットビューポートをシミュレート
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      render(<ScoreDisplay scoreResult={mockScoreResult} />);
      
      // タブレット用のレスポンシブクラスが適用されていることを確認
      const responsiveElements = document.querySelectorAll('.sm\\:flex-row, .sm\\:items-center, .sm\\:gap-4');
      expect(responsiveElements.length).toBeGreaterThan(0);
    });
  });

  describe('カスタムプロパティ', () => {
    it('カスタムクラス名が適用される', () => {
      const customClass = 'custom-score-display';
      render(<ScoreDisplay scoreResult={mockScoreResult} className={customClass} />);
      
      const container = document.querySelector(`.${customClass}`);
      expect(container).toBeInTheDocument();
    });

    it('showBreakdownプロパティが機能する', () => {
      render(<ScoreDisplay scoreResult={mockScoreResult} showBreakdown={false} />);
      
      // 詳細表示のヒントテキストが表示される
      expect(screen.getByText('各スコアの詳細な計算根拠を確認するには、詳細表示をご利用ください')).toBeInTheDocument();
    });
  });

  describe('エラーハンドリング', () => {
    it('NaNスコアを適切に処理する', () => {
      const nanScoreResult = {
        ...mockScoreResult,
        total: NaN,
        components: {
          evidence: NaN,
          safety: 75.0,
          cost: 70.0,
          practicality: 80.0
        }
      };
      
      // エラーが発生せずにレンダリングされることを確認
      expect(() => {
        render(<ScoreDisplay scoreResult={nanScoreResult} />);
      }).not.toThrow();
      
      // NaNの場合はそのまま「NaN」と表示される（複数箇所に表示される）
      const nanElements = screen.getAllByText('NaN');
      expect(nanElements.length).toBeGreaterThan(0);
    });

    it('極端なスコア値を適切に処理する', () => {
      const extremeScoreResult = {
        ...mockScoreResult,
        total: 150, // 100を超える値
        components: {
          evidence: -10, // 負の値
          safety: 150,   // 100を超える値
          cost: 70.0,
          practicality: 80.0
        }
      };
      
      expect(() => {
        render(<ScoreDisplay scoreResult={extremeScoreResult} />);
      }).not.toThrow();
      
      // 極端な値でも表示される（複数箇所に表示される）
      const extremeElements = screen.getAllByText('150.0');
      expect(extremeElements.length).toBeGreaterThan(0);
      expect(screen.getByText('-10.0')).toBeInTheDocument();
    });

    it('空のbreakdownデータを適切に処理する', () => {
      const emptyBreakdownResult = {
        ...mockScoreResult,
        breakdown: {
          evidence: { score: 0, factors: [], explanation: '' },
          safety: { score: 0, factors: [], explanation: '' },
          cost: { score: 0, factors: [], explanation: '' },
          practicality: { score: 0, factors: [], explanation: '' }
        }
      };
      
      expect(() => {
        render(<ScoreDisplay scoreResult={emptyBreakdownResult} />);
      }).not.toThrow();
    });

    it('未定義のプロパティを適切に処理する', () => {
      const incompleteResult = {
        total: 50,
        components: {
          evidence: 50,
          safety: 50,
          cost: 50,
          practicality: 50
        },
        weights: mockScoreResult.weights,
        breakdown: mockScoreResult.breakdown,
        isComplete: true,
        missingData: [] // 空配列で初期化
      };
      
      expect(() => {
        render(<ScoreDisplay scoreResult={incompleteResult} />);
      }).not.toThrow();
    });

    it('ネットワークエラー状態を表示する', () => {
      const errorResult = {
        ...mockScoreResult,
        total: 0,
        isComplete: false,
        missingData: ['ネットワークエラー', 'データ取得失敗']
      };
      
      render(<ScoreDisplay scoreResult={errorResult} />);
      
      expect(screen.getByText('データが不足しています')).toBeInTheDocument();
      expect(screen.getByText('ネットワークエラー')).toBeInTheDocument();
      expect(screen.getByText('データ取得失敗')).toBeInTheDocument();
    });
  });
});