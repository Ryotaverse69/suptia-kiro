'use client';

import { useEffect } from 'react';
import { Ingredient } from '@/lib/ingredient-data';

interface IngredientDetailModalProps {
    ingredient: Ingredient | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function IngredientDetailModal({
    ingredient,
    isOpen,
    onClose
}: IngredientDetailModalProps) {
    // ESCキーでモーダルを閉じる
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!ingredient || !isOpen) return null;

    const getEvidenceLevelColor = (level: string) => {
        switch (level) {
            case 'high':
                return 'bg-green-100 text-green-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getEvidenceLevelText = (level: string) => {
        switch (level) {
            case 'high':
                return '高（複数の質の高い研究で効果が確認）';
            case 'medium':
                return '中（限定的な研究で効果が示唆）';
            case 'low':
                return '低（予備的な研究のみ）';
            default:
                return '不明';
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* オーバーレイ */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* モーダルコンテンツ */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl transform transition-all">
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold leading-6 text-gray-900 mb-2">
                                    {ingredient.name}
                                </h3>
                                <p className="text-gray-500">{ingredient.nameEn}</p>
                            </div>
                            <button
                                type="button"
                                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onClick={onClose}
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* エビデンスレベル */}
                            <div>
                                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getEvidenceLevelColor(ingredient.evidenceLevel)}`}>
                                    エビデンスレベル: {getEvidenceLevelText(ingredient.evidenceLevel)}
                                </span>
                            </div>

                            {/* 説明 */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-2">概要</h4>
                                <p className="text-gray-600">{ingredient.description}</p>
                            </div>

                            {/* 効果・効能 */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-3">主な効果・効能</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {ingredient.benefits.map((benefit, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                            <span className="text-gray-700">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 推奨摂取量 */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-2">推奨摂取量</h4>
                                <p className="text-gray-600 bg-blue-50 p-3 rounded-lg">
                                    {ingredient.recommendedDosage}
                                </p>
                            </div>

                            {/* 副作用・注意事項 */}
                            {ingredient.sideEffects.length > 0 && (
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-3">副作用・注意事項</h4>
                                    <div className="space-y-2">
                                        {ingredient.sideEffects.map((sideEffect, index) => (
                                            <div key={index} className="flex items-start space-x-2">
                                                <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></span>
                                                <span className="text-gray-700">{sideEffect}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 相互作用 */}
                            {ingredient.interactions.length > 0 && (
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-3">薬物相互作用</h4>
                                    <div className="space-y-2">
                                        {ingredient.interactions.map((interaction, index) => (
                                            <div key={index} className="flex items-start space-x-2">
                                                <span className="w-2 h-2 bg-red-500 rounded-full mt-2"></span>
                                                <span className="text-gray-700">{interaction}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 天然の供給源 */}
                            {ingredient.sources.length > 0 && (
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-3">天然の供給源</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {ingredient.sources.map((source, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                                            >
                                                {source}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                type="button"
                                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                onClick={onClose}
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}