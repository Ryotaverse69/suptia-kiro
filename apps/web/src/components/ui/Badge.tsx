import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Apple/xAI風Badgeコンポーネント
 * 成分バッジ、エビデンス強度表示などに使用
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium tracking-tight transition-all duration-200 ease-apple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
  {
    variants: {
      variant: {
        // デフォルト: Apple風グレー
        default:
          'border-border bg-background-surface text-slate-700 hover:bg-slate-100',

        // プライマリ: Apple風ブルー (#2563EB)
        primary:
          'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100',

        // セカンダリ: グリーン系
        secondary:
          'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',

        // 成分タグ用
        ingredient:
          'border-primary-200/70 bg-primary-50 text-primary-700 hover:border-primary-300 hover:bg-primary-100',

        // 効果タグ用
        effect:
          'border-emerald-200/70 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100',

        // 価格タグ用
        price:
          'border-amber-200/70 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100',

        // レーティングタグ用
        rating:
          'border-purple-200/70 bg-purple-50 text-purple-700 hover:border-purple-300 hover:bg-purple-100',

        // 成功: 高評価用
        success: 'border-emerald-400 bg-emerald-500 text-white shadow-soft',

        // 警告: 中評価用
        warning: 'border-amber-400 bg-amber-500 text-white shadow-soft',

        // エラー: 低評価用
        error: 'border-rose-400 bg-rose-500 text-white shadow-soft',

        // 情報: 一般的な情報用
        info: 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100',

        // アウトライン: ボーダーのみ
        outline: 'border-border text-slate-700 hover:bg-slate-50',

        // エビデンス強度A: 高い信頼性
        evidenceA:
          'border-emerald-400 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold shadow-soft',

        // エビデンス強度B: 中程度の信頼性
        evidenceB:
          'border-amber-400 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-soft',

        // エビデンス強度C: 低い信頼性
        evidenceC:
          'border-rose-400 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold shadow-soft',

        // スコア評価用バリアント
        high: 'border-emerald-400 bg-emerald-500 text-white shadow-soft',
        medium: 'border-amber-400 bg-amber-500 text-white shadow-soft',
        low: 'border-rose-400 bg-rose-500 text-white shadow-soft',
        danger: 'border-rose-500 bg-rose-600 text-white shadow-soft',
      },
      size: {
        sm: 'px-2.5 py-0.5 text-[11px]',
        md: 'px-3 py-1 text-xs',
        lg: 'px-3.5 py-1.5 text-sm',
      },
      // Apple風のホバー効果
      hover: {
        none: '',
        lift: 'hover:-translate-y-0.5 hover:shadow-soft',
        scale: 'hover:scale-[1.02]',
        glow: 'hover:shadow-[0_0_18px_rgba(37,99,235,0.18)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      hover: 'lift',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, hover, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size, hover }), className)}
      {...props}
    />
  );
}

/**
 * エビデンス強度バッジ専用コンポーネント
 */
interface EvidenceBadgeProps extends Omit<BadgeProps, 'variant'> {
  level: 'A' | 'B' | 'C';
}

function EvidenceBadge({ level, className, ...props }: EvidenceBadgeProps) {
  const variantMap = {
    A: 'evidenceA' as const,
    B: 'evidenceB' as const,
    C: 'evidenceC' as const,
  };

  const labelMap = {
    A: 'エビデンス A',
    B: 'エビデンス B',
    C: 'エビデンス C',
  };

  return (
    <Badge variant={variantMap[level]} className={className} {...props}>
      {labelMap[level]}
    </Badge>
  );
}

/**
 * スコアバッジ専用コンポーネント
 */
interface ScoreBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  score: number;
  maxScore?: number;
}

function ScoreBadge({
  score,
  maxScore = 100,
  className,
  ...props
}: ScoreBadgeProps) {
  const percentage = (score / maxScore) * 100;

  let variant: BadgeProps['variant'] = 'error';
  if (percentage >= 80) variant = 'success';
  else if (percentage >= 60) variant = 'warning';

  return (
    <Badge variant={variant} className={className} {...props}>
      スコア {score}
    </Badge>
  );
}

export { Badge, EvidenceBadge, ScoreBadge, badgeVariants };
