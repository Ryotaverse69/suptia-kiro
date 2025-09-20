'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { UiFilters } from './FilterSidebar';

type RemovableFilterKey = keyof UiFilters | 'query' | 'price';

interface ActiveFiltersBarProps {
  filters: UiFilters;
  query?: string;
  onRemove: (type: RemovableFilterKey, value?: string) => void;
  onClearAll: () => void;
}

export function ActiveFiltersBar({
  filters,
  query,
  onRemove,
  onClearAll,
}: ActiveFiltersBarProps) {
  const chips: Array<{
    key: string;
    label: string;
    type: RemovableFilterKey;
    value?: string;
  }> = [];

  if (query) {
    chips.push({
      key: `query-${query}`,
      label: `検索: ${query}`,
      type: 'query',
    });
  }

  filters.goals.forEach(goal =>
    chips.push({
      key: `goal-${goal}`,
      label: `目的: ${goal}`,
      type: 'goals',
      value: goal,
    })
  );
  filters.categories.forEach(category =>
    chips.push({
      key: `category-${category}`,
      label: `カテゴリ: ${category}`,
      type: 'categories',
      value: category,
    })
  );
  filters.brands.forEach(brand =>
    chips.push({
      key: `brand-${brand}`,
      label: `ブランド: ${brand}`,
      type: 'brands',
      value: brand,
    })
  );
  filters.ingredients.forEach(ingredient =>
    chips.push({
      key: `ingredient-${ingredient}`,
      label: `成分: ${ingredient}`,
      type: 'ingredients',
      value: ingredient,
    })
  );

  if (filters.rating) {
    chips.push({
      key: `rating-${filters.rating}`,
      label: `評価 ${filters.rating}+`,
      type: 'rating',
    });
  }
  if (filters.inStockOnly) {
    chips.push({ key: 'stock', label: '在庫あり', type: 'inStockOnly' });
  }
  if (filters.onSale) {
    chips.push({ key: 'sale', label: 'セール', type: 'onSale' });
  }
  if (filters.priceMin > 0 || filters.priceMax < Number.MAX_SAFE_INTEGER) {
    chips.push({
      key: 'price',
      label: `価格 ${filters.priceMin.toLocaleString()}〜${filters.priceMax.toLocaleString()}円`,
      type: 'price',
    });
  }

  if (chips.length === 0) return null;

  return (
    <div
      className='flex flex-wrap items-center gap-2 rounded-3xl border border-border/60 bg-white/80 px-6 py-4 shadow-soft backdrop-blur-md'
      role='region'
      aria-label='適用中の検索フィルター'
    >
      {chips.map(chip => (
        <button
          key={chip.key}
          type='button'
          className='transition duration-150 ease-apple hover:-translate-y-0.5'
          onClick={() => onRemove(chip.type, chip.value)}
          aria-label={`${chip.label} を解除`}
        >
          <Badge variant='ingredient' hover='lift'>
            {chip.label}
          </Badge>
        </button>
      ))}
      <Button
        type='button'
        variant='ghost'
        size='sm'
        hover='lift'
        onClick={onClearAll}
        className='ml-auto rounded-full text-xs font-semibold text-text-muted'
        aria-label='すべてのフィルターを解除'
      >
        すべて解除
      </Button>
    </div>
  );
}
