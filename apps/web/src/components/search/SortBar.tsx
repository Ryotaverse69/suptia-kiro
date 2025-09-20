'use client';

import { Button } from '@/components/ui/Button';
import type { SearchSortOption } from '@/lib/search';
import { cn } from '@/lib/utils';

const sortOptions: Array<{ value: SearchSortOption; label: string }> = [
  { value: 'popularity_desc', label: 'おすすめ' },
  { value: 'rating_desc', label: '評価が高い' },
  { value: 'price_asc', label: '価格が安い' },
  { value: 'price_desc', label: '価格が高い' },
  { value: 'newest', label: '新着' },
];

interface SortBarProps {
  value: SearchSortOption;
  total: number;
  onChange: (value: SearchSortOption) => void;
}

export function SortBar({ value, total, onChange }: SortBarProps) {
  return (
    <div
      className='flex flex-col gap-4 rounded-3xl border border-border/60 bg-white/80 px-6 py-4 shadow-soft backdrop-blur-md md:flex-row md:items-center md:justify-between'
      role='region'
      aria-label='検索結果の並び替え'
    >
      <div>
        <p className='text-xs font-semibold uppercase tracking-[0.28em] text-text-muted'>
          検索結果
        </p>
        <p className='text-base font-semibold text-slate-900'>
          該当 {total.toLocaleString()} 件
        </p>
      </div>
      <div
        className='flex flex-wrap items-center gap-2'
        role='radiogroup'
        aria-label='並び替えオプション'
      >
        {sortOptions.map(option => (
          <Button
            key={option.value}
            type='button'
            variant={value === option.value ? 'primary' : 'ghost'}
            size='sm'
            hover='lift'
            className={cn(
              'rounded-full px-4 py-2 text-xs font-semibold',
              value === option.value ? '' : 'text-text-subtle'
            )}
            onClick={() => onChange(option.value)}
            role='radio'
            aria-checked={value === option.value}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
