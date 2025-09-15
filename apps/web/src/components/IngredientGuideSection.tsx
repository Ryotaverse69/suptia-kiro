'use client';

import { useState } from 'react';
import IngredientCard from './IngredientCard';
import SectionHeader from './SectionHeader';
import {
  MOCK_INGREDIENTS,
  INGREDIENT_CATEGORIES,
  IngredientCategory,
} from '@/lib/ingredient-data';
import { useTranslation } from '@/contexts/LocaleContext';

interface IngredientGuideSectionProps {
  className?: string;
}

export default function IngredientGuideSection({
  className = '',
}: IngredientGuideSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    IngredientCategory | 'all'
  >('all');
  const { t } = useTranslation();

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
    <section className={`py-section-md bg-white ${className}`}>
      <div className='max-w-7xl mx-auto container-padding'>
        {/* Apple風セクションヘッダー - Apple風広めの余白 */}
        <div className='mb-component-2xl'>
          <SectionHeader
            title={t('ingredients.guide')}
            subtitle={t('home.categories.subtitle')}
          />
        </div>

        {/* カテゴリフィルター - Apple風広めの余白 */}
        <div className='flex flex-wrap justify-center gap-component-sm sm:gap-component-md mb-component-xl px-component-sm'>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-component-md sm:px-component-lg py-component-sm sm:py-component-md rounded-full text-xs sm:text-sm font-medium transition-all duration-300 
                       hover:scale-105 active:scale-95 ${selectedCategory === 'all'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {t('common.all') || 'すべて'}
          </button>
          {INGREDIENT_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-component-sm sm:px-component-lg py-component-sm sm:py-component-md rounded-full text-xs sm:text-sm font-medium transition-all duration-300 
                         hover:scale-105 active:scale-95 flex items-center gap-1 sm:gap-2 ${selectedCategory === category.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <span className='text-sm sm:text-lg'>{category.icon}</span>
              <span className='hidden sm:inline'>{category.name}</span>
            </button>
          ))}
        </div>

        {/* 成分カードグリッド - Apple風広めの余白 */}
        <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-component-md sm:gap-component-lg lg:gap-component-xl mb-component-2xl'>
          {filteredIngredients.map(ingredient => (
            <IngredientCard
              key={ingredient.id}
              ingredient={ingredient}
              onClick={() => handleIngredientClick(ingredient.id)}
            />
          ))}
        </div>

        {/* もっと見るボタン - Apple風広めの余白 */}
        {selectedCategory === 'all' && MOCK_INGREDIENTS.length > 6 && (
          <div className='text-center mb-component-xl'>
            <button
              className='px-component-xl py-component-md border-2 border-primary-600 text-primary-600 
                             rounded-xl font-medium hover:bg-primary-600 hover:text-white 
                             transition-all duration-300 hover:scale-105 active:scale-95'
            >
              {t('ingredients.guide')}
            </button>
          </div>
        )}

        {/* カテゴリ選択時の説明 - Apple風広めの余白 */}
        {selectedCategory !== 'all' && (
          <div className='text-center'>
            {(() => {
              const categoryInfo = INGREDIENT_CATEGORIES.find(
                cat => cat.id === selectedCategory
              );
              return categoryInfo ? (
                <div className='max-w-2xl mx-auto'>
                  <div className='flex items-center justify-center gap-component-md mb-component-lg'>
                    <span className='text-4xl'>{categoryInfo.icon}</span>
                    <h3 className='text-2xl font-semibold text-gray-900'>
                      {categoryInfo.name}
                    </h3>
                  </div>
                  <p className='text-gray-600 leading-relaxed mb-component-xl'>
                    {categoryInfo.description}
                  </p>
                  <div>
                    <span
                      className='inline-flex items-center px-component-md py-component-sm bg-primary-100 
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
