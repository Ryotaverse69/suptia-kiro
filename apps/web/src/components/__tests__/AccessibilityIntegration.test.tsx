import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import CompareCard from '../CompareCard';
import { SuggestChips, defaultSuggestChips } from '../SuggestChips';
import IngredientCard from '../IngredientCard';
import SectionHeader from '../SectionHeader';
import { SkipLinks } from '../SkipLinks';
import { Ingredient } from '@/lib/ingredient-data';

// jest-axeのマッチャーを追加
expect.extend(toHaveNoViolations);

// モックデータ
const mockProduct = {
  id: 'test-product-1',
  name: 'テストビタミンD',
  brand: 'テストブランド',
  price: 1980,
  pricePerDay: 66,
  currency: '¥',
  rating: 4.5,
  reviewCount: 123,
  mainIngredients: ['ビタミンD3', '高吸収', 'オーガニック'],
  totalScore: 85,
};

const mockIngredient: Ingredient = {
  id: 'test-ingredient-1',
  name: 'ビタミンD',
  nameEn: 'Vitamin D',
  category: 'vitamins',
  description: 'テスト用の説明文です。',
  benefits: ['免疫力向上', '骨の健康', '筋肉機能'],
  evidenceLevel: 'high',
  averagePrice: 2000,
  popularity: 85,
  safetyRating: 4.5,
  interactions: [],
  contraindications: [],
  dosageRecommendations: {
    adult: { min: 1000, max: 4000, unit: 'IU' },
  },
};

