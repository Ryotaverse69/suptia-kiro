'use client';

import { useState, useRef, useEffect } from 'react';
import { useKeyboardNavigation, useAnnouncer } from '@/hooks/useAccessibility';
import { KeyboardNavigation } from '@/lib/accessibility';

// 検索アイコンSVGコンポーネント
const SearchIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
    </svg>
);

export interface Recommendation {
    id: string;
    title: string;
    reason: string;
    confidence: number;
}

export interface SearchBarProps {
    onSearch: (query: string) => void;
    aiRecommendations?: Recommendation[];
    placeholder?: string;
    size?: 'small' | 'large';
    className?: string;
}

export function SearchBar({
    onSearch,
    aiRecommendations = [],
    placeholder = 'サプリメントを検索...',
    size = 'large',
    className = '',
}: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [showRecommendations, setShowRecommendations] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const recommendationRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const { announce } = useAnnouncer();

    // サイズに応じたスタイル
    const sizeClasses = {
        small: {
            container: 'max-w-md',
            input: 'h-12 text-base px-4 pl-12',
            icon: 'w-5 h-5 left-4',
            button: 'h-12 px-6 text-sm',
        },
        large: {
            container: 'max-w-2xl',
            input: 'h-16 text-lg px-6 pl-16',
            icon: 'w-6 h-6 left-6',
            button: 'h-16 px-8 text-base',
        },
    };

    const styles = sizeClasses[size] || sizeClasses.large;

    // 検索実行
    const handleSearch = () => {
        if (query.trim()) {
            onSearch(query.trim());
            setShowRecommendations(false);
        }
    };

    // キーボードナビゲーション
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showRecommendations || aiRecommendations.length === 0) {
            if (e.key === 'Enter') {
                handleSearch();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                const nextIndex = selectedIndex < aiRecommendations.length - 1 ? selectedIndex + 1 : 0;
                setSelectedIndex(nextIndex);
                recommendationRefs.current[nextIndex]?.focus();
                break;
            case 'ArrowUp':
                e.preventDefault();
                const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : aiRecommendations.length - 1;
                setSelectedIndex(prevIndex);
                recommendationRefs.current[prevIndex]?.focus();
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < aiRecommendations.length) {
                    handleRecommendationClick(aiRecommendations[selectedIndex]);
                } else {
                    handleSearch();
                }
                break;
            case 'Escape':
                e.preventDefault();
                setShowRecommendations(false);
                setSelectedIndex(-1);
                inputRef.current?.focus();
                break;
            default:
                if (e.key === 'Enter') {
                    handleSearch();
                }
        }
    };

    // フォーカス管理
    const handleFocus = () => {
        setIsFocused(true);
        if (aiRecommendations.length > 0) {
            setShowRecommendations(true);
            announce(`${aiRecommendations.length}件のAIレコメンドが利用可能です。矢印キーで選択できます。`);
        }
    };

    const handleBlur = (e: React.FocusEvent) => {
        // フォーカスがレコメンド内に移動した場合は閉じない
        if (containerRef.current?.contains(e.relatedTarget as Node)) {
            return;
        }
        setIsFocused(false);
        setShowRecommendations(false);
        setSelectedIndex(-1);
    };

    // レコメンド選択
    const handleRecommendationClick = (recommendation: Recommendation) => {
        setQuery(recommendation.title);
        onSearch(recommendation.title);
        setShowRecommendations(false);
        setSelectedIndex(-1);
        announce(`${recommendation.title}を選択しました`);
        inputRef.current?.focus();
    };

    // 外部クリックでレコメンドを閉じる
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowRecommendations(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className={`relative w-full ${styles.container} mx-auto ${className}`}>
            {/* 検索入力フィールド */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <SearchIcon className={`${styles.icon} text-gray-400`} />
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    role="combobox"
                    aria-expanded={showRecommendations}
                    aria-haspopup="listbox"
                    aria-controls={showRecommendations ? 'search-recommendations' : undefined}
                    aria-activedescendant={selectedIndex >= 0 ? `recommendation-${selectedIndex}` : undefined}
                    aria-label="サプリメント検索"
                    className={`
            ${styles.input}
            w-full
            border-2 border-gray-200
            rounded-2xl
            bg-white
            shadow-lg
            focus:border-primary-500
            focus:ring-4
            focus:ring-primary-100
            focus:outline-none
            transition-all
            duration-200
            placeholder-gray-400
            ${isFocused ? 'shadow-xl' : ''}
          `}
                />

                {/* 検索ボタン */}
                <button
                    onClick={handleSearch}
                    disabled={!query.trim()}
                    aria-label={`"${query}"を検索`}
                    className={`
            ${styles.button}
            absolute
            right-2
            top-1/2
            -translate-y-1/2
            bg-primary-600
            hover:bg-primary-700
            disabled:bg-gray-300
            disabled:cursor-not-allowed
            text-white
            font-semibold
            rounded-xl
            transition-all
            duration-200
            shadow-md
            hover:shadow-lg
            focus:outline-none
            focus:ring-2
            focus:ring-primary-500
            focus:ring-offset-2
          `}
                >
                    検索
                </button>
            </div>

            {/* AIレコメンド表示 */}
            {showRecommendations && aiRecommendations.length > 0 && (
                <div
                    id="search-recommendations"
                    role="listbox"
                    aria-label="AIレコメンド"
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <span className="text-primary-500" aria-hidden="true">🤖</span>
                            AIレコメンド
                        </h3>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {aiRecommendations.map((recommendation, index) => (
                            <button
                                key={recommendation.id}
                                ref={(el) => {
                                    recommendationRefs.current[index] = el;
                                }}
                                id={`recommendation-${index}`}
                                role="option"
                                aria-selected={selectedIndex === index}
                                onClick={() => handleRecommendationClick(recommendation)}
                                onFocus={() => setSelectedIndex(index)}
                                onBlur={handleBlur}
                                className={`w-full p-4 text-left transition-colors border-b border-gray-50 last:border-b-0 ${selectedIndex === index ? 'bg-primary-50' : 'hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-gray-900 truncate">
                                            {recommendation.title}
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-1 overflow-hidden" style={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical'
                                        }}>
                                            {recommendation.reason}
                                        </p>
                                    </div>

                                    <div className="flex-shrink-0">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-primary-400" aria-hidden="true"></div>
                                            <span className="text-xs text-gray-500" aria-label={`信頼度${Math.round(recommendation.confidence * 100)}パーセント`}>
                                                {Math.round(recommendation.confidence * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="p-3 bg-gray-50 text-center">
                        <p className="text-xs text-gray-500">
                            AIが分析した結果に基づく推奨です
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}