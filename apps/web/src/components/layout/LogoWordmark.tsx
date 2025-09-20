import { cn } from '@/lib/utils';

const sizeStyles = {
  sm: {
    title: 'text-lg',
    subtitle: 'text-xs',
    gap: 'gap-1',
  },
  md: {
    title: 'text-xl',
    subtitle: 'text-xs',
    gap: 'gap-1.5',
  },
  lg: {
    title: 'text-2xl',
    subtitle: 'text-sm',
    gap: 'gap-2',
  },
} as const;

type LogoWordmarkSize = keyof typeof sizeStyles;

export interface LogoWordmarkProps {
  size?: LogoWordmarkSize;
  className?: string;
  showEnglish?: boolean;
}

export function LogoWordmark({
  size = 'md',
  className,
  showEnglish = true,
}: LogoWordmarkProps) {
  const styles = sizeStyles[size];

  return (
    <span
      className={cn(
        'inline-flex flex-col items-start justify-center font-semibold tracking-tight text-slate-900',
        styles.gap,
        className
      )}
      aria-label='サプティア | Suptia'
    >
      <span className={cn('flex items-baseline gap-[0.45rem]', styles.title)}>
        <span className='bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-500 bg-clip-text font-medium text-transparent'>
          サプティア
        </span>
        <span className='font-light text-slate-400'>|</span>
        <span className='font-medium uppercase tracking-[0.24em] text-slate-700'>
          Suptia
        </span>
      </span>
      {showEnglish ? (
        <span className={cn('font-medium text-text-muted', styles.subtitle)}>
          Precision Supplement Intelligence
        </span>
      ) : null}
    </span>
  );
}
