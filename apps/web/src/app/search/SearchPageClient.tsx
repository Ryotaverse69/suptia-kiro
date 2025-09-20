'use client';

import { useCallback, useMemo, useState, FormEvent } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  FilterSidebar,
  type UiFilters,
} from '@/components/search/FilterSidebar';
import { Button } from '@/components/ui/Button';
import { ActiveFiltersBar } from '@/components/search/ActiveFiltersBar';
import { SortBar } from '@/components/search/SortBar';
import { CompareTray } from '@/components/search/CompareTray';
import { ResultCard, type ResultProduct } from '@/components/search/ResultCard';
import type {
  SearchFiltersInput,
  SearchProductsResult,
  SearchSortOption,
} from '@/lib/search';
import { cn } from '@/lib/utils';

const DEFAULT_PAGE_SIZE = 20;

export interface ClientSearchPayload {
  initialQuery: string;
  initialFilters: SearchFiltersInput;
  initialData: SearchProductsResult;
  aiConditions?: string[];
}

function toUiFilters(
  filters: SearchFiltersInput,
  facets: SearchProductsResult['facets']
): UiFilters {
  const priceMin = filters.minPrice ?? facets.priceRange.min ?? 0;
  const priceMax =
    filters.maxPrice ??
    facets.priceRange.max ??
    Math.max(priceMin, DEFAULT_PAGE_SIZE * 1000);
  return {
    categories: filters.categories ?? [],
    brands: filters.brands ?? [],
    goals: filters.goals ?? [],
    ingredients: filters.ingredients ?? [],
    priceMin,
    priceMax,
    rating: filters.rating,
    inStockOnly: filters.inStockOnly ?? false,
    onSale: filters.onSale ?? false,
  };
}

function buildSearchParams({
  query,
  filters,
  sort,
  page,
  pageSize,
}: {
  query: string;
  filters: UiFilters;
  sort: SearchSortOption;
  page: number;
  pageSize: number;
}): URLSearchParams {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  filters.goals.forEach(goal => params.append('goal', goal));
  filters.categories.forEach(category => params.append('category', category));
  filters.brands.forEach(brand => params.append('brand', brand));
  filters.ingredients.forEach(ingredient =>
    params.append('ingredient', ingredient)
  );
  if (filters.priceMin > 0)
    params.set('price_min', String(Math.round(filters.priceMin)));
  if (Number.isFinite(filters.priceMax))
    params.set('price_max', String(Math.round(filters.priceMax)));
  if (filters.rating) params.set('rating', String(filters.rating));
  if (filters.inStockOnly) params.set('stock', 'in');
  if (filters.onSale) params.set('sale', 'true');
  params.set('sort', sort);
  params.set('page', String(page));
  params.set('page_size', String(pageSize));
  return params;
}

function uiFiltersToRequest(filters: UiFilters): Partial<SearchFiltersInput> {
  return {
    categories: filters.categories,
    brands: filters.brands,
    goals: filters.goals,
    ingredients: filters.ingredients,
    minPrice: filters.priceMin,
    maxPrice: filters.priceMax,
    rating: filters.rating,
    inStockOnly: filters.inStockOnly,
    onSale: filters.onSale,
  };
}

interface SearchPageClientProps {
  payload: ClientSearchPayload;
}

