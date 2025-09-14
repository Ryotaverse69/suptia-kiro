import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import CompareCard from '../CompareCard';

const mockProduct = {
  id: '1',
  name: 'ビタミンD3 2000IU',
  brand: 'Nature Made',
  price: 1980,
  pricePerDay: 66,
  mainIngredients: ['ビタミンD3', '高吸収', 'オリーブオイル'],
  rating: 4.8,
  reviewCount: 256,
  totalScore: 85,
};

describe('CompareCard', () => {
  it('基本的な商品情報を表示する', () => {
    render(<CompareCard {...mockProduct} />);

    expect(screen.getByText('ビタミンD3 2000IU')).toBeInTheDocument();
    expect(screen.getByText('Nature Made')).toBeInTheDocument();
    expect(screen.getByText('¥1,980')).toBeInTheDocument();
    expect(screen.getByText('¥66')).toBeInTheDocument();
    expect(screen.getByText('1日あたり')).toBeInTheDocument();
  });

  it('総合スコアを表示する', () => {
    render(<CompareCard {...mockProduct} />);

    expect(screen.getByText('総合スコア 85')).toBeInTheDocument();
  });

  it('評価と レビュー数を表示する', () => {
    render(<CompareCard {...mockProduct} />);

    expect(screen.getByText(/4\.8/)).toBeInTheDocument();
    expect(screen.getByText(/256件のレビュー/)).toBeInTheDocument();
  });

  it('主要成分バッジを表示する', () => {
    render(<CompareCard {...mockProduct} />);

    expect(screen.getByText('ビタミンD3')).toBeInTheDocument();
    expect(screen.getByText('高吸収')).toBeInTheDocument();
    expect(screen.getByText('オリーブオイル')).toBeInTheDocument();
  });

  it('主要成分が3つ以上の場合に省略表示する', () => {
    const productWithManyIngredients = {
      ...mockProduct,
      mainIngredients: [
        'ビタミンD3',
        '高吸収',
        'オリーブオイル',
        'ビタミンK2',
        'マグネシウム',
      ],
    };

    render(<CompareCard {...productWithManyIngredients} />);

    expect(screen.getByText('ビタミンD3')).toBeInTheDocument();
    expect(screen.getByText('高吸収')).toBeInTheDocument();
    expect(screen.getByText('オリーブオイル')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('追加バッジを表示する', () => {
    const badges = [
      { label: '高品質', variant: 'high' as const },
      { label: '人気', variant: 'info' as const },
    ];

    render(<CompareCard {...mockProduct} badges={badges} />);

    expect(screen.getByText('高品質')).toBeInTheDocument();
    expect(screen.getByText('人気')).toBeInTheDocument();
  });

  it('詳細を見るボタンをクリックしたときにコールバックが呼ばれる', () => {
    const onViewDetails = vi.fn();
    render(<CompareCard {...mockProduct} onViewDetails={onViewDetails} />);

    const detailsButton = screen.getByRole('button', { name: '詳細を見る' });
    fireEvent.click(detailsButton);

    expect(onViewDetails).toHaveBeenCalledWith('1');
  });

  it('お気に入りボタンをクリックしたときにコールバックが呼ばれる', () => {
    const onAddToFavorites = vi.fn();
    render(
      <CompareCard {...mockProduct} onAddToFavorites={onAddToFavorites} />
    );

    const favoriteButton = screen.getByLabelText('お気に入りに追加');
    fireEvent.click(favoriteButton);

    expect(onAddToFavorites).toHaveBeenCalledWith('1');
  });

  it('お気に入りボタンの状態が切り替わる', () => {
    render(<CompareCard {...mockProduct} />);

    const favoriteButton = screen.getByLabelText('お気に入りに追加');
    fireEvent.click(favoriteButton);

    expect(screen.getByLabelText('お気に入りから削除')).toBeInTheDocument();
  });

  it('カスタム通貨を表示する', () => {
    render(<CompareCard {...mockProduct} currency='$' />);

    expect(screen.getByText('$1,980')).toBeInTheDocument();
    expect(screen.getByText('$66')).toBeInTheDocument();
  });

  it('評価がない場合は評価を表示しない', () => {
    const productWithoutRating = {
      ...mockProduct,
      rating: undefined,
      reviewCount: undefined,
    };

    render(<CompareCard {...productWithoutRating} />);

    expect(screen.queryByText(/4.8/)).not.toBeInTheDocument();
  });

  it('総合スコアがない場合はスコアバッジを表示しない', () => {
    const productWithoutScore = {
      ...mockProduct,
      totalScore: undefined,
    };

    render(<CompareCard {...productWithoutScore} />);

    expect(screen.queryByText(/総合スコア/)).not.toBeInTheDocument();
  });

  it('Apple風のホバー効果クラスが適用される', () => {
    const { container } = render(<CompareCard {...mockProduct} />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('apple-hover');
    expect(card).toHaveClass('hover:shadow-lg');
    expect(card).toHaveClass('hover:-translate-y-1');
  });

  it('カスタムクラス名が適用される', () => {
    const { container } = render(
      <CompareCard {...mockProduct} className='custom-class' />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('custom-class');
  });

  it('バッジのvariantに応じて適切なスタイルが適用される', () => {
    const badges = [
      { label: '高品質', variant: 'high' as const },
      { label: '中品質', variant: 'medium' as const },
      { label: '低品質', variant: 'low' as const },
      { label: '情報', variant: 'info' as const },
    ];

    render(<CompareCard {...mockProduct} badges={badges} />);

    const highBadge = screen.getByText('高品質');
    const mediumBadge = screen.getByText('中品質');
    const lowBadge = screen.getByText('低品質');
    const infoBadge = screen.getByText('情報');

    expect(highBadge).toHaveClass('from-green-500', 'to-green-600');
    expect(mediumBadge).toHaveClass('from-yellow-500', 'to-orange-500');
    expect(lowBadge).toHaveClass('from-red-500', 'to-red-600');
    expect(infoBadge).toHaveClass('from-primary-500', 'to-primary-600');
  });
});
