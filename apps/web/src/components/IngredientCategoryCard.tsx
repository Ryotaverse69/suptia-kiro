'use client';

import Link from 'next/link';
import { IngredientCategoryInfo } from '@/lib/ingredient-data';

interface IngredientCategoryCardProps {
    category: IngredientCategoryInfo;
}

export default function IngredientCategoryCard({ category }: IngredientCategoryCardProps) {
    return (
        <Link
            href={`/ingredients/${category.id}`}
            className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 overflow-hidden group"
        >
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">{category.icon}</span>
                        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                            {category.name}
                        </h3>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.color}`}>
                        {category.count}種類
                    </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {category.description}
                </p>

                <div className="flex items-center justify-between">
                    <span className="text-primary-600 text-sm font-medium group-hover:text-primary-700">
                        詳しく見る
                    </span>
                    <svg
                        className="w-4 h-4 text-primary-600 group-hover:text-primary-700 group-hover:translate-x-1 transition-all duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </Link>
    );
}