import * as React from 'react';
import { cn } from '@/lib/utils';

type SkeletonVariant = 'card' | 'list' | 'filter';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  lines?: number;
}

const shimmerClass =
  'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent before:animate-[shimmer_1.8s_infinite] before:will-change-transform';

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'card', lines = 4, ...props }, ref) => {
    if (variant === 'list') {
      return (
        <div
          ref={ref}
          className={cn('space-y-3', className)}
          role='status'
          aria-live='polite'
          {...props}
        >
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={cn(
                shimmerClass,
                'h-4 w-full rounded-full bg-slate-200/80'
              )}
            />
          ))}
        </div>
      );
    }

    if (variant === 'filter') {
      return (
        <div
          ref={ref}
          className={cn(
            'space-y-3 rounded-2xl border border-border/60 bg-white p-4 shadow-soft',
            className
          )}
          role='status'
          aria-live='polite'
          {...props}
        >
          <div
            className={cn(
              shimmerClass,
              'h-4 w-28 rounded-full bg-slate-200/80'
            )}
          />
          <div
            className={cn(
              shimmerClass,
              'h-10 w-full rounded-2xl bg-slate-200/80'
            )}
          />
          <div className='space-y-2'>
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  shimmerClass,
                  'h-3 w-full rounded-full bg-slate-200/60'
                )}
              />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          shimmerClass,
          'h-[260px] w-full rounded-2xl bg-slate-200/80',
          className
        )}
        role='status'
        aria-live='polite'
        {...props}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';

export { Skeleton };
