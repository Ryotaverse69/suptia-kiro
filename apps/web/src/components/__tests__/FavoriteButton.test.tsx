import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FavoriteButton } from '../FavoriteButton';

// LocalStorage のモック
const mockLocalStorage = (() => {
    let store: Record<string, string> = {};

    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
});

describe('FavoriteButton', () => {
    const mockProps = {
        productId: 'test-product-1',
        productName: 'テスト商品',
    };

    beforeEach(() => {
        mockLocalStorage.clear();
    });

    it('初期状態では「お気に入りに追加」が表示される', async () => {
        render(<FavoriteButton {...mockProps} />);

        await waitFor(() => {
            expect(screen.getByText('お気に入りに追加')).toBeInTheDocument();
        });
    });

    it('お気に入りに追加できる', async () => {
        render(<FavoriteButton {...mockProps} />);

        await waitFor(() => {
            expect(screen.getByText('お気に入りに追加')).toBeInTheDocument();
        });

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('お気に入り済み')).toBeInTheDocument();
        });

        // ローカルストレージに保存されているか確認
        const favorites = JSON.parse(mockLocalStorage.getItem('suptia-favorites') || '[]');
        expect(favorites).toContain('test-product-1');
    });

    it('お気に入りから削除できる', async () => {
        // 事前にお気に入りに追加
        mockLocalStorage.setItem('suptia-favorites', JSON.stringify(['test-product-1']));

        render(<FavoriteButton {...mockProps} />);

        await waitFor(() => {
            expect(screen.getByText('お気に入り済み')).toBeInTheDocument();
        });

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('お気に入りに追加')).toBeInTheDocument();
        });

        // ローカルストレージから削除されているか確認
        const favorites = JSON.parse(mockLocalStorage.getItem('suptia-favorites') || '[]');
        expect(favorites).not.toContain('test-product-1');
    });

    it('既存のお気に入り状態を正しく読み込む', async () => {
        // 事前にお気に入りに追加
        mockLocalStorage.setItem('suptia-favorites', JSON.stringify(['test-product-1']));

        render(<FavoriteButton {...mockProps} />);

        await waitFor(() => {
            expect(screen.getByText('お気に入り済み')).toBeInTheDocument();
        });
    });

    it('商品詳細情報も保存される', async () => {
        render(<FavoriteButton {...mockProps} />);

        await waitFor(() => {
            expect(screen.getByText('お気に入りに追加')).toBeInTheDocument();
        });

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('お気に入り済み')).toBeInTheDocument();
        });

        // 商品詳細情報が保存されているか確認
        const favoriteDetails = JSON.parse(mockLocalStorage.getItem('suptia-favorite-details') || '{}');
        expect(favoriteDetails['test-product-1']).toBeDefined();
        expect(favoriteDetails['test-product-1'].name).toBe('テスト商品');
        expect(favoriteDetails['test-product-1'].addedAt).toBeDefined();
    });

    it('ローカルストレージエラー時も正常に動作する', async () => {
        // getItem でエラーを発生させる
        const originalGetItem = mockLocalStorage.getItem;
        mockLocalStorage.getItem = () => {
            throw new Error('LocalStorage error');
        };

        render(<FavoriteButton {...mockProps} />);

        await waitFor(() => {
            expect(screen.getByText('お気に入りに追加')).toBeInTheDocument();
        });

        // 元に戻す
        mockLocalStorage.getItem = originalGetItem;
    });

    it('適切なaria-labelが設定される', async () => {
        render(<FavoriteButton {...mockProps} />);

        await waitFor(() => {
            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('aria-label', 'お気に入りに追加');
        });

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(button).toHaveAttribute('aria-label', 'お気に入りから削除');
        });
    });

    it('カスタムクラス名が適用される', async () => {
        render(<FavoriteButton {...mockProps} className="custom-class" />);

        await waitFor(() => {
            const button = screen.getByRole('button');
            expect(button).toHaveClass('custom-class');
        });
    });
});