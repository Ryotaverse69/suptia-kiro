'use client';

import React from 'react';
import { useSkipLinks } from '@/hooks/useAccessibility';

export const SkipLinks: React.FC = () => {
    const { skipToContent, skipToNavigation } = useSkipLinks();

    return (
        <div className="sr-only focus-within:not-sr-only">
            <a
                href="#main-content"
                onClick={(e) => {
                    e.preventDefault();
                    skipToContent();
                }}
                className="absolute top-4 left-4 bg-primary-600 text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200"
            >
                メインコンテンツにスキップ
            </a>
            <a
                href="#navigation"
                onClick={(e) => {
                    e.preventDefault();
                    skipToNavigation();
                }}
                className="absolute top-4 left-40 bg-primary-600 text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200"
            >
                ナビゲーションにスキップ
            </a>
        </div>
    );
};