'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const suggestions = [
  'ビタミンD サプリ',
  'プロテイン パウダー',
  'マルチビタミン',
  'オメガ3 フィッシュオイル',
  'コラーゲン サプリ',
  'プロバイオティクス',
  '葉酸 サプリ',
  'マグネシウム サプリ',
];

function IconSearch() {
  return (
    <svg
      aria-hidden='true'
      className='h-5 w-5 text-neutral-500'
      viewBox='0 0 20 20'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.6}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M15.5 15.5l-3.5-3.5m1.5-3.5a5 5 0 11-10 0 5 5 0 0110 0z'
      />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg
      aria-hidden='true'
      className='h-5 w-5 text-neutral-500'
      viewBox='0 0 20 20'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.6}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M5 2.5v2.5M15 2.5v2.5M3 7.5h14M4.5 10h11M4.5 13h7'
      />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg
      aria-hidden='true'
      className='h-5 w-5 text-neutral-500'
      viewBox='0 0 20 20'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.6}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M3.75 15.5v-1a3.75 3.75 0 013.75-3.75h5a3.75 3.75 0 013.75 3.75v1M10 9.25a3.25 3.25 0 100-6.5 3.25 3.25 0 000 6.5z'
      />
    </svg>
  );
}

export function Hero() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const suggestionListId = 'hero-search-suggestions';

  const filteredSuggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return suggestions.slice(0, 5);
    }
    return suggestions
      .filter(item => item.toLowerCase().includes(normalized))
      .slice(0, 5);
  }, [query]);

  const handleSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section className='relative flex min-h-[calc(100vh-60px)] items-center justify-center overflow-hidden bg-[var(--bg-hero)] text-white'>
      <div
        className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_55%)]'
        aria-hidden='true'
      />
      <div className='relative z-10 w-full'>
        <div className='mx-auto flex w-full max-w-[1100px] flex-col items-center gap-10 px-4 py-16 sm:px-6 md:py-20 lg:px-8'>
          <div className='text-center'>
            <p className='text-sm font-semibold uppercase tracking-[0.3em] text-white/80'>
              SUPTIA PRICE CHECKER
            </p>
            <h1 className='mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-[56px]'>
              次回のサプリ購入を
              <span className='text-trivago-sand'>最大50%お得に</span>
            </h1>
            <p className='mt-4 text-lg text-white/90 sm:text-xl'>
              100を超えるサイトのサプリ価格をサプティアが比較します
            </p>
          </div>

          <div className='w-full max-w-[860px]'>
            <form
              role='search'
              aria-label='サプリメント検索'
              onSubmit={event => {
                event.preventDefault();
                handleSubmit(query);
              }}
              className='relative'
            >
              <div className='flex h-[60px] w-full items-stretch rounded-pill border border-primary-500 bg-white text-neutral-900 shadow-trivago-card'>
                <label className='flex flex-1 items-center gap-4 px-6 py-3 focus-within:ring-2 focus-within:ring-primary-200'>
                  <IconSearch />
                  <div className='flex w-full flex-col'>
                    <span className='text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500'>
                      カテゴリ・ブランド
                    </span>
                    <input
                      value={query}
                      onChange={event => setQuery(event.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setTimeout(() => setIsFocused(false), 120)}
                      type='text'
                      placeholder='サプリメントを検索'
                      className='w-full border-none bg-transparent p-0 text-base font-semibold text-neutral-900 placeholder:text-neutral-400 focus:outline-none'
                      role='combobox'
                      aria-autocomplete='list'
                      aria-expanded={
                        isFocused && filteredSuggestions.length > 0
                      }
                      aria-controls={suggestionListId}
                    />
                  </div>
                </label>

                <div className='hidden min-w-[180px] items-center gap-3 border-l border-neutral-200 px-6 py-3 sm:flex'>
                  <IconCalendar />
                  <div>
                    <p className='text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500'>
                      購入タイミング
                    </p>
                    <p className='text-sm font-semibold text-neutral-900'>
                      今月中に購入
                    </p>
                  </div>
                </div>

                <div className='hidden min-w-[160px] items-center gap-3 border-l border-neutral-200 px-6 py-3 sm:flex'>
                  <IconUsers />
                  <div>
                    <p className='text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500'>
                      比較条件
                    </p>
                    <p className='text-sm font-semibold text-neutral-900'>
                      主要ショップ 3サイト
                    </p>
                  </div>
                </div>

                <button
                  type='submit'
                  className='m-2 flex min-w-[120px] items-center justify-center rounded-[999px] bg-primary-500 px-6 text-base font-semibold text-white transition-colors duration-200 ease-trivago hover:bg-primary-600'
                >
                  サプリを検索
                </button>
              </div>

              {isFocused && filteredSuggestions.length > 0 && (
                <ul
                  role='listbox'
                  id={suggestionListId}
                  className='absolute left-0 right-0 top-[calc(100%+12px)] z-20 overflow-hidden rounded-xl border border-neutral-200 bg-white py-2 text-sm text-neutral-800 shadow-trivago-card'
                >
                  {filteredSuggestions.map(item => (
                    <li key={item}>
                      <button
                        type='button'
                        role='option'
                        aria-selected='false'
                        className='flex w-full items-center justify-between px-5 py-3 text-left hover:bg-neutral-50'
                        onMouseDown={event => event.preventDefault()}
                        onClick={() => {
                          setQuery(item);
                          handleSubmit(item);
                        }}
                      >
                        <span>{item}</span>
                        <span className='text-xs text-neutral-400'>人気</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </form>

            <p className='mt-4 text-xs font-medium uppercase tracking-[0.3em] text-white/70'>
              サプティアが1分毎に最新価格を更新
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
