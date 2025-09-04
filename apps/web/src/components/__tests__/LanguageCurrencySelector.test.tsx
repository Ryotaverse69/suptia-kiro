import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LanguageCurrencySelector from '../LanguageCurrencySelector';
import { LocaleProvider } from '@/contexts/LocaleContext';

// Next.js router のモック
const mockPush = vi.fn();
const mockPathname = '/';

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
    usePathname: () => mockPathname,
}));

// LocalStorage のモック
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

const renderWithProvider = (component: React.ReactElement) => {
    return render(
        <LocaleProvider initialLocale="ja">
            {component}
        </LocaleProvider>
    );
};

describe('LanguageCurrencySelector', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
    });

    it('should render language and currency selector button', () => {
        renderWithProvider(<LanguageCurrencySelector />);

        const button = screen.getByRole('button', { name: /言語・通貨設定/ });
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent('日本語');
        expect(button).toHaveTextContent('¥');
    });

    it('should open dropdown menu when button is clicked', async () => {
        renderWithProvider(<LanguageCurrencySelector />);

        const button = screen.getByRole('button', { name: /言語・通貨設定/ });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('言語 / Language')).toBeInTheDocument();
            expect(screen.getByText('通貨 / Currency')).toBeInTheDocument();
        });
    });

    it('should display language options in dropdown', async () => {
        renderWithProvider(<LanguageCurrencySelector />);

        const button = screen.getByRole('button', { name: /言語・通貨設定/ });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByRole('menuitem', { name: /日本語/ })).toBeInTheDocument();
            expect(screen.getByRole('menuitem', { name: /English/ })).toBeInTheDocument();
        });
    });

    it('should display currency options in dropdown', async () => {
        renderWithProvider(<LanguageCurrencySelector />);

        const button = screen.getByRole('button', { name: /言語・通貨設定/ });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getAllByText('¥')).toHaveLength(2); // ボタン内とドロップダウン内
            expect(screen.getByText('円')).toBeInTheDocument();
            expect(screen.getByText('$')).toBeInTheDocument();
            expect(screen.getByText('Dollar')).toBeInTheDocument();
        });
    });

    it('should show current locale as selected', async () => {
        renderWithProvider(<LanguageCurrencySelector />);

        const button = screen.getByRole('button', { name: /言語・通貨設定/ });
        fireEvent.click(button);

        await waitFor(() => {
            const japaneseOption = screen.getByRole('menuitem', { name: /日本語/ });
            expect(japaneseOption).toHaveClass('bg-primary-50', 'text-primary-700');
        });
    });

    it('should change language when language option is clicked', async () => {
        renderWithProvider(<LanguageCurrencySelector />);

        const button = screen.getByRole('button', { name: /言語・通貨設定/ });
        fireEvent.click(button);

        await waitFor(() => {
            const englishOption = screen.getByRole('menuitem', { name: /English/ });
            fireEvent.click(englishOption);
        });

        expect(localStorageMock.setItem).toHaveBeenCalledWith('suptia-locale', 'en');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('suptia-currency', 'USD');
        expect(mockPush).toHaveBeenCalled();
    });

    it('should change currency when currency option is clicked', async () => {
        renderWithProvider(<LanguageCurrencySelector />);

        const button = screen.getByRole('button', { name: /言語・通貨設定/ });
        fireEvent.click(button);

        await waitFor(() => {
            const dollarOption = screen.getByRole('menuitem', { name: /\$ Dollar/ });
            fireEvent.click(dollarOption);
        });

        expect(localStorageMock.setItem).toHaveBeenCalledWith('suptia-currency', 'USD');
    });

    it('should close dropdown when overlay is clicked', async () => {
        renderWithProvider(<LanguageCurrencySelector />);

        const button = screen.getByRole('button', { name: /言語・通貨設定/ });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('言語 / Language')).toBeInTheDocument();
        });

        // オーバーレイをクリック
        const overlay = document.querySelector('.fixed.inset-0');
        expect(overlay).toBeInTheDocument();
        fireEvent.click(overlay!);

        await waitFor(() => {
            expect(screen.queryByText('言語 / Language')).not.toBeInTheDocument();
        });
    });

    it('should have proper ARIA attributes', () => {
        renderWithProvider(<LanguageCurrencySelector />);

        const button = screen.getByRole('button', { name: /言語・通貨設定/ });
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(button).toHaveAttribute('aria-haspopup', 'true');
        expect(button).toHaveAttribute('aria-label', '言語・通貨設定');
    });

    it('should update ARIA expanded state when dropdown is opened', async () => {
        renderWithProvider(<LanguageCurrencySelector />);

        const button = screen.getByRole('button', { name: /言語・通貨設定/ });
        fireEvent.click(button);

        await waitFor(() => {
            expect(button).toHaveAttribute('aria-expanded', 'true');
        });
    });

    it('should apply custom className', () => {
        const customClass = 'custom-test-class';
        renderWithProvider(<LanguageCurrencySelector className={customClass} />);

        const container = document.querySelector(`.${customClass}`);
        expect(container).toBeInTheDocument();
    });

    it('should handle keyboard navigation', async () => {
        renderWithProvider(<LanguageCurrencySelector />);

        const button = screen.getByRole('button', { name: /言語・通貨設定/ });

        // フォーカスを当てる
        button.focus();
        expect(button).toHaveFocus();

        // クリックでドロップダウンを開く
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('言語 / Language')).toBeInTheDocument();
        });
    });
});