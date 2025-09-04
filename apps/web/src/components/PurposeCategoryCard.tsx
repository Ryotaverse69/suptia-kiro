'use client';

import { PurposeCategoryInfo } from '@/lib/ingredient-data';

interface PurposeCategoryCardProps {
    purpose: PurposeCategoryInfo;
    ingredientCount: number;
    onClick: () => void;
}

export default function PurposeCategoryCard({
    purpose,
    ingredientCount,
    onClick
}: PurposeCategoryCardProps) {
    return (
        <button
            onClick={onClick}
            className="w-full text-left bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 overflow-hidden group p-4"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                    <span className="text-2xl">{purpose.icon}</span>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {purpose.name}
                    </h3>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${purpose.color}`}>
                    {ingredientCount}種類
                </span>
            </div>

            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {purpose.description}
            </p>

            <div className="flex items-center justify-between">
                <span className="text-blue-600 text-sm font-medium group-hover:text-blue-700">
                    成分を見る
                </span>
                <svg
                    className="w-4 h-4 text-blue-600 group-hover:text-blue-700 group-hover:translate-x-1 transition-all duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </button>
    );
}