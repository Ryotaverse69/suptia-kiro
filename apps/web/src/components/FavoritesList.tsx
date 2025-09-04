'use client';

import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import {
    getFavoriteProducts,
    getFavoriteCategories,
    getUncategorizedFavorites,
    getFavoriteProductsByCategory,
    removeFromFavorites,
    createFavoriteCategory,
    deleteFavoriteCategory,
    addProductToCategory,
    removeProductFromCategory,
    type FavoriteProduct,
    type FavoriteCategory,
} from '../lib/favorites';

interface FavoritesListProps {
    onProductClick?: (productId: string) => void;
}

/**
 * お気に入り商品一覧コンポーネント
 */
export function FavoritesList({ onProductClick }: FavoritesListProps) {
    const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
    const [categories, setCategories] = useState<FavoriteCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

    // データを読み込み
    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        try {
            setIsLoading(true);
            const allFavorites = getFavoriteProducts();
            const allCategories = getFavoriteCategories();

            setFavorites(allFavorites);
            setCategories(allCategories);
        } catch (error) {
            console.error('お気に入りデータの読み込みに失敗しました:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 表示する商品を取得
    const getDisplayProducts = (): FavoriteProduct[] => {
        if (selectedCategory === null) {
            return getUncategorizedFavorites();
        } else if (selectedCategory === 'all') {
            return favorites;
        } else {
            return getFavoriteProductsByCategory(selectedCategory);
        }
    };

    // お気に入りから削除
    const handleRemoveFavorite = (productId: string) => {
        try {
            removeFromFavorites(productId);
            loadData();
            setSelectedProducts(prev => {
                const newSet = new Set(prev);
                newSet.delete(productId);
                return newSet;
            });
        } catch (error) {
            console.error('お気に入りの削除に失敗しました:', error);
        }
    };

    // カテゴリを作成
    const handleCreateCategory = () => {
        if (!newCategoryName.trim()) return;

        try {
            createFavoriteCategory(newCategoryName.trim());
            setNewCategoryName('');
            setShowCategoryForm(false);
            loadData();
        } catch (error) {
            console.error('カテゴリの作成に失敗しました:', error);
        }
    };

    // カテゴリを削除
    const handleDeleteCategory = (categoryId: string) => {
        if (!confirm('このカテゴリを削除しますか？カテゴリ内の商品は未分類に移動されます。')) {
            return;
        }

        try {
            deleteFavoriteCategory(categoryId);
            if (selectedCategory === categoryId) {
                setSelectedCategory(null);
            }
            loadData();
        } catch (error) {
            console.error('カテゴリの削除に失敗しました:', error);
        }
    };

    // 商品をカテゴリに移動
    const handleMoveToCategory = (categoryId: string) => {
        if (selectedProducts.size === 0) return;

        try {
            selectedProducts.forEach(productId => {
                // 現在のカテゴリから削除
                if (selectedCategory && selectedCategory !== 'all' && selectedCategory !== null) {
                    removeProductFromCategory(productId, selectedCategory);
                }

                // 新しいカテゴリに追加
                if (categoryId !== 'uncategorized') {
                    addProductToCategory(productId, categoryId);
                }
            });

            setSelectedProducts(new Set());
            loadData();
        } catch (error) {
            console.error('カテゴリの移動に失敗しました:', error);
        }
    };

    // 商品選択の切り替え
    const toggleProductSelection = (productId: string) => {
        setSelectedProducts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">読み込み中...</span>
            </div>
        );
    }

    const displayProducts = getDisplayProducts();

    return (
        <div className="space-y-6">
            {/* カテゴリ管理セクション */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">カテゴリ管理</h3>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCategoryForm(!showCategoryForm)}
                    >
                        新しいカテゴリ
                    </Button>
                </div>

                {/* カテゴリ作成フォーム */}
                {showCategoryForm && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="カテゴリ名を入力"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
                            />
                            <Button onClick={handleCreateCategory} size="sm">
                                作成
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setShowCategoryForm(false);
                                    setNewCategoryName('');
                                }}
                            >
                                キャンセル
                            </Button>
                        </div>
                    </div>
                )}

                {/* カテゴリ選択 */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${selectedCategory === 'all'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        すべて ({favorites.length})
                    </button>
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${selectedCategory === null
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        未分類 ({getUncategorizedFavorites().length})
                    </button>
                    {categories.map(category => (
                        <div key={category.id} className="flex items-center gap-1">
                            <button
                                onClick={() => setSelectedCategory(category.id)}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${selectedCategory === category.id
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {category.name} ({category.productIds.length})
                            </button>
                            <button
                                onClick={() => handleDeleteCategory(category.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="カテゴリを削除"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* 選択された商品の操作 */}
            {selectedProducts.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-blue-800 font-medium">
                            {selectedProducts.size}個の商品を選択中
                        </span>
                        <div className="flex gap-2">
                            <select
                                onChange={(e) => e.target.value && handleMoveToCategory(e.target.value)}
                                className="px-3 py-1 border border-blue-300 rounded-md text-sm"
                                defaultValue=""
                            >
                                <option value="">カテゴリに移動...</option>
                                <option value="uncategorized">未分類</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedProducts(new Set())}
                            >
                                選択解除
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* 商品一覧 */}
            {displayProducts.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {selectedCategory === 'all' ? 'お気に入り商品がありません' : 'このカテゴリに商品がありません'}
                    </h3>
                    <p className="text-gray-600">
                        商品詳細ページでお気に入りに追加してください
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {displayProducts.map(product => (
                        <Card key={product.id} className="hover:shadow-md transition-shadow">
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                                            {product.name}
                                        </h4>
                                        {product.brand && (
                                            <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
                                        )}
                                        {product.category && (
                                            <Badge variant="info" className="mb-2">
                                                {product.category}
                                            </Badge>
                                        )}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={selectedProducts.has(product.id)}
                                        onChange={() => toggleProductSelection(product.id)}
                                        className="ml-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                </div>

                                {product.price && (
                                    <div className="mb-3">
                                        <span className="text-lg font-bold text-gray-900">
                                            {product.currency === 'USD' ? '$' : '¥'}{product.price.toLocaleString()}
                                        </span>
                                    </div>
                                )}

                                <div className="text-xs text-gray-500 mb-3">
                                    追加日: {new Date(product.addedAt).toLocaleDateString('ja-JP')}
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => onProductClick?.(product.id)}
                                    >
                                        詳細を見る
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRemoveFavorite(product.id)}
                                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                                    >
                                        削除
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}