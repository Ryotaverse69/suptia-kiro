'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';

interface LangCurrencySwitcherProps {
  className?: string;
  align?: 'left' | 'right';
  size?: 'default' | 'compact';
}

const languages: Array<{
  locale: 'ja' | 'en';
  label: string;
  hint: string;
}> = [
  { locale: 'ja', label: '日本語', hint: 'JP' },
  { locale: 'en', label: 'English', hint: 'EN' },
];

const currencies: Array<{
  code: 'JPY' | 'USD';
  symbol: string;
  label: string;
}> = [
  { code: 'JPY', symbol: '¥', label: '日本円' },
  { code: 'USD', symbol: '$', label: 'USドル' },
];

export function LangCurrencySwitcher({
  className,
  align = 'right',
  size = 'default',
}: LangCurrencySwitcherProps) {
  const { locale, currency, setLocale, setCurrency } = useLocale();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const handleLocale = (next: 'ja' | 'en') => {
    setLocale(next);
    setOpen(false);
  };

  const handleCurrency = (next: 'JPY' | 'USD') => {
    setCurrency(next);
    setOpen(false);
  };

  const label = `${locale === 'ja' ? '日本語' : 'English'} · ${currency}`;

  return (
    <div className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type='button'
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          'flex items-center gap-2 rounded-full border border-border/60 bg-white/70 px-4 py-2 text-xs font-medium text-text-subtle shadow-soft transition-all duration-200 ease-apple hover:-translate-y-0.5 hover:bg-white hover:text-text-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
          size === 'compact' &&
            'rounded-2xl px-3 py-1.5 text-[11px] shadow-none'
        )}
        aria-haspopup='dialog'
        aria-expanded={open}
        aria-label='言語と通貨を切り替える'
      >
        <span className='inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-50 text-[11px] font-semibold text-primary-600'>
          {locale === 'ja' ? 'JP' : 'EN'}
        </span>
        <span className='uppercase tracking-[0.18em]'>{currency}</span>
      </button>

      {open ? (
        <div
          ref={dropdownRef}
          role='dialog'
          aria-label='言語と通貨の選択'
          className={cn(
            'absolute z-50 mt-3 w-64 rounded-2xl border border-border/60 bg-white/95 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-opacity duration-200 ease-apple',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <p className='text-[11px] font-semibold uppercase tracking-[0.32em] text-text-muted'>
            Locale · Currency
          </p>
          <p className='mt-1 text-sm text-text-subtle'>{label}</p>

          <div className='mt-4 space-y-4'>
            <section>
              <p className='text-xs font-semibold uppercase tracking-[0.24em] text-text-muted'>
                Language
              </p>
              <div className='mt-2 grid grid-cols-2 gap-2'>
                {languages.map(item => (
                  <button
                    key={item.locale}
                    type='button'
                    onClick={() => handleLocale(item.locale)}
                    className={cn(
                      'rounded-2xl border border-border/50 px-3 py-2 text-left text-sm font-medium text-text-subtle transition-all duration-200 ease-apple hover:border-primary-200 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                      locale === item.locale &&
                        'border-primary-300 bg-primary-50/60 text-primary-600 shadow-soft'
                    )}
                  >
                    <span>{item.label}</span>
                    <span className='block text-[11px] font-medium uppercase tracking-[0.28em] text-text-muted'>
                      {item.hint}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className='text-xs font-semibold uppercase tracking-[0.24em] text-text-muted'>
                Currency
              </p>
              <div className='mt-2 grid grid-cols-2 gap-2'>
                {currencies.map(item => (
                  <button
                    key={item.code}
                    type='button'
                    onClick={() => handleCurrency(item.code)}
                    className={cn(
                      'rounded-2xl border border-border/50 px-3 py-2 text-left text-sm font-medium text-text-subtle transition-all duration-200 ease-apple hover:border-primary-200 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                      currency === item.code &&
                        'border-primary-300 bg-primary-50/60 text-primary-600 shadow-soft'
                    )}
                  >
                    <span>{item.label}</span>
                    <span className='block text-[11px] font-medium uppercase tracking-[0.28em] text-text-muted'>
                      {item.symbol} {item.code}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
