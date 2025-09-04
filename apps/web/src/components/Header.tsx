"use client";

import { useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import Link from "next/link";

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
    const { locale, currency, setLocale, setCurrency } = useLocale();

    const handleLocaleChange = (newLocale: 'ja' | 'en') => {
        setLocale(newLocale);
        setIsLanguageMenuOpen(false);
    };

    const handleCurrencyChange = (newCurrency: 'JPY' | 'USD') => {
        setCurrency(newCurrency);
        setIsLanguageMenuOpen(false);
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo - サプティア + Suptia */}
                    <Link href="/" className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">S</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                サプティア
                            </span>
                            <span className="text-xs text-gray-500 font-medium -mt-1">
                                Suptia
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav id="navigation" role="navigation" aria-label="メインナビゲーション" className="hidden lg:flex items-center space-x-8">
                        <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200">
                            ホーム
                        </Link>
                        <Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200">
                            サプティアとは
                        </Link>
                        <Link href="/ingredients" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200">
                            成分ガイド
                        </Link>
                        <Link href="/compare" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200">
                            人気比較
                        </Link>
                        <Link href="/mypage" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200">
                            マイページ
                        </Link>
                    </nav>

                    {/* Language/Currency Switcher & Mobile Menu */}
                    <div className="flex items-center space-x-4">
                        {/* Language/Currency Switcher */}
                        <div className="relative">
                            <button
                                onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                                aria-label="言語・通貨切替"
                            >
                                <span className="text-sm font-medium text-gray-700">
                                    {locale === 'ja' ? '日本語' : 'English'}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {currency === 'JPY' ? '¥' : '$'}
                                </span>
                                <svg
                                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isLanguageMenuOpen ? 'rotate-180' : ''
                                        }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Language/Currency Dropdown */}
                            {isLanguageMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                                        言語・通貨
                                    </div>
                                    <button
                                        onClick={() => {
                                            handleLocaleChange('ja');
                                            handleCurrencyChange('JPY');
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors duration-200 ${locale === 'ja' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>日本語</span>
                                            <span className="text-xs text-gray-500">¥ JPY</span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleLocaleChange('en');
                                            handleCurrencyChange('USD');
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors duration-200 ${locale === 'en' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>English</span>
                                            <span className="text-xs text-gray-500">$ USD</span>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                            aria-label="メニューを開く"
                        >
                            <svg
                                className="w-6 h-6 text-gray-700"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                {isMenuOpen ? (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="lg:hidden py-4 border-t border-gray-200">
                        <nav role="navigation" aria-label="モバイルナビゲーション" className="flex flex-col space-y-4">
                            <Link
                                href="/"
                                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 py-2"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                ホーム
                            </Link>
                            <Link
                                href="/about"
                                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 py-2"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                サプティアとは
                            </Link>
                            <Link
                                href="/ingredients"
                                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 py-2"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                成分ガイド
                            </Link>
                            <Link
                                href="/compare"
                                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 py-2"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                人気比較
                            </Link>
                            <Link
                                href="/mypage"
                                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 py-2"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                マイページ
                            </Link>
                        </nav>
                    </div>
                )}
            </div>

            {/* Backdrop for dropdowns */}
            {(isLanguageMenuOpen || isMenuOpen) && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => {
                        setIsLanguageMenuOpen(false);
                        setIsMenuOpen(false);
                    }}
                />
            )}
        </header>
    );
}
