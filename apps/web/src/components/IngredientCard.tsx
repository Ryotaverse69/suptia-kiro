'use client';

import Link from 'next/link';

import { Ingredient } from '@/lib/ingredient-data';
import { IngredientImage } from './ui/OptimizedImage';

interface IngredientCardProps {
  ingredient: Ingredient;
  onClick?: () => void;
}

export default function IngredientCard({
  ingredient,
  onClick,
}: IngredientCardProps) {
  // エビデンス強度のA/B/C表示とカラー
  const getEvidenceLevelDisplay = (level: string) => {
    switch (level) {
      case 'high':
        return { label: 'A', color: 'bg-green-500 text-white' };
      case 'medium':
        return { label: 'B', color: 'bg-yellow-500 text-white' };
      case 'low':
        return { label: 'C', color: 'bg-red-500 text-white' };
      default:
        return { label: '?', color: 'bg-gray-500 text-white' };
    }
  };

  // カテゴリ別カラーコーディング
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'vitamins':
        return 'bg-orange-50 border-orange-200';
      case 'minerals':
        return 'bg-blue-50 border-blue-200';
      case 'herbs':
        return 'bg-green-50 border-green-200';
      case 'amino-acids':
        return 'bg-purple-50 border-purple-200';
      case 'probiotics':
        return 'bg-pink-50 border-pink-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const evidenceDisplay = getEvidenceLevelDisplay(ingredient.evidenceLevel);
  const categoryColor = getCategoryColor(ingredient.category);

  return (
    <article
      className={`bg-white rounded-xl p-4 sm:p-6 lg:p-8 border-2 ${categoryColor} cursor-pointer 
                       transition-all duration-400 hover:shadow-md hover:-translate-y-2 
                       hover:scale-[1.02] group apple-hover`}
      onClick={onClick}
      role='article'
      aria-labelledby={`ingredient-name-${ingredient.id}`}
      aria-describedby={`ingredient-description-${ingredient.id}`}
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* 成分画像 - Apple風広めの余白 */}
      <div className='mb-component-lg flex justify-center'>
        <div className='w-12 h-12 sm:w-16 sm:h-16 relative rounded-xl overflow-hidden'>
          <IngredientImage
            src={
              ingredient.imageUrl || '/placeholders/ingredient-placeholder.svg'
            }
            alt={`${ingredient.name}の成分画像`}
            className='w-full h-full object-cover'
          />
        </div>
      </div>

      {/* エビデンス強度バッジ - Apple風広めの余白 */}
      <div className='flex items-center justify-between mb-component-lg'>
        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${evidenceDisplay.color} 
                               flex items-center justify-center font-bold text-base sm:text-lg shadow-sm`}
          role='img'
          aria-label={`エビデンス強度 ${evidenceDisplay.label}ランク`}
        >
          {evidenceDisplay.label}
        </div>
        <div className='text-right'>
          <div className='text-xs sm:text-sm text-gray-500'>月額平均</div>
          <div
            className='text-base sm:text-lg font-semibold text-primary-600'
            aria-label={`月額平均価格 ${ingredient.averagePrice.toLocaleString()}円`}
          >
            ¥{ingredient.averagePrice.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 成分名 - Apple風広めの余白 */}
      <div className='mb-component-lg'>
        <h3
          id={`ingredient-name-${ingredient.id}`}
          className='text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-component-xs 
                              group-hover:text-primary-600 transition-colors duration-300 leading-tight'
        >
          {ingredient.name}
        </h3>
        <p className='text-xs sm:text-sm text-gray-500 font-light'>
          {ingredient.nameEn}
        </p>
      </div>

      {/* 説明文 - Apple風広めの余白 */}
      <p
        id={`ingredient-description-${ingredient.id}`}
        className='text-gray-600 text-sm mb-component-lg leading-relaxed line-clamp-3'
      >
        {ingredient.description}
      </p>

      {/* 効能バッジ - Apple風広めの余白 */}
      <div className='mb-component-lg'>
        <div
          className='flex flex-wrap gap-component-sm'
          role='list'
          aria-label='効能一覧'
        >
          {ingredient.benefits.slice(0, 3).map((benefit, index) => (
            <span
              key={index}
              role='listitem'
              className='px-3 py-1 bg-primary-100 text-primary-700 text-xs 
                                     rounded-full font-medium hover:bg-primary-200 
                                     transition-colors duration-200'
            >
              {benefit}
            </span>
          ))}
          {ingredient.benefits.length > 3 && (
            <span
              role='listitem'
              className='px-3 py-1 bg-gray-100 text-gray-600 text-xs 
                                       rounded-full font-medium'
              aria-label={`他${ingredient.benefits.length - 3}個の効能`}
            >
              +{ingredient.benefits.length - 3}個
            </span>
          )}
        </div>
      </div>

      {/* 人気度インジケーター - Apple風広めの余白 */}
      <div className='mb-component-lg' role='region' aria-label='人気度'>
        <div className='flex items-center justify-between text-sm mb-component-xs'>
          <span className='text-gray-500'>人気度</span>
          <span className='font-medium text-gray-700'>
            {ingredient.popularity}%
          </span>
        </div>
        <div
          className='w-full bg-gray-200 rounded-full h-2'
          role='progressbar'
          aria-valuenow={ingredient.popularity}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`人気度 ${ingredient.popularity}%`}
        >
          <div
            className='bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full 
                                 transition-all duration-500 ease-out'
            style={{ width: `${ingredient.popularity}%` }}
          />
        </div>
      </div>

      {/* Apple風CTAボタン */}
      <Link
        href={`/ingredients/${ingredient.id}`}
        onClick={event => event.stopPropagation()}
        className='w-full inline-flex justify-center items-center bg-primary-600 text-white py-3 sm:py-4 rounded-xl font-medium text-sm sm:text-base
                             hover:bg-primary-700 transition-all duration-300 hover:scale-105 active:scale-95
                             shadow-sm hover:shadow-md group-hover:shadow-primary-500/25'
        aria-label={`${ingredient.name}の詳細ページへ移動`}
      >
        詳細ページで見る
      </Link>
    </article>
  );
}
