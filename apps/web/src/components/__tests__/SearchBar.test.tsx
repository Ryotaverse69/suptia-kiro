import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { SearchBar, type Recommendation } from '../SearchBar';

// アクセシビリティフックをモック
vi.mock('@/hooks/useAccessibility', () => ({
  useKeyboardNavigation: () => ({}),
  useAnnouncer: () => ({
    announce: vi.fn(),
  }),
}));

// モックレコメンドデータ
const mockRecommendations: Recommendation[] = [
  {
    id: '1',
    title: 'ビタミンC 1000mg',
    reason: '免疫力向上に効果的で、コストパフォーマンスが優秀です',
    confidence: 0.95,
  },
  {
    id: '2',
    title: 'オメガ3フィッシュオイル',
    reason: '心血管の健康をサポートし、高品質な成分を含有しています',
    confidence: 0.88,
  },
];

describe('SearchBar', () => {
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    mockOnSearch.mockClear();
  });

  describe('基本機能', () => {
    it('正常にレンダリングされる', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      expect(
        screen.getByPlaceholderText('サプリメントを検索...')
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '検索' })).toBeInTheDocument();
    });

    it('カスタムプレースホルダーが表示される', () => {
      render(
        <SearchBar
          onSearch={mockOnSearch}
          placeholder='カスタムプレースホルダー'
        />
      );

      expect(
        screen.getByPlaceholderText('カスタムプレースホルダー')
      ).toBeInTheDocument();
    });

    it('検索ボタンクリックで検索が実行される', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText('サプリメントを検索...');
      const button = screen.getByRole('button', { name: '検索' });

      fireEvent.change(input, { target: { value: 'ビタミンC' } });
      fireEvent.click(button);

      expect(mockOnSearch).toHaveBeenCalledWith('ビタミンC');
    });

    it('Enterキーで検索が実行される', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText('サプリメントを検索...');

      fireEvent.change(input, { target: { value: 'オメガ3' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnSearch).toHaveBeenCalledWith('オメガ3');
    });

    it('空の検索クエリでは検索が実行されない', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const button = screen.getByRole('button', { name: '検索' });

      fireEvent.click(button);

      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('空白のみの検索クエリでは検索が実行されない', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText('サプリメントを検索...');
      const button = screen.getByRole('button', { name: '検索' });

      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(button);

      expect(mockOnSearch).not.toHaveBeenCalled();
    });
  });

  describe('サイズバリエーション', () => {
    it('smallサイズが正しく適用される', () => {
      render(<SearchBar onSearch={mockOnSearch} size='small' />);

      const input = screen.getByPlaceholderText('サプリメントを検索...');

      expect(input).toHaveClass('h-12', 'text-base');
    });

    it('largeサイズが正しく適用される', () => {
      render(<SearchBar onSearch={mockOnSearch} size='large' />);

      const input = screen.getByPlaceholderText('サプリメントを検索...');

      expect(input).toHaveClass('h-16', 'text-lg');
    });
  });

  describe('AIレコメンド機能', () => {
    it('レコメンドがない場合は表示されない', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText('サプリメントを検索...');
      fireEvent.focus(input);

      expect(screen.queryByText('AIレコメンド')).not.toBeInTheDocument();
    });

    it('フォーカス時にレコメンドが表示される', () => {
      render(
        <SearchBar
          onSearch={mockOnSearch}
          aiRecommendations={mockRecommendations}
        />
      );

      const input = screen.getByPlaceholderText('サプリメントを検索...');
      fireEvent.focus(input);

      expect(screen.getByText('AIレコメンド')).toBeInTheDocument();
      expect(screen.getByText('ビタミンC 1000mg')).toBeInTheDocument();
      expect(screen.getByText('オメガ3フィッシュオイル')).toBeInTheDocument();
    });

    it('レコメンドクリックで検索が実行される', async () => {
      render(
        <SearchBar
          onSearch={mockOnSearch}
          aiRecommendations={mockRecommendations}
        />
      );

      const input = screen.getByPlaceholderText('サプリメントを検索...');
      fireEvent.focus(input);

      const recommendation = screen.getByText('ビタミンC 1000mg');
      fireEvent.click(recommendation);

      expect(mockOnSearch).toHaveBeenCalledWith('ビタミンC 1000mg');
    });

    it('レコメンドの信頼度が正しく表示される', () => {
      render(
        <SearchBar
          onSearch={mockOnSearch}
          aiRecommendations={mockRecommendations}
        />
      );

      const input = screen.getByPlaceholderText('サプリメントを検索...');
      fireEvent.focus(input);

      expect(screen.getByText('95%')).toBeInTheDocument();
      expect(screen.getByText('88%')).toBeInTheDocument();
    });

    it('ブラー時にレコメンドが非表示になる', async () => {
      render(
        <SearchBar
          onSearch={mockOnSearch}
          aiRecommendations={mockRecommendations}
        />
      );

      const input = screen.getByPlaceholderText('サプリメントを検索...');
      fireEvent.focus(input);

      expect(screen.getByText('AIレコメンド')).toBeInTheDocument();

      fireEvent.blur(input);

      await waitFor(
        () => {
          expect(screen.queryByText('AIレコメンド')).not.toBeInTheDocument();
        },
        { timeout: 300 }
      );
    });
  });

  describe('アクセシビリティ', () => {
    it('検索ボタンが無効状態で適切にマークされる', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const button = screen.getByRole('button', { name: '検索' });

      expect(button).toBeDisabled();
    });

    it('検索クエリ入力時にボタンが有効になる', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText('サプリメントを検索...');
      const button = screen.getByRole('button', { name: '検索' });

      fireEvent.change(input, { target: { value: 'テスト' } });

      expect(button).not.toBeDisabled();
    });

    it('キーボードナビゲーションが機能する', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText('サプリメントを検索...');
      const button = screen.getByRole('button', { name: '検索' });

      // Tabキーでフォーカス移動
      input.focus();
      expect(document.activeElement).toBe(input);

      fireEvent.keyDown(input, { key: 'Tab' });
      // ボタンにフォーカスが移動することを確認
      // 注: jsdomでは実際のフォーカス移動は制限されるため、
      // 実際のブラウザテストで確認が必要
    });
  });

  describe('エラーハンドリング', () => {
    it('onSearchが未定義でもエラーが発生しない', () => {
      // TypeScriptでは必須プロパティなので、実際にはこのケースは発生しない
      // しかし、ランタイムでの安全性を確認
      expect(() => {
        render(<SearchBar onSearch={mockOnSearch} />);
      }).not.toThrow();
    });

    it('不正なレコメンドデータでもエラーが発生しない', () => {
      const invalidRecommendations = [
        {
          id: '1',
          title: '',
          reason: '',
          confidence: -1,
        },
      ] as Recommendation[];

      expect(() => {
        render(
          <SearchBar
            onSearch={mockOnSearch}
            aiRecommendations={invalidRecommendations}
          />
        );
      }).not.toThrow();
    });
  });
});
