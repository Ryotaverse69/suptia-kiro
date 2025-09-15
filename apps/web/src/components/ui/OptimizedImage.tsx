'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * 最適化された画像コンポーネント
 * - WebP自動変換
 * - 遅延読み込み
 * - プレースホルダー対応
 * - エラーハンドリング
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  fill = false,
  quality = 85,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // エラー時のフォールバック画像
  const fallbackSrc = '/placeholders/product-placeholder.svg';

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        src={hasError ? fallbackSrc : src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        sizes={sizes}
        quality={quality}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          fill ? 'object-cover' : '',
          className?.includes('pointer-events-none') ? 'pointer-events-none' : ''
        )}
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* ローディング状態のプレースホルダー */}
      {isLoading && !hasError && (
        <div className='absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center'>
          <div className='w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin' />
        </div>
      )}
    </div>
  );
}

/**
 * 商品画像用の最適化コンポーネント
 */
export function ProductImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={400}
      height={300}
      className={className}
      priority={priority}
      placeholder='blur'
      blurDataURL='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjhGQUZDIi8+Cjwvc3ZnPg=='
      sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
      quality={90}
    />
  );
}

/**
 * 成分画像用の最適化コンポーネント
 */
export function IngredientImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={300}
      height={200}
      className={className}
      placeholder='blur'
      blurDataURL='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjBGOUZGIi8+Cjwvc3ZnPg=='
      sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw'
      quality={85}
    />
  );
}

/**
 * ヒーロー背景画像用の最適化コンポーネント
 */
export function HeroBackgroundImage({ className }: { className?: string }) {
  return (
    <OptimizedImage
      src='/placeholders/hero-background.svg'
      alt='Hero background'
      fill
      priority
      className={cn('pointer-events-none', className)}
      sizes='100vw'
      quality={75}
    />
  );
}
