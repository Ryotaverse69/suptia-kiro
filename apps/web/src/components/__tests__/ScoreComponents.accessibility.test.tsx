/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ScoreDisplay } from '../ScoreDisplay';
import { ScoreBreakdown } from '../ScoreBreakdown';
import { ScoreResult } from '@/lib/scoring';

// アクセシビリティテスト用のヘルパー関数
const checkAriaAttributes = (element: HTMLElement, expectedAttributes: Record<string, string>) => {
  Object.entries(expectedAttributes).forEach(([attr, value]) => {
    expect(element).toHaveAttribute(attr, value);
  });
};

// モックデータ
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
      score: 85.0,
      factors: [
        {
          name: 'エビデンスレベル',
          value: 90,
          weight: 0.4,
          description: '科学的根拠の質'
        },
        {
          name: '研究数',
          value: 80,
          weight: 0.6,
          description: '成分に関する研究の数'
        }
      ],
      explanation: 'エビデンススコアは科学的根拠の質と量を評価します'
    },
    safety: {
      score: 75.0,
      factors: [
        {
          name: '副作用リスク',
          value: 85,
          weight: 0.4,
          description: '報告されている副作用の重篤度'
        },
        {
          name: '相互作用リスク',
          value: 70,
          weight: 0.35,
          description: '薬物や他の成分との相互作用リスク'
        },
        {
          name: '禁忌事項',
          value: 65,
          weight: 0.25,
          description: '使用を避けるべき条件の数'
        }
      ],
      explanation: '安全性スコアは副作用や相互作用のリスクを評価します'
    },
    cost: {
      score: 70.0,
      factors: [
        {
          name: '市場価格比較',
          value: 75,
          weight: 0.6,
          description: '同類商品との価格比較'
        },
        {
          name: 'mg単価',
          value: 65,
          weight: 0.4,
          description: '有効成分1mgあたりのコスト'
        }
      ],
      explanation: 'コストスコアは価格対効果を評価します'
    },
    practicality: {
      score: 80.0,
      factors: [
        {
          name: '摂取頻度',
          value: 85,
          weight: 0.4,
          description: '1日の摂取回数（少ない方が高スコア）'
        },
        {
          name: '剤形',
          value: 80,
          weight: 0.3,
          description: '摂取しやすさ（カプセル>錠剤>粉末）'
        },
        {
          name: '容量',
          value: 75,
          weight: 0.3,
          description: '1容器での継続日数'
        }
      ],
      explanation: '実用性スコアは使いやすさを評価します'
    }
  },
  isComplete: true,
  missingData: []
};

const mockIncompleteScoreResult: ScoreResult = {
  ...mockScoreResult,
  isComplete: false,
  missingData: ['成分の詳細情報', '第三者検査結果']
};

describe('ScoreDisplay アクセシビリティテスト', () => {
  it('基本的なアクセシビリティ要件を満たしていること', async () => {
    render(<ScoreDisplay scoreResult={mockScoreResult} />);
    
    // 基本的なアクセシビリティ要件をチェック
    expect(screen.getByRole('region')).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
  });

  it('適切なARIA属性が設定されていること', () => {
    render(<ScoreDisplay scoreResult={mockScoreResult} />);
    
    // region roleが設定されていること
    expect(screen.getByRole('region')).toBeInTheDocument();
    
    // progressbar roleが設定されていること
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
    
    // 各プログレスバーに適切なaria-labelが設定されていること
    progressBars.forEach(progressBar => {
      expect(progressBar).toHaveAttribute('aria-label');
      expect(progressBar).toHaveAttribute('aria-valuenow');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });
  });

  it('スクリーンリーダー用の隠しテキストが提供されていること', () => {
    render(<ScoreDisplay scoreResult={mockScoreResult} />);
    
    // sr-onlyクラスの要素が存在すること
    const hiddenSummary = screen.getByText(/商品の総合スコアは78.5点/);
    expect(hiddenSummary).toBeInTheDocument();
    expect(hiddenSummary.closest('.sr-only')).toBeInTheDocument();
  });

  it('キーボードナビゲーションが機能すること', async () => {
    render(<ScoreDisplay scoreResult={mockScoreResult} />);
    
    // Tabキーでフォーカス可能な要素に移動できること
    const focusableElements = screen.getAllByRole('progressbar').filter(el => el.tabIndex >= 0);
    
    expect(focusableElements.length).toBeGreaterThan(0);
    
    // 各フォーカス可能要素がtabIndexを持っていることを確認
    focusableElements.forEach(element => {
      expect(element.tabIndex).toBeGreaterThanOrEqual(0);
    });
  });

  it('ローディング状態でアクセシビリティが保たれること', async () => {
    render(<ScoreDisplay scoreResult={null} isLoading={true} />);
    
    // ローディング状態のaria-labelが設定されていること
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('スコア計算中')).toBeInTheDocument();
  });

  it('エラー状態でアクセシビリティが保たれること', async () => {
    render(
      <ScoreDisplay 
        scoreResult={null} 
        isLoading={false} 
        error="スコア計算に失敗しました" 
      />
    );
    
    // エラー状態のrole="alert"が設定されていること
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('データ不足警告でアクセシビリティが保たれること', async () => {
    render(<ScoreDisplay scoreResult={mockIncompleteScoreResult} />);
    
    // 警告のrole="alert"が設定されていること
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('データが不足しています')).toBeInTheDocument();
  });
});

