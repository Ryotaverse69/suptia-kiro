'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import {
  PURPOSE_CATEGORIES,
  type PurposeCategoryInfo,
} from '@/lib/ingredient-data';
import { useLocale } from '@/contexts/LocaleContext';

const DEFAULT_MIN_PRICE = 0;
const DEFAULT_MAX_PRICE = 20000;
const PRICE_STEP = 500;
const PRESET_RANGES = [
  { label: '〜¥5,000', min: 0, max: 5000 },
  { label: '〜¥10,000', min: 0, max: 10000 },
  { label: '¥10,000〜¥15,000', min: 10000, max: 15000 },
  { label: '¥15,000〜', min: 15000, max: DEFAULT_MAX_PRICE },
];

const SUGGESTION_ICON_MAP: Record<string, string> = {
  product: '🔍',
  ingredient: '🧪',
  goal: '🎯',
  brand: '🏷',
  category: '📂',
};

type RemoteSuggestion = {
  id: string;
  type: string;
  label: string;
  context?: string;
  score?: number;
};

const FALLBACK_SUGGESTIONS: RemoteSuggestion[] = [
  {
    id: 'fallback-immune',
    type: 'goal',
    label: '免疫ケア',
    context: '健康目標',
    score: 1,
  },
  {
    id: 'fallback-sleep',
    type: 'goal',
    label: '睡眠サポート',
    context: '健康目標',
    score: 1,
  },
  {
    id: 'fallback-vitamin-c',
    type: 'ingredient',
    label: 'ビタミンC',
    context: '美容・抗酸化',
    score: 1,
  },
  {
    id: 'fallback-magnesium',
    type: 'ingredient',
    label: 'マグネシウム',
    context: 'リラックス',
    score: 1,
  },
];

export interface SearchFormState {
  query: string;
  goals: string[];
  priceMin: number;
  priceMax: number;
}

export interface SearchFormProps {
  initialState?: SearchFormState;
  onSubmit?: (state: SearchFormState) => void;
  className?: string;
  focusOnMount?: boolean;
}

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}

