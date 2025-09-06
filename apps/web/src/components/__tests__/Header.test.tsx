import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Header } from '../Header';
import { LocaleProvider } from '@/contexts/LocaleContext';

// Next.js Link のモック
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Next.js navigation のモック
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
}));

// テスト用のラッパーコンポーネント
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <LocaleProvider>{children}</LocaleProvider>
);

describe('Header Component', () => {
  test('ロゴが正しく表示される', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    // サプティア + Suptiaロゴの表示確認
    expect(screen.getByText('サプティア')).toBeInTheDocument();
    expect(screen.getByText('Suptia')).toBeInTheDocument();

    // ロゴのアイコン（S）が表示されることを確認
    expect(screen.getByText('S')).toBeInTheDocument();

    // ロゴがリンクとして機能することを確認
    const logoLink = screen.getByLabelText('サプティア ホーム');
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/');
  });

  test('ロゴクリック時のホームページ遷移確認', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    // ロゴリンクが正しいhref属性を持つことを確認
    const logoLink = screen.getByLabelText('サプティア ホーム');
    expect(logoLink).toHaveAttribute('href', '/');

    // ロゴがクリック可能であることを確認
    fireEvent.click(logoLink);
    // 実際のナビゲーションはNext.jsのルーターが処理するため、
    // ここではhref属性の確認のみ行う
  });

  test('ナビゲーションメニューが機能する', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    // 各メニュー項目のクリック動作確認
    expect(screen.getByText('ホーム')).toBeInTheDocument();
    expect(screen.getByText('サプティアとは')).toBeInTheDocument();
    expect(screen.getByText('成分ガイド')).toBeInTheDocument();
    expect(screen.getByText('人気比較')).toBeInTheDocument();
    expect(screen.getByText('マイページ')).toBeInTheDocument();

    // 各リンクが正しいhref属性を持つことを確認
    expect(screen.getByRole('link', { name: 'ホーム' })).toHaveAttribute(
      'href',
      '/'
    );
    expect(
      screen.getByRole('link', { name: 'サプティアとは' })
    ).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: '成分ガイド' })).toHaveAttribute(
      'href',
      '/ingredients'
    );
    expect(screen.getByRole('link', { name: '人気比較' })).toHaveAttribute(
      'href',
      '/compare'
    );
    expect(screen.getByRole('link', { name: 'マイページ' })).toHaveAttribute(
      'href',
      '/mypage'
    );
  });

  test('言語・通貨切替が動作する', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    // 言語・通貨切替ボタンが表示されることを確認
    const languageButton = screen.getByLabelText('言語・通貨切替');
    expect(languageButton).toBeInTheDocument();

    // ボタンをクリックしてドロップダウンを開く
    fireEvent.click(languageButton);

    // ドロップダウンメニューが表示されることを確認
    expect(screen.getByText('言語・通貨')).toBeInTheDocument();
    expect(screen.getAllByText('日本語')).toHaveLength(2); // ボタンとドロップダウンの両方
    expect(screen.getByText('English')).toBeInTheDocument();

    // 通貨表示の確認
    expect(screen.getByText('¥ JPY')).toBeInTheDocument();
    expect(screen.getByText('$ USD')).toBeInTheDocument();
  });

  test('モバイルメニューが機能する', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    // モバイルメニューボタンが表示されることを確認
    const mobileMenuButton = screen.getByLabelText('メニューを開く');
    expect(mobileMenuButton).toBeInTheDocument();

    // モバイルメニューボタンをクリック
    fireEvent.click(mobileMenuButton);

    // モバイルナビゲーションが表示されることを確認
    const mobileNav = screen.getByLabelText('モバイルナビゲーション');
    expect(mobileNav).toBeInTheDocument();
  });

  test('レスポンシブデザインが適用される', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    // ヘッダーが固定位置に配置されることを確認
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('fixed', 'top-0', 'left-0', 'right-0');

    // デスクトップナビゲーションが適切なクラスを持つことを確認
    const desktopNav = screen.getByLabelText('メインナビゲーション');
    expect(desktopNav).toHaveClass('hidden', 'lg:flex');
  });

  test('アクセシビリティ属性が適切に設定される', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    // ヘッダーがbanner roleを持つことを確認
    expect(screen.getByRole('banner')).toBeInTheDocument();

    // ナビゲーションが適切なaria-labelを持つことを確認
    expect(screen.getByLabelText('メインナビゲーション')).toBeInTheDocument();

    // ロゴが適切なaria-labelを持つことを確認
    expect(screen.getByLabelText('サプティア ホーム')).toBeInTheDocument();

    // 言語切替ボタンが適切なaria-labelを持つことを確認
    expect(screen.getByLabelText('言語・通貨切替')).toBeInTheDocument();
  });
});
