import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Apple/xAI風Badgeコンポーネント
 * 成分バッジ、エビデンス強度表示などに使用
 */
const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2',
  {
    variants: {
      variant: {
        // デフォルト: Apple風グレー
        default: 'border-gray-200 bg-gray-100 text-gray-800 hover:bg-gray-200',

        // プライマリ: Apple風ブルー (#2563EB)
        primary:
          'border-primary-200 bg-primary-100 text-primary-800 hover:bg-primary-200',

        // セカンダリ: グリーン系
        secondary:
          'border-green-200 bg-green-100 text-green-800 hover:bg-green-200',

        // 成功: 高評価用
        success: 'border-green-300 bg-green-500 text-white shadow-soft',

        // 警告: 中評価用
        warning: 'border-yellow-300 bg-yellow-500 text-white shadow-soft',

        // エラー: 低評価用
        error: 'border-red-300 bg-red-500 text-white shadow-soft',

        // 情報: 一般的な情報用
        info: 'border-blue-300 bg-blue-500 text-white shadow-soft',

        // アウトライン: ボーダーのみ
        outline: 'border-gray-300 text-gray-700 hover:bg-gray-50',

        // エビデンス強度A: 高い信頼性
        evidenceA:
          'border-green-400 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold shadow-soft',

        // エビデンス強度B: 中程度の信頼性
        evidenceB:
          'border-yellow-400 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold shadow-soft',

        // エビデンス強度C: 低い信頼性
        evidenceC:
          'border-red-400 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-soft',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
      // Apple風のホバー効果
      hover: {
        none: '',
        lift: 'hover:-translate-y-0.5 hover:shadow-soft',
        scale: 'hover:scale-105',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      hover: 'scale',
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
