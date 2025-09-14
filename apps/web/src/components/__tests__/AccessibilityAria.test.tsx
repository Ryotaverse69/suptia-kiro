import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import CompareCard from '../CompareCard';
import { SuggestChips, defaultSuggestChips } from '../SuggestChips';
import IngredientCard from '../IngredientCard';
import SectionHeader from '../SectionHeader';
import { Ingredient } from '@/lib/ingredient-data';

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

describe('ARIA属性のアクセシビリティテスト', () => {
  describe('CompareCard', () => {
    it('適切なARIA属性が設定されている', () => {
      render(<CompareCard {...mockProduct} />);

      // article要素とaria-labelledby
      const article = screen.getByRole('article');
      expect(article).toHaveAttribute(
        'aria-labelledby',
        'product-name-test-product-1'
      );
      expect(article).toHaveAttribute(
        'aria-describedby',
        'product-description-test-product-1'
      );

      // 商品名のid
      const productName = screen.getByText('テストビタミンD');
      expect(productName).toHaveAttribute('id', 'product-name-test-product-1');

      // ブランド名のid
      const brandName = screen.getByText('テストブランド');
      expect(brandName).toHaveAttribute(
        'id',
        'product-description-test-product-1'
      );

      // 評価の星表示
      const ratingDisplay = screen.getByLabelText('5つ星中4.5つ星の評価');
      expect(ratingDisplay).toBeInTheDocument();

      // 主要成分リスト
      const ingredientsList = screen.getByRole('list', { name: '主要成分' });
      expect(ingredientsList).toBeInTheDocument();

      // 価格情報
      const priceRegion = screen.getByRole('region', { name: '価格情報' });
      expect(priceRegion).toBeInTheDocument();
    });

    it('お気に入りボタンに適切なaria-labelが設定されている', () => {
      render(<CompareCard {...mockProduct} />);

      const favoriteButton = screen.getByLabelText('お気に入りに追加');
      expect(favoriteButton).toBeInTheDocument();
    });
  });

  describe('SuggestChips', () => {
    it('適切なARIA属性が設定されている', () => {
      const mockOnChipClick = vi.fn();
      render(
        <SuggestChips
          chips={defaultSuggestChips.slice(0, 3)}
          onChipClick={mockOnChipClick}
          title='テストカテゴリ'
        />
      );

      // region要素
      const region = screen.getByRole('region', { name: '検索候補' });
      expect(region).toBeInTheDocument();

      // タイトルのid
      const title = screen.getByText('テストカテゴリ');
      expect(title).toHaveAttribute('id', 'suggest-chips-title');

      // リスト要素
      const list = screen.getByRole('list');
      expect(list).toHaveAttribute('aria-labelledby', 'suggest-chips-title');

      // リストアイテム
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeGreaterThan(0);

      // 人気チップのaria-label
      const popularChip = screen.getByLabelText(/ビタミンDで検索（人気）/);
      expect(popularChip).toBeInTheDocument();
    });

    it('展開ボタンに適切なaria-expanded属性が設定されている', () => {
      const mockOnChipClick = vi.fn();
      render(
        <SuggestChips
          chips={defaultSuggestChips}
          onChipClick={mockOnChipClick}
          maxVisible={3}
        />
      );

      const expandButton = screen.getByRole('button', { name: /他.*件を表示/ });
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
      expect(expandButton).toHaveAttribute(
        'aria-controls',
        'suggest-chips-list'
      );
    });
  });

  describe('IngredientCard', () => {
    it('適切なARIA属性が設定されている', () => {
      const mockOnClick = vi.fn();
      render(
        <IngredientCard ingredient={mockIngredient} onClick={mockOnClick} />
      );

      // article要素
      const article = screen.getByRole('article');
      expect(article).toHaveAttribute(
        'aria-labelledby',
        'ingredient-name-test-ingredient-1'
      );
      expect(article).toHaveAttribute(
        'aria-describedby',
        'ingredient-description-test-ingredient-1'
      );
      expect(article).toHaveAttribute('tabIndex', '0');

      // 成分名のid
      const ingredientName = screen.getByText('ビタミンD');
      expect(ingredientName).toHaveAttribute(
        'id',
        'ingredient-name-test-ingredient-1'
      );

      // 説明文のid
      const description = screen.getByText('テスト用の説明文です。');
      expect(description).toHaveAttribute(
        'id',
        'ingredient-description-test-ingredient-1'
      );

      // エビデンス強度バッジ
      const evidenceBadge = screen.getByLabelText('エビデンス強度 Aランク');
      expect(evidenceBadge).toBeInTheDocument();

      // 効能リスト
      const benefitsList = screen.getByRole('list', { name: '効能一覧' });
      expect(benefitsList).toBeInTheDocument();

      // 人気度プログレスバー
      const popularityBar = screen.getByRole('progressbar', {
        name: '人気度 85%',
      });
      expect(popularityBar).toHaveAttribute('aria-valuenow', '85');
      expect(popularityBar).toHaveAttribute('aria-valuemin', '0');
      expect(popularityBar).toHaveAttribute('aria-valuemax', '100');

      // CTAボタン
      const ctaButton = screen.getByLabelText('ビタミンDの詳細を見る');
      expect(ctaButton).toBeInTheDocument();
    });
  });

  describe('SectionHeader', () => {
    it('適切なARIA属性が設定されている', () => {
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

      // サブタイトル
      const subtitle = screen.getByLabelText('セクションカテゴリ');
      expect(subtitle).toBeInTheDocument();

      // メインタイトル
      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toHaveAttribute('id', 'section-テストセクション');

      // 説明文
      const description = screen.getByText('テスト用の説明文');
      expect(description).toHaveAttribute(
        'aria-describedby',
        'section-テストセクション'
      );
    });
  });
});