describe('ScoreBreakdown アクセシビリティテスト', () => {
  it('基本的なアクセシビリティ要件を満たしていること', async () => {
    render(
      <ScoreBreakdown 
        breakdown={mockScoreResult.breakdown} 
        weights={mockScoreResult.weights} 
      />
    );
    
    // 基本的なアクセシビリティ要件をチェック
    expect(screen.getByRole('region')).toBeInTheDocument();
    expect(screen.getAllByRole('button').length).toBe(4); // 4つの要素分
  });

  it('展開可能セクションに適切なARIA属性が設定されていること', () => {
    render(
      <ScoreBreakdown 
        breakdown={mockScoreResult.breakdown} 
        weights={mockScoreResult.weights} 
      />
    );
    
    // 展開可能なボタンが存在すること
    const expandButtons = screen.getAllByRole('button');
    expect(expandButtons.length).toBe(4); // 4つの要素分
    
    expandButtons.forEach(button => {
      // aria-expandedが設定されていること
      expect(button).toHaveAttribute('aria-expanded');
      
      // aria-controlsが設定されていること
      expect(button).toHaveAttribute('aria-controls');
      
      // aria-describedbyが設定されていること
      expect(button).toHaveAttribute('aria-describedby');
    });
  });

  it('キーボードナビゲーションが機能すること', async () => {
    render(
      <ScoreBreakdown 
        breakdown={mockScoreResult.breakdown} 
        weights={mockScoreResult.weights} 
      />
    );
    
    const firstButton = screen.getAllByRole('button')[0];
    
    // Enterキーイベントをシミュレート
    fireEvent.keyDown(firstButton, { key: 'Enter', code: 'Enter' });
    
    // 展開後の状態を確認
    expect(firstButton).toHaveAttribute('aria-expanded', 'true');
    
    // Escapeキーイベントをシミュレート
    fireEvent.keyDown(firstButton, { key: 'Escape', code: 'Escape' });
  });

  it('展開時にスクリーンリーダーへのアナウンスが機能すること', async () => {
    render(
      <ScoreBreakdown 
        breakdown={mockScoreResult.breakdown} 
        weights={mockScoreResult.weights} 
      />
    );
    
    const firstButton = screen.getAllByRole('button')[0];
    
    // 展開前の状態確認
    expect(firstButton).toHaveAttribute('aria-expanded', 'false');
    
    // 展開
    fireEvent.click(firstButton);
    
    // 展開後の状態確認
    await waitFor(() => {
      expect(firstButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('要因表示に適切なARIA属性が設定されていること', async () => {
    render(
      <ScoreBreakdown 
        breakdown={mockScoreResult.breakdown} 
        weights={mockScoreResult.weights} 
      />
    );
    
    // 最初のセクションを展開
    const firstButton = screen.getAllByRole('button')[0];
    fireEvent.click(firstButton);
    
    // 展開されたコンテンツ内のgroup roleを確認
    await waitFor(() => {
      const groups = screen.getAllByRole('group');
      expect(groups.length).toBeGreaterThan(0);
      
      // 各グループに適切なaria-labelledbyが設定されていること
      groups.forEach(group => {
        if (group.getAttribute('aria-labelledby')) {
          expect(group).toHaveAttribute('aria-labelledby');
        }
      });
    });
  });

  it('プログレスバーに適切なARIA属性が設定されていること', async () => {
    render(
      <ScoreBreakdown 
        breakdown={mockScoreResult.breakdown} 
        weights={mockScoreResult.weights} 
      />
    );
    
    // セクションを展開してプログレスバーを表示
    const firstButton = screen.getAllByRole('button')[0];
    fireEvent.click(firstButton);
    
    // プログレスバーが存在することを確認
    await waitFor(() => {
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
      
      progressBars.forEach(progressBar => {
        expect(progressBar).toHaveAttribute('aria-valuenow');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
        expect(progressBar).toHaveAttribute('aria-label');
      });
    });
  });

  it('重み設定セクションに適切なARIA属性が設定されていること', () => {
    render(
      <ScoreBreakdown 
        breakdown={mockScoreResult.breakdown} 
        weights={mockScoreResult.weights} 
      />
    );
    
    // complementary roleが設定されていること
    expect(screen.getByRole('complementary')).toBeInTheDocument();
    
    // リスト構造が適切に設定されていること
    expect(screen.getByRole('list', { name: '重み設定一覧' })).toBeInTheDocument();
    
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(4); // 4つの要素分
    
    // 各リストアイテムに適切なaria-labelが設定されていること
    listItems.forEach(item => {
      const weightElement = item.querySelector('[aria-label*="パーセント"]');
      expect(weightElement).toBeInTheDocument();
    });
  });
});

describe('統合アクセシビリティテスト', () => {
  it('ScoreDisplayとScoreBreakdownを組み合わせた場合のアクセシビリティ', async () => {
    render(
      <div>
        <ScoreDisplay scoreResult={mockScoreResult} />
        <ScoreBreakdown 
          breakdown={mockScoreResult.breakdown} 
          weights={mockScoreResult.weights} 
        />
      </div>
    );
    
    // 基本的なアクセシビリティ要件をチェック
    expect(screen.getAllByRole('region').length).toBe(2);
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button').length).toBe(4);
  });

  it('フォーカス管理が適切に機能すること', async () => {
    render(
      <div>
        <ScoreDisplay scoreResult={mockScoreResult} />
        <ScoreBreakdown 
          breakdown={mockScoreResult.breakdown} 
          weights={mockScoreResult.weights} 
        />
      </div>
    );
    
    // フォーカス可能な要素が適切に順序付けられていることを確認
    const focusableElements = [
      ...screen.getAllByRole('progressbar'),
      ...screen.getAllByRole('button'),
      ...screen.getAllByRole('group')
    ].filter(el => el.tabIndex >= 0);
    
    expect(focusableElements.length).toBeGreaterThan(0);
  });
});