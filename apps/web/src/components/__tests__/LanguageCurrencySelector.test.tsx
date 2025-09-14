import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageCurrencySelector } from '../LanguageCurrencySelector';
import { LocaleProvider } from '@/contexts/LocaleContext';

// LocaleProviderでラップしたテストコンポーネント
const TestComponent = () => (
  <LocaleProvider>
    <LanguageCurrencySelector />
  </LocaleProvider>
);

describe('LanguageCurrencySelector', () => {
  beforeEach(() => {
    // LocalStorageをクリア
    localStorage.clear();
  });

  it('デフォルトで日本語/JPYが表示される', () => {
    render(<TestComponent />);

    const button = screen.getByRole('button', { name: '言語・通貨切替' });
    expect(button).toHaveTextContent('日本語 / JPY ¥');
  });

  it('ドロップダウンが開閉する', async () => {
    render(<TestComponent />);

    const button = screen.getByRole('button', { name: '言語・通貨切替' });

    // ドロップダウンを開く
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByText('日本語')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
    });
  });

  it('言語・通貨切替が正しく動作する', async () => {
    render(<TestComponent />);

    const button = screen.getByRole('button', { name: '言語・通貨切替' });

    // ドロップダウンを開く
    fireEvent.click(button);

    // Englishを選択
    const englishOption = screen.getByRole('menuitem', { name: /English/ });
    fireEvent.click(englishOption);

    await waitFor(() => {
      expect(button).toHaveTextContent('English / USD $');
    });
  });

  it('Escapeキーでドロップダウンが閉じる', async () => {
    render(<TestComponent />);

    const button = screen.getByRole('button', { name: '言語・通貨切替' });

    // ドロップダウンを開く
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    // Escapeキーを押す
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('外部クリックでドロップダウンが閉じる', async () => {
    render(
      <div>
        <TestComponent />
        <div data-testid='outside'>Outside element</div>
      </div>
    );

    const button = screen.getByRole('button', { name: '言語・通貨切替' });

    // ドロップダウンを開く
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    // 外部要素をクリック
    fireEvent.mouseDown(screen.getByTestId('outside'));

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('選択された言語・通貨がハイライトされる', async () => {
    render(<TestComponent />);

    const button = screen.getByRole('button', { name: '言語・通貨切替' });

    // ドロップダウンを開く
    fireEvent.click(button);

    await waitFor(() => {
      const japaneseOption = screen.getByRole('menuitem', { name: /日本語/ });
      expect(japaneseOption).toHaveClass('text-blue-600', 'bg-blue-50/50');
    });
  });
});
