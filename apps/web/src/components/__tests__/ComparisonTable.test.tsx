import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComparisonTable, Product } from '../ComparisonTable';

// モックデータ
const mockProducts: Product[] = [
    {
        id: '1',
        name: 'ビタミンC 1000mg',
        brand: 'ブランドA',
        price: 2000,
        currency: 'JPY',
        servingsPerContainer: 60,
        normalizedPricePerMg: 0.033,
        costPerDay: 33,
        totalScore: 85,
        evidenceScore: 90,
        safetyScore: 85,
        costScore: 80,
        practicalityScore: 85,
        ingredients: [
            { name: 'ビタミンC', amount: 1000, unit: 'mg' },
            { name: 'ローズヒップ', amount: 50, unit: 'mg' }
        ]
    },
    {
        id: '2',
        name: 'マルチビタミン',
        brand: 'ブランドB',
        price: 3000,
        currency: 'JPY',
        servingsPerContainer: 30,
        normalizedPricePerMg: 0.05,
        costPerDay: 100,
        totalScore: 75,
        evidenceScore: 70,
        safetyScore: 80,
        costScore: 70,
        practicalityScore: 80,
        ingredients: [
            { name: 'ビタミンA', amount: 800, unit: 'mcg' },
            { name: 'ビタミンC', amount: 500, unit: 'mg' },
            { name: 'ビタミンD', amount: 20, unit: 'mcg' }
        ]
    }
];

const mockOnProductRemove = jest.fn();

describe('ComparisonTable', () => {
    beforeEach(() => {
        mockOnProductRemove.mockClear();
    });

    it('商品が表示される', () => {
        render(
            <ComparisonTable
                products={mockProducts}
                onProductRemove={mockOnProductRemove}
            />
        );

        expect(screen.getByText('ビタミンC 1000mg')).toBeInTheDocument();
        expect(screen.getByText('マルチビタミン')).toBeInTheDocument();
        expect(screen.getByText('ブランドA')).toBeInTheDocument();
        expect(screen.getByText('ブランドB')).toBeInTheDocument();
    });

    it('商品数が正しく表示される', () => {
        render(
            <ComparisonTable
                products={mockProducts}
                onProductRemove={mockOnProductRemove}
            />
        );

        expect(screen.getByText('2件の商品を比較中')).toBeInTheDocument();
    });

    it('削除ボタンが機能する', () => {
        render(
            <ComparisonTable
                products={mockProducts}
                onProductRemove={mockOnProductRemove}
            />
        );

        const deleteButtons = screen.getAllByText('削除');
        fireEvent.click(deleteButtons[0]);

        expect(mockOnProductRemove).toHaveBeenCalledWith('1');
    });

    it('すべて削除ボタンが機能する', () => {
        render(
            <ComparisonTable
                products={mockProducts}
                onProductRemove={mockOnProductRemove}
            />
        );

        const removeAllButton = screen.getByText('すべて削除');
        fireEvent.click(removeAllButton);

        expect(mockOnProductRemove).toHaveBeenCalledTimes(2);
        expect(mockOnProductRemove).toHaveBeenCalledWith('1');
        expect(mockOnProductRemove).toHaveBeenCalledWith('2');
    });

    it('商品名をクリックすると詳細モーダルが開く', () => {
        render(
            <ComparisonTable
                products={mockProducts}
                onProductRemove={mockOnProductRemove}
            />
        );

        const productNameButton = screen.getByRole('button', { name: 'ビタミンC 1000mg' });
        fireEvent.click(productNameButton);

        // モーダルが開いていることを確認
        expect(screen.getByText('比較から削除')).toBeInTheDocument();
    });

    it('ソート機能が動作する', () => {
        render(
            <ComparisonTable
                products={mockProducts}
                onProductRemove={mockOnProductRemove}
            />
        );

        // 総合スコアでソート（デフォルトは降順）
        const scoreHeader = screen.getByText('総合スコア');
        fireEvent.click(scoreHeader);

        // ソート順が変わったことを確認（昇順になる）
        expect(screen.getByText('↑')).toBeInTheDocument();
    });

    it('商品がない場合の表示', () => {
        render(
            <ComparisonTable
                products={[]}
                onProductRemove={mockOnProductRemove}
            />
        );

        expect(screen.getByText('比較する商品がありません')).toBeInTheDocument();
        expect(screen.getByText('商品を追加して比較を開始してください')).toBeInTheDocument();
    });

    it('スコアバッジが正しい色で表示される', () => {
        render(
            <ComparisonTable
                products={mockProducts}
                onProductRemove={mockOnProductRemove}
            />
        );

        // 高スコア（85点）は high variant
        const highScoreBadges = screen.getAllByText('85点');
        expect(highScoreBadges[0]).toHaveClass('bg-green-100', 'text-green-800');

        // 中スコア（75点）は medium variant
        const mediumScoreBadge = screen.getByText('75点');
        expect(mediumScoreBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('価格が正しくフォーマットされる', () => {
        render(
            <ComparisonTable
                products={mockProducts}
                onProductRemove={mockOnProductRemove}
            />
        );

        expect(screen.getByText('¥33')).toBeInTheDocument();
        expect(screen.getByText('¥100')).toBeInTheDocument();
    });

    it('成分情報が表示される', () => {
        render(
            <ComparisonTable
                products={mockProducts}
                onProductRemove={mockOnProductRemove}
            />
        );

        expect(screen.getByText('ビタミンC')).toBeInTheDocument();
        expect(screen.getByText('1000mg')).toBeInTheDocument();
        expect(screen.getByText('ローズヒップ')).toBeInTheDocument();
        expect(screen.getByText('50mg')).toBeInTheDocument();
    });
});