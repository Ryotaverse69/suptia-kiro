'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LogoWordmark } from './LogoWordmark';
import { LangCurrencySwitcher } from './LangCurrencySwitcher';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/contexts/LocaleContext';

const navigationItems = [
  { label: 'サプティアとは', href: '/about' },
  { label: '成分ガイド', href: '/ingredients' },
  { label: '比較', href: '/compare' },
];

export function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { copy } = useLocale();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const navLinkClass = (href: string) => {
    const isActive =
      pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));

    return cn(
      'relative px-1 text-sm font-medium transition-colors duration-200 ease-apple',
      isActive ? 'text-primary-600' : 'text-text-subtle hover:text-text-default'
    );
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-[60] border-b transition-all duration-300 ease-apple',
        isScrolled
          ? 'border-border/70 bg-white/95 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl'
          : 'border-transparent bg-white/65 backdrop-blur-md'
      )}
    >
      <div
        className={cn(
          'container flex w-full items-center justify-between transition-all duration-300 ease-apple',
          isScrolled ? 'py-3 md:py-3.5' : 'py-5 md:py-6'
        )}
      >
        <div className='flex items-center gap-8'>
          <Link
            href='/'
            aria-label='サプティア | Suptia ホーム'
            className='flex items-center gap-3'
          >
            <LogoWordmark />
          </Link>

          <span
            className='hidden text-sm font-medium text-text-muted md:inline'
            data-testid='header-copy-tagline'
          >
            {copy.tagline}
          </span>

          <nav
            aria-label='主要ナビゲーション'
            className='hidden items-center gap-8 md:flex'
          >
            {navigationItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkClass(item.href)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className='hidden items-center gap-4 md:flex'>
          <LangCurrencySwitcher />
          <Button
            asChild
            variant='ghost'
            size='sm'
            className='rounded-full border border-border/60 bg-white/80 px-5 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-text-muted hover:bg-white'
          >
            <Link href='/search' aria-label='検索ページへ移動'>
              検索
            </Link>
          </Button>
        </div>

        <button
          type='button'
          className='flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-white/80 text-text-muted shadow-soft transition-all duration-200 ease-apple hover:-translate-y-0.5 hover:text-text-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:hidden'
          aria-label={isMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
          aria-expanded={isMenuOpen}
          aria-controls='mobile-menu'
          onClick={() => setIsMenuOpen(prev => !prev)}
        >
          <span aria-hidden='true'>
            {isMenuOpen ? (
              <svg
                className='h-5 w-5'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth={1.8}
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M6 6l12 12M6 18L18 6' />
              </svg>
            ) : (
              <svg
                className='h-5 w-5'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth={1.8}
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M4 7h16' />
                <path d='M4 12h16' />
                <path d='M4 17h16' />
              </svg>
            )}
          </span>
        </button>
      </div>

      {isMenuOpen ? (
        <>
          <div
            className='fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden'
            onClick={() => setIsMenuOpen(false)}
          />
          <div
            id='mobile-menu'
            role='dialog'
            aria-modal='true'
            className='fixed inset-x-0 top-[76px] z-50 mx-4 rounded-3xl border border-border/60 bg-white/95 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl md:hidden'
          >
            <nav
              aria-label='モバイルナビゲーション'
              className='flex flex-col gap-5 text-base'
            >
              {navigationItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className='flex items-center justify-between rounded-2xl border border-transparent px-3 py-2 text-text-subtle transition-colors duration-200 ease-apple hover:border-primary-200 hover:text-primary-600'
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>{item.label}</span>
                  <span aria-hidden='true' className='text-sm text-text-muted'>
                    →
                  </span>
                </Link>
              ))}
            </nav>

            <div className='mt-6 flex flex-col gap-3'>
              <LangCurrencySwitcher size='compact' align='left' />
              <Button
                asChild
                variant='primary'
                size='sm'
                className='rounded-full uppercase tracking-[0.28em]'
              >
                <Link href='/search'>検索</Link>
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
}
