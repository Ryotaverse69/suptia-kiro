'use client';

import React, { useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
// 簡素化されたロケール設定
const locales = ['ja', 'en'] as const;
type Locale = typeof locales[number];

interface LanguageCurrencySelectorProps {
    className?: string;
}

export default function LanguageCurrencySelector({ className = '' }: LanguageCurrencySelectorProps) {
    const { locale, currency, setLocale, setCurrency } = useLocale();
    const [isOpen, setIsOpen] = useState(false);

    const languageNames = {
        ja: '日本語',
        en: 'English',
    };

    const currencyOptions = [
        { code: 'JPY', symbol: '¥', name: '円' },
        { code: 'USD', symbol: '$', name: 'Dollar' },
    ];

    const handleLocaleChange = (newLocale: Locale) => {
        setLocale(newLocale);
        setIsOpen(false);
    };

    const handleCurrencyChange = (newCurrency: string) => {
        setCurrency(newCurrency);
    };

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md"
                aria-expanded={isOpen}
                aria-haspopup="true"
                aria-label="言語・通貨設定"
            >
                <span className="text-lg">🌐</span>
                <span>{languageNames[locale]}</span>
                <span className="text-xs text-gray-500">
                    {currencyOptions.find(c => c.code === currency)?.symbol}
                </span>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <>
                    {/* オーバーレイ */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                        aria-hidden="true"
                    />

                    {/* ドロップダウンメニュー */}
                    <div className="absolute right-0 z-20 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="py-1">
                            {/* 言語選択 */}
                            <div className="px-4 py-2 text-sm font-medium text-gray-900 border-b border-gray-200">
                                言語 / Language
                            </div>
                            {locales.map((loc) => (
                                <button
                                    key={loc}
                                    onClick={() => handleLocaleChange(loc)}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${locale === loc ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                                        }`}
                                    role="menuitem"
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{languageNames[loc]}</span>
                                        {locale === loc && (
                                            <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                </button>
                            ))}

                            {/* 通貨選択 */}
                            <div className="px-4 py-2 text-sm font-medium text-gray-900 border-b border-t border-gray-200 mt-2">
                                通貨 / Currency
                            </div>
                            {currencyOptions.map((curr) => (
                                <button
                                    key={curr.code}
                                    onClick={() => handleCurrencyChange(curr.code)}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${currency === curr.code ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                                        }`}
                                    role="menuitem"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center space-x-2">
                                            <span className="font-mono">{curr.symbol}</span>
                                            <span>{curr.name}</span>
                                            <span className="text-xs text-gray-500">({curr.code})</span>
                                        </span>
                                        {currency === curr.code && (
                                            <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}