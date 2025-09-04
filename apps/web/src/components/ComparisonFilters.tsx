'use client';

import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ComparisonCriteria } from './ComparisonTable';

interface ComparisonFiltersProps {
    availableCriteria: ComparisonCriteria[];
    visibleCriteria: ComparisonCriteria[];
    onCriteriaChange: (criteria: ComparisonCriteria[]) => void;
    onExport?: (format?: 'csv' | 'json') => void;
    className?: string;
}

export function ComparisonFilters({
    availableCriteria,
    visibleCriteria,
    onCriteriaChange,
    onExport,
    className = ''
}: ComparisonFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // 表示項目の切り替え
    const toggleCriteria = (criteria: ComparisonCriteria) => {
        const isVisible = visibleCriteria.some(c => c.field === criteria.field);

        if (isVisible) {
            // 削除
            const newCriteria = visibleCriteria.filter(c => c.field !== criteria.field);
            onCriteriaChange(newCriteria);
        } else {
            // 追加
            const newCriteria = [...visibleCriteria, criteria];
            onCriteriaChange(newCriteria);
        }
    };

    // すべて選択/解除
    const toggleAll = () => {
        if (visibleCriteria.length === availableCriteria.length) {
            // すべて解除（最低1つは残す）
            onCriteriaChange([availableCriteria[0]]);
        } else {
            // すべて選択
            onCriteriaChange(availableCriteria);
        }
    };

    // デフォルト設定に戻す
    const resetToDefault = () => {
        const defaultCriteria = availableCriteria.filter(c =>
            ['name', 'brand', 'totalScore', 'costPerDay'].includes(c.field as string)
        );
        onCriteriaChange(defaultCriteria);
    };

    return (
        <Card className={`${className}`}>
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">表示項目の設定</h3>
                    <div className="flex items-center space-x-2">
                        {onExport && (
                            <div className="relative">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onExport('csv')}
                                    className="text-blue-600 hover:text-blue-700"
                                >
                                    CSV出力
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onExport('json')}
                                    className="text-green-600 hover:text-green-700 ml-1"
                                >
                                    JSON出力
                                </Button>
                            </div>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? '閉じる' : '設定'}
                        </Button>
                    </div>
                </div>

                {isExpanded && (
                    <div className="space-y-4">
                        {/* 一括操作 */}
                        <div className="flex items-center space-x-2 pb-3 border-b border-gray-200">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleAll}
                            >
                                {visibleCriteria.length === availableCriteria.length ? 'すべて解除' : 'すべて選択'}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={resetToDefault}
                            >
                                デフォルトに戻す
                            </Button>
                        </div>

                        {/* プリセット選択 */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">プリセット</h4>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const basicCriteria = availableCriteria.filter(c =>
                                            ['name', 'brand', 'totalScore', 'costPerDay'].includes(c.field as string)
                                        );
                                        onCriteriaChange(basicCriteria);
                                    }}
                                >
                                    基本情報
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const scoreCriteria = availableCriteria.filter(c =>
                                            ['name', 'totalScore', 'evidenceScore', 'safetyScore', 'costScore', 'practicalityScore'].includes(c.field as string)
                                        );
                                        onCriteriaChange(scoreCriteria);
                                    }}
                                >
                                    スコア詳細
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const priceCriteria = availableCriteria.filter(c =>
                                            ['name', 'brand', 'costPerDay', 'normalizedPricePerMg', 'price'].includes(c.field as string)
                                        );
                                        onCriteriaChange(priceCriteria);
                                    }}
                                >
                                    価格比較
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const ingredientCriteria = availableCriteria.filter(c =>
                                            ['name', 'brand', 'ingredients'].includes(c.field as string)
                                        );
                                        onCriteriaChange(ingredientCriteria);
                                    }}
                                >
                                    成分詳細
                                </Button>
                            </div>
                        </div>

                        {/* 項目選択 */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-700">表示項目</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {availableCriteria.map((criteria) => {
                                    const isVisible = visibleCriteria.some(c => c.field === criteria.field);

                                    return (
                                        <label
                                            key={criteria.field}
                                            className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isVisible}
                                                onChange={() => toggleCriteria(criteria)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">
                                                {criteria.label}
                                            </span>
                                            {criteria.type === 'score' && (
                                                <span className="text-xs text-blue-500">📊</span>
                                            )}
                                            {criteria.type === 'price' && (
                                                <span className="text-xs text-green-500">💰</span>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 選択状況 */}
                        <div className="pt-3 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                                {visibleCriteria.length} / {availableCriteria.length} 項目を表示中
                            </div>
                        </div>
                    </div>
                )}

                {/* 簡易表示 */}
                {!isExpanded && (
                    <div className="text-sm text-gray-600">
                        {visibleCriteria.length}項目を表示中 • クリックして設定を変更
                    </div>
                )}
            </div>
        </Card>
    );
}