/**
 * Headerコンポーネントのユニットテスト
 * ハンバーガーメニューの動作を含む
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { Header } from '../Header';
import { LocaleProvider } from '@/contexts/LocaleContext';

// Next.js router のモック
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

// SkipLinks のモック
vi.mock('../SkipLinks', () => ({
  useFocusManagement: () => ({
    trapFocus: vi.fn(() => vi.fn()),
    restoreFocus: vi.fn(),
  }),
}));

const mockUsePathname = vi.mocked(await import('next/navigation')).usePathname;

const renderHeader = () => {
  return render(
    <LocaleProvider>
      <Header />
    </LocaleProvider>
  );
};

describe('Header', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
    // スクロールイベントのモック
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  describe('基本表示', () => {
    test('ヘッダーが正常に表示される', () => {
      renderHeader();

      // ロゴが表示される（より具体的なセレクタを使用）
      const logoLink = screen.getByLabelText(/サプティア.*ホーム/);
      expect(logoLink).toBeInTheDocument();
      expect(logoLink).toHaveTextContent('サプティア');
      expect(logoLink).toHaveTextContent('Suptia');

      // ナビゲーションリンクが表示される（デスクトップ）
      expect(screen.getByText('比較')).toBeInTheDocument();
      expect(screen.getByText('成分ガイド')).toBeInTheDocument();
      expect(screen.getByText('サプティアとは')).toBeInTheDocument();
    });

    test('検索ボタンが表示される', () => {
      renderHeader();

      const searchLink = screen.getByRole('link', { name: '検索ページへ移動' });
      expect(searchLink).toBeInTheDocument();
    });
  });

  describe('ハンバーガーメニュー', () => {
    test('ハンバーガーメニューボタンが表示される', () => {
      renderHeader();

      const menuButton = screen.getByLabelText('メニューを開く');
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu');
    });

    test('初期状態ではモバイルメニューが非表示', () => {
      renderHeader();

      const mobileMenu = screen.queryByRole('navigation', {
        name: 'モバイルナビゲーション',
      });
      expect(mobileMenu).not.toBeInTheDocument();
    });

    test('ハンバーガーメニューボタンをクリックするとメニューが開く', async () => {
      renderHeader();

      const menuButton = screen.getByLabelText('メニューを開く');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(menuButton).toHaveAttribute('aria-expanded', 'true');
        expect(menuButton).toHaveAttribute('aria-label', 'メニューを閉じる');
      });

      // モバイルメニューが表示される
      const mobileMenu = screen.getByRole('navigation', {
        name: 'モバイルナビゲーション',
      });
      expect(mobileMenu).toBeInTheDocument();

      // body のスクロールが無効になる
      expect(document.body.style.overflow).toBe('hidden');
    });

    test('メニューが開いている状態でボタンをクリックするとメニューが閉じる', async () => {
      renderHeader();

      const menuButton = screen.getByLabelText('メニューを開く');

      // メニューを開く
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      });

      // メニューを閉じる
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(menuButton).toHaveAttribute('aria-expanded', 'false');
        expect(menuButton).toHaveAttribute('aria-label', 'メニューを開く');
      });

      // モバイルメニューが非表示になる
      const mobileMenu = screen.queryByRole('navigation', {
        name: 'モバイルナビゲーション',
      });
      expect(mobileMenu).not.toBeInTheDocument();

      // body のスクロールが復元される
      expect(document.body.style.overflow).toBe('');
    });

    test('Escapeキーでメニューが閉じる', async () => {
      renderHeader();

      const menuButton = screen.getByLabelText('メニューを開く');

      // メニューを開く
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      });

      // Escapeキーを押す
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      });

      // モバイルメニューが非表示になる
      const mobileMenu = screen.queryByRole('navigation', {
        name: 'モバイルナビゲーション',
      });
      expect(mobileMenu).not.toBeInTheDocument();
    });

    test('オーバーレイをクリックするとメニューが閉じる', async () => {
      renderHeader();

      const menuButton = screen.getByLabelText('メニューを開く');

      // メニューを開く
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      });

      // オーバーレイをクリック
      const overlay = document.querySelector('.fixed.inset-0.z-40');
      expect(overlay).toBeInTheDocument();
      fireEvent.click(overlay!);

      await waitFor(() => {
        expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      });
    });

    test('モバイルメニュー内のリンクをクリックするとメニューが閉じる', async () => {
      renderHeader();

      const menuButton = screen.getByLabelText('メニューを開く');

      // メニューを開く
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      });

      // モバイルメニュー内のリンクをクリック
      const mobileMenu = screen.getByRole('navigation', {
        name: 'モバイルナビゲーション',
      });
      const compareLink = mobileMenu.querySelector('a[href="/compare"]');
      expect(compareLink).toBeInTheDocument();
      compareLink?.addEventListener('click', event => event.preventDefault());
      fireEvent.click(compareLink!);

      await waitFor(() => {
        expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  describe('アクセシビリティ', () => {
    test('適切なARIA属性が設定されている', () => {
      renderHeader();

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();

      const mainNav = screen.getByRole('navigation', {
        name: '主要ナビゲーション',
      });
      expect(mainNav).toBeInTheDocument();

      const menuButton = screen.getByLabelText('メニューを開く');
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu');
    });

    test('ロゴリンクに適切なaria-labelが設定されている', () => {
      renderHeader();

      const logoLink = screen.getByLabelText(/サプティア.*ホーム/);
      expect(logoLink).toBeInTheDocument();
      expect(logoLink).toHaveAttribute('href', '/');
    });
  });

  describe('スクロール効果', () => {
    test('スクロール時にヘッダーの背景が変化する', async () => {
      renderHeader();

      const header = screen.getByRole('banner');

      // 初期状態
      expect(header).toHaveClass('bg-white/65');

      // スクロールをシミュレート
      Object.defineProperty(window, 'scrollY', {
        value: 24,
        writable: true,
      });

      fireEvent.scroll(window);

      await waitFor(() => {
        expect(header).toHaveClass('bg-white/95');
        expect(header.className).toContain('shadow-');
      });
    });
  });

  describe('アクティブリンクのハイライト', () => {
    test('現在のページのナビゲーションリンクがハイライトされる', () => {
      mockUsePathname.mockReturnValue('/compare');
      renderHeader();

      const compareLink = screen.getByText('比較');
      expect(compareLink).toHaveClass('text-primary-600');
    });

    test('成分ガイドページでのハイライト', () => {
      mockUsePathname.mockReturnValue('/ingredients/vitamin-d');
      renderHeader();

      const ingredientsLink = screen.getByText('成分ガイド');
      expect(ingredientsLink).toHaveClass('text-primary-600');
    });
  });
});
