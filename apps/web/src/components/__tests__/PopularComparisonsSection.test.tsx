import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import PopularComparisonsSection from '../PopularComparisonsSection';

const mockProducts = [
  {
    id: '1',
    name: 'ビタミンD3 2000IU',
    brand: 'Nature Made',
    price: 1980,
    pricePerDay: 66,
    rating: 4.8,
    reviewCount: 256,
    mainIngredients: ['ビタミンD3', '高吸収', 'オリーブオイル'],
    totalScore: 85,
  },
  {
    id: '2',
    name: 'マルチビタミン&ミネラル',
    brand: 'DHC',
    price: 1580,
    pricePerDay: 53,
    rating: 4.6,
    reviewCount: 189,
    mainIngredients: ['ビタミンB群', 'ビタミンC', '鉄分'],
    totalScore: 82,
  },
];

describe('PopularComparisonsSection', () => {
  it('デフォルトのタイトルとサブタイトルを表示する', () => {
    render(<PopularComparisonsSection />);

    expect(screen.getByText('人気サプリ比較')).toBeInTheDocument();
    expect(screen.getByText('Popular Comparisons')).toBeInTheDocument();
    expect(
      screen.getByText('AIが厳選した、最も人気の高いサプリメントを比較')
    ).toBeInTheDocument();
  });

  it('カスタムタイトルとサブタイトルを表示する', () => {
    render(
      <PopularComparisonsSection
        title='おすすめサプリ'
        subtitle='Recommended Supplements'
        description='専門家が選んだおすすめのサプリメント'
      />
    );

    expect(screen.getByText('おすすめサプリ')).toBeInTheDocument();
    expect(screen.getByText('Recommended Supplements')).toBeInTheDocument();
    expect(
      screen.getByText('専門家が選んだおすすめのサプリメント')
    ).toBeInTheDocument();
  });

  it('商品カードを表示する', () => {
    render(<PopularComparisonsSection products={mockProducts} />);

    expect(screen.getByText('ビタミンD3 2000IU')).toBeInTheDocument();
    expect(screen.getByText('Nature Made')).toBeInTheDocument();
    expect(screen.getByText('マルチビタミン&ミネラル')).toBeInTheDocument();
    expect(screen.getByText('DHC')).toBeInTheDocument();
  });

  it('もっと見るボタンを表示する', () => {
    render(<PopularComparisonsSection />);

    expect(
      screen.getByRole('button', { name: 'すべての比較を見る' })
    ).toBeInTheDocument();
  });

  it('showMoreButtonがfalseの場合はもっと見るボタンを表示しない', () => {
    render(<PopularComparisonsSection showMoreButton={false} />);

    expect(
      screen.queryByRole('button', { name: 'すべての比較を見る' })
    ).not.toBeInTheDocument();
  });

  it('もっと見るボタンをクリックしたときにコールバックが呼ばれる', () => {
    const onShowMore = vi.fn();
    render(<PopularComparisonsSection onShowMore={onShowMore} />);

    const showMoreButton = screen.getByRole('button', {
      name: 'すべての比較を見る',
    });
    fireEvent.click(showMoreButton);

    expect(onShowMore).toHaveBeenCalled();
  });

  it('商品の詳細を見るボタンをクリックしたときにコールバックが呼ばれる', () => {
    const onViewDetails = vi.fn();
    render(
      <PopularComparisonsSection
        products={mockProducts}
        onViewDetails={onViewDetails}
      />
    );

    const detailsButtons = screen.getAllByRole('button', {
      name: '詳細を見る',
    });
    fireEvent.click(detailsButtons[0]);

    expect(onViewDetails).toHaveBeenCalledWith('1');
  });

  it('お気に入りボタンをクリックしたときにコールバックが呼ばれる', () => {
    const onAddToFavorites = vi.fn();
    render(
      <PopularComparisonsSection
        products={mockProducts}
        onAddToFavorites={onAddToFavorites}
      />
    );

    const favoriteButtons = screen.getAllByLabelText('お気に入りに追加');
    fireEvent.click(favoriteButtons[0]);

    expect(onAddToFavorites).toHaveBeenCalledWith('1');
  });

  it('グリッドレイアウトのクラスが適用される', () => {
    const { container } = render(
      <PopularComparisonsSection products={mockProducts} />
    );

    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass(
      'grid-cols-1',
      'md:grid-cols-2',
      'lg:grid-cols-3'
    );
    // レスポンシブギャップクラスの確認
    expect(gridContainer).toHaveClass('gap-6', 'lg:gap-8', 'xl:gap-10');
  });

  it('セクションの背景色が適用される', () => {
    const { container } = render(<PopularComparisonsSection />);

    const section = container.firstChild as HTMLElement;
    expect(section).toHaveClass('bg-gray-50');
  });

  it('適切な余白とスペーシングが適用される', () => {
    const { container } = render(<PopularComparisonsSection />);

    const section = container.firstChild as HTMLElement;
    // レスポンシブパディングクラスの確認
    expect(section).toHaveClass('py-16', 'sm:py-20', 'lg:py-24');

    const innerContainer = section.querySelector('.max-w-7xl');
    expect(innerContainer).toHaveClass(
      'mx-auto',
      'px-4',
      'sm:px-6',
      'lg:px-8',
      'xl:px-12'
    );
  });

  it('カスタムクラス名が適用される', () => {
    const { container } = render(
      <PopularComparisonsSection className='custom-section' />
    );

    const section = container.firstChild as HTMLElement;
    expect(section).toHaveClass('custom-section');
  });

  it('デフォルトの商品データが表示される', () => {
    render(<PopularComparisonsSection />);

    // デフォルトの商品が表示されることを確認
    expect(screen.getByText('ビタミンD3 2000IU')).toBeInTheDocument();
    expect(screen.getByText('マルチビタミン&ミネラル')).toBeInTheDocument();
    expect(screen.getByText('オメガ3 フィッシュオイル')).toBeInTheDocument();
  });

  it('空の商品配列でもエラーが発生しない', () => {
    render(<PopularComparisonsSection products={[]} />);

    expect(screen.getByText('人気サプリ比較')).toBeInTheDocument();
    expect(screen.queryByText('ビタミンD3 2000IU')).not.toBeInTheDocument();
  });
});