export function SearchForm({
  initialState = {
    query: '',
    goals: [],
    priceMin: DEFAULT_MIN_PRICE,
    priceMax: DEFAULT_MAX_PRICE,
  },
  onSubmit,
  className,
  focusOnMount = false,
}: SearchFormProps) {
  const router = useRouter();
  const { formatPrice } = useLocale();
  const [state, setState] = useState<SearchFormState>(initialState);
  const [query, setQuery] = useState(initialState.query);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [suggestions, setSuggestions] =
    useState<RemoteSuggestion[]>(FALLBACK_SUGGESTIONS);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement | null>(null);
  const suggestionsAbortRef = useRef<AbortController | null>(null);
  const goalButtonRef = useRef<HTMLButtonElement | null>(null);
  const goalPanelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showGoals &&
        goalPanelRef.current &&
        !goalPanelRef.current.contains(event.target as Node) &&
        goalButtonRef.current &&
        !goalButtonRef.current.contains(event.target as Node)
      ) {
        setShowGoals(false);
      }
      if (
        showSuggestions &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showGoals, showSuggestions]);

  useEffect(() => {
    if (focusOnMount) {
      inputRef.current?.focus();
    }
  }, [focusOnMount]);

  useEffect(() => {
    if (!showSuggestions) return;

    const controller = new AbortController();
    suggestionsAbortRef.current?.abort();
    suggestionsAbortRef.current = controller;

    const fetchSuggestions = async () => {
      try {
        setIsSuggestionLoading(true);
        const params = new URLSearchParams();
        if (debouncedQuery.trim()) {
          params.set('q', debouncedQuery.trim());
        }
        params.set('limit', '8');
        const response = await fetch(`/api/suggest?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(`Failed to load suggestions (${response.status})`);
        }
        const body = await response.json();
        if (Array.isArray(body.suggestions) && body.suggestions.length > 0) {
          setSuggestions(body.suggestions);
        } else if (!debouncedQuery.trim()) {
          setSuggestions(FALLBACK_SUGGESTIONS);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Search suggestions fetch failed', error);
          if (!debouncedQuery.trim()) {
            setSuggestions(FALLBACK_SUGGESTIONS);
          }
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSuggestionLoading(false);
        }
      }
    };

    fetchSuggestions();

    return () => controller.abort();
  }, [debouncedQuery, showSuggestions]);

  const goalOptions: PurposeCategoryInfo[] = useMemo(
    () => PURPOSE_CATEGORIES.map(item => ({ ...item })),
    []
  );

  const handleStateChange = useCallback((partial: Partial<SearchFormState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  const handleSubmit = useCallback(
    (override?: Partial<SearchFormState>) => {
      const nextState = { ...state, query, ...override };
      setState(nextState);

      const params = new URLSearchParams();
      if (nextState.query.trim()) {
        params.set('q', nextState.query.trim());
      }
      if (nextState.goals.length > 0) {
        params.set('goal', nextState.goals.join(','));
      }
      if (nextState.priceMin !== DEFAULT_MIN_PRICE) {
        params.set('price_min', String(nextState.priceMin));
      }
      if (nextState.priceMax !== DEFAULT_MAX_PRICE) {
        params.set('price_max', String(nextState.priceMax));
      }

      const url = `/search${params.toString() ? `?${params.toString()}` : ''}`;

      if (onSubmit) {
        onSubmit(nextState);
      } else {
        router.push(url);
      }
    },
    [onSubmit, query, router, state]
  );

  const toggleGoal = useCallback(
    (id: string) => {
      handleStateChange({
        goals: state.goals.includes(id)
          ? state.goals.filter(goal => goal !== id)
          : [...state.goals, id],
      });
    },
    [handleStateChange, state.goals]
  );

  const clearGoals = useCallback(() => {
    handleStateChange({ goals: [] });
  }, [handleStateChange]);

  const handleSuggestionSelect = useCallback(
    (suggestion: RemoteSuggestion) => {
      const nextGoals =
        suggestion.type === 'goal'
          ? Array.from(new Set([...state.goals, suggestion.label]))
          : state.goals;

      if (suggestion.type === 'goal') {
        handleStateChange({ goals: nextGoals });
      }

      setQuery(suggestion.label);
      setShowSuggestions(false);
      handleSubmit({ query: suggestion.label, goals: nextGoals });
    },
    [handleStateChange, handleSubmit, state.goals]
  );

  return (
    <div
      className={cn(
        'rounded-3xl border border-border/60 bg-white/80 p-6 shadow-soft backdrop-blur-xl md:p-8',
        className
      )}
    >
      <form
        className='space-y-6'
        onSubmit={event => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <div className='grid gap-4 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)]'>
          <div className='relative'>
            <label
              htmlFor='hero-search-input'
              className='mb-2 block text-xs font-semibold uppercase tracking-[0.28em] text-text-muted'
            >
              フリーワード検索
            </label>
            <Input
              id='hero-search-input'
              ref={inputRef}
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder='検索ワード（成分・ブランド・目的）'
              leadingIcon={
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth={1.5}
                  className='h-5 w-5'
                >
                  <circle cx='11' cy='11' r='7' />
                  <path d='m20 20-3.5-3.5' />
                </svg>
              }
              onFocus={() => setShowSuggestions(true)}
              className='h-14 rounded-3xl bg-white/70 pr-4 text-base shadow-soft'
            />
            {showSuggestions && (
              <div
                ref={suggestionsRef}
                className='absolute left-0 right-0 top-[calc(100%+0.75rem)] z-30 overflow-hidden rounded-2xl border border-border/60 bg-white/95 shadow-[0_22px_48px_rgba(15,23,42,0.14)] backdrop-blur-xl animate-fade-in'
              >
                <div className='border-b border-border/40 px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-text-muted'>
                  サジェスト
                </div>
                <ul className='max-h-64 overflow-y-auto py-2'>
                  {isSuggestionLoading ? (
                    <li className='px-4 py-2 text-xs text-text-muted'>
                      候補を読み込んでいます…
                    </li>
                  ) : null}
                  {!isSuggestionLoading && suggestions.length === 0 ? (
                    <li className='px-4 py-2 text-xs text-text-muted'>
                      一致する候補が見つかりません
                    </li>
                  ) : null}
                  {!isSuggestionLoading &&
                    suggestions.map(item => (
                      <li key={item.id}>
                        <button
                          type='button'
                          onClick={() => handleSuggestionSelect(item)}
                          className='flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm text-text-subtle transition-colors duration-150 ease-apple hover:bg-primary-50/70 hover:text-primary-700'
                        >
                          <span className='flex items-center gap-3'>
                            <span className='flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-600'>
                              {SUGGESTION_ICON_MAP[item.type] ?? '🔍'}
                            </span>
                            <span>
                              <span className='block text-sm font-semibold text-text-subtle'>
                                {item.label}
                              </span>
                              {item.context ? (
                                <span className='block text-xs text-text-muted'>
                                  {item.context}
                                </span>
                              ) : null}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>

          <div className='relative'>
            <label className='mb-2 block text-xs font-semibold uppercase tracking-[0.28em] text-text-muted'>
              目的・カテゴリ
            </label>
            <button
              type='button'
              ref={goalButtonRef}
              onClick={() => setShowGoals(value => !value)}
              className='flex h-14 w-full items-center justify-between rounded-3xl border border-border/60 bg-white/70 px-5 text-left text-sm text-text-subtle shadow-soft transition-all duration-150 ease-apple hover:-translate-y-0.5 hover:bg-white hover:text-text-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white'
              aria-expanded={showGoals}
              aria-haspopup='listbox'
            >
              <span>
                {state.goals.length > 0
                  ? `${state.goals.length} 件選択`
                  : '疲労回復、美容、免疫…'}
              </span>
              <span aria-hidden='true' className='text-text-muted'>
                ▾
              </span>
            </button>
            {showGoals && (
              <div
                ref={goalPanelRef}
                className='absolute left-0 right-0 top-[calc(100%+0.75rem)] z-30 rounded-2xl border border-border/60 bg-white/95 p-4 shadow-[0_22px_48px_rgba(15,23,42,0.14)] backdrop-blur-xl animate-fade-in'
                role='listbox'
                aria-label='目的カテゴリ'
              >
                <div className='flex items-center justify-between pb-2'>
                  <span className='text-xs font-semibold uppercase tracking-[0.28em] text-text-muted'>
                    人気の目的
                  </span>
                  <button
                    type='button'
                    onClick={clearGoals}
                    className='text-xs text-primary-600 hover:text-primary-700'
                  >
                    クリア
                  </button>
                </div>
                <div className='grid gap-2 sm:grid-cols-2'>
                  {goalOptions.map(option => {
                    const isActive = state.goals.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        type='button'
                        className={cn(
                          'flex items-start gap-3 rounded-2xl border border-border/50 px-3 py-2 text-left transition-all duration-150 ease-apple hover:border-primary-200 hover:text-primary-600',
                          isActive &&
                            'border-primary-300 bg-primary-50/60 text-primary-600 shadow-soft'
                        )}
                        onClick={() => toggleGoal(option.id)}
                        role='option'
                        aria-selected={isActive}
                      >
                        <span className='mt-1 text-base'>{option.icon}</span>
                        <span className='flex flex-col gap-0.5'>
                          <span className='text-sm font-semibold'>
                            {option.name}
                          </span>
                          <span className='text-xs text-text-muted'>
                            {option.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {state.goals.length > 0 && (
              <div className='mt-3 flex flex-wrap gap-2'>
                {state.goals.map(goalId => {
                  const goalInfo = goalOptions.find(
                    option => option.id === goalId
                  );
                  if (!goalInfo) return null;
                  return (
                    <button
                      key={goalId}
                      type='button'
                      onClick={() => toggleGoal(goalId)}
                      className='transition-transform duration-150 ease-apple hover:-translate-y-0.5'
                    >
                      <Badge
                        variant='ingredient'
                        hover='lift'
                        className='cursor-pointer'
                      >
                        {goalInfo.name}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className='mb-2 block text-xs font-semibold uppercase tracking-[0.28em] text-text-muted'>
              価格レンジ (税込)
            </label>
            <div className='rounded-3xl border border-border/60 bg-white/70 px-5 py-4 shadow-soft'>
              <div className='flex items-center justify-between text-sm font-medium text-text-default'>
                <span>{formatPrice(state.priceMin)}</span>
                <span className='text-xs text-text-muted'>〜</span>
                <span>{formatPrice(state.priceMax)}</span>
              </div>
              <div className='mt-3 grid grid-cols-2 gap-3'>
                <div className='flex items-center gap-3'>
                  <input
                    type='range'
                    min={DEFAULT_MIN_PRICE}
                    max={DEFAULT_MAX_PRICE}
                    step={PRICE_STEP}
                    value={state.priceMin}
                    onChange={event => {
                      const value = Number(event.target.value);
                      handleStateChange({
                        priceMin: Math.min(value, state.priceMax - PRICE_STEP),
                      });
                    }}
                    className='w-full accent-primary-600'
                  />
                  <span className='text-xs text-text-muted'>最小</span>
                </div>
                <div className='flex items-center gap-3'>
                  <input
                    type='range'
                    min={DEFAULT_MIN_PRICE}
                    max={DEFAULT_MAX_PRICE}
                    step={PRICE_STEP}
                    value={state.priceMax}
                    onChange={event => {
                      const value = Number(event.target.value);
                      handleStateChange({
                        priceMax: Math.max(value, state.priceMin + PRICE_STEP),
                      });
                    }}
                    className='w-full accent-primary-600'
                  />
                  <span className='text-xs text-text-muted'>最大</span>
                </div>
              </div>
              <div className='mt-3 flex flex-wrap gap-2'>
                {PRESET_RANGES.map(range => (
                  <button
                    key={range.label}
                    type='button'
                    className='rounded-full border border-border/60 px-3 py-1 text-xs text-text-subtle transition-colors duration-150 ease-apple hover:border-primary-300 hover:text-primary-600'
                    onClick={() =>
                      handleStateChange({
                        priceMin: range.min,
                        priceMax: range.max,
                      })
                    }
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className='flex flex-col items-start justify-between gap-3 md:flex-row md:items-center'>
          <p className='text-sm text-text-muted'>
            成分エビデンス、第三者検査、在庫状況まで一括でチェックできます。
          </p>
          <Button
            type='submit'
            size='lg'
            className='rounded-full px-8 py-3 text-sm uppercase tracking-[0.32em]'
          >
            検索
          </Button>
        </div>
      </form>
    </div>
  );
}
