import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Apple/xAI風Buttonコンポーネント
 * デザイントークン: #2563EB、白基調、Inter + Noto Sans JP
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // プライマリ: Apple風ブルー (#2563EB)
        primary:
          'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-soft hover:shadow-medium',

        // セカンダリ: 白基調
        secondary:
          'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-soft hover:shadow-medium',

        // アウトライン: Apple風ボーダー
        outline:
          'border border-primary-600 text-primary-600 hover:bg-primary-50 hover:text-primary-700',

        // ゴースト: 最小限のスタイル
        ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',

        // リンク: テキストのみ
        link: 'text-primary-600 underline-offset-4 hover:underline',

        // 破壊的アクション
        destructive:
          'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-soft hover:shadow-medium',
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 py-3 text-base',
        xl: 'h-14 px-8 py-4 text-lg',
        icon: 'h-10 w-10',
      },
      // Apple風のホバー効果
      hover: {
        none: '',
        lift: 'hover:-translate-y-0.5',
        scale: 'hover:scale-[1.02] active:scale-[0.98]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      hover: 'lift',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, hover, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, hover, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
