'use client';

import { useState } from 'react';
import {
    PURPOSE_CATEGORIES,
    PRODUCT_FORMS,
    PRICE_RANGES,
    INGREDIENT_CATEGORIES,
    type FilterState,
    type PurposeCategory,
    type ProductForm,
    type IngredientCategory,
    type PriceRange
} from '@/lib/ingredient-data';

interface IngredientFiltersProps {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    onReset: () => void;
}

export default function IngredientFilters({
    filters,
    onFiltersChange,
    onReset
}: IngredientFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleCategoryChange = (category: IngredientCategory, checked: boolean) => {
        const newCategories = checked
            ? [...filters.categories, category]
            : filters.categories.filter(c => c !== category);

        onFiltersChange({ ...filters, categories: newCategories });
    };

    const handlePurposeChange = (purpose: PurposeCategory, checked: boolean) => {
        const newPurposes = checked
            ? [...filters.purposes, purpose]
            : filters.purposes.filter(p => p !== purpose);

        onFiltersChange({ ...filters, purposes: newPurposes });
    };

    const handleFormChange = (form: ProductForm, checked: boolean) => {
        const newForms = checked
            ? [...filters.forms, form]
            : filters.forms.filter(f => f !== form);

        onFiltersChange({ ...filters, forms: newForms });
    };

    const handlePriceRangeChange = (priceRange: PriceRange | null) => {
        onFiltersChange({ ...filters, priceRange });
    };

    const handleEvidenceLevelChange = (level: 'high' | 'medium' | 'low', checked: boolean) => {
        const newLevels = checked
            ? [...filters.evidenceLevel, level]
            : filters.evidenceLevel.filter(l => l !== level);

        onFiltersChange({ ...filters, evidenceLevel: newLevels });
    };

    const handleSortChange = (sortBy: FilterState['sortBy'], sortOrder: FilterState['sortOrder']) => {
        onFiltersChange({ ...filters, sortBy, sortOrder });
    };

    const activeFiltersCount =
        filters.categories.length +
        filters.purposes.length +
        filters.forms.length +
        filters.evidenceLevel.length +
        (filters.priceRange ? 1 : 0);

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
            {/* フィルタヘッダー */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">フィルタ</h3>
                        {activeFiltersCount > 0 && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                {activeFiltersCount}個適用中
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={onReset}
                            className="text-sm text-gray-500 hover:text-gray-700"
                            disabled={activeFiltersCount === 0}
                        >
                            リセット
                        </button>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1 text-gray-500 hover:text-gray-700"
                        >
                            <svg
                                className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* フィルタコンテンツ */}
            {isExpanded && (
                <div className="p-4 space-y-6">
                    {/* 検索 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            成分名で検索
                        </label>
                        <input
                            type="text"
                            value={filters.searchQuery}
                            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
                            placeholder="成分名を入力..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* 目的別フィルタ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            目的・効果
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {PURPOSE_CATEGORIES.map((purpose) => (
                                <label key={purpose.id} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filters.purposes.includes(purpose.id)}
                                        onChange={(e) => handlePurposeChange(purpose.id, e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 flex items-center space-x-1">
                                        <span>{purpose.icon}</span>
                                        <span>{purpose.name}</span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* カテゴリフィルタ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            成分カテゴリ
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {INGREDIENT_CATEGORIES.map((category) => (
                                <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filters.categories.includes(category.id)}
                                        onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 flex items-center space-x-1">
                                        <span>{category.icon}</span>
                                        <span>{category.name}</span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 形状フィルタ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            形状・タイプ
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {PRODUCT_FORMS.map((form) => (
                                <label key={form.id} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filters.forms.includes(form.id)}
                                        onChange={(e) => handleFormChange(form.id, e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{form.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 価格帯フィルタ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            価格帯（月額）
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="priceRange"
                                    checked={!filters.priceRange}
                                    onChange={() => handlePriceRangeChange(null)}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">すべて</span>
                            </label>
                            {PRICE_RANGES.map((range) => (
                                <label key={range.id} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="priceRange"
                                        checked={filters.priceRange?.id === range.id}
                                        onChange={() => handlePriceRangeChange(range)}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{range.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* エビデンスレベルフィルタ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            エビデンスレベル
                        </label>
                        <div className="space-y-2">
                            {[
                                { level: 'high' as const, name: '高', color: 'text-green-700' },
                                { level: 'medium' as const, name: '中', color: 'text-yellow-700' },
                                { level: 'low' as const, name: '低', color: 'text-red-700' }
                            ].map(({ level, name, color }) => (
                                <label key={level} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filters.evidenceLevel.includes(level)}
                                        onChange={(e) => handleEvidenceLevelChange(level, e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className={`text-sm ${color}`}>{name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* ソート */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            並び順
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <select
                                value={filters.sortBy}
                                onChange={(e) => handleSortChange(e.target.value as FilterState['sortBy'], filters.sortOrder)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="name">名前</option>
                                <option value="evidence">エビデンス</option>
                                <option value="popularity">人気度</option>
                            </select>
                            <select
                                value={filters.sortOrder}
                                onChange={(e) => handleSortChange(filters.sortBy, e.target.value as FilterState['sortOrder'])}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="asc">昇順</option>
                                <option value="desc">降順</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}