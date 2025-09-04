import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComparisonFilters } from '../ComparisonFilters';
import { ComparisonCriteria } from '../ComparisonTable';

// モック比較項目
const mockCriteria: ComparisonCriteria[] = [
    { field: 'name', label: '商品名', type: 'text', sortable: true },
    { field: 'brand', label: 'ブランド', type: 'text', sortable: true },
    { field: 'totalScore', label: '総合スコア', type: 'score', sortable: true },
    { field: 'costPerDay', label: '実効コスト/日', type: 'price', sortable: true },
    { field: 'ingredients', label: '主要成分', type: 'ingredients', sortable: false },
];

const mockVisibleCriteria: ComparisonCriteria[] = [
    { field: 'name', label: '商品名', type: 'text', sortable: true },
    { field: 'totalScore', label: '総合スコア', type: 'score', sortable: true },
];

const mockOnCriteriaChange = jest.fn();
const mockOnExport = jest.fn();

describe('ComparisonFilters', () => {
    beforeEach(() => {
        mockOnCriteriaChange.mockClear();
        mockOnExport.mockClear();
    });

    it('基本的な表示要素が存在する', () => {
        render(
            <ComparisonFilters
                availableCriteria={mockCriteria}
                visibleCriteria={mockVisibleCriteria}
                onCriteriaChange={mockOnCriteriaChange}
                onExport={mockOnExport}
            />
        );

        expect(screen.getByText('表示項目の設定')).toBeInTheDocument();
        expect(screen.getByText('CSV出力')).toBeInTheDocument();
        expect(screen.getByText('JSON出力')).toBeInTheDocument();
        expect(screen.getByText('設定')).toBeInTheDocument();
    });

    it('選択状況が正しく表示される', () => {
        render(
            <ComparisonFilters
                availableCriteria={mockCriteria}
                visibleCriteria={mockVisibleCriteria}
                onCriteriaChange={mockOnCriteriaChange}
                onExport={mockOnExport}
            />
        );

        expect(screen.getByText('2項目を表示中 • クリックして設定を変更')).toBeInTheDocument();
    });

    it('設定ボタンをクリックすると詳細設定が表示される', () => {
        render(
            <ComparisonFilters
                availableCriteria={mockCriteria}
                visibleCriteria={mockVisibleCriteria}
                onCriteriaChange={mockOnCriteriaChange}
                onExport={mockOnExport}
            />
        );

        const settingsButton = screen.getByText('設定');
        fireEvent.click(settingsButton);

        expect(screen.getByText('プリセット')).toBeInTheDocument();
        expect(screen.getByText('基本情報')).toBeInTheDocument();
        expect(screen.getByText('スコア詳細')).toBeInTheDocument();
        expect(screen.getByText('価格比較')).toBeInTheDocument();
        expect(screen.getByText('成分詳細')).toBeInTheDocument();
        expect(screen.getByText('表示項目')).toBeInTheDocument();
    });

    it('プリセットボタンが機能する', () => {
        render(
            <ComparisonFilters
                availableCriteria={mockCriteria}
                visibleCriteria={mockVisibleCriteria}
                onCriteriaChange={mockOnCriteriaChange}
                onExport={mockOnExport}
            />
        );

        // 設定を開く
        fireEvent.click(screen.getByText('設定'));

        // 基本情報プリセットをクリック
        fireEvent.click(screen.getByText('基本情報'));

        expect(mockOnCriteriaChange).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ field: 'name' }),
                expect.objectContaining({ field: 'brand' }),
                expect.objectContaining({ field: 'totalScore' }),
                expect.objectContaining({ field: 'costPerDay' }),
            ])
        );
    });

    it('すべて選択/解除ボタンが機能する', () => {
        render(
            <ComparisonFilters
                availableCriteria={mockCriteria}
                visibleCriteria={mockVisibleCriteria}
                onCriteriaChange={mockOnCriteriaChange}
                onExport={mockOnExport}
            />
        );

        // 設定を開く
        fireEvent.click(screen.getByText('設定'));

        // すべて選択をクリック
        fireEvent.click(screen.getByText('すべて選択'));

        expect(mockOnCriteriaChange).toHaveBeenCalledWith(mockCriteria);
    });

    it('デフォルトに戻すボタンが機能する', () => {
        render(
            <ComparisonFilters
                availableCriteria={mockCriteria}
                visibleCriteria={mockCriteria} // すべて選択状態
                onCriteriaChange={mockOnCriteriaChange}
                onExport={mockOnExport}
            />
        );

        // 設定を開く
        fireEvent.click(screen.getByText('設定'));

        // デフォルトに戻すをクリック
        fireEvent.click(screen.getByText('デフォルトに戻す'));

        expect(mockOnCriteriaChange).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ field: 'name' }),
                expect.objectContaining({ field: 'brand' }),
                expect.objectContaining({ field: 'totalScore' }),
                expect.objectContaining({ field: 'costPerDay' }),
            ])
        );
    });

    it('個別項目のチェックボックスが機能する', () => {
        render(
            <ComparisonFilters
                availableCriteria={mockCriteria}
                visibleCriteria={mockVisibleCriteria}
                onCriteriaChange={mockOnCriteriaChange}
                onExport={mockOnExport}
            />
        );

        // 設定を開く
        fireEvent.click(screen.getByText('設定'));

        // ブランドのチェックボックスをクリック（追加）
        const brandCheckbox = screen.getByLabelText('ブランド');
        fireEvent.click(brandCheckbox);

        expect(mockOnCriteriaChange).toHaveBeenCalledWith([
            ...mockVisibleCriteria,
            expect.objectContaining({ field: 'brand' })
        ]);
    });

    it('CSVエクスポートボタンが機能する', () => {
        render(
            <ComparisonFilters
                availableCriteria={mockCriteria}
                visibleCriteria={mockVisibleCriteria}
                onCriteriaChange={mockOnCriteriaChange}
                onExport={mockOnExport}
            />
        );

        fireEvent.click(screen.getByText('CSV出力'));

        expect(mockOnExport).toHaveBeenCalledWith('csv');
    });

    it('JSONエクスポートボタンが機能する', () => {
        render(
            <ComparisonFilters
                availableCriteria={mockCriteria}
                visibleCriteria={mockVisibleCriteria}
                onCriteriaChange={mockOnCriteriaChange}
                onExport={mockOnExport}
            />
        );

        fireEvent.click(screen.getByText('JSON出力'));

        expect(mockOnExport).toHaveBeenCalledWith('json');
    });

    it('エクスポート機能なしでも正常に動作する', () => {
        render(
            <ComparisonFilters
                availableCriteria={mockCriteria}
                visibleCriteria={mockVisibleCriteria}
                onCriteriaChange={mockOnCriteriaChange}
            />
        );

        expect(screen.queryByText('CSV出力')).not.toBeInTheDocument();
        expect(screen.queryByText('JSON出力')).not.toBeInTheDocument();
        expect(screen.getByText('表示項目の設定')).toBeInTheDocument();
    });

    it('項目タイプに応じたアイコンが表示される', () => {
        render(
            <ComparisonFilters
                availableCriteria={mockCriteria}
                visibleCriteria={mockVisibleCriteria}
                onCriteriaChange={mockOnCriteriaChange}
                onExport={mockOnExport}
            />
        );

        // 設定を開く
        fireEvent.click(screen.getByText('設定'));

        // スコア項目にはチャートアイコンが表示される
        expect(screen.getByText('📊')).toBeInTheDocument();

        // 価格項目にはお金アイコンが表示される
        expect(screen.getByText('💰')).toBeInTheDocument();
    });
});