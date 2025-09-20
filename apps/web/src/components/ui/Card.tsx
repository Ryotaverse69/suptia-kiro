import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Apple/xAI風Cardコンポーネント
 * 白基調、極薄影、Apple風の洗練されたデザイン
 */
const cardVariants = cva(
  'rounded-2xl border border-border bg-white text-slate-900 shadow-soft transition-all duration-300 ease-apple',
  {
    variants: {
      variant: {
        // デフォルト: 白基調、極薄影
        default: 'border-border/70 shadow-soft',

        // エレベーテッド: より強い影
        elevated: 'border-border/50 shadow-medium hover:shadow-strong',

        // アウトライン: ボーダーのみ
        outlined: 'border-border shadow-none hover:border-primary-200',

        // ガラス効果
        glass: 'border-white/40 bg-white/70 backdrop-blur-lg shadow-soft',

        // ヒーロー: 大型カード用
        hero: 'border-transparent bg-gradient-to-br from-white to-slate-100/60 shadow-strong',

        // プロダクトカード
        product:
          'border-border bg-white shadow-soft hover:shadow-medium hover:border-primary-200/80 relative overflow-hidden',

        // 成分カード
        ingredient:
          'border-primary-100/60 bg-gradient-to-br from-primary-50/70 via-white to-secondary-50/60 shadow-soft backdrop-blur-[2px]',

        // カテゴリーカード
        category:
          'border-border/60 bg-white/90 backdrop-blur-md shadow-soft hover:shadow-medium',
      },
      // Apple風のホバー効果
      hover: {
        none: '',
        lift: 'hover:-translate-y-1 hover:shadow-medium',
        scale: 'hover:scale-[1.01]',
        glow: 'hover:shadow-[0_0_24px_rgba(37,99,235,0.12)]',
      },
      // パディング設定
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      hover: 'lift',
      padding: 'md',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, hover, padding, className }))}
      {...props}
    />
  )
);
Card.displayName = 'Card';

/**
 * CardHeader - カードのヘッダー部分
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

/**
 * CardTitle - カードのタイトル
 */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-xl font-semibold leading-tight tracking-tight text-slate-900',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

/**
 * CardDescription - カードの説明文
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-slate-600 leading-relaxed', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

/**
 * CardContent - カードのメインコンテンツ
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

/**
 * CardFooter - カードのフッター
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
};
