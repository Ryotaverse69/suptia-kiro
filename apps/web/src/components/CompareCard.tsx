'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './ui/Button';
import { ProductImage } from './ui/OptimizedImage';

interface ProductBadge {
  label: string;
  variant: 'high' | 'medium' | 'low' | 'info';
}

interface CompareCardProps {
  id: string;
  name: string;
  brand: string;
  price: number;
  pricePerDay: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  mainIngredients: string[];
  imageUrl?: string;
  badges?: ProductBadge[];
  totalScore?: number;
  onViewDetails?: (productId: string) => void;
  onAddToFavorites?: (productId: string) => void;
  className?: string;
}

/**
 * Apple風商品比較カードコンポーネント
 * 画像・名称・最安値・主要成分バッジ・CTAを含む
 * ホバーで影・微拡大（Apple寄り：上品で短い）
 * Requirements: 1.4 - Popular Comparisons セクションでの使用
 */
export default function CompareCard({
  id,
  name,
  brand,
  price,
  pricePerDay,
  currency = '¥',
  rating,
  reviewCount,
  mainIngredients,
  imageUrl,
  badges = [],
  totalScore,
  onViewDetails,
  onAddToFavorites,
  className,
}: CompareCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(id);
    }
  };

  const handleAddToFavorites = () => {
    setIsFavorited(!isFavorited);
    if (onAddToFavorites) {
      onAddToFavorites(id);
    }
  };

  const getBadgeStyles = (variant: ProductBadge['variant']) => {
    const styles = {
      high: 'bg-gradient-to-r from-green-500 to-green-600 text-white',
      medium: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
      low: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
      info: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white',
    };
    return styles[variant];
  };

  return (
    <article
      className={cn(
        'bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-soft transition-all duration-300 group',
        'hover:shadow-lg hover:-translate-y-1 apple-hover',
        className
      )}
      role='article'
      aria-labelledby={`product-name-${id}`}
      aria-describedby={`product-description-${id}`}
    >
      {/* ヘッダー部分：スコアバッジとお気に入りボタン */}
      <div className='flex items-center justify-between mb-4 sm:mb-6'>
        {totalScore && (
          <div className='px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full text-xs sm:text-sm font-medium'>
            総合スコア {totalScore}
          </div>
        )}
        <button
          onClick={handleAddToFavorites}
          className='text-gray-400 hover:text-red-500 transition-colors p-1.5 sm:p-2 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          aria-label={isFavorited ? 'お気に入りから削除' : 'お気に入りに追加'}
        >
          <svg
            className='w-5 h-5 sm:w-6 sm:h-6'
            fill={isFavorited ? 'currentColor' : 'none'}
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
            />
          </svg>
        </button>
      </div>

      {/* 商品画像 */}
      <div className='mb-4 sm:mb-6 flex justify-center'>
        <div className='w-20 h-20 sm:w-24 sm:h-24 relative rounded-xl overflow-hidden'>
          <ProductImage
            src={imageUrl || '/placeholders/product-placeholder.svg'}
            alt={`${name}の商品画像`}
            className='w-full h-full object-cover'
          />
        </div>
      </div>

      {/* 商品情報 */}
      <div className='mb-4 sm:mb-6'>
        <h3
          id={`product-name-${id}`}
          className='text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors leading-tight'
        >
          {name}
        </h3>
        <p
          id={`product-description-${id}`}
          className='text-sm sm:text-base text-gray-600 mb-3 sm:mb-4'
        >
          {brand}
        </p>

        {/* 評価 */}
        {rating && (
          <div className='flex items-center mb-4'>
            <div
              className='flex items-center'
              role='img'
              aria-label={`5つ星中${rating.toFixed(1)}つ星の評価`}
            >
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={cn(
                    'w-4 h-4',
                    i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
                  )}
                  fill='currentColor'
                  viewBox='0 0 20 20'
                  aria-hidden='true'
                >
                  <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                </svg>
              ))}
            </div>
            <span className='ml-2 text-sm text-gray-600'>
              {rating.toFixed(1)}{' '}
              {reviewCount && `(${reviewCount}件のレビュー)`}
            </span>
          </div>
        )}

        {/* 主要成分バッジ */}
        <div
          className='flex flex-wrap gap-2 mb-4'
          role='list'
          aria-label='主要成分'
        >
          {mainIngredients.slice(0, 3).map((ingredient, index) => (
            <span
              key={index}
              role='listitem'
              className='px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs'
            >
              {ingredient}
            </span>
          ))}
          {mainIngredients.length > 3 && (
            <span
              role='listitem'
              className='px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs'
              aria-label={`他${mainIngredients.length - 3}種類の成分`}
            >
              +{mainIngredients.length - 3}
            </span>
          )}
        </div>

        {/* 追加バッジ */}
        {badges.length > 0 && (
          <div className='flex flex-wrap gap-2 mb-4'>
            {badges.map((badge, index) => (
              <span
                key={index}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium',
                  getBadgeStyles(badge.variant)
                )}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 価格情報 */}
      <div
        className='flex items-center justify-between mb-4 sm:mb-6'
        role='region'
        aria-label='価格情報'
      >
        <div>
          <span
            className='text-xl sm:text-2xl lg:text-3xl font-bold text-primary-600'
            aria-label={`価格 ${currency}${price.toLocaleString()}円`}
          >
            {currency}
            {price.toLocaleString()}
          </span>
          <span className='text-xs sm:text-sm text-gray-500 ml-1 sm:ml-2'>
            30日分
          </span>
        </div>
        <div className='text-right'>
          <div
            className='text-base sm:text-lg font-semibold text-gray-900'
            aria-label={`1日あたり ${currency}${Math.round(pricePerDay)}円`}
          >
            {currency}
            {Math.round(pricePerDay)}
          </div>
          <div className='text-xs sm:text-sm text-gray-500'>1日あたり</div>
        </div>
      </div>

      {/* CTAボタン */}
      <Button
        onClick={handleViewDetails}
        className='w-full'
        size='lg'
        hover='scale'
      >
        詳細を見る
      </Button>
    </article>
  );
}
