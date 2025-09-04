import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { FavoritesList } from '../FavoritesList';
import * as favoritesLib from '../../lib/favorites';

// favorites ライブラリをモック
vi.mock('../../lib/favorites', () => ({
    getFavoriteProducts: vi.fn(),
    getFavoriteCategories: vi.fn(),
    getUncategorizedFavorites: vi.fn(),
    getFavoriteProductsByCategory: vi.fn(),
    removeFromFavorites: vi.fn(),
    createFavoriteCategory: vi.fn(),
    deleteFavoriteCategory: vi.fn(),
    addProductToCategory: vi.fn(),
    removeProductFromCategory: vi.fn(),
}));

const mockFavoritesLib = favoritesLib as any;

describe('FavoritesList', () => {
    const mockProducts = [
        {
            id: 'product-1',
            name: 'ビタミンC 1000mg',
            brand: 'ヘルスブランド',
            category: 'ビタミン',
            price: 1500,
            currency: 'JPY',
            addedAt: '2024-01-15T10:00:00.000Z',
        },
        {
            id: 'product-2',
            name: 'マグネシウム サプリ',
            brand: 'ミネラル社',
            category: 'ミネラル',
            price: 2000,
            currency: 'JPY',
            addedAt: '2024-01-14T10:00:00.000Z',
        },
    ];

    const mockCategories = [
        {
            id: 'category-1',
            name: '健康維持',
            productIds: ['product-1'],
        },
        {
            id: 'category-2',
            name: '美容',
            productIds: [],
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockFavoritesLib.getFavoriteProducts.mockReturnValue(mockProducts);
        mockFavoritesLib.getFavoriteCategories.mockReturnValue(mockCategories);
        mockFavoritesLib.getUncategorizedFavorites.mockReturnValue([mockProducts[1]]);
        mockFavoritesLib.getFavoriteProductsByCategory.mockReturnValue([mockProducts[0]]);
    });

    test('お気に入り商品一覧が表示される', async () => {
        render(<FavoritesList />);

        await waitFor(() => {
            expect(screen.getByText('ビタミンC 1000mg')).toBeInTheDocument();
            expect(screen.getByText('マグネシウム サプリ')).toBeInTheDocument();
        });

        expect(screen.getByText('ヘルスブランド')).toBeInTheDocument();
        expect(screen.getByText('ミネラル社')).toBeInTheDocument();
        expect(screen.getByText('¥1,500')).toBeInTheDocument();
        expect(screen.getByText('¥2,000')).toBeInTheDocument();
    });

    test('カテゴリが表示される', async () => {
        render(<FavoritesList />);

        await waitFor(() => {
            expect(screen.getByText('すべて (2)')).toBeInTheDocument();
            expect(screen.getByText('未分類 (1)')).toBeInTheDocument();
            expect(screen.getByText('健康維持 (1)')).toBeInTheDocument();
            expect(screen.getByText('美容 (0)')).toBeInTheDocument();
        });
    });

    test('カテゴリを選択すると該当商品のみ表示される', async () => {
        render(<FavoritesList />);

        await waitFor(() => {
            expect(screen.getByText('健康維持 (1)')).toBeInTheDocument();
        });

        // 健康維持カテゴリを選択
        fireEvent.click(screen.getByText('健康維持 (1)'));

        expect(mockFavoritesLib.getFavoriteProductsByCategory).toHaveBeenCalledWith('category-1');
    });

    test('新しいカテゴリを作成できる', async () => {
        mockFavoritesLib.createFavoriteCategory.mockReturnValue({
            id: 'new-category',
            name: '新カテゴリ',
            productIds: [],
        });

        render(<FavoritesList />);

        await waitFor(() => {
            expect(screen.getByText('新しいカテゴリ')).toBeInTheDocument();
        });

        // 新しいカテゴリボタンをクリック
        fireEvent.click(screen.getByText('新しいカテゴリ'));

        // フォームが表示される
        expect(screen.getByPlaceholderText('カテゴリ名を入力')).toBeInTheDocument();

        // カテゴリ名を入力
        const input = screen.getByPlaceholderText('カテゴリ名を入力');
        fireEvent.change(input, { target: { value: '新カテゴリ' } });

        // 作成ボタンをクリック
        fireEvent.click(screen.getByText('作成'));

        expect(mockFavoritesLib.createFavoriteCategory).toHaveBeenCalledWith('新カテゴリ');
    });

    test('商品をお気に入りから削除できる', async () => {
        render(<FavoritesList />);

        await waitFor(() => {
            expect(screen.getAllByText('削除')).toHaveLength(2);
        });

        // 最初の削除ボタンをクリック
        fireEvent.click(screen.getAllByText('削除')[0]);

        expect(mockFavoritesLib.removeFromFavorites).toHaveBeenCalledWith('product-1');
    });

    test('商品を選択してカテゴリに移動できる', async () => {
        render(<FavoritesList />);

        await waitFor(() => {
            expect(screen.getAllByRole('checkbox')).toHaveLength(2);
        });

        // 商品を選択
        const checkboxes = screen.getAllByRole('checkbox');
        fireEvent.click(checkboxes[0]);

        // 選択状態の表示を確認
        expect(screen.getByText('1個の商品を選択中')).toBeInTheDocument();

        // カテゴリ移動のセレクトボックスを確認
        const select = screen.getByDisplayValue('カテゴリに移動...');
        expect(select).toBeInTheDocument();
    });

    test('商品がない場合の表示', async () => {
        mockFavoritesLib.getFavoriteProducts.mockReturnValue([]);
        mockFavoritesLib.getUncategorizedFavorites.mockReturnValue([]);

        render(<FavoritesList />);

        await waitFor(() => {
            expect(screen.getByText('お気に入り商品がありません')).toBeInTheDocument();
            expect(screen.getByText('商品詳細ページでお気に入りに追加してください')).toBeInTheDocument();
        });
    });

    test('商品クリック時のコールバックが呼ばれる', async () => {
        const mockOnProductClick = vi.fn();
        render(<FavoritesList onProductClick={mockOnProductClick} />);

        await waitFor(() => {
            expect(screen.getAllByText('詳細を見る')).toHaveLength(2);
        });

        // 詳細を見るボタンをクリック
        fireEvent.click(screen.getAllByText('詳細を見る')[0]);

        expect(mockOnProductClick).toHaveBeenCalledWith('product-1');
    });

    test('カテゴリ削除の確認ダイアログ', async () => {
        // window.confirmをモック
        const mockConfirm = vi.fn().mockReturnValue(true);
        Object.defineProperty(window, 'confirm', { value: mockConfirm });

        render(<FavoritesList />);

        await waitFor(() => {
            // カテゴリ削除ボタンを探す（×ボタン）
            const deleteButtons = screen.getAllByTitle('カテゴリを削除');
            expect(deleteButtons).toHaveLength(2);
        });

        // 最初のカテゴリ削除ボタンをクリック
        const deleteButtons = screen.getAllByTitle('カテゴリを削除');
        fireEvent.click(deleteButtons[0]);

        expect(mockConfirm).toHaveBeenCalledWith(
            'このカテゴリを削除しますか？カテゴリ内の商品は未分類に移動されます。'
        );
        expect(mockFavoritesLib.deleteFavoriteCategory).toHaveBeenCalledWith('category-1');
    });

    test('ローディング状態の表示', () => {
        // getFavoriteProductsが呼ばれる前にレンダリング
        mockFavoritesLib.getFavoriteProducts.mockImplementation(() => {
            throw new Error('Loading...');
        });

        render(<FavoritesList />);

        // ローディング表示は初期状態で表示されるため、
        // useEffectが実行される前の状態をテスト
        expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    test('エラーハンドリング', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        mockFavoritesLib.removeFromFavorites.mockImplementation(() => {
            throw new Error('削除に失敗しました');
        });

        render(<FavoritesList />);

        await waitFor(() => {
            expect(screen.getAllByText('削除')).toHaveLength(2);
        });

        // 削除ボタンをクリック
        fireEvent.click(screen.getAllByText('削除')[0]);

        expect(consoleSpy).toHaveBeenCalledWith(
            'お気に入りの削除に失敗しました:',
            expect.any(Error)
        );

        consoleSpy.mockRestore();
    });
});