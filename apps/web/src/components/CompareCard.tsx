'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './ui/Button';
import { ProductImage } from './ui/OptimizedImage';
import { useLocale, useTranslation } from '@/contexts/LocaleContext';

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
  const { formatPrice } = useLocale();
  const { t } = useTranslation();

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enterキーまたはスペースキーで詳細を表示
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleViewDetails();
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
        'bg-white rounded-xl p-4 sm:p-6 lg:p-8 shadow-soft transition-all duration-300 group',
        'hover:shadow-md hover:-translate-y-1 apple-hover',
        className
      )}
      role='article'
      aria-labelledby={`product-name-${id}`}
      aria-describedby={`product-description-${id}`}
    >
      {/* ヘッダー部分：スコアバッジとお気に入りボタン - Apple風広めの余白 */}
      <div className='flex items-center justify-between mb-component-lg'>
        {totalScore && (
          <div className='px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full text-xs sm:text-sm font-medium'>
            {t('diagnosis.totalScore')} {totalScore}
          </div>
        )}
        <button
          onClick={handleAddToFavorites}
          className='text-gray-400 hover:text-red-500 transition-colors p-3 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 min-w-[44px] min-h-[44px] flex items-center justify-center'
          aria-label={
            isFavorited
              ? t('product.removeFromFavorites')
              : t('product.addToFavorites')
          }
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

      {/* 商品画像 - より大きく目立つサイズに変更 */}
      <div className='mb-component-lg flex justify-center'>
        <div className='w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 relative rounded-xl overflow-hidden bg-gray-50 group-hover:shadow-sm transition-shadow duration-300'>
          <ProductImage
            src={imageUrl || '/placeholders/product-placeholder.svg'}
            alt={`${name}の商品画像`}
            className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
          />
        </div>
      </div>

      {/* 商品情報 - Apple風広めの余白 */}
      <div className='mb-component-lg'>
        <h3
          id={`product-name-${id}`}
          className='text-lg sm:text-xl lg:text-2xl font-semibold-apple text-gray-900 mb-component-xs group-hover:text-primary-600 transition-colors leading-tight font-apple tracking-apple-normal'
        >
          {name}
        </h3>
        <p
          id={`product-description-${id}`}
          className='text-sm sm:text-base text-gray-600 mb-component-md font-apple font-normal-apple'
        >
          {brand}
        </p>

        {/* 評価 - Apple風広めの余白 */}
        {rating && (
          <div className='flex items-center mb-component-md'>
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
            <span className='ml-component-sm text-sm text-gray-600'>
              {rating.toFixed(1)}{' '}
              {reviewCount && `(${reviewCount}${t('product.reviews')})`}
            </span>
          </div>
        )}

        {/* 主要成分バッジ - Apple風デザイン強化 */}
        <div
          className='flex flex-wrap gap-component-sm mb-component-md'
          role='list'
          aria-label='主要成分'
        >
          {mainIngredients.slice(0, 3).map((ingredient, index) => (
            <span
              key={index}
              role='listitem'
              className='px-3 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200/50 hover:border-primary-200 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 hover:text-primary-700 transition-all duration-200'
            >
              {ingredient}
            </span>
          ))}
          {mainIngredients.length > 3 && (
            <span
              role='listitem'
              className='px-3 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200/50'
              aria-label={`他${mainIngredients.length - 3}種類の成分`}
            >
              +{mainIngredients.length - 3}
            </span>
          )}
        </div>

        {/* 追加バッジ - Apple風広めの余白 */}
        {badges.length > 0 && (
          <div className='flex flex-wrap gap-component-sm mb-component-md'>
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

      {/* 価格情報 - 最安値を明示 */}
      <div
        className='flex items-center justify-between mb-component-lg'
        role='region'
        aria-label='価格情報'
      >
        <div>
          <div className='flex items-center gap-2 mb-1'>
            <span className='px-2 py-0.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-xs font-medium'>
              最安値
            </span>
          </div>
          <span
            className='text-xl sm:text-2xl lg:text-3xl font-semibold-apple text-primary-600 font-apple tracking-apple-normal'
            aria-label={`最安値 ${formatPrice(price)}`}
          >
            {formatPrice(price)}
          </span>
          <span className='text-xs sm:text-sm text-gray-500 ml-component-xs sm:ml-component-sm font-apple'>
            30日分
          </span>
        </div>
        <div className='text-right'>
          <div
            className='text-base sm:text-lg font-semibold-apple text-gray-900 font-apple tracking-apple-normal'
            aria-label={`1日あたり ${formatPrice(pricePerDay)}`}
          >
            {formatPrice(pricePerDay)}
          </div>
          <div className='text-xs sm:text-sm text-gray-500 font-apple'>
            1日あたり
          </div>
        </div>
      </div>

      {/* Apple風CTAボタン - より目立つデザイン */}
      <div className='flex gap-3'>
        <Button
          onClick={handleViewDetails}
          onKeyDown={handleKeyDown}
          className='flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-4 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
          size='lg'
          hover='scale'
          aria-describedby={`product-description-${id}`}
        >
          {t('product.details')}
        </Button>
        <button
          className='px-4 py-4 border-2 border-primary-600 text-primary-600 rounded-xl font-medium hover:bg-primary-600 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 min-w-[60px] flex items-center justify-center'
          aria-label='比較に追加'
          title='比較に追加'
        >
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 6v6m0 0v6m0-6h6m-6 0H6'
            />
          </svg>
        </button>
      </div>
    </article>
  );
}
