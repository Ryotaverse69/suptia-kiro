import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Apple/xAI風Buttonコンポーネント
 * デザイントークン: #2563EB、白基調、Inter + Noto Sans JP
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-semibold tracking-tight transition-all duration-200 ease-apple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // プライマリ: Apple風ブルー (#2563EB)
        primary:
          'bg-primary-600 text-white shadow-soft hover:bg-primary-700 hover:shadow-medium active:bg-primary-800',

        // セカンダリ: 白基調
        secondary:
          'bg-white text-slate-900 border border-border/60 shadow-soft hover:bg-background-surface hover:border-border hover:shadow-medium',

        // アウトライン: Apple風ボーダー
        outline:
          'border border-primary-600 text-primary-600 bg-white hover:bg-primary-50 hover:text-primary-700',

        // ゴースト: 最小限のスタイル
        ghost:
          'text-slate-600 hover:bg-primary-50/60 hover:text-primary-700 focus-visible:bg-primary-50/60',

        // リンク: テキストのみ
        link: 'text-primary-600 underline-offset-4 hover:underline focus-visible:underline',

        // 破壊的アクション
        destructive:
          'bg-red-500 text-white shadow-soft hover:bg-red-600 active:bg-red-700',

        // 透明なガラス調ボタン
        glass:
          'border border-white/70 bg-white/30 text-white backdrop-blur-xl shadow-soft hover:bg-white/45 hover:text-white',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-lg',
        icon: 'h-11 w-11',
      },
      // Apple風のホバー効果
      hover: {
        none: '',
        lift: 'hover:-translate-y-0.5',
        scale: 'hover:scale-[1.02] active:scale-[0.98]',
        glow: 'hover:shadow-[0_0_24px_rgba(37,99,235,0.18)]',
      },
      fullWidth: {
        true: 'w-full',
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
