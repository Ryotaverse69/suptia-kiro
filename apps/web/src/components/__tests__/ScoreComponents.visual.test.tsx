import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ScoreDisplay } from '../ScoreDisplay';
import { ScoreBreakdown } from '../ScoreBreakdown';
import { ScoreResult } from '@/lib/scoring';

// 視覚的テスト用のモックデータセット
const visualTestScenarios: Array<{ name: string; scoreResult: ScoreResult }> = [
  {
    name: '優秀スコア（90点台）',
    scoreResult: {
      total: 92.5,
      components: { evidence: 95, safety: 90, cost: 88, practicality: 95 },
      weights: { evidence: 0.35, safety: 0.30, cost: 0.20, practicality: 0.15 },
      breakdown: {
        evidence: { score: 95, factors: [{ name: 'エビデンスレベル', value: 95, weight: 1.0, description: 'A級エビデンス' }], explanation: '優秀なエビデンス' },
        safety: { score: 90, factors: [{ name: '副作用リスク', value: 90, weight: 1.0, description: 'リスクなし' }], explanation: '非常に安全' },
        cost: { score: 88, factors: [{ name: 'コスト効率', value: 88, weight: 1.0, description: '高コスト効率' }], explanation: '優秀なコスト効率' },
        practicality: { score: 95, factors: [{ name: '使いやすさ', value: 95, weight: 1.0, description: '非常に使いやすい' }], explanation: '優秀な実用性' }
      },
      isComplete: true,
      missingData: []
    }
  },
  {
    name: '良好スコア（70点台）',
    scoreResult: {
      total: 75.0,
      components: { evidence: 80, safety: 75, cost: 70, practicality: 75 },
      weights: { evidence: 0.35, safety: 0.30, cost: 0.20, practicality: 0.15 },
      breakdown: {
        evidence: { score: 80, factors: [{ name: 'エビデンスレベル', value: 80, weight: 1.0, description: 'B級エビデンス' }], explanation: '良好なエビデンス' },
        safety: { score: 75, factors: [{ name: '副作用リスク', value: 75, weight: 1.0, description: '軽微なリスク' }], explanation: '概ね安全' },
        cost: { score: 70, factors: [{ name: 'コスト効率', value: 70, weight: 1.0, description: '標準的コスト' }], explanation: '標準的なコスト' },
        practicality: { score: 75, factors: [{ name: '使いやすさ', value: 75, weight: 1.0, description: '使いやすい' }], explanation: '良好な実用性' }
      },
      isComplete: true,
      missingData: []
    }
  },
  {
    name: '普通スコア（50点台）',
    scoreResult: {
      total: 55.0,
      components: { evidence: 60, safety: 55, cost: 50, practicality: 55 },
      weights: { evidence: 0.35, safety: 0.30, cost: 0.20, practicality: 0.15 },
      breakdown: {
        evidence: { score: 60, factors: [{ name: 'エビデンスレベル', value: 60, weight: 1.0, description: 'C級エビデンス' }], explanation: '限定的なエビデンス' },
        safety: { score: 55, factors: [{ name: '副作用リスク', value: 55, weight: 1.0, description: '中程度のリスク' }], explanation: '注意が必要' },
        cost: { score: 50, factors: [{ name: 'コスト効率', value: 50, weight: 1.0, description: '高コスト' }], explanation: 'コスト効率が低い' },
        practicality: { score: 55, factors: [{ name: '使いやすさ', value: 55, weight: 1.0, description: '普通の使いやすさ' }], explanation: '標準的な実用性' }
      },
      isComplete: true,
      missingData: []
    }
  },
  {
    name: '要改善スコア（30点台）',
    scoreResult: {
      total: 35.0,
      components: { evidence: 40, safety: 35, cost: 30, practicality: 35 },
      weights: { evidence: 0.35, safety: 0.30, cost: 0.20, practicality: 0.15 },
      breakdown: {
        evidence: { score: 40, factors: [{ name: 'エビデンスレベル', value: 40, weight: 1.0, description: 'エビデンス不足' }], explanation: 'エビデンスが不十分' },
        safety: { score: 35, factors: [{ name: '副作用リスク', value: 35, weight: 1.0, description: '高リスク' }], explanation: '安全性に懸念' },
        cost: { score: 30, factors: [{ name: 'コスト効率', value: 30, weight: 1.0, description: '非常に高コスト' }], explanation: 'コスト効率が悪い' },
        practicality: { score: 35, factors: [{ name: '使いやすさ', value: 35, weight: 1.0, description: '使いにくい' }], explanation: '実用性に問題' }
      },
      isComplete: true,
      missingData: []
    }
  },
  {
    name: 'データ不足ケース',
    scoreResult: {
      total: 60.0,
      components: { evidence: 50, safety: 70, cost: 0, practicality: 65 },
      weights: { evidence: 0.35, safety: 0.30, cost: 0.20, practicality: 0.15 },
      breakdown: {
        evidence: { score: 50, factors: [{ name: 'エビデンスレベル', value: 50, weight: 1.0, description: 'データ不足' }], explanation: 'エビデンスデータが不足' },
        safety: { score: 70, factors: [{ name: '副作用リスク', value: 70, weight: 1.0, description: '軽微なリスク' }], explanation: '概ね安全' },
        cost: { score: 0, factors: [], explanation: '価格データが取得できません' },
        practicality: { score: 65, factors: [{ name: '使いやすさ', value: 65, weight: 1.0, description: '使いやすい' }], explanation: '良好な実用性' }
      },
      isComplete: false,
      missingData: ['価格情報', '詳細な成分データ']
    }
  }
];

