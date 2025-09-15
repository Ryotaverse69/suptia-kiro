'use client';

import React, { useState, useMemo } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { ProductComparisonModal } from './ProductComparisonModal';

export interface Product {
    id: string;
    name: string;
    brand: string;
    price: number;
    currency: string;
    servingsPerContainer: number;
    normalizedPricePerMg: number;
    costPerDay: number;
    totalScore: number;
    evidenceScore: number;
    safetyScore: number;
    costScore: number;
    practicalityScore: number;
    ingredients: Array<{
        name: string;
        amount: number;
        unit: string;
        dailyValue?: number;
    }>;
    imageUrl?: string;
}

export interface ComparisonCriteria {
    field: keyof Product | 'ingredients';
    label: string;
    type: 'text' | 'number' | 'score' | 'price' | 'ingredients';
    sortable: boolean;
}

interface ComparisonTableProps {
    products: Product[];
    onProductRemove: (productId: string) => void;
    className?: string;
}

const DEFAULT_CRITERIA: ComparisonCriteria[] = [
    { field: 'name', label: '商品名', type: 'text', sortable: true },
    { field: 'brand', label: 'ブランド', type: 'text', sortable: true },
    { field: 'totalScore', label: '総合スコア', type: 'score', sortable: true },
    { field: 'evidenceScore', label: 'エビデンス', type: 'score', sortable: true },
    { field: 'safetyScore', label: '安全性', type: 'score', sortable: true },
    { field: 'costScore', label: 'コスト', type: 'score', sortable: true },
    { field: 'practicalityScore', label: '実用性', type: 'score', sortable: true },
    { field: 'costPerDay', label: '実効コスト/日', type: 'price', sortable: true },
    { field: 'normalizedPricePerMg', label: '正規化価格(mg/日)', type: 'price', sortable: true },
    { field: 'ingredients', label: '主要成分', type: 'ingredients', sortable: false },
];

type SortField = keyof Product | 'ingredients';
type SortOrder = 'asc' | 'desc';

export function ComparisonTable({ products, onProductRemove, className = '' }: ComparisonTableProps) {
    const [sortField, setSortField] = useState<SortField>('totalScore');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [visibleCriteria, setVisibleCriteria] = useState<ComparisonCriteria[]>(DEFAULT_CRITERIA);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // ソート処理
    const sortedProducts = useMemo(() => {
        if (!sortField || sortField === 'ingredients') return products;

        return [...products].sort((a, b) => {
            const aValue = a[sortField as keyof Product];
            const bValue = b[sortField as keyof Product];

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortOrder === 'asc'
                    ? aValue.localeCompare(bValue, 'ja')
                    : bValue.localeCompare(aValue, 'ja');
            }

            return 0;
        });
    }, [products, sortField, sortOrder]);

    // ソートハンドラー
    const handleSort = (field: SortField) => {
        if (field === sortField) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    // スコアバッジの色を決定
    const getScoreBadgeVariant = (score: number): 'high' | 'medium' | 'low' => {
        if (score >= 80) return 'high';
        if (score >= 60) return 'medium';
        return 'low';
    };

    // 価格フォーマット
    const formatPrice = (price: number, currency: string = 'JPY') => {
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
        }).format(price);
    };

    // セルの値をレンダリング
    const renderCellValue = (product: Product, criteria: ComparisonCriteria) => {
        const { field, type } = criteria;

        if (field === 'ingredients') {
            return (
                <div className="space-y-1">
                    {product.ingredients.slice(0, 3).map((ingredient, index) => (
                        <div key={index} className="text-xs">
                            <span className="font-medium">{ingredient.name}</span>
                            <span className="text-gray-500 ml-1">
                                {ingredient.amount}{ingredient.unit}
                            </span>
                        </div>
                    ))}
                    {product.ingredients.length > 3 && (
                        <div className="text-xs text-gray-400">
                            他{product.ingredients.length - 3}成分
                        </div>
                    )}
                </div>
            );
        }

        const value = product[field as keyof Product];

        // 商品名の場合はクリック可能にする
        if (field === 'name') {
            return (
                <button
                    onClick={() => handleProductClick(product)}
                    className="text-left font-medium text-primary-600 hover:text-primary-800 hover:underline transition-colors"
                >
                    {Array.isArray(value) ? JSON.stringify(value) : String(value)}
                </button>
            );
        }

        switch (type) {
            case 'score':
                return (
                    <Badge variant={getScoreBadgeVariant(value as number)}>
                        {typeof value === 'number' ? value : 0}点
                    </Badge>
                );
            case 'price':
                return (
                    <span className="font-medium">
                        {formatPrice(value as number, product.currency)}
                    </span>
                );
            case 'number':
                return <span className="font-medium">{Array.isArray(value) ? JSON.stringify(value) : String(value)}</span>;
            default:
                return <span>{Array.isArray(value) ? JSON.stringify(value) : String(value)}</span>;
        }
    };

    // 一括削除
    const handleRemoveAll = () => {
        products.forEach(product => onProductRemove(product.id));
    };

    // 商品詳細表示
    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    // モーダルを閉じる
    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
    };

    if (products.length === 0) {
        return (
            <Card className={`p-8 text-center ${className}`}>
                <div className="text-gray-500">
                    <div className="text-lg font-medium mb-2">比較する商品がありません</div>
                    <div className="text-sm">商品を追加して比較を開始してください</div>
                </div>
            </Card>
        );
    }

    return (
        <Card className={`overflow-hidden ${className}`}>
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">商品比較表</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {products.length}件の商品を比較中
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveAll}
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                            すべて削除
                        </Button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                    <thead className="bg-white sticky top-0 z-10 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                操作
                            </th>
                            {visibleCriteria.map((criteria) => (
                                <th
                                    key={criteria.field}
                                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${criteria.sortable ? 'cursor-pointer hover:bg-gray-50' : ''
                                        }`}
                                    onClick={() => criteria.sortable && handleSort(criteria.field)}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>{criteria.label}</span>
                                        {criteria.sortable && sortField === criteria.field && (
                                            <span className="text-blue-500">
                                                {sortOrder === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedProducts.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50/50">
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onProductRemove(product.id)}
                                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                                    >
                                        削除
                                    </Button>
                                </td>
                                {visibleCriteria.map((criteria) => (
                                    <td
                                        key={criteria.field}
                                        className="px-4 py-4 whitespace-nowrap text-sm text-gray-900"
                                    >
                                        {renderCellValue(product, criteria)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 商品詳細モーダル */}
            <ProductComparisonModal
                product={selectedProduct}
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onRemove={onProductRemove}
            />
        </Card>
    );
}
