'use client';

import { useState } from 'react';
import IngredientCard from './IngredientCard';
import SectionHeader from './SectionHeader';
import {
  MOCK_INGREDIENTS,
  INGREDIENT_CATEGORIES,
  IngredientCategory,
} from '@/lib/ingredient-data';

interface IngredientGuideSectionProps {
  className?: string;
}

export default function IngredientGuideSection({
  className = '',
}: IngredientGuideSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    IngredientCategory | 'all'
  >('all');

  // カテゴリフィルタリング
  const filteredIngredients =
    selectedCategory === 'all'
      ? MOCK_INGREDIENTS.slice(0, 6) // 全体表示時は6件まで
      : MOCK_INGREDIENTS.filter(
          ingredient => ingredient.category === selectedCategory
        );

  const handleIngredientClick = (ingredientId: string) => {
    // 成分詳細ページへの遷移（将来実装）
    console.log('Navigate to ingredient detail:', ingredientId);
  };

  return (
    <section className={`py-16 sm:py-20 lg:py-24 bg-white ${className}`}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12'>
        {/* Apple風セクションヘッダー */}
        <SectionHeader
          title='成分ガイド'
          subtitle='科学的根拠に基づいた成分情報をわかりやすく'
          className='mb-16'
        />

        {/* カテゴリフィルター - モバイル対応 */}
        <div className='flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 px-2'>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 
                       hover:scale-105 active:scale-95 ${
                         selectedCategory === 'all'
                           ? 'bg-primary-600 text-white shadow-lg'
                           : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                       }`}
          >
            すべて
          </button>
          {INGREDIENT_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 
                         hover:scale-105 active:scale-95 flex items-center gap-1 sm:gap-2 ${
                           selectedCategory === category.id
                             ? 'bg-primary-600 text-white shadow-lg'
                             : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                         }`}
            >
              <span className='text-sm sm:text-lg'>{category.icon}</span>
              <span className='hidden sm:inline'>{category.name}</span>
            </button>
          ))}
        </div>

        {/* 成分カードグリッド - レスポンシブ3列レイアウト */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 xl:gap-10 mb-8 sm:mb-12'>
          {filteredIngredients.map(ingredient => (
            <IngredientCard
              key={ingredient.id}
              ingredient={ingredient}
              onClick={() => handleIngredientClick(ingredient.id)}
            />
          ))}
        </div>

        {/* もっと見るボタン */}
        {selectedCategory === 'all' && MOCK_INGREDIENTS.length > 6 && (
          <div className='text-center'>
            <button
              className='px-8 py-4 border-2 border-primary-600 text-primary-600 
                             rounded-xl font-medium hover:bg-primary-600 hover:text-white 
                             transition-all duration-300 hover:scale-105 active:scale-95'
            >
              すべての成分を見る
            </button>
          </div>
        )}

        {/* カテゴリ選択時の説明 */}
        {selectedCategory !== 'all' && (
          <div className='mt-12 text-center'>
            {(() => {
              const categoryInfo = INGREDIENT_CATEGORIES.find(
                cat => cat.id === selectedCategory
              );
              return categoryInfo ? (
                <div className='max-w-2xl mx-auto'>
                  <div className='flex items-center justify-center gap-3 mb-4'>
                    <span className='text-4xl'>{categoryInfo.icon}</span>
                    <h3 className='text-2xl font-semibold text-gray-900'>
                      {categoryInfo.name}
                    </h3>
                  </div>
                  <p className='text-gray-600 leading-relaxed'>
                    {categoryInfo.description}
                  </p>
                  <div className='mt-6'>
                    <span
                      className='inline-flex items-center px-4 py-2 bg-primary-100 
                                   text-primary-700 rounded-full text-sm font-medium'
                    >
                      {categoryInfo.count}種類の成分
                    </span>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </div>
    </section>
  );
}