describe('スコアコンポーネント視覚的テスト', () => {
  describe('ScoreDisplay 視覚的バリエーション', () => {
    visualTestScenarios.forEach(({ name, scoreResult }) => {
      it(`${name}の視覚的表示が正しい`, () => {
        render(<ScoreDisplay scoreResult={scoreResult} />);

        // 基本要素の存在確認
        expect(screen.getByText('総合スコア')).toBeInTheDocument();
        expect(screen.getByText(scoreResult.total.toString())).toBeInTheDocument();

        // スコアレベルの表示確認
        const scoreLevel = getScoreLevel(scoreResult.total);
        expect(screen.getByText(scoreLevel)).toBeInTheDocument();

        // 色分けクラスの確認
        const scoreElement = screen.getByText(scoreResult.total.toString()).closest('div');
        const expectedColorClass = getExpectedColorClass(scoreResult.total);
        expect(scoreElement).toHaveClass(expectedColorClass);

        // プログレスバーの確認
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars.length).toBe(5); // 総合 + 4要素

        // 各要素スコアの表示確認
        expect(screen.getByText(scoreResult.components.evidence.toString())).toBeInTheDocument();
        expect(screen.getByText(scoreResult.components.safety.toString())).toBeInTheDocument();
        expect(screen.getByText(scoreResult.components.cost.toString())).toBeInTheDocument();
        expect(screen.getByText(scoreResult.components.practicality.toString())).toBeInTheDocument();
      });
    });

    it('データ不足時の警告表示が正しい', () => {
      const incompleteData = visualTestScenarios.find(s => s.name === 'データ不足ケース')!;
      render(<ScoreDisplay scoreResult={incompleteData.scoreResult} />);

      // データ不足警告の表示
      expect(screen.getByText('データが不足しています')).toBeInTheDocument();
      expect(screen.getByText('価格情報')).toBeInTheDocument();
      expect(screen.getByText('詳細な成分データ')).toBeInTheDocument();

      // 警告アイコンまたはスタイルの確認
      const warningElement = screen.getByText('データが不足しています').closest('div');
      expect(warningElement).toHaveClass('bg-yellow-50', 'border-yellow-200');
    });
  });

  describe('ScoreBreakdown 視覚的バリエーション', () => {
    visualTestScenarios.forEach(({ name, scoreResult }) => {
      it(`${name}の詳細表示が正しい`, () => {
        render(<ScoreBreakdown breakdown={scoreResult.breakdown} weights={scoreResult.weights} />);

        // 基本構造の確認
        expect(screen.getByText('スコア詳細分析')).toBeInTheDocument();

        // 4つのセクションの存在確認
        expect(screen.getByText('エビデンス')).toBeInTheDocument();
        expect(screen.getByText('安全性')).toBeInTheDocument();
        expect(screen.getByText('コスト')).toBeInTheDocument();
        expect(screen.getByText('実用性')).toBeInTheDocument();

        // 各セクションの色分け確認
        const evidenceButton = screen.getByRole('button', { name: /エビデンス/ });
        const evidenceSection = evidenceButton.parentElement;
        const expectedBorderClass = getExpectedBorderClass(scoreResult.breakdown.evidence.score);
        expect(evidenceSection).toHaveClass(expectedBorderClass);

        // 重み表示の確認
        expect(screen.getByText(/重み 35%/)).toBeInTheDocument();
        expect(screen.getByText(/重み 30%/)).toBeInTheDocument();
        expect(screen.getByText(/重み 20%/)).toBeInTheDocument();
        expect(screen.getByText(/重み 15%/)).toBeInTheDocument();
      });
    });
  });

  describe('レスポンシブ視覚的テスト', () => {
    const testViewports = [
      { name: 'モバイル', width: 375, height: 667 },
      { name: 'タブレット', width: 768, height: 1024 },
      { name: 'デスクトップ', width: 1024, height: 768 },
      { name: '大画面', width: 1440, height: 900 }
    ];

    testViewports.forEach(({ name, width, height }) => {
      it(`${name}ビューポート（${width}x${height}）で適切に表示される`, () => {
        // ビューポートサイズを設定
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
        Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height });

        const testData = visualTestScenarios[1]; // 良好スコアを使用
        render(<ScoreDisplay scoreResult={testData.scoreResult} />);

        // 基本表示の確認
        expect(screen.getByText('総合スコア')).toBeInTheDocument();
        expect(screen.getByText('75')).toBeInTheDocument();

        // レスポンシブクラスの確認
        if (width < 640) {
          // モバイル: 縦並びレイアウト
          const mobileLayout = document.querySelector('.flex-col, .space-y-4');
          expect(mobileLayout).toBeInTheDocument();
        } else if (width >= 1024) {
          // デスクトップ: グリッドレイアウト
          const desktopLayout = document.querySelector('.grid, .lg\\:grid-cols-4');
          expect(desktopLayout).toBeInTheDocument();
        }
      });
    });
  });

  describe('アニメーション・トランジション視覚テスト', () => {
    it('プログレスバーのアニメーションクラスが適用される', () => {
      const testData = visualTestScenarios[0]; // 優秀スコアを使用
      render(<ScoreDisplay scoreResult={testData.scoreResult} />);

      // プログレスバーのアニメーションクラス確認
      const progressBars = screen.getAllByRole('progressbar');
      progressBars.forEach(bar => {
        const progressFill = bar.querySelector('.transition-all, .duration-300, .ease-in-out');
        expect(progressFill).toBeInTheDocument();
      });
    });

    it('ホバー効果のクラスが適用される', () => {
      const testData = visualTestScenarios[1];
      render(<ScoreBreakdown breakdown={testData.scoreResult.breakdown} weights={testData.scoreResult.weights} />);

      // ボタンのホバー効果クラス確認
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('hover:bg-gray-50', 'transition-colors');
      });
    });
  });

  describe('ダークモード対応視覚テスト', () => {
    it('ダークモードクラスが適用される', () => {
      // ダークモードをシミュレート
      document.documentElement.classList.add('dark');

      const testData = visualTestScenarios[1];
      render(<ScoreDisplay scoreResult={testData.scoreResult} />);

      // ダークモード用のクラスが適用されているかチェック
      const darkElements = document.querySelectorAll('.dark\\:bg-gray-800, .dark\\:text-white, .dark\\:border-gray-600');
      expect(darkElements.length).toBeGreaterThan(0);

      // クリーンアップ
      document.documentElement.classList.remove('dark');
    });
  });

  describe('印刷スタイル視覚テスト', () => {
    it('印刷用のスタイルクラスが適用される', () => {
      const testData = visualTestScenarios[1];
      render(<ScoreDisplay scoreResult={testData.scoreResult} />);

      // 印刷用のクラスが適用されているかチェック
      const printElements = document.querySelectorAll('.print\\:text-black, .print\\:bg-white');
      expect(printElements.length).toBeGreaterThan(0);
    });
  });
});

// ヘルパー関数
function getScoreLevel(score: number): string {
  if (score >= 80) return '優秀';
  if (score >= 60) return '良好';
  if (score >= 40) return '普通';
  return '要改善';
}

function getExpectedColorClass(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-primary-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

function getExpectedBorderClass(score: number): string {
  if (score >= 80) return 'border-green-200';
  if (score >= 60) return 'border-blue-200';
  if (score >= 40) return 'border-yellow-200';
  return 'border-red-200';
}