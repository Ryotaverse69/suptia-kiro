'use client';

import Link from 'next/link';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SearchForm, type SearchFormState } from './SearchForm';
import { PURPOSE_CATEGORIES } from '@/lib/ingredient-data';
import { useLocale } from '@/contexts/LocaleContext';

function ScrollIndicator() {
  return (
    <div className='pointer-events-none absolute inset-x-0 bottom-10 flex justify-center'>
      <div className='flex flex-col items-center gap-2 text-xs font-medium text-text-muted'>
        <span>スクロール</span>
        <span className='scroll-indicator' aria-hidden='true' />
      </div>
    </div>
  );
}

export function HeroSearch() {
  const router = useRouter();
  const { copy } = useLocale();

  const handleSubmit = useCallback(
    (values: SearchFormState) => {
      const params = new URLSearchParams();
      if (values.query.trim()) params.set('q', values.query.trim());
      if (values.goals.length) params.set('goal', values.goals.join(','));
      if (values.priceMin > 0) params.set('price_min', String(values.priceMin));
      if (values.priceMax < 20000)
        params.set('price_max', String(values.priceMax));
      router.push(`/search${params.toString() ? `?${params.toString()}` : ''}`);
    },
    [router]
  );

  return (
    <section className='relative flex h-[100dvh] flex-col justify-center overflow-hidden bg-white'>
      <div className='hero-background pointer-events-none absolute inset-0 opacity-85 sm:opacity-95' />
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.08),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(79,70,229,0.06),_transparent_55%)] opacity-80 sm:opacity-90' />
      <div className='absolute inset-0 bg-[linear-gradient(120deg,rgba(37,99,235,0.05)_0%,rgba(14,165,233,0.04)_40%,rgba(129,140,248,0.04)_75%)] mix-blend-soft-light hidden sm:block' />
      <div className='absolute inset-0 opacity-30 [mask-image:radial-gradient(circle_at_center,rgba(0,0,0,0.85),transparent_70%)] [background-image:linear-gradient(90deg,rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(0deg,rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:64px_64px] hidden lg:block' />

      <div className='container relative z-10 flex w-full flex-col items-center text-center'>
        <span className='rounded-full border border-primary-200/60 bg-primary-50/60 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-primary-600'>
          Precision Supplement Intelligence
        </span>
        <h1 className='mt-6 text-balance text-4xl font-light tracking-tight text-slate-900 md:text-6xl'>
          {copy.hero.headline}
        </h1>
        <p
          className='mt-6 max-w-2xl text-base text-text-muted md:text-lg'
          data-testid='hero-copy-subheadline'
        >
          {copy.hero.subheadline}
        </p>

        <div className='mt-10 w-full max-w-4xl'>
          <SearchForm focusOnMount onSubmit={handleSubmit} />
        </div>

        <div className='mt-8 flex flex-wrap justify-center gap-3 text-xs text-text-muted md:text-sm'>
          {PURPOSE_CATEGORIES.slice(0, 6).map(category => (
            <Link
              key={category.id}
              href={`/search?goal=${category.id}`}
              className='rounded-full border border-border/60 bg-white/60 px-4 py-2 text-text-subtle transition-all duration-150 ease-apple hover:-translate-y-0.5 hover:border-primary-200 hover:text-primary-600'
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      <ScrollIndicator />
    </section>
  );
}
