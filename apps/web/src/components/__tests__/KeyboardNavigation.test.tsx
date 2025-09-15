/**
 * キーボードナビゲーション統合テスト
 * Requirements: 8.1 - キーボードのみで検索→比較→詳細カードCTAまで到達できる
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HeroSearch from '../HeroSearch';
import PopularComparisonsSection from '../PopularComparisonsSection';
import SkipLinks from '../SkipLinks';

// LocaleContext のモック
vi.mock('@/contexts/LocaleContext', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

describe('キーボードナビゲーション統合テスト', () => {
    const user = userEvent.setup();

    beforeEach(() => {
        // DOM をクリア
        document.body.innerHTML = '';
    });

    describe('スキップリンク', () => {
        it('Tabキーでスキップリンクにフォーカスできる', async () => {
            render(<SkipLinks />);

            // Tabキーでスキップリンクにフォーカス
            await user.tab();

            const skipLink = screen.getByText('メインコンテンツにスキップ');
            expect(skipLink).toHaveFocus();
        });

        it('Enterキーでスキップリンクを活性化できる', async () => {
            // メインコンテンツ要素を作成
            const mainContent = document.createElement('main');
            mainContent.id = 'main-content';
            mainContent.tabIndex = -1;
            // scrollIntoViewをモック
            mainContent.scrollIntoView = vi.fn();
            document.body.appendChild(mainContent);

            render(<SkipLinks />);

            const skipLink = screen.getByText('メインコンテンツにスキップ');
            skipLink.focus();

            // Enterキーを押す
            await user.keyboard('{Enter}');

            // メインコンテンツにフォーカスが移動することを確認
            await waitFor(() => {
                expect(mainContent).toHaveFocus();
            });
        });
    });

    describe('検索バー', () => {
        it('キーボードで検索バーを操作できる', async () => {
            const mockOnSearch = vi.fn();
            render(<HeroSearch onSearch={mockOnSearch} />);

            const searchInput = screen.getByRole('combobox');

            // 検索バーにフォーカス
            await user.click(searchInput);
            expect(searchInput).toHaveFocus();

            // テキストを入力
            await user.type(searchInput, 'ビタミンD');
            expect(searchInput).toHaveValue('ビタミンD');

            // Enterキーで検索実行
            await user.keyboard('{Enter}');
            expect(mockOnSearch).toHaveBeenCalledWith('ビタミンD');
        });

        it('矢印キーでAIサジェストを選択できる', async () => {
            const mockOnSearch = vi.fn();
            const aiSuggestions = [
                {
                    id: '1',
                    text: '疲労回復に効果的なビタミンB群を探す',
                    intent: 'purpose' as const,
                    confidence: 0.92,
                },
                {
                    id: '2',
                    text: '美容効果の高いコラーゲンサプリを比較',
                    intent: 'purpose' as const,
                    confidence: 0.88,
                },
            ];

            render(<HeroSearch onSearch={mockOnSearch} aiSuggestions={aiSuggestions} />);

            const searchInput = screen.getByRole('combobox');

            // 検索バーにフォーカスしてサジェストを表示
            await user.click(searchInput);

            // サジェストが表示されるまで待機
            await waitFor(() => {
                expect(screen.getByText('疲労回復に効果的なビタミンB群を探す')).toBeInTheDocument();
            });

            // 下矢印キーで最初のサジェストを選択
            await user.keyboard('{ArrowDown}');

            const firstSuggestion = screen.getByRole('option', { name: /疲労回復に効果的なビタミンB群を探す/ });
            expect(firstSuggestion).toHaveFocus();

            // Enterキーで選択
            await user.keyboard('{Enter}');
            expect(mockOnSearch).toHaveBeenCalledWith('疲労回復に効果的なビタミンB群を探す');
        });

        it('Escapeキーでサジェストを閉じることができる', async () => {
            const aiSuggestions = [
                {
                    id: '1',
                    text: '疲労回復に効果的なビタミンB群を探す',
                    intent: 'purpose' as const,
                    confidence: 0.92,
                },
            ];

            render(<HeroSearch aiSuggestions={aiSuggestions} />);

            const searchInput = screen.getByRole('combobox');

            // 検索バーにフォーカスしてサジェストを表示
            await user.click(searchInput);

            // サジェストが表示されることを確認
            await waitFor(() => {
                expect(screen.getByText('疲労回復に効果的なビタミンB群を探す')).toBeInTheDocument();
            });

            // Escapeキーでサジェストを閉じる
            await user.keyboard('{Escape}');

            // サジェストが非表示になることを確認
            await waitFor(() => {
                expect(screen.queryByText('疲労回復に効果的なビタミンB群を探す')).not.toBeInTheDocument();
            });

            // フォーカスが検索バーに戻ることを確認
            expect(searchInput).toHaveFocus();
        });
    });

    describe('比較カード', () => {
        it('Tabキーで比較カード内の要素を順次移動できる', async () => {
            render(<PopularComparisonsSection />);

            // 最初のカードのお気に入りボタンにフォーカス
            const favoriteButtons = screen.getAllByLabelText(/お気に入り/);
            await user.tab();
            // 複数回Tabを押して最初のお気に入りボタンに到達
            let currentElement = document.activeElement;
            while (currentElement !== favoriteButtons[0] && favoriteButtons.includes(currentElement as HTMLElement)) {
                await user.tab();
                currentElement = document.activeElement;
            }

            // 詳細ボタンにフォーカス移動
            await user.tab();
            const detailButtons = screen.getAllByText('詳細を見る');
            expect(detailButtons[0]).toHaveFocus();
        });

        it('Enterキーで詳細ボタンを活性化できる', async () => {
            const mockOnViewDetails = vi.fn();
            render(<PopularComparisonsSection onViewDetails={mockOnViewDetails} />);

            const detailButton = screen.getAllByText('詳細を見る')[0];
            detailButton.focus();

            // Enterキーを押す
            await user.keyboard('{Enter}');

            expect(mockOnViewDetails).toHaveBeenCalled();
        });

        it('スペースキーで詳細ボタンを活性化できる', async () => {
            const mockOnViewDetails = vi.fn();
            render(<PopularComparisonsSection onViewDetails={mockOnViewDetails} />);

            const detailButton = screen.getAllByText('詳細を見る')[0];
            detailButton.focus();

            // スペースキーを押す
            await user.keyboard(' ');

            expect(mockOnViewDetails).toHaveBeenCalled();
        });
    });

    describe('フォーカス管理', () => {
        it('フォーカス可能な要素が適切なフォーカスリングを持つ', () => {
            render(
                <div>
                    <SkipLinks />
                    <HeroSearch />
                    <PopularComparisonsSection />
                </div>
            );

            // フォーカス可能な要素を取得
            const focusableElements = screen.getAllByRole('button').concat(
                screen.getAllByRole('combobox'),
                screen.getAllByRole('link')
            );

            focusableElements.forEach(element => {
                // フォーカスリングのスタイルが適用されていることを確認
                const styles = window.getComputedStyle(element);
                const hasFocusStyles =
                    element.className.includes('focus:') ||
                    element.className.includes('focus-visible:') ||
                    styles.outline !== 'none';

                expect(hasFocusStyles).toBe(true);
            });
        });

        it('ARIA属性が適切に設定されている', () => {
            render(
                <div>
                    <HeroSearch />
                    <PopularComparisonsSection />
                </div>
            );

            // 検索バーのARIA属性を確認
            const searchInput = screen.getByRole('combobox');
            expect(searchInput).toHaveAttribute('aria-label');
            expect(searchInput).toHaveAttribute('aria-expanded');

            // 比較カードのARIA属性を確認
            const articles = screen.getAllByRole('article');
            articles.forEach(article => {
                expect(article).toHaveAttribute('aria-labelledby');
                expect(article).toHaveAttribute('aria-describedby');
            });
        });
    });
});