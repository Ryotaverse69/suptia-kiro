'use client';

import React, { useState, useMemo } from 'react';
import { calculateEffectiveCostPerDay } from "@/lib/cost";
import { LazyComparisonTable, LazyAdvancedFilters } from '@/components/LazyComponents';
import type { Product as ComparisonProduct, ComparisonCriteria } from "@/components/ComparisonTable";

interface SanityProduct {
    _id: string;
    name: string;
    brand: string;
    priceJPY: number;
    servingsPerContainer: number;
    servingsPerDay: number;
    slug: {
        current: string;
    };
    form?: string;
    thirdPartyTested?: boolean;
    ingredients?: Array<{
        ingredient: {
            name: string;
            category?: string;
        };
        amountMgPerServing: number;
    }>;
}

interface ComparePageClientProps {
    initialProducts: SanityProduct[];
}

// デフォルトの比較項目
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

// Sanity商品データを比較テーブル用に変換
function convertToComparisonProduct(sanityProduct: SanityProduct): ComparisonProduct {
    let costPerDay = 0;
    try {
        costPerDay = calculateEffectiveCostPerDay({
            priceJPY: sanityProduct.priceJPY,
            servingsPerContainer: sanityProduct.servingsPerContainer,
            servingsPerDay: sanityProduct.servingsPerDay,
        });
    } catch (error) {
        console.warn(`Cost calculation failed for ${sanityProduct.name}:`, error);
    }

    // 成分の総mg数を計算
    const totalMgPerDay = sanityProduct.ingredients?.reduce((total, ing) => {
        return total + (ing.amountMgPerServing * sanityProduct.servingsPerDay);
    }, 0) || 1;

    const normalizedPricePerMg = totalMgPerDay > 0 ? costPerDay / totalMgPerDay : 0;

    // 仮のスコア計算（実際のスコアリングロジックに置き換える）
    const evidenceScore = Math.min(100, (sanityProduct.ingredients?.length || 0) * 10 + 50);
    const safetyScore = sanityProduct.thirdPartyTested ? 90 : 60;
    const costScore = Math.max(0, 100 - (costPerDay / 100) * 10);
    const practicalityScore = sanityProduct.form === 'カプセル' ? 85 : 75;
    const totalScore = Math.round((evidenceScore + safetyScore + costScore + practicalityScore) / 4);

    return {
        id: sanityProduct._id,
        name: sanityProduct.name,
        brand: sanityProduct.brand,
        price: sanityProduct.priceJPY,
        currency: 'JPY',
        servingsPerContainer: sanityProduct.servingsPerContainer,
        normalizedPricePerMg,
        costPerDay,
        totalScore,
        evidenceScore,
        safetyScore,
        costScore,
        practicalityScore,
        ingredients: sanityProduct.ingredients?.map(ing => ({
            name: ing.ingredient.name,
            amount: ing.amountMgPerServing,
            unit: 'mg',
            dailyValue: undefined,
        })) || [],
    };
}

export function ComparePageClient({ initialProducts }: ComparePageClientProps) {
    // Sanity商品データを比較用に変換
    const allComparisonProducts = useMemo(() => {
        return initialProducts.map(convertToComparisonProduct);
    }, [initialProducts]);

    const [selectedProducts, setSelectedProducts] = useState<ComparisonProduct[]>(
        allComparisonProducts.slice(0, 5) // 最初の5商品を選択
    );
    const [visibleCriteria, setVisibleCriteria] = useState<ComparisonCriteria[]>(
        DEFAULT_CRITERIA.filter(c =>
            ['name', 'brand', 'totalScore', 'costPerDay'].includes(c.field as string)
        )
    );

    // 商品を削除
    const handleProductRemove = (productId: string) => {
        setSelectedProducts(prev => prev.filter(p => p.id !== productId));
    };

    // 商品を追加
    const handleProductAdd = (product: ComparisonProduct) => {
        if (!selectedProducts.find(p => p.id === product.id)) {
            setSelectedProducts(prev => [...prev, product]);
        }
    };

    // 比較結果をエクスポート
    const handleExport = (format: 'csv' | 'json' = 'csv') => {
        const timestamp = new Date().toISOString().slice(0, 10);
        let content: string;
        let mimeType: string;
        let filename: string;

        if (format === 'json') {
            content = generateJSON(selectedProducts, visibleCriteria);
            mimeType = 'application/json;charset=utf-8;';
            filename = `suptia_comparison_${timestamp}.json`;
        } else {
            content = generateCSV(selectedProducts, visibleCriteria);
            mimeType = 'text/csv;charset=utf-8;';
            filename = `suptia_comparison_${timestamp}.csv`;
        }

        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* 商品選択セクション */}
            <div className="glass-effect rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    比較する商品を選択
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {allComparisonProducts.map((product) => {
                        const isSelected = selectedProducts.find(p => p.id === product.id);

                        return (
                            <div
                                key={product.id}
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${isSelected
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                onClick={() => {
                                    if (isSelected) {
                                        handleProductRemove(product.id);
                                    } else {
                                        handleProductAdd(product);
                                    }
                                }}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900 text-sm">
                                            {product.name}
                                        </h4>
                                        <p className="text-xs text-gray-600 mt-1">
                                            {product.brand}
                                        </p>
                                        <p className="text-xs text-primary-600 font-medium mt-1">
                                            ¥{product.costPerDay.toFixed(0)}/日
                                        </p>
                                    </div>
                                    <div className="ml-2">
                                        {isSelected ? (
                                            <span className="text-blue-500 text-sm">✓</span>
                                        ) : (
                                            <span className="text-gray-400 text-sm">+</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-4 text-sm text-gray-600">
                    {selectedProducts.length}商品を選択中
                </div>
            </div>

            {/* フィルター設定 */}
            <LazyAdvancedFilters
                availableCriteria={DEFAULT_CRITERIA}
                visibleCriteria={visibleCriteria}
                onCriteriaChange={setVisibleCriteria}
                onExport={handleExport}
            />

            {/* 比較テーブル */}
            <LazyComparisonTable
                products={selectedProducts}
                onProductRemove={handleProductRemove}
            />
        </div>
    );
}

// CSV生成関数
function generateCSV(products: ComparisonProduct[], criteria: ComparisonCriteria[]): string {
    const headers = ['商品ID', ...criteria.map(c => c.label)];
    const rows = products.map(product => {
        const row = [product.id];

        criteria.forEach(criteria => {
            if (criteria.field === 'ingredients') {
                const ingredientNames = product.ingredients.map(ing =>
                    `${ing.name}(${ing.amount}${ing.unit})`
                ).join('; ');
                row.push(ingredientNames);
            } else {
                const value = product[criteria.field as keyof ComparisonProduct];
                row.push(String(value || ''));
            }
        });

        return row;
    });

    return [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
}

// JSON形式でのエクスポート
function generateJSON(products: ComparisonProduct[], criteria: ComparisonCriteria[]): string {
    const exportData = {
        exportDate: new Date().toISOString(),
        criteria: criteria.map(c => ({ field: c.field, label: c.label, type: c.type })),
        products: products.map(product => {
            const productData: any = { id: product.id };

            criteria.forEach(criteria => {
                if (criteria.field === 'ingredients') {
                    productData[criteria.field] = product.ingredients;
                } else {
                    productData[criteria.field] = product[criteria.field as keyof ComparisonProduct];
                }
            });

            return productData;
        })
    };

    return JSON.stringify(exportData, null, 2);
}
