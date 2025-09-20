'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  align?: 'left' | 'center' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children?: ReactNode;
}

/**
 * Apple風セクションヘッダーコンポーネント
 * 統一されたセクション見出しデザインとApple風のタイポグラフィを提供
 * Requirements: 1.4 - Popular Comparisons セクションでの使用
 */
export default function SectionHeader({
  id,
  title,
  subtitle,
  description,
  align = 'center',
  size = 'lg',
  className,
  children,
}: SectionHeaderProps) {
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const sizeClasses = {
    sm: {
      title: 'text-2xl md:text-3xl lg:text-4xl',
      subtitle: 'text-sm',
      description: 'text-base lg:text-lg',
      spacing: 'mb-component-xl lg:mb-component-2xl',
    },
    md: {
      title: 'text-3xl md:text-4xl lg:text-5xl',
      subtitle: 'text-sm',
      description: 'text-lg lg:text-xl',
      spacing: 'mb-section-xs lg:mb-section-sm',
    },
    lg: {
      title: 'text-4xl md:text-5xl lg:text-6xl xl:text-7xl',
      subtitle: 'text-base',
      description: 'text-xl lg:text-2xl',
      spacing: 'mb-section-sm lg:mb-section-md',
    },
    xl: {
      title: 'text-5xl md:text-6xl lg:text-7xl xl:text-8xl',
      subtitle: 'text-lg',
      description: 'text-2xl lg:text-3xl',
      spacing: 'mb-section-md lg:mb-section-lg',
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <header
      className={cn(
        'w-full',
        alignmentClasses[align],
        currentSize.spacing,
        className
      )}
      role='banner'
    >
      {/* サブタイトル（小さなラベル） - Apple風広めの余白 */}
      {subtitle && (
        <div
          className={cn(
            'font-medium text-primary-600 tracking-wide uppercase mb-component-md',
            currentSize.subtitle
          )}
          aria-label='セクションカテゴリ'
        >
          {subtitle}
        </div>
      )}

      {/* メインタイトル - Apple風タイポグラフィ - Apple風広めの余白 */}
      <h2
        className={cn(
          'font-light text-gray-900 leading-[1.1] tracking-tight mb-component-lg',
          currentSize.title
        )}
        id={id || `section-${title.replace(/\s+/g, '-').toLowerCase()}`}
        aria-label={title}
      >
        {title}
      </h2>

      {/* 説明文 - 統一間隔 */}
      {description && (
        <p
          className={cn(
            'text-gray-600 font-light max-w-2xl lg:max-w-3xl xl:max-w-4xl tracking-normal',
            currentSize.description,
            align === 'center' && 'mx-auto',
            align === 'right' && 'ml-auto'
          )}
          aria-describedby={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
        >
          {description}
        </p>
      )}

      {/* 追加コンテンツ - Apple風広めの余白 */}
      {children && <div className='mt-component-lg'>{children}</div>}
    </header>
  );
}
