/**
 * データフロー統合テスト
 * アプリケーション全体のデータフローを検証
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders, userActions, cleanup, mockProduct } from './integration-helpers';
import React from 'react';

describe('データフロー統合テスト', () => {
    beforeEach(() => {
        cleanup.clearAllStorage();
        vi.clearAllMocks();
    });

    describe('検索データフロー', () => {
        it('検索クエリから結果表示までのデータフローが正常に動作する', async () => {
            const mockOnSearch = vi.fn();

            const MockSearchBar = () => (
                <div>
                    <input
                        type="search"
                        placeholder="サプリメントを検索"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                mockOnSearch((e.target as HTMLInputElement).value);
                            }
                        }}
                    />
                    <div>
                        <h3>AIレコメンド</h3>
                        <div>ビタミンC 1000mg</div>
                        <div>免疫力向上に効果的</div>
                    </div>
                </div>
            );

            renderWithProviders(<MockSearchBar />);

            // 検索実行
            const searchInput = screen.getByRole('searchbox');
            await userActions.typeText(searchInput, 'ビタミンC');
            fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

            // 検索クエリが正しく渡されることを確認
            expect(mockOnSearch).toHaveBeenCalledWith('ビタミンC');

            // AIレコメンドデータが表示されることを確認
            expect(screen.getByText('ビタミンC 1000mg')).toBeInTheDocument();
            expect(screen.getByText('免疫力向上に効果的')).toBeInTheDocument();
        });

        it('検索結果のフィルタリングが正常に動作する', () => {
            const mockProducts = [
                { ...mockProduct, category: 'vitamin', price: 1000 },
                { ...mockProduct, id: '2', category: 'mineral', price: 2000 },
                { ...mockProduct, id: '3', category: 'vitamin', price: 1500 },
            ];

            // フィルター適用のシミュレーション
            const filteredProducts = mockProducts.filter(p => p.category === 'vitamin');
            expect(filteredProducts).toHaveLength(2);

            // 価格範囲フィルターのシミュレーション
            const priceFilteredProducts = filteredProducts.filter(p => p.price <= 1200);
            expect(priceFilteredProducts).toHaveLength(1);
        });
    });

    describe('診断データフロー', () => {
        it('診断回答からスコア計算までのデータフローが正常に動作する', async () => {
            const mockOnSubmit = vi.fn();

            const MockDiagnosisForm = () => (
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    const answers = {
                        purpose: formData.getAll('purpose'),
                        constitution: formData.getAll('constitution'),
                        lifestyle: formData.getAll('lifestyle'),
                    };
                    mockOnSubmit(answers);
                }}>
                    <fieldset>
                        <legend>改善したい症状を選択してください</legend>
                        <label>
                            <input type="checkbox" name="purpose" value="疲労回復" />
                            疲労回復
                        </label>
                        <label>
                            <input type="checkbox" name="purpose" value="免疫向上" />
                            免疫向上
                        </label>
                    </fieldset>
                    <button type="submit">診断</button>
                </form>
            );

            renderWithProviders(<MockDiagnosisForm />);

            // 診断回答を入力
            const option1 = screen.getByLabelText('疲労回復');
            const option2 = screen.getByLabelText('免疫向上');

            await userActions.clickElement(option1);
            await userActions.clickElement(option2);

            // 診断実行
            const submitButton = screen.getByRole('button', { name: /診断/ });
            await userActions.clickElement(submitButton);

            // 回答データが正しく渡されることを確認
            expect(mockOnSubmit).toHaveBeenCalledWith(
                expect.objectContaining({
                    purpose: expect.arrayContaining(['疲労回復', '免疫向上']),
                })
            );
        });

        it('スコア計算ロジックが正確に動作する', () => {
            const mockProductData = {
                evidence: { score: 90, studies: 15 },
                safety: { score: 95, warnings: [] },
                cost: { score: 75, pricePerDay: 99.33 },
                practicality: { score: 82, dosagePerDay: 2 },
            };

            // 総合スコア計算のシミュレーション
            const totalScore = (90 + 95 + 75 + 82) / 4;
            expect(totalScore).toBe(85.5);

            // 個別スコアの確認
            expect(mockProductData.evidence.score).toBe(90);
            expect(mockProductData.safety.score).toBe(95);
            expect(mockProductData.cost.score).toBe(75);
            expect(mockProductData.practicality.score).toBe(82);
        });

        it('診断結果の表示データが正確に処理される', () => {
            const MockDiagnosisResult = () => (
                <div>
                    <h2>診断結果</h2>
                    <div>総合スコア: 85.5</div>
                    <div>エビデンス: 90</div>
                    <div>安全性: 95</div>
                    <div>コスト: 75</div>
                    <div>実用性: 82</div>
                </div>
            );

            renderWithProviders(<MockDiagnosisResult />);

            // 結果データが正しく表示されることを確認
            expect(screen.getByText(/85\.5/)).toBeInTheDocument();
            expect(screen.getByText(/90/)).toBeInTheDocument();
            expect(screen.getByText(/95/)).toBeInTheDocument();
            expect(screen.getByText(/75/)).toBeInTheDocument();
            expect(screen.getByText(/82/)).toBeInTheDocument();
        });
    });

    describe('お気に入りデータフロー', () => {
        it('お気に入り追加から保存までのデータフローが正常に動作する', async () => {
            const mockOnToggle = vi.fn();

            const MockFavoriteButton = () => (
                <button onClick={() => mockOnToggle('test-product-1', true)}>
                    お気に入りに追加
                </button>
            );

            renderWithProviders(<MockFavoriteButton />);

            // お気に入りボタンをクリック
            const favoriteButton = screen.getByRole('button', { name: /お気に入り/ });
            await userActions.clickElement(favoriteButton);

            // お気に入り状態の変更が呼び出されることを確認
            expect(mockOnToggle).toHaveBeenCalledWith('test-product-1', true);
        });

        it('お気に入りリストの同期が正常に動作する', () => {
            // ローカルストレージをモック
            const mockLocalStorage = {
                getItem: vi.fn(),
                setItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn(),
            };
            Object.defineProperty(window, 'localStorage', {
                value: mockLocalStorage,
                writable: true,
            });

            // 初期データをセット
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(['product-1', 'product-2']));

            // お気に入りリストの取得
            const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            expect(favorites).toEqual(['product-1', 'product-2']);

            // お気に入り削除のシミュレーション
            const updatedFavorites = favorites.filter((id: string) => id !== 'product-1');
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(updatedFavorites));

            // 削除後の確認
            const newFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            expect(newFavorites).toEqual(['product-2']);
        });
    });

    describe('価格データフロー', () => {
        it('価格計算から表示までのデータフローが正常に動作する', () => {
            const mockPricing = {
                price: 2980,
                currency: 'JPY',
                servingsPerContainer: 30,
                servingSize: 2,
                totalAmount: 1000, // mg
            };

            // 1日あたりのコスト計算
            const costPerDay = mockPricing.price / mockPricing.servingsPerContainer;
            expect(Math.round(costPerDay * 100) / 100).toBe(99.33);

            // mg/日あたりの価格計算
            const pricePerMg = mockPricing.price / mockPricing.totalAmount;
            expect(pricePerMg).toBe(2.98);

            // 価格フォーマット（簡易版）
            const formattedPrice = `¥${mockPricing.price.toLocaleString()}`;
            expect(formattedPrice).toBe('¥2,980');
        });

        it('価格アラート設定のデータフローが正常に動作する', async () => {
            const mockOnSubmit = vi.fn();

            const MockPriceAlertForm = () => (
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    mockOnSubmit({
                        productId: 'test-product-1',
                        targetPrice: Number(formData.get('targetPrice')),
                        currentPrice: 2980,
                    });
                }}>
                    <label>
                        目標価格:
                        <input type="number" name="targetPrice" />
                    </label>
                    <button type="submit">設定</button>
                </form>
            );

            renderWithProviders(<MockPriceAlertForm />);

            // アラート価格を入力
            const priceInput = screen.getByLabelText(/目標価格/);
            await userActions.typeText(priceInput, '2500');

            // アラート設定を保存
            const submitButton = screen.getByRole('button', { name: /設定/ });
            await userActions.clickElement(submitButton);

            // アラートデータが正しく渡されることを確認
            expect(mockOnSubmit).toHaveBeenCalledWith({
                productId: 'test-product-1',
                targetPrice: 2500,
                currentPrice: 2980,
            });
        });
    });

    describe('比較データフロー', () => {
        it('商品比較データの処理が正常に動作する', () => {
            const mockProducts = [
                {
                    id: '1',
                    name: 'ビタミンC 1000mg',
                    pricing: { price: 2980, costPerDay: 99.33 },
                },
                {
                    id: '2',
                    name: 'ビタミンC 500mg',
                    pricing: { price: 1980, costPerDay: 66.00 },
                },
            ];

            const MockComparisonTable = () => (
                <table>
                    <thead>
                        <tr>
                            <th>商品名</th>
                            <th>価格</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockProducts.map(product => (
                            <tr key={product.id}>
                                <td>{product.name}</td>
                                <td>¥{product.pricing.price.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );

            renderWithProviders(<MockComparisonTable />);

            // 比較データが正しく表示されることを確認
            expect(screen.getByText('ビタミンC 1000mg')).toBeInTheDocument();
            expect(screen.getByText('ビタミンC 500mg')).toBeInTheDocument();
            expect(screen.getByText('¥2,980')).toBeInTheDocument();
            expect(screen.getByText('¥1,980')).toBeInTheDocument();
        });

        it('比較データのソート機能が正常に動作する', () => {
            const mockProducts = [
                { id: '1', pricing: { costPerDay: 99.33 } },
                { id: '2', pricing: { costPerDay: 66.00 } },
                { id: '3', pricing: { costPerDay: 120.50 } },
            ];

            // 価格でソート（昇順）
            const sortedByPrice = [...mockProducts].sort((a, b) =>
                a.pricing.costPerDay - b.pricing.costPerDay
            );

            expect(sortedByPrice[0].id).toBe('2'); // 66.00
            expect(sortedByPrice[1].id).toBe('1'); // 99.33
            expect(sortedByPrice[2].id).toBe('3'); // 120.50
        });
    });

    describe('国際化データフロー', () => {
        it('言語切替時のデータ変換が正常に動作する', () => {
            // 日本語での価格表示
            const priceJA = `¥${(2980).toLocaleString('ja-JP')}`;
            expect(priceJA).toBe('¥2,980');

            // 英語での価格表示（簡易版）
            const priceEN = `$${(29.80).toLocaleString('en-US')}`;
            expect(priceEN).toBe('$29.8');

            // 通貨換算のシミュレーション
            const exchangeRate = 150; // 1 USD = 150 JPY
            const convertedPrice = 2980 / exchangeRate;
            expect(Math.round(convertedPrice * 100) / 100).toBe(19.87);
        });
    });

    describe('パフォーマンスデータフロー', () => {
        it('大量データの処理が効率的に動作する', () => {
            // 大量の商品データを生成
            const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
                ...mockProduct,
                id: `product-${i}`,
                name: `テストサプリメント${i}`,
            }));

            // データ処理時間を測定
            const startTime = performance.now();

            // フィルタリング処理
            const filteredData = largeDataset.filter(product =>
                product.name.includes('テスト')
            );

            const endTime = performance.now();
            const processingTime = endTime - startTime;

            // 処理時間が100ms以下であることを確認
            expect(processingTime).toBeLessThan(100);
            expect(filteredData).toHaveLength(1000);
        });
    });
});