import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import IngredientCard from '../IngredientCard';
import { Ingredient } from '@/lib/ingredient-data';

// モック成分データ
const mockIngredient: Ingredient = {
  id: 'vitamin-c',
  name: 'ビタミンC',
  nameEn: 'Vitamin C (Ascorbic Acid)',
  category: 'vitamins',
  description:
    '強力な抗酸化作用を持つ水溶性ビタミン。コラーゲンの合成に必要で、免疫機能をサポートします。',
  benefits: [
    '抗酸化作用による細胞保護',
    'コラーゲン合成の促進',
    '免疫機能の強化',
    '鉄の吸収促進',
    '疲労回復のサポート',
  ],
  recommendedDosage: '成人: 100-1000mg/日',
  sideEffects: ['高用量摂取時の胃腸障害', '腎結石のリスク（2g/日以上）'],
  interactions: ['ワルファリンとの相互作用の可能性'],
  evidenceLevel: 'high',
  sources: ['柑橘類', 'ブロッコリー', 'イチゴ', 'キウイフルーツ'],
  purposes: ['immunity', 'beauty', 'fatigue-recovery'],
  commonForms: ['tablet', 'capsule', 'powder'],
  averagePrice: 1500,
  popularity: 95,
};

describe('IngredientCard', () => {
  it('成分の基本情報が正しく表示される', () => {
    render(<IngredientCard ingredient={mockIngredient} />);

    // 成分名の表示確認
    expect(screen.getByText('ビタミンC')).toBeInTheDocument();
    expect(screen.getByText('Vitamin C (Ascorbic Acid)')).toBeInTheDocument();

    // 説明文の表示確認
    expect(
      screen.getByText(/強力な抗酸化作用を持つ水溶性ビタミン/)
    ).toBeInTheDocument();

    // 価格の表示確認
    expect(screen.getByText('¥1,500')).toBeInTheDocument();

    // 人気度の表示確認
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('エビデンス強度が正しく表示される', () => {
    render(<IngredientCard ingredient={mockIngredient} />);

    // エビデンス強度Aの表示確認
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('効能バッジが正しく表示される', () => {
    render(<IngredientCard ingredient={mockIngredient} />);

    // 最初の3つの効能が表示されることを確認
    expect(screen.getByText('抗酸化作用による細胞保護')).toBeInTheDocument();
    expect(screen.getByText('コラーゲン合成の促進')).toBeInTheDocument();
    expect(screen.getByText('免疫機能の強化')).toBeInTheDocument();

    // 残りの効能数が表示されることを確認
    expect(screen.getByText('+2個')).toBeInTheDocument();
  });

  it('カテゴリ別のカラーコーディングが適用される', () => {
    const { container } = render(
      <IngredientCard ingredient={mockIngredient} />
    );

    // ビタミンカテゴリのカラーが適用されることを確認
    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('bg-orange-50', 'border-orange-200');
  });

  it('クリックイベントが正しく動作する', () => {
    const mockOnClick = vi.fn();
    render(
      <IngredientCard ingredient={mockIngredient} onClick={mockOnClick} />
    );

    // カードをクリック
    const cardElement = screen
      .getByRole('button', { name: /詳細を見る/ })
      .closest('div');
    fireEvent.click(cardElement!);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('詳細ボタンが表示される', () => {
    render(<IngredientCard ingredient={mockIngredient} />);

    const detailButton = screen.getByRole('button', { name: '詳細を見る' });
    expect(detailButton).toBeInTheDocument();
  });

  it('異なるエビデンスレベルで正しい表示がされる', () => {
    const mediumEvidenceIngredient = {
      ...mockIngredient,
      evidenceLevel: 'medium' as const,
    };

    render(<IngredientCard ingredient={mediumEvidenceIngredient} />);
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('異なるカテゴリで正しいカラーが適用される', () => {
    const mineralIngredient = {
      ...mockIngredient,
      category: 'minerals' as const,
    };

    const { container } = render(
      <IngredientCard ingredient={mineralIngredient} />
    );
    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('bg-blue-50', 'border-blue-200');
  });

  it('人気度バーが正しい幅で表示される', () => {
    const { container } = render(
      <IngredientCard ingredient={mockIngredient} />
    );

    // 人気度バーの要素を取得
    const popularityBar = container.querySelector('[style*="width: 95%"]');

    expect(popularityBar).toBeInTheDocument();
    expect(popularityBar).toHaveStyle('width: 95%');
  });
});
