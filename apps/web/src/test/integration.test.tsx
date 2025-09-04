/**
 * 統合テスト
 * 重要なユーザーフローの統合テスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import {
    renderWithProviders,
    userActions,
    accessibilityHelpers,
    performanceHelpers,
    cleanup,
    mockProduct,
    mockDiagnosisAnswers,
    mockDiagnosisResults,
} from './integration-helpers';

// コンポーネントのインポート
import { SearchBar } from '@/components/SearchBar';
import { DiagnosisForm } from '@/components/diagnosis/DiagnosisForm';
import { DiagnosisResult } from '@/components/diagnosis/DiagnosisResult';
import { ComparisonTable } from '@/components/ComparisonTable';
import { FavoritesList } from '@/components/FavoritesList';
import { PriceTable } from '@/components/PriceTable';

describe('統合テスト', () => {
    beforeEach(() => {
        cleanup.clearAllStorage();
        vi.clearAllMocks();
    });

    describe('検索フロー統合テスト', () => {
        it('検索から商品詳細まで一連のフローが動作する', async () => {
            // 検索バーをレンダリング
            renderWithProviders(
                <SearchBar
                    onSearch={vi.fn()}
                    aiRecommendations={[]}
                    placeholder="サプリメントを検索"
                    size="large"
                />
            );

            // 検索実行
            await userActions.performSearch('ビタミンC');

            // 検索結果が表示されることを確認
            await waitFor(() => {
                expect(screen.getByText(/検索結果/)).toBeInTheDocument();
            });
        });

        it('AIレコメンド機能が適切に動作する', async () => {
            const mockRecommendations = [
                {
                    id: '1',
                    title: 'ビタミンC サプリメント',
                    reason: '免疫力向上に効果的',
                    confidence: 0.9,
                },
            ];

            renderWithProviders(
                <SearchBar
                    onSearch={vi.fn()}
                    aiRecommendations={mockRecommendations}
                    placeholder="サプリメントを検索"
                    size="large"
                />
            );

            // レコメンドが表示されることを確認
            expect(screen.getByText('ビタミンC サプリメント')).toBeInTheDocument();
            expect(screen.getByText('免疫力向上に効果的')).toBeInTheDocument();
        });
    });

    describe('診断フロー統合テスト', () => {
        it('診断から結果表示まで一連のフローが動作する', async () => {
            const mockOnSubmit = vi.fn();

            // 診断フォームをレンダリング
            renderWithProviders(
                <DiagnosisForm
                    onSubmit={mockOnSubmit}
                    questions={[
                        {
                            id: '1',
                            type: 'multiple',
                            category: 'purpose',
                            question: '改善したい症状を選択してください',
                            options: ['疲労回復', '免疫向上', '美容効果'],
                        },
                    ]}
                />
            );

            // 診断を完了
            await userActions.completeDiagnosis();

            // 診断結果をレンダリング
            renderWithProviders(
                <DiagnosisResult
                    results={mockDiagnosisResults}
                    userAnswers={mockDiagnosisAnswers}
                />
            );

            // 結果が表示されることを確認
            expect(screen.getByText(/総合スコア/)).toBeInTheDocument();
            expect(screen.getByText('85.5')).toBeInTheDocument();
        });

        it('スコア計算が正確に動作する', () => {
            renderWithProviders(
                <DiagnosisResult
                    results={mockDiagnosisResults}
                    userAnswers={mockDiagnosisAnswers}
                />
            );

            // 各スコアが表示されることを確認
            expect(screen.getByText('90')).toBeInTheDocument(); // evidence
            expect(screen.getByText('95')).toBeInTheDocument(); // safety
            expect(screen.getByText('75')).toBeInTheDocument(); // cost
            expect(screen.getByText('82')).toBeInTheDocument(); // practicality
        });
    });

    describe('商品比較フロー統合テスト', () => {
        it('商品比較機能が適切に動作する', async () => {
            const mockProducts = [mockProduct, { ...mockProduct, id: 'test-product-2', name: 'テストサプリメント2' }];

            renderWithProviders(
                <ComparisonTable
                    products={mockProducts}
                    comparisonCriteria={[
                        { field: 'name', label: '商品名', type: 'text', sortable: true },
                        { field: 'pricing', label: '価格', type: 'price', sortable: true },
                    ]}
                    onProductRemove={vi.fn()}
                    onCriteriaChange={vi.fn()}
                />
            );

            // 比較テーブルが表示されることを確認
            expect(screen.getByText('テストサプリメント')).toBeInTheDocument();
            expect(screen.getByText('テストサプリメント2')).toBeInTheDocument();

            // 商品を比較リストに追加
            await userActions.addToComparison();
        });
    });

    describe('お気に入り機能統合テスト', () => {
        it('お気に入り機能が適切に動作する', async () => {
            renderWithProviders(
                <FavoritesList
                    favorites={[mockProduct]}
                    onRemove={vi.fn()}
                    onCategoryChange={vi.fn()}
                />
            );

            // お気に入り商品が表示されることを確認
            expect(screen.getByText('テストサプリメント')).toBeInTheDocument();

            // お気に入りに追加
            await userActions.addToFavorites();
        });
    });

    describe('価格機能統合テスト', () => {
        it('価格表示と計算が正確に動作する', () => {
            renderWithProviders(
                <PriceTable
                    products={[mockProduct]}
                    currency="JPY"
                    locale="ja"
                />
            );

            // 価格が正しく表示されることを確認
            expect(screen.getByText('¥2,980')).toBeInTheDocument();
            expect(screen.getByText(/99.33/)).toBeInTheDocument(); // 1日あたりのコスト
        });
    });

    describe('アクセシビリティ統合テスト', () => {
        it('キーボードナビゲーションが適切に動作する', async () => {
            renderWithProviders(
                <SearchBar
                    onSearch={vi.fn()}
                    aiRecommendations={[]}
                    placeholder="サプリメントを検索"
                    size="large"
                />
            );

            await accessibilityHelpers.testKeyboardNavigation();
        });

        it('スクリーンリーダー対応が適切に実装されている', () => {
            renderWithProviders(
                <DiagnosisResult
                    results={mockDiagnosisResults}
                    userAnswers={mockDiagnosisAnswers}
                />
            );

            accessibilityHelpers.testScreenReaderSupport();
        });
    });

    describe('パフォーマンス統合テスト', () => {
        it('コンポーネントのレンダリング時間が適切である', () => {
            const renderTime = performanceHelpers.measureRenderTime(() => {
                renderWithProviders(
                    <ComparisonTable
                        products={[mockProduct]}
                        comparisonCriteria={[
                            { field: 'name', label: '商品名', type: 'text', sortable: true },
                        ]}
                        onProductRemove={vi.fn()}
                        onCriteriaChange={vi.fn()}
                    />
                );
            });

            // レンダリング時間が100ms以下であることを確認
            expect(renderTime).toBeLessThan(100);
        });

        it('大量データの処理が適切に動作する', () => {
            const largeProductList = Array.from({ length: 100 }, (_, i) => ({
                ...mockProduct,
                id: `product-${i}`,
                name: `テストサプリメント${i}`,
            }));

            const renderTime = performanceHelpers.measureRenderTime(() => {
                renderWithProviders(
                    <ComparisonTable
                        products={largeProductList}
                        comparisonCriteria={[
                            { field: 'name', label: '商品名', type: 'text', sortable: true },
                        ]}
                        onProductRemove={vi.fn()}
                        onCriteriaChange={vi.fn()}
                    />
                );
            });

            // 大量データでもレンダリング時間が500ms以下であることを確認
            expect(renderTime).toBeLessThan(500);
        });
    });

    describe('エラーハンドリング統合テスト', () => {
        it('ネットワークエラー時の適切な処理', async () => {
            // ネットワークエラーをシミュレート
            const mockFetch = vi.fn().mockRejectedValue(new Error('Network Error'));
            global.fetch = mockFetch;

            renderWithProviders(
                <SearchBar
                    onSearch={vi.fn()}
                    aiRecommendations={[]}
                    placeholder="サプリメントを検索"
                    size="large"
                />
            );

            await userActions.performSearch('ビタミンC');

            // エラーメッセージが表示されることを確認
            await waitFor(() => {
                expect(screen.getByText(/エラーが発生しました/)).toBeInTheDocument();
            });
        });

        it('無効なデータ入力時の適切な処理', async () => {
            const mockOnSubmit = vi.fn();

            renderWithProviders(
                <DiagnosisForm
                    onSubmit={mockOnSubmit}
                    questions={[
                        {
                            id: '1',
                            type: 'multiple',
                            category: 'purpose',
                            question: '改善したい症状を選択してください',
                            options: ['疲労回復', '免疫向上'],
                        },
                    ]}
                />
            );

            // 無効なデータで診断を実行
            const submitButton = screen.getByRole('button', { name: /診断/ });
            await userActions.addToFavorites(); // 何も選択せずに実行

            // バリデーションエラーが表示されることを確認
            await waitFor(() => {
                expect(screen.getByText(/選択してください/)).toBeInTheDocument();
            });
        });
    });

    describe('国際化統合テスト', () => {
        it('言語切替が適切に動作する', () => {
            renderWithProviders(
                <PriceTable
                    products={[mockProduct]}
                    currency="USD"
                    locale="en"
                />
            );

            // 英語表示になることを確認（実装に応じて調整）
            expect(screen.getByText(/Price/)).toBeInTheDocument();
        });

        it('通貨切替が適切に動作する', () => {
            renderWithProviders(
                <PriceTable
                    products={[mockProduct]}
                    currency="USD"
                    locale="en"
                />
            );

            // USD表示になることを確認
            expect(screen.getByText(/\$/)).toBeInTheDocument();
        });
    });
});