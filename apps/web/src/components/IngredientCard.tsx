'use client';

import { Ingredient } from '@/lib/ingredient-data';

interface IngredientCardProps {
    ingredient: Ingredient;
    onClick?: () => void;
}

export default function IngredientCard({ ingredient, onClick }: IngredientCardProps) {
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
                return '高';
            case 'medium':
                return '中';
            case 'low':
                return '低';
            default:
                return '不明';
        }
    };

    return (
        <div
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 cursor-pointer"
            onClick={onClick}
        >
            <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {ingredient.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {ingredient.nameEn}
                        </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEvidenceLevelColor(ingredient.evidenceLevel)}`}>
                        エビデンス: {getEvidenceLevelText(ingredient.evidenceLevel)}
                    </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {ingredient.description}
                </p>

                <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">主な効果:</h4>
                    <div className="flex flex-wrap gap-1">
                        {ingredient.benefits.slice(0, 3).map((benefit, index) => (
                            <span
                                key={index}
                                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                            >
                                {benefit}
                            </span>
                        ))}
                        {ingredient.benefits.length > 3 && (
                            <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
                                +{ingredient.benefits.length - 3}個
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                        推奨摂取量: {ingredient.recommendedDosage}
                    </span>
                    <button className="text-blue-600 hover:text-blue-700 font-medium">
                        詳細を見る →
                    </button>
                </div>
            </div>
        </div>
    );
}