describe('アクセシビリティ統合テスト', () => {
  beforeEach(() => {
    // DOM要素をセットアップ
    document.body.innerHTML = `
      <div id="main-content">Main Content</div>
      <div id="navigation">Navigation</div>
      <div id="search">Search</div>
    `;
  });

  describe('axe-core自動テスト', () => {
    it('CompareCardにアクセシビリティ違反がない', async () => {
      const { container } = render(<CompareCard {...mockProduct} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('SuggestChipsにアクセシビリティ違反がない', async () => {
      const mockOnChipClick = vi.fn();
      const { container } = render(
        <SuggestChips
          chips={defaultSuggestChips.slice(0, 3)}
          onChipClick={mockOnChipClick}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('IngredientCardにアクセシビリティ違反がない', async () => {
      const mockOnClick = vi.fn();
      const { container } = render(
        <IngredientCard ingredient={mockIngredient} onClick={mockOnClick} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('SectionHeaderにアクセシビリティ違反がない', async () => {
      const { container } = render(
        <SectionHeader
          title='テストセクション'
          subtitle='カテゴリ'
          description='テスト用の説明文'
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('SkipLinksにアクセシビリティ違反がない', async () => {
      const { container } = render(<SkipLinks />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('キーボードナビゲーション統合テスト', () => {
    it('CompareCardがキーボードでアクセス可能', () => {
      const mockOnViewDetails = vi.fn();
      render(
        <CompareCard {...mockProduct} onViewDetails={mockOnViewDetails} />
      );

      const detailsButton = screen.getByText('詳細を見る');

      // Tabキーでフォーカス可能
      detailsButton.focus();
      expect(detailsButton).toHaveFocus();

      // クリックでアクション実行（Buttonコンポーネントは標準的なクリックイベントを使用）
      fireEvent.click(detailsButton);
      expect(mockOnViewDetails).toHaveBeenCalledWith('test-product-1');
    });

    it('IngredientCardがキーボードでアクセス可能', () => {
      const mockOnClick = vi.fn();
      render(
        <IngredientCard ingredient={mockIngredient} onClick={mockOnClick} />
      );

      const card = screen.getByRole('article');

      // Tabキーでフォーカス可能
      card.focus();
      expect(card).toHaveFocus();

      // Enterキーでアクション実行
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(mockOnClick).toHaveBeenCalled();

      // Spaceキーでもアクション実行
      fireEvent.keyDown(card, { key: ' ' });
      expect(mockOnClick).toHaveBeenCalledTimes(2);
    });

    it('SuggestChipsがキーボードでアクセス可能', () => {
      const mockOnChipClick = vi.fn();
      render(
        <SuggestChips
          chips={defaultSuggestChips.slice(0, 3)}
          onChipClick={mockOnChipClick}
        />
      );

      const firstChipButton = screen.getByLabelText('ビタミンDで検索（人気）');

      // Tabキーでフォーカス可能
      firstChipButton.focus();
      expect(firstChipButton).toHaveFocus();

      // クリックイベントでアクション実行
      fireEvent.click(firstChipButton);
      expect(mockOnChipClick).toHaveBeenCalled();
    });
  });

  describe('スクリーンリーダー対応テスト', () => {
    it('CompareCardが適切なランドマークとラベルを持つ', () => {
      render(<CompareCard {...mockProduct} />);

      // article要素
      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('aria-labelledby');
      expect(article).toHaveAttribute('aria-describedby');

      // 評価の読み上げ
      const rating = screen.getByLabelText(/5つ星中.*つ星の評価/);
      expect(rating).toBeInTheDocument();

      // 価格情報
      const priceRegion = screen.getByRole('region', { name: '価格情報' });
      expect(priceRegion).toBeInTheDocument();
    });

    it('IngredientCardが適切なランドマークとラベルを持つ', () => {
      const mockOnClick = vi.fn();
      render(
        <IngredientCard ingredient={mockIngredient} onClick={mockOnClick} />
      );

      // article要素
      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('aria-labelledby');
      expect(article).toHaveAttribute('aria-describedby');

      // エビデンス強度
      const evidenceBadge = screen.getByLabelText(/エビデンス強度.*ランク/);
      expect(evidenceBadge).toBeInTheDocument();

      // 人気度プログレスバー
      const popularityBar = screen.getByRole('progressbar');
      expect(popularityBar).toHaveAttribute('aria-valuenow');
      expect(popularityBar).toHaveAttribute('aria-valuemin');
      expect(popularityBar).toHaveAttribute('aria-valuemax');
    });

    it('SectionHeaderが適切な見出し構造を持つ', () => {
      render(
        <SectionHeader
          title='テストセクション'
          subtitle='カテゴリ'
          description='テスト用の説明文'
        />
      );

      // header要素
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();

      // h2見出し
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveAttribute('id');

      // サブタイトル
      const subtitle = screen.getByLabelText('セクションカテゴリ');
      expect(subtitle).toBeInTheDocument();
    });
  });

  describe('フォーカス管理統合テスト', () => {
    it('SkipLinksが正しく動作する', () => {
      render(<SkipLinks />);

      const mainContentLink = screen.getByText('メインコンテンツへスキップ');

      // Alt+Sでフォーカス
      fireEvent.keyDown(document, { key: 's', altKey: true });
      expect(mainContentLink).toHaveFocus();

      // Enterキーでリンク先に移動（実際のナビゲーションはテストしない）
      expect(mainContentLink).toHaveAttribute('href', '#main-content');
    });

    it('フォーカスリングが適切に表示される', () => {
      render(<CompareCard {...mockProduct} />);

      const favoriteButton = screen.getByLabelText('お気に入りに追加');

      // フォーカス時にfocus:ring-*クラスが適用されることを確認
      favoriteButton.focus();
      expect(favoriteButton).toHaveFocus();

      // フォーカスリングのスタイルが適用されていることを確認
      expect(favoriteButton).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });

  describe('色とコントラストの統合テスト', () => {
    it('重要なテキストが十分なコントラストを持つ', () => {
      render(<CompareCard {...mockProduct} />);

      // 商品名（重要なテキスト）
      const productName = screen.getByText('テストビタミンD');
      expect(productName).toHaveClass('text-gray-900'); // 高コントラスト

      // 価格（重要な情報）
      const price = screen.getByText('¥1,980');
      expect(price).toHaveClass('text-primary-600'); // アクセント色
    });

    it('状態変化が色以外でも伝わる', () => {
      const mockOnAddToFavorites = vi.fn();
      render(
        <CompareCard {...mockProduct} onAddToFavorites={mockOnAddToFavorites} />
      );

      const favoriteButton = screen.getByLabelText('お気に入りに追加');

      // クリック前のaria-label
      expect(favoriteButton).toHaveAttribute('aria-label', 'お気に入りに追加');

      // クリック後（状態変化をテスト）
      fireEvent.click(favoriteButton);

      // aria-labelが変更されることを確認
      expect(favoriteButton).toHaveAttribute(
        'aria-label',
        'お気に入りから削除'
      );
    });
  });
});
