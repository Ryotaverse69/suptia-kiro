'use client';

import { useState, useEffect, useCallback } from 'react';
import { SearchBar, type Recommendation } from './SearchBar';
import {
    generateRecommendations,
    getPopularRecommendations,
    createDebouncedRecommendationGenerator,
    type UserContext,
    type RecommendationItem
} from '@/lib/ai-recommendations';

export interface AIRecommendationSearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
    size?: 'small' | 'large';
    className?: string;
    userContext?: UserContext;
    maxRecommendations?: number;
    enablePopularOnFocus?: boolean;
    variant?: 'default' | 'glass';
}

export function AIRecommendationSearchBar({
    onSearch,
    placeholder = 'サプリメント名や成分名で検索...',
    size = 'large',
    className = '',
    userContext,
    maxRecommendations = 5,
    enablePopularOnFocus = true,
    variant = 'default',
}: AIRecommendationSearchBarProps) {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentQuery, setCurrentQuery] = useState('');

    // デバウンス機能付きレコメンド生成器
    const debouncedGenerate = useCallback(
        createDebouncedRecommendationGenerator(300),
        []
    );

    // レコメンドアイテムをRecommendation形式に変換
    const convertToRecommendation = (item: RecommendationItem): Recommendation => ({
        id: item.id,
        title: item.title,
        reason: item.reason,
        confidence: item.confidence,
    });

    // 検索クエリに基づくレコメンド生成
    const generateRecommendationsForQuery = useCallback(async (query: string) => {
        if (!query.trim()) {
            if (enablePopularOnFocus) {
                const popularItems = getPopularRecommendations(maxRecommendations);
                setRecommendations(popularItems.map(convertToRecommendation));
            } else {
                setRecommendations([]);
            }
            return;
        }

        setIsLoading(true);
        try {
            const items = await debouncedGenerate(query, userContext, maxRecommendations);
            setRecommendations(items.map(convertToRecommendation));
        } catch (error) {
            console.error('レコメンド生成エラー:', error);
            setRecommendations([]);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedGenerate, userContext, maxRecommendations, enablePopularOnFocus]);

    // 検索実行時の処理
    const handleSearch = useCallback((query: string) => {
        setCurrentQuery(query);
        onSearch(query);
    }, [onSearch]);

    // フォーカス時の人気レコメンド表示
    const handleFocus = useCallback(() => {
        if (enablePopularOnFocus && recommendations.length === 0) {
            const popularItems = getPopularRecommendations(maxRecommendations);
            setRecommendations(popularItems.map(convertToRecommendation));
        }
    }, [enablePopularOnFocus, recommendations.length, maxRecommendations]);

    // 入力変更時のレコメンド更新
    useEffect(() => {
        generateRecommendationsForQuery(currentQuery);
    }, [currentQuery, generateRecommendationsForQuery]);

    // ローディング状態のレコメンド
    const loadingRecommendations: Recommendation[] = isLoading ? [
        {
            id: 'loading-1',
            title: '検索中...',
            reason: 'AIがあなたに最適なサプリメントを分析しています',
            confidence: 0,
        }
    ] : [];

    return (
        <div className="relative">
            <SearchBar
                onSearch={handleSearch}
                aiRecommendations={isLoading ? loadingRecommendations : recommendations}
                placeholder={placeholder}
                size={size}
                className={className}
                variant={variant}
            />

            {/* AIレコメンド状態インジケーター */}
            {isLoading && (
                <div className="absolute top-full left-0 right-0 mt-1 flex justify-center">
                    <div className="bg-primary-50 text-primary-600 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                        AI分析中...
                    </div>
                </div>
            )}
        </div>
    );
}

// フック：AIレコメンド機能付きSearchBar
export function useAIRecommendationSearch(
    userContext?: UserContext,
    maxRecommendations: number = 5
) {
    const [query, setQuery] = useState('');
    const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const debouncedGenerate = useCallback(
        createDebouncedRecommendationGenerator(300),
        []
    );

    const search = useCallback(async (searchQuery: string) => {
        setQuery(searchQuery);

        if (!searchQuery.trim()) {
            setRecommendations([]);
            return;
        }

        setIsLoading(true);
        try {
            const items = await debouncedGenerate(searchQuery, userContext, maxRecommendations);
            setRecommendations(items);
        } catch (error) {
            console.error('検索エラー:', error);
            setRecommendations([]);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedGenerate, userContext, maxRecommendations]);

    const getPopular = useCallback(() => {
        const popularItems = getPopularRecommendations(maxRecommendations);
        setRecommendations(popularItems);
    }, [maxRecommendations]);

    return {
        query,
        recommendations,
        isLoading,
        search,
        getPopular,
    };
}
