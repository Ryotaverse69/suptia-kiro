import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HeroSearch from '../HeroSearch';

// LocaleContextのモック
vi.mock('@/contexts/LocaleContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'home.cta.titleLine1': 'あなたに最も合う',
        'home.cta.titleEmphasis': 'サプリメント',
        'header.tagline': 'AIが分析する、あなただけの最適解',
        'search.placeholder': 'サプリメントを検索（例：ビタミンD、疲労回復、美容）',
        'common.search': '検索',
        'search.aiRecommendation': 'AIサジェスト',
        'ingredients.categories': '人気のカテゴリ',
      };
      return translations[key] || key;
    },
  }),
  useLocale: () => ({
    locale: 'ja',
  }),
}));

describe('HeroSearch', () => {
  it('renders hero text correctly', () => {
    render(<HeroSearch />);

    expect(screen.getByText(/あなたに最も合う/)).toBeInTheDocument();
    expect(screen.getByText('サプリメント')).toBeInTheDocument();
    expect(
      screen.getByText('AIが分析する、あなただけの最適解')
    ).toBeInTheDocument();
  });

  it('renders search input with correct placeholder', () => {
    render(<HeroSearch />);

    const searchInput = screen.getByPlaceholderText(
      'サプリメントを検索（例：ビタミンD、疲労回復、美容）'
    );
    expect(searchInput).toBeInTheDocument();
  });

  it('renders search button', () => {
    render(<HeroSearch />);

    const searchButton = screen.getByRole('button', { name: '検索' });
    expect(searchButton).toBeInTheDocument();
  });

  it('renders popular category chips', () => {
    render(<HeroSearch />);

    expect(screen.getAllByText('人気のカテゴリ')[0]).toBeInTheDocument();
    expect(screen.getByText('ビタミンD')).toBeInTheDocument();
    expect(screen.getByText('疲労回復')).toBeInTheDocument();
    expect(screen.getByText('美容')).toBeInTheDocument();
    // maxVisible=3なので最初の3つのみ表示される
    expect(screen.queryByText('免疫力')).not.toBeInTheDocument();
  });

  it('calls onSearch when search is performed', async () => {
    const mockOnSearch = vi.fn();
    render(<HeroSearch onSearch={mockOnSearch} />);

    const searchInput = screen.getByPlaceholderText(
      'サプリメントを検索（例：ビタミンD、疲労回復、美容）'
    );
    const searchButton = screen.getByRole('button', { name: '検索' });

    fireEvent.change(searchInput, { target: { value: 'ビタミンD' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('ビタミンD');
    });
  });

  it('calls onSearch when chip is clicked', async () => {
    const mockOnSearch = vi.fn();
    render(<HeroSearch onSearch={mockOnSearch} />);

    const vitaminDChip = screen.getByText('ビタミンD');
    fireEvent.click(vitaminDChip);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('ビタミンD');
    });
  });

  it('shows enhanced AI suggestions when input is focused', async () => {
    render(<HeroSearch />);

    const searchInput = screen.getByRole('combobox');
    fireEvent.focus(searchInput);

    await waitFor(() => {
      expect(screen.getByText('AIサジェスト')).toBeInTheDocument();
      expect(
        screen.getByText('疲労回復に効果的なビタミンB群を探す')
      ).toBeInTheDocument();
      expect(
        screen.getByText('美容効果の高いコラーゲンサプリを比較')
      ).toBeInTheDocument();
      expect(
        screen.getByText('マグネシウム不足による睡眠の質改善')
      ).toBeInTheDocument();
      // 信頼度スコアの表示確認
      expect(screen.getByText('94%')).toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', () => {
    render(<HeroSearch />);

    const searchInput = screen.getByRole('combobox');
    expect(searchInput).toHaveAttribute('aria-label', 'サプリメントを検索（例：ビタミンD、疲労回復、美容）');
    expect(searchInput).toHaveAttribute('aria-expanded', 'false');
    expect(searchInput).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('applies correct CSS classes for Apple-style design', () => {
    render(<HeroSearch />);

    const section = document.querySelector('section');
    expect(section).toHaveClass(
      'min-h-screen',
      'bg-white',
      'flex',
      'flex-col',
      'justify-center',
      'items-center'
    );

    const searchInput = screen.getByRole('combobox');
    expect(searchInput).toHaveClass(
      'rounded-2xl',
      'bg-gray-50/80',
      'border-2'
    );
  });

  it('displays AI suggestion confidence scores', async () => {
    render(<HeroSearch />);

    const searchInput = screen.getByRole('combobox');
    fireEvent.focus(searchInput);

    await waitFor(() => {
      // 信頼度スコアが表示されることを確認
      expect(screen.getByText('94%')).toBeInTheDocument();
      expect(screen.getByText('91%')).toBeInTheDocument();
      expect(screen.getByText('88%')).toBeInTheDocument();
    });
  });

  it('shows different suggestion types with visual indicators', async () => {
    render(<HeroSearch />);

    const searchInput = screen.getByRole('combobox');
    fireEvent.focus(searchInput);

    await waitFor(() => {
      // 異なるタイプのサジェストが表示されることを確認
      expect(
        screen.getByText('疲労回復に効果的なビタミンB群を探す')
      ).toBeInTheDocument(); // purpose
      expect(
        screen.getByText('マグネシウム不足による睡眠の質改善')
      ).toBeInTheDocument(); // ingredient
      expect(
        screen.getByText('オメガ3脂肪酸で心血管健康をサポート')
      ).toBeInTheDocument(); // condition
    });
  });
});
