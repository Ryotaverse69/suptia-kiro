'use client';

import { useState, useEffect } from 'react';
import { isFavorite, addToFavorites, removeFromFavorites, type FavoriteProduct } from '../lib/favorites';

interface FavoriteButtonProps {
    productId: string;
    productName: string;
    brand?: string;
    category?: string;
    price?: number;
    currency?: string;
    className?: string;
}

/**
 * お気に入りボタンコンポーネント
 * favoritesライブラリを使用してお気に入り状態を管理
 */
export function FavoriteButton({
    productId,
    productName,
    brand,
    category,
    price,
    currency = 'JPY',
    className = ''
}: FavoriteButtonProps) {
    const [isFav, setIsFav] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // お気に入り状態を読み込み
    useEffect(() => {
        try {
            setIsFav(isFavorite(productId));
        } catch (error) {
            console.error('お気に入り状態の読み込みに失敗しました:', error);
        } finally {
            setIsLoading(false);
        }
    }, [productId]);

    // お気に入り状態を切り替え
    const toggleFavorite = () => {
        try {
            if (isFav) {
                // お気に入りから削除
                removeFromFavorites(productId);
                setIsFav(false);
            } else {
                // お気に入りに追加
                const product: Omit<FavoriteProduct, 'addedAt'> = {
                    id: productId,
                    name: productName,
                    brand,
                    category,
                    price,
                    currency,
                };
                addToFavorites(product);
                setIsFav(true);
            }
        } catch (error) {
            console.error('お気に入り状態の保存に失敗しました:', error);
        }
    };

    if (isLoading) {
        return (
            <button
                disabled
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed ${className}`}
            >
                <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                <span>読み込み中...</span>
            </button>
        );
    }

    return (
        <button
            onClick={toggleFavorite}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${isFav
                ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                } ${className}`}
            aria-label={isFav ? 'お気に入りから削除' : 'お気に入りに追加'}
        >
            <svg
                className={`w-5 h-5 transition-colors ${isFav ? 'text-red-500 fill-current' : 'text-gray-400'
                    }`}
                viewBox="0 0 24 24"
                fill={isFav ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
            </svg>
            <span className="font-medium">
                {isFav ? 'お気に入り済み' : 'お気に入りに追加'}
            </span>
        </button>
    );
}