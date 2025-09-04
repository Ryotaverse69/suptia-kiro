'use client';

import { useState, useMemo } from 'react';
import {
    INGREDIENT_CATEGORIES,
    PURPOSE_CATEGORIES,
    getIngredientsByCategory,
    getIngredientsByPurpose,
    filterIngredients,
    getPopularIngredients
} from '@/lib/ingredient-data';
import IngredientCategoryCard from '@/components/IngredientCategoryCard';
import IngredientCard from '@/components/IngredientCard';
import IngredientDetailModal from '@/components/IngredientDetailModal';
import IngredientFilters from '@/components/IngredientFilters';
import PurposeCategoryCard from '@/components/PurposeCategoryCard';
import type {
    Ingredient,
    IngredientCategory,
    PurposeCategory,
    FilterState
} from '@/lib/ingredient-data';

type ViewMode = 'categories' | 'purposes' | 'filtered' | 'category-detail' | 'purpose-detail';

export default function IngredientsPageClient() {
    const [viewMode, setViewMode] = useState<ViewMode>('categories');
    const [selectedCategory, setSelectedCategory] = useState<IngredientCategory | null>(null);
    const [selectedPurpose, setSelectedPurpose] = useState<PurposeCategory | null>(null);
    const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        categories: [],
        purposes: [],
        forms: [],
        priceRange: null,
        evidenceLevel: [],
        searchQuery: '',
        sortBy: 'popularity',
        sortOrder: 'desc'
    });

    const handleCategoryClick = (categoryId: IngredientCategory) => {
        setSelectedCategory(categoryId);
        setViewMode('category-detail');
    };

    const handlePurposeClick = (purposeId: PurposeCategory) => {
        setSelectedPurpose(purposeId);
        setViewMode('purpose-detail');
    };

    const handleIngredientClick = (ingredient: Ingredient) => {
        setSelectedIngredient(ingredient);
        setIsModalOpen(true);
    };

    const handleBackToMain = () => {
        setSelectedCategory(null);
        setSelectedPurpose(null);
        setViewMode('categories');
    };

    const handleShowFiltered = () => {
        setViewMode('filtered');
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedIngredient(null);
    };

    const resetFilters = () => {
        setFilters({
            categories: [],
            purposes: [],
            forms: [],
            priceRange: null,
            evidenceLevel: [],
            searchQuery: '',
            sortBy: 'popularity',
            sortOrder: 'desc'
        });
    };

    // 表示する成分を計算
    const displayedIngredients = useMemo(() => {
        switch (viewMode) {
            case 'category-detail':
                return selectedCategory ? getIngredientsByCategory(selectedCategory) : [];
            case 'purpose-detail':
                return selectedPurpose ? getIngredientsByPurpose(selectedPurpose) : [];
            case 'filtered':
                return filterIngredients(filters);
            default:
                return [];
        }
    }, [viewMode, selectedCategory, selectedPurpose, filters]);

    const selectedCategoryInfo = selectedCategory
        ? INGREDIENT_CATEGORIES.find(cat => cat.id === selectedCategory)
        : null;

    const selectedPurposeInfo = selectedPurpose
        ? PURPOSE_CATEGORIES.find(purpose => purpose.id === selectedPurpose)
        : null;

    const popularIngredients = useMemo(() => getPopularIngredients(6), []);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                {/* ヘッダー */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">成分ガイド</h1>
                    <p className="text-lg text-gray-600">
                        サプリメントに含まれる様々な成分について詳しく学べます。
                    </p>
                </div>

                {/* ナビゲーションタブ */}
                <div className="mb-8">
                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('categories')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'categories' || viewMode === 'category-detail'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            カテゴリ別
                        </button>
                        <button
                            onClick={() => setViewMode('purposes')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'purposes' || viewMode === 'purpose-detail'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            目的別
                        </button>
                        <button
                            onClick={handleShowFiltered}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'filtered'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            詳細検索
                        </button>
                    </div>
                </div>

                {/* カテゴリ表示 */}
                {viewMode === 'categories' && (
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">成分カテゴリ</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            {INGREDIENT_CATEGORIES.map((category) => (
                                <div key={category.id} onClick={() => handleCategoryClick(category.id)}>
                                    <IngredientCategoryCard category={category} />
                                </div>
                            ))}
                        </div>

                        {/* 人気成分 */}
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-6">人気の成分</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {popularIngredients.map((ingredient) => (
                                    <IngredientCard
                                        key={ingredient.id}
                                        ingredient={ingredient}
                                        onClick={() => handleIngredientClick(ingredient)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 目的別表示 */}
                {viewMode === 'purposes' && (
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">目的・効果別</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {PURPOSE_CATEGORIES.map((purpose) => {
                                const ingredientCount = getIngredientsByPurpose(purpose.id).length;
                                return (
                                    <PurposeCategoryCard
                                        key={purpose.id}
                                        purpose={purpose}
                                        ingredientCount={ingredientCount}
                                        onClick={() => handlePurposeClick(purpose.id)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 詳細検索表示 */}
                {viewMode === 'filtered' && (
                    <div className="grid lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-1">
                            <IngredientFilters
                                filters={filters}
                                onFiltersChange={setFilters}
                                onReset={resetFilters}
                            />
                        </div>
                        <div className="lg:col-span-3">
                            <div className="mb-4">
                                <p className="text-gray-600">
                                    {displayedIngredients.length}件の成分が見つかりました
                                </p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                {displayedIngredients.map((ingredient) => (
                                    <IngredientCard
                                        key={ingredient.id}
                                        ingredient={ingredient}
                                        onClick={() => handleIngredientClick(ingredient)}
                                    />
                                ))}
                            </div>
                            {displayedIngredients.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">
                                        条件に一致する成分が見つかりませんでした。
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* カテゴリ詳細表示 */}
                {viewMode === 'category-detail' && selectedCategoryInfo && (
                    <div>
                        {/* パンくずナビ */}
                        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
                            <button
                                onClick={handleBackToMain}
                                className="hover:text-blue-600 transition-colors"
                            >
                                成分ガイド
                            </button>
                            <span>/</span>
                            <span className="text-gray-900">{selectedCategoryInfo.name}</span>
                        </nav>

                        {/* カテゴリヘッダー */}
                        <div className="mb-8">
                            <div className="flex items-center space-x-3 mb-4">
                                <span className="text-3xl">{selectedCategoryInfo.icon}</span>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {selectedCategoryInfo.name}
                                </h2>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedCategoryInfo.color}`}>
                                    {displayedIngredients.length}種類
                                </span>
                            </div>
                            <p className="text-gray-600">
                                {selectedCategoryInfo.description}
                            </p>
                        </div>

                        {/* 成分カード一覧 */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {displayedIngredients.map((ingredient) => (
                                <IngredientCard
                                    key={ingredient.id}
                                    ingredient={ingredient}
                                    onClick={() => handleIngredientClick(ingredient)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* 目的別詳細表示 */}
                {viewMode === 'purpose-detail' && selectedPurposeInfo && (
                    <div>
                        {/* パンくずナビ */}
                        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
                            <button
                                onClick={handleBackToMain}
                                className="hover:text-blue-600 transition-colors"
                            >
                                成分ガイド
                            </button>
                            <span>/</span>
                            <span className="text-gray-900">{selectedPurposeInfo.name}</span>
                        </nav>

                        {/* 目的ヘッダー */}
                        <div className="mb-8">
                            <div className="flex items-center space-x-3 mb-4">
                                <span className="text-3xl">{selectedPurposeInfo.icon}</span>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {selectedPurposeInfo.name}
                                </h2>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedPurposeInfo.color}`}>
                                    {displayedIngredients.length}種類
                                </span>
                            </div>
                            <p className="text-gray-600">
                                {selectedPurposeInfo.description}
                            </p>
                        </div>

                        {/* 成分カード一覧 */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {displayedIngredients.map((ingredient) => (
                                <IngredientCard
                                    key={ingredient.id}
                                    ingredient={ingredient}
                                    onClick={() => handleIngredientClick(ingredient)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* 成分詳細モーダル */}
                <IngredientDetailModal
                    ingredient={selectedIngredient}
                    isOpen={isModalOpen}
                    onClose={closeModal}
                />
            </div>
        </div>
    );
}