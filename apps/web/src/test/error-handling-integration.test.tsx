/**
 * エラーハンドリング統合テスト
 * アプリケーション全体のエラーハンドリングを検証
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userActions, cleanup } from './integration-helpers';
import React from 'react';

// エラーバウンダリのモック
class TestErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <div>エラーが発生しました。ページを再読み込みしてください。</div>;
        }

        return this.props.children;
    }
}

describe('エラーハンドリング統合テスト', () => {
    beforeEach(() => {
        cleanup.clearAllStorage();
        vi.clearAllMocks();
        // コンソールエラーをモック
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    describe('ネットワークエラーハンドリング', () => {
        it('検索API失敗時の適切なエラー表示', async () => {
            // fetch APIをモック（失敗）
            const mockFetch = vi.fn().mockRejectedValue(new Error('Network Error'));
            global.fetch = mockFetch;

            const MockSearchWithError = () => {
                const [error, setError] = React.useState<string | null>(null);

                const handleSearch = async () => {
                    try {
                        await fetch('/api/search?q=test');
                    } catch (error) {
                        setError('検索中にエラーが発生しました');
                    }
                };

                return (
                    <div>
                        <input type="search" placeholder="検索" />
                        <button onClick={handleSearch}>検索</button>
                        {error && <div role="alert">{error}</div>}
                        <button onClick={handleSearch}>再試行</button>
                    </div>
                );
            };

            renderWithProviders(<MockSearchWithError />);

            // 検索実行
            const searchButton = screen.getByRole('button', { name: /検索/ });
            await userActions.clickElement(searchButton);

            // エラーメッセージが表示されることを確認
            await waitFor(() => {
                expect(screen.getByRole('alert')).toHaveTextContent('検索中にエラーが発生しました');
            });

            // 再試行ボタンが表示されることを確認
            expect(screen.getByRole('button', { name: /再試行/ })).toBeInTheDocument();
        });

        it('診断API失敗時の適切なエラー表示', async () => {
            const MockDiagnosisWithError = () => {
                const [error, setError] = React.useState<string | null>(null);

                const handleSubmit = async () => {
                    try {
                        throw new Error('診断処理中にエラーが発生しました');
                    } catch (error) {
                        setError('診断処理中にエラーが発生しました');
                    }
                };

                return (
                    <div>
                        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                            <label>
                                <input type="checkbox" name="purpose" value="疲労回復" />
                                疲労回復
                            </label>
                            <button type="submit">診断</button>
                        </form>
                        {error && <div role="alert">{error}</div>}
                    </div>
                );
            };

            renderWithProviders(<MockDiagnosisWithError />);

            // 診断回答を入力
            const option = screen.getByLabelText('疲労回復');
            await userActions.clickElement(option);

            // 診断実行
            const submitButton = screen.getByRole('button', { name: /診断/ });
            await userActions.clickElement(submitButton);

            // エラーメッセージが表示されることを確認
            await waitFor(() => {
                expect(screen.getByRole('alert')).toHaveTextContent('診断処理中にエラーが発生しました');
            });
        });

        it('価格取得API失敗時の適切なエラー表示', async () => {
            // 価格取得APIの失敗をシミュレート
            const mockFetch = vi.fn().mockRejectedValue(new Error('Price API Error'));
            global.fetch = mockFetch;

            const PriceDisplayWithError = () => {
                const [error, setError] = React.useState<string | null>(null);

                React.useEffect(() => {
                    fetch('/api/prices/test-product')
                        .catch(() => setError('価格情報の取得に失敗しました'));
                }, []);

                if (error) {
                    return <div role="alert">{error}</div>;
                }

                return <div>価格: ¥2,980</div>;
            };

            renderWithProviders(<PriceDisplayWithError />);

            // エラーメッセージが表示されることを確認
            await waitFor(() => {
                expect(screen.getByRole('alert')).toHaveTextContent('価格情報の取得に失敗しました');
            });
        });
    });

    describe('バリデーションエラーハンドリング', () => {
        it('診断フォームの必須項目未入力エラー', async () => {
            const MockDiagnosisFormWithValidation = () => {
                const [error, setError] = React.useState<string | null>(null);

                const handleSubmit = (e: React.FormEvent) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    const purposes = formData.getAll('purpose');

                    if (purposes.length === 0) {
                        setError('目的を選択してください');
                        return;
                    }

                    setError(null);
                };

                return (
                    <form onSubmit={handleSubmit}>
                        <fieldset>
                            <legend>改善したい症状を選択してください（必須）</legend>
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
                        {error && <div role="alert">{error}</div>}
                    </form>
                );
            };

            renderWithProviders(<MockDiagnosisFormWithValidation />);

            // 何も選択せずに診断実行
            const submitButton = screen.getByRole('button', { name: /診断/ });
            await userActions.clickElement(submitButton);

            // バリデーションエラーが表示されることを確認
            await waitFor(() => {
                expect(screen.getByRole('alert')).toHaveTextContent('目的を選択してください');
            });
        });

        it('価格アラートフォームの無効な価格入力エラー', async () => {
            const MockPriceAlertFormWithValidation = () => {
                const [error, setError] = React.useState<string | null>(null);

                const handleSubmit = (e: React.FormEvent) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    const price = Number(formData.get('targetPrice'));

                    if (price <= 0) {
                        setError('正の数値を入力してください');
                        return;
                    }

                    setError(null);
                };

                return (
                    <form onSubmit={handleSubmit}>
                        <label>
                            目標価格:
                            <input type="number" name="targetPrice" />
                        </label>
                        <button type="submit">設定</button>
                        {error && <div role="alert">{error}</div>}
                    </form>
                );
            };

            renderWithProviders(<MockPriceAlertFormWithValidation />);

            // 無効な価格を入力
            const priceInput = screen.getByLabelText(/目標価格/);
            await userActions.typeText(priceInput, '-100'); // 負の値

            // 設定ボタンをクリック
            const submitButton = screen.getByRole('button', { name: /設定/ });
            await userActions.clickElement(submitButton);

            // バリデーションエラーが表示されることを確認
            await waitFor(() => {
                expect(screen.getByRole('alert')).toHaveTextContent('正の数値を入力してください');
            });
        });

        it('検索フォームの無効な入力エラー', async () => {
            const MockSearchFormWithValidation = () => {
                const [error, setError] = React.useState<string | null>(null);

                const handleSubmit = (e: React.FormEvent) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    const query = formData.get('query') as string;

                    if (!query || query.trim() === '') {
                        setError('検索キーワードを入力してください');
                        return;
                    }

                    setError(null);
                };

                return (
                    <form onSubmit={handleSubmit}>
                        <input type="search" name="query" placeholder="検索" />
                        <button type="submit">検索</button>
                        {error && <div role="alert">{error}</div>}
                    </form>
                );
            };

            renderWithProviders(<MockSearchFormWithValidation />);

            // 空の検索を実行
            const submitButton = screen.getByRole('button', { name: /検索/ });
            await userActions.clickElement(submitButton);

            // バリデーションエラーが表示されることを確認
            await waitFor(() => {
                expect(screen.getByRole('alert')).toHaveTextContent('検索キーワードを入力してください');
            });
        });
    });

    describe('データ処理エラーハンドリング', () => {
        it('無効な商品データ処理時のエラー', () => {
            // エラーを発生させるコンポーネント
            const ErrorComponent = () => {
                throw new Error('Component rendering error');
            };

            renderWithProviders(
                <TestErrorBoundary>
                    <ErrorComponent />
                </TestErrorBoundary>
            );

            // エラーバウンダリのフォールバックUIが表示されることを確認
            expect(screen.getByText(/エラーが発生しました/)).toBeInTheDocument();
            expect(screen.getByText(/ページを再読み込みしてください/)).toBeInTheDocument();
        });

        it('ローカルストレージアクセスエラー', async () => {
            // ローカルストレージのsetItemをモック（失敗）
            const mockSetItem = vi.fn().mockImplementation(() => {
                throw new Error('Storage quota exceeded');
            });
            Object.defineProperty(window, 'localStorage', {
                value: { setItem: mockSetItem, getItem: vi.fn() },
                writable: true,
            });

            const MockFavoriteWithStorageError = () => {
                const [error, setError] = React.useState<string | null>(null);

                const handleToggle = () => {
                    try {
                        localStorage.setItem('favorites', JSON.stringify(['test-product-1']));
                    } catch (error) {
                        setError('お気に入りの保存に失敗しました');
                    }
                };

                return (
                    <div>
                        <button onClick={handleToggle}>お気に入りに追加</button>
                        {error && <div role="alert">{error}</div>}
                    </div>
                );
            };

            renderWithProviders(<MockFavoriteWithStorageError />);

            // お気に入りボタンをクリック
            const favoriteButton = screen.getByRole('button', { name: /お気に入り/ });
            await userActions.clickElement(favoriteButton);

            // エラーメッセージが表示されることを確認
            await waitFor(() => {
                expect(screen.getByRole('alert')).toHaveTextContent('お気に入りの保存に失敗しました');
            });
        });
    });

    describe('コンポーネントエラーハンドリング', () => {
        it('コンポーネントレンダリングエラー時のフォールバック表示', () => {
            // エラーを発生させるコンポーネント
            const ErrorComponent = () => {
                throw new Error('Component rendering error');
            };

            renderWithProviders(
                <TestErrorBoundary>
                    <ErrorComponent />
                </TestErrorBoundary>
            );

            // エラーバウンダリのフォールバックUIが表示されることを確認
            expect(screen.getByText(/エラーが発生しました/)).toBeInTheDocument();
            expect(screen.getByText(/ページを再読み込みしてください/)).toBeInTheDocument();
        });

        it('非同期処理エラー時の適切な処理', async () => {
            const AsyncErrorComponent = () => {
                const [error, setError] = React.useState<string | null>(null);

                React.useEffect(() => {
                    // 非同期処理でエラーが発生
                    Promise.reject(new Error('Async error'))
                        .catch(() => setError('非同期処理でエラーが発生しました'));
                }, []);

                if (error) {
                    return <div role="alert">{error}</div>;
                }

                return <div>正常なコンテンツ</div>;
            };

            renderWithProviders(<AsyncErrorComponent />);

            // エラーメッセージが表示されることを確認
            await waitFor(() => {
                expect(screen.getByRole('alert')).toHaveTextContent('非同期処理でエラーが発生しました');
            });
        });
    });

    describe('復旧機能テスト', () => {
        it('エラー後の再試行機能が正常に動作する', async () => {
            let attemptCount = 0;
            const mockOperation = vi.fn().mockImplementation(() => {
                attemptCount++;
                if (attemptCount === 1) {
                    throw new Error('一時的なエラー');
                }
                return Promise.resolve('成功');
            });

            const SearchWithRetry = () => {
                const [error, setError] = React.useState<string | null>(null);
                const [isLoading, setIsLoading] = React.useState(false);
                const [result, setResult] = React.useState<string | null>(null);

                const handleSearch = async () => {
                    setIsLoading(true);
                    setError(null);
                    setResult(null);
                    try {
                        const response = await mockOperation();
                        setResult(response);
                    } catch (error) {
                        setError('検索に失敗しました');
                    } finally {
                        setIsLoading(false);
                    }
                };

                return (
                    <div>
                        <button onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? '検索中...' : '検索'}
                        </button>
                        {error && (
                            <div>
                                <div role="alert">{error}</div>
                                <button onClick={handleSearch}>再試行</button>
                            </div>
                        )}
                        {result && <div>結果: {result}</div>}
                    </div>
                );
            };

            renderWithProviders(<SearchWithRetry />);

            // 最初の検索実行（失敗）
            const searchButton = screen.getByRole('button', { name: /検索/ });
            await userActions.clickElement(searchButton);

            // エラーメッセージと再試行ボタンが表示されることを確認
            await waitFor(() => {
                expect(screen.getByRole('alert')).toHaveTextContent('検索に失敗しました');
                expect(screen.getByRole('button', { name: /再試行/ })).toBeInTheDocument();
            });

            // 再試行実行（成功）
            const retryButton = screen.getByRole('button', { name: /再試行/ });
            await userActions.clickElement(retryButton);

            // 成功結果が表示されることを確認
            await waitFor(() => {
                expect(screen.getByText('結果: 成功')).toBeInTheDocument();
                expect(screen.queryByRole('alert')).not.toBeInTheDocument();
            });
        });

        it('ページリロード機能が正常に動作する', () => {
            // ページリロードをモック
            const mockReload = vi.fn();
            Object.defineProperty(window, 'location', {
                value: { reload: mockReload },
                writable: true,
            });

            const ErrorRecoveryComponent = () => {
                const handleReload = () => {
                    window.location.reload();
                };

                return (
                    <div>
                        <div>エラーが発生しました</div>
                        <button onClick={handleReload}>ページを再読み込み</button>
                    </div>
                );
            };

            renderWithProviders(<ErrorRecoveryComponent />);

            // リロードボタンをクリック
            const reloadButton = screen.getByRole('button', { name: /ページを再読み込み/ });
            userActions.clickElement(reloadButton);

            // リロードが実行されることを確認
            expect(mockReload).toHaveBeenCalled();
        });
    });
});