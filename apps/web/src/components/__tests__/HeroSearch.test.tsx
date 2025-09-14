import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HeroSearch from '../HeroSearch';

// LocaleContextのモック
vi.mock('@/contexts/LocaleContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('HeroSearch', () => {
  it('renders hero text correctly', () => {
    render(<HeroSearch />);

    expect(screen.getByText(/あなたに最も合う/)).toBeInTheDocument();
    expect(screen.getByText('サプリメント')).toBeInTheDocument();
    expect(screen.getByText('最も安い価格で。')).toBeInTheDocument();
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

    expect(screen.getByText('人気のカテゴリ')).toBeInTheDocument();
    expect(screen.getByText('ビタミンD')).toBeInTheDocument();
    expect(screen.getByText('疲労回復')).toBeInTheDocument();
    expect(screen.getByText('美容')).toBeInTheDocument();
    expect(screen.getByText('免疫力')).toBeInTheDocument();
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

  it('shows AI suggestions when input is focused', async () => {
    render(<HeroSearch />);

    const searchInput = screen.getByPlaceholderText(
      'サプリメントを検索（例：ビタミンD、疲労回復、美容）'
    );
    fireEvent.focus(searchInput);

    await waitFor(() => {
      expect(screen.getByText('AIサジェスト')).toBeInTheDocument();
      expect(
        screen.getByText('疲労回復に効果的なビタミンB群を探す')
      ).toBeInTheDocument();
      expect(
        screen.getByText('美容効果の高いコラーゲンサプリを比較')
      ).toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', () => {
    render(<HeroSearch />);

    const searchInput = screen.getByRole('combobox');
    expect(searchInput).toHaveAttribute('aria-label', 'サプリメント検索');
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

    const searchInput = screen.getByPlaceholderText(
      'サプリメントを検索（例：ビタミンD、疲労回復、美容）'
    );
    expect(searchInput).toHaveClass(
      'rounded-2xl',
      'bg-gray-50/80',
      'border-2',
      'border-transparent'
    );
  });
});
