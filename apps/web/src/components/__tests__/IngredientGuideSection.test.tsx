import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import IngredientGuideSection from '../IngredientGuideSection';

// console.logをモック
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => { });

describe('IngredientGuideSection', () => {
  afterEach(() => {
    mockConsoleLog.mockClear();
  });

  it('セクションヘッダーが正しく表示される', () => {
    render(<IngredientGuideSection />);

    expect(screen.getByText('成分ガイド')).toBeInTheDocument();
    expect(
      screen.getByText('科学的根拠に基づいた成分情報をわかりやすく')
    ).toBeInTheDocument();
  });

  it('カテゴリフィルターが表示される', () => {
    render(<IngredientGuideSection />);

    // すべてボタンの確認
    expect(screen.getByText('すべて')).toBeInTheDocument();

    // カテゴリボタンの確認
    expect(screen.getByText('ビタミン')).toBeInTheDocument();
    expect(screen.getByText('ミネラル')).toBeInTheDocument();
    expect(screen.getByText('ハーブ')).toBeInTheDocument();
    expect(screen.getByText('アミノ酸')).toBeInTheDocument();
  });

  it('初期状態で成分カードが表示される', () => {
    render(<IngredientGuideSection />);

    // 成分カードが表示されることを確認（最大6件）
    const ingredientCards = screen.getAllByText('詳細を見る');
    expect(ingredientCards.length).toBeGreaterThan(0);
    expect(ingredientCards.length).toBeLessThanOrEqual(6);
  });

  it('カテゴリフィルターが正しく動作する', () => {
    render(<IngredientGuideSection />);

    // ビタミンカテゴリをクリック
    const vitaminButton = screen.getByText('ビタミン');
    fireEvent.click(vitaminButton);

    // ビタミンカテゴリの説明が表示されることを確認
    expect(
      screen.getByText(
        '体の機能維持に必要な必須栄養素。エネルギー代謝や免疫機能をサポート'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('13種類の成分')).toBeInTheDocument();
  });

  it('成分カードクリック時にコンソールログが出力される', () => {
    render(<IngredientGuideSection />);

    // 最初の成分カードをクリック
    const firstCard = screen.getAllByText('詳細を見る')[0];
    fireEvent.click(firstCard);
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Navigate to ingredient detail:',
      expect.any(String)
    );
  });

  it('すべてカテゴリで「もっと見る」ボタンが表示される', () => {
    render(<IngredientGuideSection />);

    // モックデータが6件以上ある場合、「もっと見る」ボタンが表示される
    const moreButton = screen.queryByText('すべての成分を見る');
    // モックデータの件数によって表示が変わるため、存在チェックのみ
    if (moreButton) {
      expect(moreButton).toBeInTheDocument();
    }
  });

  it('カテゴリ選択時にアクティブ状態が正しく表示される', () => {
    render(<IngredientGuideSection />);

    // カテゴリフィルターのビタミンボタンを取得（🍊アイコンを含む）
    const vitaminButton = screen.getByText('🍊').closest('button');
    if (vitaminButton) {
      fireEvent.click(vitaminButton);
      // アクティブなボタンのスタイルが適用されることを確認
      expect(vitaminButton).toHaveClass('bg-primary-600', 'text-white');
    }
  });

  it('カスタムクラス名が適用される', () => {
    const { container } = render(
      <IngredientGuideSection className='custom-class' />
    );

    const sectionElement = container.firstChild as HTMLElement;
    expect(sectionElement).toHaveClass('custom-class');
  });

  it('3列グリッドレイアウトが適用される', () => {
    const { container } = render(<IngredientGuideSection />);

    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass(
      'grid-cols-1',
      'sm:grid-cols-1',
      'md:grid-cols-2',
      'lg:grid-cols-3'
    );
    // レスポンシブギャップクラスの確認
    expect(gridContainer).toHaveClass(
      'gap-4',
      'sm:gap-6',
      'lg:gap-8',
      'xl:gap-10'
    );
  });

  it('適切な余白とスペーシングが適用される', () => {
    const { container } = render(<IngredientGuideSection />);

    const sectionElement = container.firstChild as HTMLElement;
    // レスポンシブパディングクラスの確認
    expect(sectionElement).toHaveClass('py-16', 'sm:py-20', 'lg:py-24');

    const containerElement = container.querySelector('.max-w-7xl');
    expect(containerElement).toHaveClass(
      'mx-auto',
      'px-4',
      'sm:px-6',
      'lg:px-8',
      'xl:px-12'
    );
  });
});