export default function SearchPageClient({ payload }: SearchPageClientProps) {
  const router = useRouter();
  const initialSort: SearchSortOption =
    payload.initialFilters.sort ?? 'popularity_desc';
  const initialPageSize =
    payload.initialFilters.pageSize ??
    payload.initialData.pageSize ??
    DEFAULT_PAGE_SIZE;

  const defaultPriceMin = payload.initialData.facets.priceRange.min ?? 0;
  const defaultPriceMax = payload.initialData.facets.priceRange.max ?? 20000;

  const [query, setQuery] = useState(payload.initialQuery);
  const [queryInput, setQueryInput] = useState(payload.initialQuery);
  const [filters, setFilters] = useState<UiFilters>(
    toUiFilters(payload.initialFilters, payload.initialData.facets)
  );
  const [sort, setSort] = useState<SearchSortOption>(initialSort);
  const [page, setPage] = useState(payload.initialData.page ?? 1);
  const [data, setData] = useState<SearchProductsResult>(payload.initialData);
  const [compareList, setCompareList] = useState<ResultProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  const fetchResults = useCallback(
    async ({
      nextFilters,
      nextSort,
      nextPage,
      nextQuery,
    }: {
      nextFilters: UiFilters;
      nextSort: SearchSortOption;
      nextPage: number;
      nextQuery: string;
    }) => {
      const params = buildSearchParams({
        query: nextQuery,
        filters: nextFilters,
        sort: nextSort,
        page: nextPage,
        pageSize: initialPageSize,
      });

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/search?${params.toString()}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(`検索結果の取得に失敗しました (${response.status})`);
        }
        const json = await response.json();
        setData({
          items: json.results ?? [],
          total: json.total ?? 0,
          page: json.page ?? nextPage,
          pageSize: json.pageSize ?? initialPageSize,
          facets: json.facets ?? payload.initialData.facets,
        });
        setPage(json.page ?? nextPage);
        router.replace(`/search?${params.toString()}`, { scroll: false });
      } catch (err) {
        console.error('Search fetch failed', err);
        setError('検索結果の取得中に問題が発生しました');
      } finally {
        setIsLoading(false);
      }
    },
    [initialPageSize, payload.initialData.facets, router]
  );

  const handleFiltersChange = (next: UiFilters) => {
    setFilters(next);
    setPage(1);
    fetchResults({
      nextFilters: next,
      nextSort: sort,
      nextPage: 1,
      nextQuery: query,
    });
  };

  const handleSortChange = (nextSort: SearchSortOption) => {
    setSort(nextSort);
    setPage(1);
    fetchResults({
      nextFilters: filters,
      nextSort,
      nextPage: 1,
      nextQuery: query,
    });
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    fetchResults({
      nextFilters: filters,
      nextSort: sort,
      nextPage,
      nextQuery: query,
    });
  };

  const handleQuerySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = queryInput.trim();
    setQuery(normalized);
    setPage(1);
    fetchResults({
      nextFilters: filters,
      nextSort: sort,
      nextPage: 1,
      nextQuery: normalized,
    });
  };

  const handleSuggestedCondition = (condition: string) => {
    if (!condition) return;
    const next = { ...filters };
    if (condition.includes('¥')) {
      const matches = condition.match(/\d[\d,]*/g) || [];
      if (matches.length >= 2) {
        const [min, max] = matches.map(entry =>
          Number(entry.replace(/,/g, ''))
        );
        next.priceMin = Math.min(min, max);
        next.priceMax = Math.max(min, max);
      }
    } else {
      next.goals = Array.from(new Set([...next.goals, condition]));
    }
    handleFiltersChange(next);
  };

  const handleActiveFilterRemove = (
    type: keyof UiFilters | 'query' | 'price',
    value?: string
  ) => {
    switch (type) {
      case 'query':
        setQuery('');
        setQueryInput('');
        fetchResults({
          nextFilters: filters,
          nextSort: sort,
          nextPage: 1,
          nextQuery: '',
        });
        setPage(1);
        break;
      case 'categories':
      case 'brands':
      case 'goals':
      case 'ingredients':
        if (!value) return;
        handleFiltersChange({
          ...filters,
          [type]: filters[type].filter(item => item !== value),
        } as UiFilters);
        break;
      case 'rating':
        handleFiltersChange({ ...filters, rating: undefined });
        break;
      case 'inStockOnly':
        handleFiltersChange({ ...filters, inStockOnly: false });
        break;
      case 'onSale':
        handleFiltersChange({ ...filters, onSale: false });
        break;
      case 'price':
        handleFiltersChange({
          ...filters,
          priceMin: data.facets.priceRange.min ?? 0,
          priceMax: data.facets.priceRange.max ?? 20000,
        });
        break;
      default:
        break;
    }
  };

  const handleClearAll = () => {
    const reset: UiFilters = {
      categories: [],
      brands: [],
      goals: [],
      ingredients: [],
      priceMin: data.facets.priceRange.min ?? 0,
      priceMax: data.facets.priceRange.max ?? 20000,
      rating: undefined,
      inStockOnly: false,
      onSale: false,
    };
    setFilters(reset);
    setQuery('');
    setQueryInput('');
    setPage(1);
    fetchResults({
      nextFilters: reset,
      nextSort: sort,
      nextPage: 1,
      nextQuery: '',
    });
  };

  const handleCompareToggle = (id: string) => {
    const target = data.items.find(product => product.id === id);
    if (!target) return;
    setCompareList(prev => {
      if (prev.some(item => item.id === id)) {
        return prev.filter(item => item.id !== id);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, target];
    });
  };

  const hasActiveFilters = useMemo(() => {
    const request = uiFiltersToRequest(filters);
    const priceChanged =
      filters.priceMin > defaultPriceMin || filters.priceMax < defaultPriceMax;
    return Boolean(
      (query && query.length > 0) ||
        request.categories?.length ||
        request.brands?.length ||
        request.goals?.length ||
        request.ingredients?.length ||
        request.rating ||
        priceChanged ||
        request.inStockOnly ||
        request.onSale
    );
  }, [defaultPriceMax, defaultPriceMin, filters, query]);

  return (
    <div className='mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:px-10 lg:grid-cols-[minmax(0,1fr)_300px]'>
      <div className='space-y-6 order-1 lg:order-2'>
        <form
          onSubmit={handleQuerySubmit}
          className='flex flex-col gap-4 rounded-3xl border border-border/60 bg-white/80 px-6 py-5 shadow-soft backdrop-blur-md md:flex-row md:items-center md:justify-between'
        >
          <div className='flex flex-1 items-center gap-3'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth={1.5}
              className='h-5 w-5 text-text-muted'
            >
              <circle cx='11' cy='11' r='7' />
              <path d='m20 20-3.5-3.5' />
            </svg>
            <input
              value={queryInput}
              onChange={event => setQueryInput(event.target.value)}
              placeholder='検索ワード（成分・ブランド・目的）'
              className='flex-1 border-none bg-transparent text-base text-slate-900 outline-none'
            />
          </div>
          <Button
            type='submit'
            variant='primary'
            size='sm'
            hover='lift'
            className='rounded-full px-6'
          >
            検索を更新
          </Button>
        </form>

        <SortBar value={sort} total={data.total} onChange={handleSortChange} />

        {hasActiveFilters ? (
          <ActiveFiltersBar
            filters={filters}
            query={query}
            onRemove={handleActiveFilterRemove}
            onClearAll={handleClearAll}
          />
        ) : null}

        {isLoading ? (
          <div
            role='status'
            aria-live='polite'
            className='rounded-3xl border border-border/60 bg-white/70 p-6 text-sm text-text-muted shadow-soft'
          >
            検索結果を更新しています…
          </div>
        ) : null}

        {error ? (
          <div className='rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-700 shadow-soft'>
            {error}
          </div>
        ) : null}

        <section
          className='space-y-4'
          role='region'
          aria-labelledby='search-results-heading'
          aria-live='polite'
          aria-busy={isLoading}
          data-testid='search-results'
        >
          <h2 id='search-results-heading' className='sr-only'>
            検索結果一覧
          </h2>
          {data.items.length === 0 && !isLoading ? (
            <div className='rounded-3xl border border-border/60 bg-white/80 p-8 text-center shadow-soft'>
              <p className='text-base font-semibold text-slate-900'>
                該当する商品が見つかりませんでした
              </p>
              <p className='mt-2 text-sm text-text-muted'>
                検索条件を調整して再度お試しください。
              </p>
            </div>
          ) : null}

          <div role='list'>
            {data.items.map(item => (
              <ResultCard
                key={item.id}
                product={item}
                onAddToCompare={handleCompareToggle}
                isInCompare={compareList.some(
                  product => product.id === item.id
                )}
              />
            ))}
          </div>
        </section>

        {data.total > data.pageSize ? (
          <div className='flex flex-col items-center gap-3 rounded-3xl border border-border/60 bg-white/80 px-6 py-5 text-sm text-text-muted shadow-soft md:flex-row md:justify-between'>
            <div>
              {data.total.toLocaleString()} 件中{' '}
              {(data.page - 1) * data.pageSize + 1}–
              {Math.min(data.page * data.pageSize, data.total)} 件を表示中
            </div>
            <div className='flex items-center gap-2'>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                hover='lift'
                className='rounded-full'
                disabled={page <= 1}
                onClick={() => handlePageChange(Math.max(1, page - 1))}
              >
                前へ
              </Button>
              <span className='text-xs font-semibold text-text-muted'>
                {page} / {totalPages}
              </span>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                hover='lift'
                className='rounded-full'
                disabled={page >= totalPages}
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              >
                次へ
              </Button>
            </div>
            {page < totalPages ? (
              <Button
                type='button'
                variant='primary'
                size='sm'
                hover='lift'
                className='rounded-full px-6'
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              >
                さらに読み込む
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className='order-2 lg:order-1 lg:sticky lg:top-[120px] lg:h-fit'>
        <FilterSidebar
          filters={filters}
          facets={data.facets}
          onChange={handleFiltersChange}
          onReset={handleClearAll}
          suggestedConditions={payload.aiConditions}
          onSelectCondition={handleSuggestedCondition}
        />
      </div>

      <CompareTray
        items={compareList.map(item => ({ id: item.id, name: item.name }))}
        onRemove={handleCompareToggle}
      />
    </div>
  );
}
