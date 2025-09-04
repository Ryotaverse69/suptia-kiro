/**
 * レイジーローディング用のコンポーネント定義
 * パフォーマンス最適化のため、重いコンポーネントを動的インポートで遅延読み込み
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// ローディングコンポーネント
const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">読み込み中...</span>
    </div>
);

// 比較テーブル（重いコンポーネント）
export const LazyComparisonTable = dynamic(
    () => import('./ComparisonTable').then(mod => ({ default: mod.ComparisonTable })),
    {
        loading: () => <LoadingSpinner />,
        ssr: false, // クライアントサイドでのみ読み込み
    }
);

// 価格履歴チャート（Chart.jsを使用する重いコンポーネント）
export const LazyPriceHistoryChart = dynamic(
    () => import('./PriceHistoryChart').then(mod => ({ default: mod.PriceHistoryChart })),
    {
        loading: () => <LoadingSpinner />,
        ssr: false,
    }
);

// 診断結果（複雑な計算を含む）
export const LazyDiagnosisResult = dynamic(
    () => import('./diagnosis/DiagnosisResult'),
    {
        loading: () => <LoadingSpinner />,
        ssr: true, // SEOのためSSRを有効
    }
);

// 成分詳細モーダル（大量のデータを含む）
export const LazyIngredientDetailModal = dynamic(
    () => import('./IngredientDetailModal'),
    {
        loading: () => <LoadingSpinner />,
        ssr: false,
    }
);

// 商品比較モーダル
export const LazyProductComparisonModal = dynamic(
    () => import('./ProductComparisonModal').then(mod => ({ default: mod.ProductComparisonModal })),
    {
        loading: () => <LoadingSpinner />,
        ssr: false,
    }
);

// AIレコメンド検索バー（AIロジックを含む）
export const LazyAIRecommendationSearchBar = dynamic(
    () => import('./AIRecommendationSearchBar').then(mod => ({ default: mod.AIRecommendationSearchBar })),
    {
        loading: () => (
            <div className="w-full max-w-2xl mx-auto">
                <div className="animate-pulse">
                    <div className="h-12 bg-gray-200 rounded-lg"></div>
                </div>
            </div>
        ),
        ssr: false,
    }
);

// 高度なフィルタリング機能
export const LazyAdvancedFilters = dynamic(
    () => import('./ComparisonFilters').then(mod => ({ default: mod.ComparisonFilters })),
    {
        loading: () => <LoadingSpinner />,
        ssr: false,
    }
);

// パフォーマンス監視用のコンポーネント
export const LazyPerformanceMonitor = dynamic(
    () => import('./PerformanceMonitor'),
    {
        loading: () => null,
        ssr: false,
    }
);

// 型定義
export interface LazyComponentProps {
    fallback?: () => JSX.Element;
    ssr?: boolean;
}

// 汎用的なレイジーローディングヘルパー
export function createLazyComponent<T = any>(
    importFn: () => Promise<{ default: ComponentType<T> }>,
    options: LazyComponentProps = {}
) {
    return dynamic(importFn, {
        loading: options.fallback || (() => <LoadingSpinner />),
        ssr: options.ssr ?? true,
    });
}

// 条件付きレイジーローディング
export function createConditionalLazyComponent<T = any>(
    importFn: () => Promise<{ default: ComponentType<T> }>,
    condition: boolean,
    fallback?: ComponentType<T>
) {
    if (!condition && fallback) {
        return fallback;
    }

    return dynamic(importFn, {
        loading: () => <LoadingSpinner />,
        ssr: false,
    });
}