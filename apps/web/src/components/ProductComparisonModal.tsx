'use client';

import React from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Product } from './ComparisonTable';

interface ProductComparisonModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onRemove?: (productId: string) => void;
}

export function ProductComparisonModal({
    product,
    isOpen,
    onClose,
    onRemove
}: ProductComparisonModalProps) {
    if (!isOpen || !product) return null;

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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* ヘッダー */}
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                            <p className="text-lg text-gray-600 mt-1">{product.brand}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            {onRemove && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        onRemove(product.id);
                                        onClose();
                                    }}
                                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                                >
                                    比較から削除
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </Button>
                        </div>
                    </div>

                    {/* スコア情報 */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        <div className="text-center">
                            <Badge variant={getScoreBadgeVariant(product.totalScore)} className="text-lg px-3 py-1">
                                {product.totalScore}点
                            </Badge>
                            <p className="text-sm text-gray-600 mt-1">総合スコア</p>
                        </div>
                        <div className="text-center">
                            <Badge variant={getScoreBadgeVariant(product.evidenceScore)} className="px-3 py-1">
                                {product.evidenceScore}点
                            </Badge>
                            <p className="text-sm text-gray-600 mt-1">エビデンス</p>
                        </div>
                        <div className="text-center">
                            <Badge variant={getScoreBadgeVariant(product.safetyScore)} className="px-3 py-1">
                                {product.safetyScore}点
                            </Badge>
                            <p className="text-sm text-gray-600 mt-1">安全性</p>
                        </div>
                        <div className="text-center">
                            <Badge variant={getScoreBadgeVariant(product.costScore)} className="px-3 py-1">
                                {product.costScore}点
                            </Badge>
                            <p className="text-sm text-gray-600 mt-1">コスト</p>
                        </div>
                        <div className="text-center">
                            <Badge variant={getScoreBadgeVariant(product.practicalityScore)} className="px-3 py-1">
                                {product.practicalityScore}点
                            </Badge>
                            <p className="text-sm text-gray-600 mt-1">実用性</p>
                        </div>
                    </div>

                    {/* 価格情報 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-900 mb-2">商品価格</h3>
                            <p className="text-2xl font-bold text-blue-600">
                                {formatPrice(product.price, product.currency)}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                {product.servingsPerContainer}回分
                            </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-900 mb-2">実効コスト/日</h3>
                            <p className="text-2xl font-bold text-green-600">
                                {formatPrice(product.costPerDay, product.currency)}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                1日あたりのコスト
                            </p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-900 mb-2">正規化価格</h3>
                            <p className="text-2xl font-bold text-purple-600">
                                {formatPrice(product.normalizedPricePerMg, product.currency)}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                mg/日あたり
                            </p>
                        </div>
                    </div>

                    {/* 成分情報 */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">成分一覧</h3>
                        {product.ingredients.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {product.ingredients.map((ingredient, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="font-medium text-gray-900">{ingredient.name}</span>
                                        <div className="text-right">
                                            <span className="text-sm font-medium text-gray-700">
                                                {ingredient.amount}{ingredient.unit}
                                            </span>
                                            {ingredient.dailyValue && (
                                                <div className="text-xs text-gray-500">
                                                    DV: {ingredient.dailyValue}%
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">成分情報が登録されていません</p>
                        )}
                    </div>

                    {/* アクションボタン */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                        <Button
                            variant="outline"
                            onClick={onClose}
                        >
                            閉じる
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                // 商品詳細ページへのリンク（実装時に追加）
                                window.open(`/products/${product.id}`, '_blank');
                            }}
                        >
                            詳細ページを見る
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}