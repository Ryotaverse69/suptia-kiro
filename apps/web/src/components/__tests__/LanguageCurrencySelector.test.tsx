import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageCurrencySelector } from '../LanguageCurrencySelector';
import { LocaleProvider } from '@/contexts/LocaleContext';

// LocaleProviderでラップするヘルパー関数
const renderWithLocaleProvider = (component: React.ReactElement) => {
  return render(
    <LocaleProvider>
      {component}
    </LocaleProvider>
  );
};

describe('LanguageCurrencySelector', () => {
  it('初期状態で日本語/JPYが表示される', () => {
    renderWithLocaleProvider(<LanguageCurrencySelector />);

    const button = screen.getByRole('button', { name: /言語・通貨切替/ });
    expect(button).toHaveTextContent('日本語 / JPY ¥');
  });

  it('ボタンクリックでドロップダウンが開く', async () => {
    renderWithLocaleProvider(<LanguageCurrencySelector />);

    const button = screen.getByRole('button', { name: /言語・通貨切替/ });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByText('日本語')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
    });
  });

  it('英語/USDを選択すると表示が切り替わる', async () => {
    renderWithLocaleProvider(<LanguageCurrencySelector />);

    const button = screen.getByRole('button', { name: /言語・通貨切替/ });
    fireEvent.click(button);

    await waitFor(() => {
      const englishOption = screen.getByRole('menuitem', { name: /English/ });
      fireEvent.click(englishOption);
    });

    await waitFor(() => {
      expect(button).toHaveTextContent('English / USD $');
    });
  });

  it('日本語/JPYを選択すると表示が切り替わる', async () => {
    renderWithLocaleProvider(<LanguageCurrencySelector />);

    const button = screen.getByRole('button', { name: /言語・通貨切替/ });
    fireEvent.click(button);

    // まず英語に切り替え
    await waitFor(() => {
      const englishOption = screen.getByRole('menuitem', { name: /English/ });
      fireEvent.click(englishOption);
    });

    // 再度ドロップダウンを開いて日本語に戻す
    fireEvent.click(button);
    await waitFor(() => {
      const japaneseOption = screen.getByRole('menuitem', { name: /日本語/ });
      fireEvent.click(japaneseOption);
    });

    await waitFor(() => {
      expect(button).toHaveTextContent('日本語 / JPY ¥');
    });
  });

  it('Escapeキーでドロップダウンが閉じる', async () => {
    renderWithLocaleProvider(<LanguageCurrencySelector />);

    const button = screen.getByRole('button', { name: /言語・通貨切替/ });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('外部クリックでドロップダウンが閉じる', async () => {
    renderWithLocaleProvider(<LanguageCurrencySelector />);

    const button = screen.getByRole('button', { name: /言語・通貨切替/ });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });
});