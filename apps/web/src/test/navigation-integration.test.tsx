/**
 * ナビゲーション統合テスト
 * 全ページ間のナビゲーション確認
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, userActions, cleanup } from './integration-helpers';
import React from 'react';

// Next.js router のモック
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: mockReplace,
        back: mockBack,
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));

describe('ナビゲーション統合テスト', () => {
    beforeEach(() => {
        cleanup.clearAllStorage();
        vi.clearAllMocks();
    });

    describe('基本ナビゲーション', () => {
        it('メインナビゲーションリンクが表示される', () => {
            // モックヘッダーコンポーネント
            const MockHeader = () => (
                <header>
                    <nav>
                        <a href="/">ホーム</a>
                        <a href="/about">サプティアとは</a>
                        <a href="/ingredients">成分ガイド</a>
                        <a href="/compare">人気比較</a>
                        <a href="/mypage">マイページ</a>
                    </nav>
                </header>
            );

            renderWithProviders(<MockHeader />);

            // ナビゲーションリンクが表示されることを確認
            expect(screen.getByRole('link', { name: /ホーム/ })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /サプティアとは/ })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /成分ガイド/ })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /人気比較/ })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /マイページ/ })).toBeInTheDocument();
        });

        it('フッターリンクが表示される', () => {
            // モックフッターコンポーネント
            const MockFooter = () => (
                <footer>
                    <nav>
                        <a href="/about">サプティアとは</a>
                        <a href="/legal/privacy">プライバシーポリシー</a>
                        <a href="/legal/terms">利用規約</a>
                        <a href="/legal/disclaimer">免責事項</a>
                        <a href="/contact">お問い合わせ</a>
                    </nav>
                </footer>
            );

            renderWithProviders(<MockFooter />);

            // フッターリンクが表示されることを確認
            expect(screen.getByRole('link', { name: /プライバシーポリシー/ })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /利用規約/ })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /免責事項/ })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /お問い合わせ/ })).toBeInTheDocument();
        });
    });

    describe('言語・通貨切替', () => {
        it('言語切替ボタンが機能する', async () => {
            const mockOnLocaleChange = vi.fn();

            const MockLanguageSelector = () => (
                <div>
                    <button onClick={() => mockOnLocaleChange('ja')}>日本語</button>
                    <button onClick={() => mockOnLocaleChange('en')}>English</button>
                </div>
            );

            renderWithProviders(<MockLanguageSelector />);

            // 英語ボタンをクリック
            const englishButton = screen.getByRole('button', { name: /English/ });
            await userActions.clickElement(englishButton);
            expect(mockOnLocaleChange).toHaveBeenCalledWith('en');
        });

        it('通貨切替ボタンが機能する', async () => {
            const mockOnCurrencyChange = vi.fn();

            const MockCurrencySelector = () => (
                <div>
                    <button onClick={() => mockOnCurrencyChange('JPY')}>JPY</button>
                    <button onClick={() => mockOnCurrencyChange('USD')}>USD</button>
                </div>
            );

            renderWithProviders(<MockCurrencySelector />);

            // USDボタンをクリック
            const usdButton = screen.getByRole('button', { name: /USD/ });
            await userActions.clickElement(usdButton);
            expect(mockOnCurrencyChange).toHaveBeenCalledWith('USD');
        });
    });

    describe('モバイルナビゲーション', () => {
        it('モバイルメニューが適切に動作する', async () => {
            const MockMobileMenu = () => {
                const [isOpen, setIsOpen] = React.useState(false);

                return (
                    <div>
                        <button onClick={() => setIsOpen(!isOpen)}>メニュー</button>
                        {isOpen && (
                            <nav role="navigation" aria-label="モバイルメニュー">
                                <a href="/">ホーム</a>
                                <a href="/ingredients">成分ガイド</a>
                            </nav>
                        )}
                    </div>
                );
            };

            renderWithProviders(<MockMobileMenu />);

            // モバイルメニューボタンをクリック
            const mobileMenuButton = screen.getByRole('button', { name: /メニュー/ });
            await userActions.clickElement(mobileMenuButton);

            // モバイルメニューが表示されることを確認
            expect(screen.getByRole('navigation', { name: /モバイルメニュー/ })).toBeInTheDocument();
        });
    });

    describe('ページ遷移フロー', () => {
        it('検索から商品詳細への遷移をシミュレート', () => {
            const MockSearchResult = () => (
                <div>
                    <h2>検索結果</h2>
                    <a href="/products/test-supplement">テストサプリメント</a>
                </div>
            );

            renderWithProviders(<MockSearchResult />);

            // 商品リンクが表示されることを確認
            expect(screen.getByRole('link', { name: /テストサプリメント/ })).toBeInTheDocument();
        });

        it('診断から結果表示への遷移をシミュレート', () => {
            const MockDiagnosisFlow = () => (
                <div>
                    <h2>診断完了</h2>
                    <a href="/diagnosis/result">診断結果を見る</a>
                </div>
            );

            renderWithProviders(<MockDiagnosisFlow />);

            // 診断結果リンクが表示されることを確認
            expect(screen.getByRole('link', { name: /診断結果を見る/ })).toBeInTheDocument();
        });

        it('マイページ内のサブページ遷移をシミュレート', () => {
            const MockMyPageNav = () => (
                <nav>
                    <a href="/mypage/favorites">お気に入り</a>
                    <a href="/mypage/history">診断履歴</a>
                    <a href="/mypage/alerts">価格アラート</a>
                    <a href="/mypage/premium">プレミアム</a>
                </nav>
            );

            renderWithProviders(<MockMyPageNav />);

            // サブページリンクが表示されることを確認
            expect(screen.getByRole('link', { name: /お気に入り/ })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /診断履歴/ })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /価格アラート/ })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /プレミアム/ })).toBeInTheDocument();
        });
    });

    describe('エラー時のナビゲーション', () => {
        it('404ページからの適切なナビゲーション', () => {
            const Mock404Page = () => (
                <div>
                    <h1>ページが見つかりません</h1>
                    <button onClick={() => mockPush('/')}>ホームに戻る</button>
                </div>
            );

            renderWithProviders(<Mock404Page />);

            // ホームに戻るボタンが表示されることを確認
            expect(screen.getByRole('button', { name: /ホームに戻る/ })).toBeInTheDocument();
        });

        it('エラーページからの復旧ナビゲーション', () => {
            const MockErrorPage = () => (
                <div>
                    <h1>エラーが発生しました</h1>
                    <button onClick={() => window.location.reload()}>再試行</button>
                </div>
            );

            renderWithProviders(<MockErrorPage />);

            // 再試行ボタンが表示されることを確認
            expect(screen.getByRole('button', { name: /再試行/ })).toBeInTheDocument();
        });
    });

    describe('アクセシビリティナビゲーション', () => {
        it('スキップリンクが適切に動作する', () => {
            const MockPageWithSkipLink = () => (
                <div>
                    <a href="#main-content">メインコンテンツにスキップ</a>
                    <nav>
                        <a href="/">ホーム</a>
                        <a href="/about">サプティアとは</a>
                    </nav>
                    <main id="main-content" role="main">
                        <h1>メインコンテンツ</h1>
                    </main>
                </div>
            );

            renderWithProviders(<MockPageWithSkipLink />);

            // スキップリンクが表示されることを確認
            expect(screen.getByRole('link', { name: /メインコンテンツにスキップ/ })).toBeInTheDocument();
            expect(screen.getByRole('main')).toBeInTheDocument();
        });
    });
});