import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AIRecommendationSearchBar } from '../AIRecommendationSearchBar';

// ai-recommendationsモジュールをモック
vi.mock('@/lib/ai-recommendations', () => ({
    generateRecommendations: vi.fn().mockReturnValue([]),
    getPopularRecommendations: vi.fn().mockReturnValue([
        {
            id: '1',
            title: 'ビタミンC 1000mg',
            reason: '免疫力向上に効果的で、コストパフォーマンスが優秀です',
            confidence: 0.95,
            category: 'cost-effective',
            tags: ['ビタミン', '免疫'],
            popularityScore: 0.92,
            evidenceLevel: 'high',
            priceRange: [800, 1500],
        },
    ]),
    createDebouncedRecommendationGenerator: vi.fn().mockReturnValue(
        vi.fn().mockResolvedValue([])
    ),
}));

describe('AIRecommendationSearchBar', () => {
    const mockOnSearch = vi.fn();

    beforeEach(() => {
        mockOnSearch.mockClear();
    });

    describe('基本機能', () => {
        it('正常にレンダリングされる', () => {
            render(<AIRecommendationSearchBar onSearch={mockOnSearch} />);

            expect(screen.getByPlaceholderText('サプリメント名や成分名で検索...')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: '検索' })).toBeInTheDocument();
        });

        it('カスタムプレースホルダーが表示される', () => {
            render(
                <AIRecommendationSearchBar
                    onSearch={mockOnSearch}
                    placeholder="カスタム検索..."
                />
            );

            expect(screen.getByPlaceholderText('カスタム検索...')).toBeInTheDocument();
        });

        it('検索実行時にonSearchが呼ばれる', () => {
            render(<AIRecommendationSearchBar onSearch={mockOnSearch} />);

            const input = screen.getByPlaceholderText('サプリメント名や成分名で検索...');
            const button = screen.getByRole('button', { name: '検索' });

            fireEvent.change(input, { target: { value: 'ビタミンC' } });
            fireEvent.click(button);

            expect(mockOnSearch).toHaveBeenCalledWith('ビタミンC');
        });
    });

    describe('プロパティ', () => {
        it('sizeプロパティが正しく適用される', () => {
            render(
                <AIRecommendationSearchBar
                    onSearch={mockOnSearch}
                    size="small"
                />
            );

            const input = screen.getByPlaceholderText('サプリメント名や成分名で検索...');
            expect(input).toHaveClass('h-12');
        });

        it('maxRecommendationsプロパティが設定される', () => {
            render(
                <AIRecommendationSearchBar
                    onSearch={mockOnSearch}
                    maxRecommendations={3}
                />
            );

            // コンポーネントが正常にレンダリングされることを確認
            expect(screen.getByPlaceholderText('サプリメント名や成分名で検索...')).toBeInTheDocument();
        });

        it('enablePopularOnFocusプロパティが設定される', () => {
            render(
                <AIRecommendationSearchBar
                    onSearch={mockOnSearch}
                    enablePopularOnFocus={false}
                />
            );

            // コンポーネントが正常にレンダリングされることを確認
            expect(screen.getByPlaceholderText('サプリメント名や成分名で検索...')).toBeInTheDocument();
        });
    });

    describe('ユーザーコンテキスト', () => {
        it('ユーザーコンテキストが設定される', () => {
            const userContext = {
                preferences: {
                    priceRange: [1000, 2000] as [number, number],
                    categories: ['ビタミン'],
                },
            };

            render(
                <AIRecommendationSearchBar
                    onSearch={mockOnSearch}
                    userContext={userContext}
                />
            );

            // コンポーネントが正常にレンダリングされることを確認
            expect(screen.getByPlaceholderText('サプリメント名や成分名で検索...')).toBeInTheDocument();
        });
    });

    describe('アクセシビリティ', () => {
        it('検索ボタンが適切にラベル付けされている', () => {
            render(<AIRecommendationSearchBar onSearch={mockOnSearch} />);

            const button = screen.getByRole('button', { name: '検索' });
            expect(button).toBeInTheDocument();
        });

        it('入力フィールドが適切にラベル付けされている', () => {
            render(<AIRecommendationSearchBar onSearch={mockOnSearch} />);

            const input = screen.getByPlaceholderText('サプリメント名や成分名で検索...');
            expect(input).toHaveAttribute('type', 'text');
        });
    });

    describe('エラーハンドリング', () => {
        it('onSearchが未定義でもエラーが発生しない', () => {
            expect(() => {
                render(<AIRecommendationSearchBar onSearch={mockOnSearch} />);
            }).not.toThrow();
        });

        it('不正なプロパティでもエラーが発生しない', () => {
            expect(() => {
                render(
                    <AIRecommendationSearchBar
                        onSearch={mockOnSearch}
                        maxRecommendations={-1}
                        size="invalid" as any
                    />
                );
            }).not.toThrow();
        });
    });
});