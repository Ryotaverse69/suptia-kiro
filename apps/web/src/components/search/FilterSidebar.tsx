'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SearchFacets } from '@/lib/search';
import { cn } from '@/lib/utils';

export interface UiFilters {
  categories: string[];
  brands: string[];
  goals: string[];
  ingredients: string[];
  priceMin: number;
  priceMax: number;
  rating?: number;
  inStockOnly: boolean;
  onSale: boolean;
}

interface FilterSidebarProps {
  filters: UiFilters;
  facets: SearchFacets;
  onChange: (next: UiFilters) => void;
  onReset: () => void;
  suggestedConditions?: string[];
  onSelectCondition?: (condition: string) => void;
}

const ratingOptions = [
  { label: '星4.5以上', value: 4.5 },
  { label: '星4.0以上', value: 4 },
  { label: '星3.5以上', value: 3.5 },
];

const goalOptionsPreset = [
  '疲労回復',
  '美容',
  '免疫ケア',
  '睡眠サポート',
  '筋力アップ',
  '集中力',
];

function toggle(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter(item => item !== value)
    : [...list, value];
}

export function FilterSidebar({
  filters,
  facets,
  onChange,
  onReset,
  suggestedConditions,
  onSelectCondition,
}: FilterSidebarProps) {
  const update = (partial: Partial<UiFilters>) => {
    onChange({ ...filters, ...partial });
  };

  const toggleCategory = (value: string) =>
    update({ categories: toggle(filters.categories, value) });
  const toggleBrand = (value: string) =>
    update({ brands: toggle(filters.brands, value) });
  const toggleGoal = (value: string) =>
    update({ goals: toggle(filters.goals, value) });
  const toggleIngredient = (value: string) =>
    update({ ingredients: toggle(filters.ingredients, value) });
  const applyRating = (value?: number) => update({ rating: value });

  const presetRanges = [
    { label: '〜¥5,000', min: 0, max: 5000 },
    { label: '〜¥10,000', min: 0, max: 10000 },
    { label: '¥10,000〜¥15,000', min: 10000, max: 15000 },
    { label: '¥15,000〜', min: 15000, max: facets.priceRange.max || 20000 },
  ];

  return (
    <aside
      role='complementary'
      aria-labelledby='search-filter-heading'
      className='space-y-6 rounded-3xl border border-border/60 bg-white/80 p-6 shadow-soft backdrop-blur-md'
    >
      <div className='flex items-center justify-between'>
        <h2
          id='search-filter-heading'
          className='text-base font-semibold text-slate-900'
        >
          フィルター
        </h2>
        <button
          type='button'
          onClick={onReset}
          aria-label='すべてのフィルターを解除'
          className='text-xs font-semibold text-primary-600 hover:text-primary-700'
        >
          条件をクリア
        </button>
      </div>

      {suggestedConditions && suggestedConditions.length > 0 ? (
        <div className='rounded-2xl border border-primary-200/60 bg-primary-50/50 p-4 shadow-soft'>
          <p className='text-xs font-semibold uppercase tracking-[0.28em] text-primary-600'>
            AIが選んだ条件
          </p>
          <div className='mt-3 flex flex-wrap gap-2'>
            {suggestedConditions.map(condition => (
              <button
                key={condition}
                type='button'
                onClick={() => onSelectCondition?.(condition)}
                className='rounded-full border border-primary-300 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600 transition duration-200 ease-apple hover:-translate-y-0.5 hover:bg-primary-100'
                aria-label={`${condition} を適用`}
              >
                {condition}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <section className='space-y-4'>
        <header className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold text-slate-900'>目的</h3>
          <span className='text-xs text-text-muted'>
            {filters.goals.length}件選択中
          </span>
        </header>
        <div className='flex flex-wrap gap-2'>
          {(facets.goals.length > 0
            ? facets.goals.map(goal => goal.value)
            : goalOptionsPreset
          ).map(goal => (
            <button
              key={goal}
              type='button'
              className={cn(
                'rounded-full border border-border/60 px-3 py-1 text-xs text-text-subtle transition duration-150 ease-apple hover:-translate-y-0.5 hover:border-primary-300 hover:text-primary-600',
                filters.goals.includes(goal) &&
                  'border-primary-300 bg-primary-50/80 text-primary-600'
              )}
              aria-pressed={filters.goals.includes(goal)}
              onClick={() => toggleGoal(goal)}
            >
              {goal}
            </button>
          ))}
        </div>
      </section>

      <section className='space-y-4'>
        <header className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold text-slate-900'>成分</h3>
          <span className='text-xs text-text-muted'>
            {filters.ingredients.length}件選択中
          </span>
        </header>
        <div className='flex flex-wrap gap-2'>
          {facets.ingredients.slice(0, 12).map(ingredient => (
            <button
              key={ingredient.value}
              type='button'
              className={cn(
                'rounded-full border border-border/60 px-3 py-1 text-xs text-text-subtle transition duration-150 ease-apple hover:-translate-y-0.5 hover:border-primary-300 hover:text-primary-600',
                filters.ingredients.includes(ingredient.value) &&
                  'border-primary-300 bg-primary-50/80 text-primary-600'
              )}
              aria-pressed={filters.ingredients.includes(ingredient.value)}
              onClick={() => toggleIngredient(ingredient.value)}
            >
              {ingredient.value}
            </button>
          ))}
        </div>
      </section>

      <section className='space-y-3'>
        <h3 className='text-sm font-semibold text-slate-900'>カテゴリ</h3>
        <div className='space-y-2 text-sm text-text-subtle'>
          {facets.categories.map(category => (
            <label
              key={category.value}
              className='flex items-center justify-between gap-3 rounded-xl border border-border/40 px-3 py-2'
            >
              <span>{category.value}</span>
              <input
                type='checkbox'
                className='h-4 w-4 accent-primary-600'
                checked={filters.categories.includes(category.value)}
                onChange={() => toggleCategory(category.value)}
              />
            </label>
          ))}
        </div>
      </section>

      <section className='space-y-3'>
        <h3 className='text-sm font-semibold text-slate-900'>ブランド</h3>
        <div className='space-y-2 text-sm text-text-subtle'>
          {facets.brands.map(brand => (
            <label
              key={brand.value}
              className='flex items-center justify-between gap-3 rounded-xl border border-border/40 px-3 py-2'
            >
              <span>{brand.value}</span>
              <input
                type='checkbox'
                className='h-4 w-4 accent-primary-600'
                checked={filters.brands.includes(brand.value)}
                onChange={() => toggleBrand(brand.value)}
              />
            </label>
          ))}
        </div>
      </section>

      <section className='space-y-4'>
        <h3 className='text-sm font-semibold text-slate-900'>価格帯</h3>
        <div className='grid grid-cols-2 gap-3'>
          <Input
            type='number'
            min={0}
            max={filters.priceMax}
            value={filters.priceMin}
            onChange={event => {
              const value = Math.max(0, Number(event.target.value));
              update({ priceMin: Math.min(value, filters.priceMax) });
            }}
            placeholder='最小金額'
            aria-label='最小金額'
          />
          <Input
            type='number'
            min={filters.priceMin}
            max={Math.max(filters.priceMin, facets.priceRange.max || 20000)}
            value={filters.priceMax}
            onChange={event => {
              const value = Math.max(
                filters.priceMin,
                Number(event.target.value)
              );
              update({ priceMax: value });
            }}
            placeholder='最大金額'
            aria-label='最大金額'
          />
        </div>
        <div className='flex flex-wrap gap-2'>
          {presetRanges.map(range => (
            <button
              key={range.label}
              type='button'
              className='rounded-full border border-border/60 px-3 py-1 text-xs text-text-subtle transition duration-150 ease-apple hover:-translate-y-0.5 hover:border-primary-300 hover:text-primary-600'
              onClick={() =>
                update({ priceMin: range.min, priceMax: range.max })
              }
            >
              {range.label}
            </button>
          ))}
        </div>
      </section>

      <section className='space-y-3'>
        <h3 className='text-sm font-semibold text-slate-900'>評価</h3>
        <div className='space-y-2 text-sm text-text-subtle'>
          {ratingOptions.map(option => (
            <label
              key={option.value}
              className='flex items-center justify-between gap-3 rounded-xl border border-border/40 px-3 py-2'
            >
              <span>{option.label}</span>
              <input
                type='radio'
                className='h-4 w-4 accent-primary-600'
                checked={filters.rating === option.value}
                onChange={() => applyRating(option.value)}
              />
            </label>
          ))}
          <button
            type='button'
            className='text-xs font-semibold text-primary-600 hover:text-primary-700'
            onClick={() => applyRating(undefined)}
          >
            評価フィルターを解除
          </button>
        </div>
      </section>

      <section className='space-y-3'>
        <h3 className='text-sm font-semibold text-slate-900'>その他の条件</h3>
        <div className='space-y-2 text-sm text-text-subtle'>
          <label className='flex items-center justify-between gap-3 rounded-xl border border-border/40 px-3 py-2'>
            <span>在庫ありのみ表示</span>
            <input
              type='checkbox'
              className='h-4 w-4 accent-primary-600'
              checked={filters.inStockOnly}
              onChange={event => update({ inStockOnly: event.target.checked })}
              aria-label='在庫がある商品だけ表示'
            />
          </label>
          <label className='flex items-center justify-between gap-3 rounded-xl border border-border/40 px-3 py-2'>
            <span>セール対象のみ</span>
            <input
              type='checkbox'
              className='h-4 w-4 accent-primary-600'
              checked={filters.onSale}
              onChange={event => update({ onSale: event.target.checked })}
              aria-label='セール中の商品に限定'
            />
          </label>
        </div>
      </section>

      {filters.ingredients.length > 0 ? (
        <section className='space-y-3'>
          <h3 className='text-sm font-semibold text-slate-900'>選択中の成分</h3>
          <div className='flex flex-wrap gap-2'>
            {filters.ingredients.map(ingredient => (
              <button
                key={ingredient}
                type='button'
                className='transition duration-150 ease-apple hover:-translate-y-0.5'
                onClick={() => toggleIngredient(ingredient)}
              >
                <Badge variant='ingredient' hover='lift'>
                  {ingredient}
                </Badge>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </aside>
  );
}
