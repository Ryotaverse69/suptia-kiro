'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import Link from 'next/link';
import { Logo } from './Logo';
import { usePathname } from 'next/navigation';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { locale, currency, setLocale, setCurrency } = useLocale();
  const pathname = usePathname();

  // Elevation on scroll
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Prevent background scroll when menus are open
  useEffect(() => {
    if (isMenuOpen || isLanguageMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMenuOpen, isLanguageMenuOpen]);

  // Close menus on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsLanguageMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleLocaleChange = (newLocale: 'ja' | 'en') => {
    setLocale(newLocale);
    setIsLanguageMenuOpen(false);
  };

  const handleCurrencyChange = (newCurrency: 'JPY' | 'USD') => {
    setCurrency(newCurrency);
    setIsLanguageMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 transition-shadow ${isScrolled ? 'shadow-sm' : ''}`}
    >
      <div className='container mx-auto px-4'>
        <div className='flex items-center justify-between h-16'>
          {/* Logo - サプティア + Suptia */}
          <Link
            href='/'
            className='flex items-center'
            aria-label='サプティア ホーム'
          >
            <Logo variant='full' size='md' />
          </Link>

          {/* Desktop Navigation */}
          <nav
            id='navigation'
            role='navigation'
            aria-label='メインナビゲーション'
            className='hidden lg:flex items-center space-x-8'
          >
            <Link
              href='/'
              aria-current={pathname === '/' ? 'page' : undefined}
              className={`transition-colors duration-200 link-underline ${pathname === '/' ? 'text-primary-700' : 'text-gray-800 hover:text-black'}`}
            >
              ホーム
            </Link>
            <Link
              href='/about'
              aria-current={pathname === '/about' ? 'page' : undefined}
              className={`transition-colors duration-200 link-underline ${pathname === '/about' ? 'text-primary-700' : 'text-gray-800 hover:text-black'}`}
            >
              サプティアとは
            </Link>
            <Link
              href='/ingredients'
              aria-current={
                pathname?.startsWith('/ingredients') ? 'page' : undefined
              }
              className={`transition-colors duration-200 link-underline ${pathname?.startsWith('/ingredients') ? 'text-primary-700' : 'text-gray-800 hover:text-black'}`}
            >
              成分ガイド
            </Link>
            <Link
              href='/compare'
              aria-current={pathname === '/compare' ? 'page' : undefined}
              className={`transition-colors duration-200 link-underline ${pathname === '/compare' ? 'text-primary-700' : 'text-gray-800 hover:text-black'}`}
            >
              人気比較
            </Link>
            <Link
              href='/mypage'
              aria-current={
                pathname?.startsWith('/mypage') ? 'page' : undefined
              }
              className={`transition-colors duration-200 link-underline ${pathname?.startsWith('/mypage') ? 'text-primary-700' : 'text-gray-800 hover:text-black'}`}
            >
              マイページ
            </Link>
          </nav>

          {/* Language/Currency Switcher & Mobile Menu */}
          <div className='flex items-center space-x-4'>
            {/* Language/Currency Switcher */}
            <div className='relative'>
              <button
                onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                className='flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200'
                aria-label='言語・通貨切替'
                aria-expanded={isLanguageMenuOpen}
                aria-haspopup='menu'
                aria-controls='lang-currency-menu'
              >
                <span className='text-sm font-medium text-gray-700'>
                  {locale === 'ja' ? '日本語' : 'English'}
                </span>
                <span className='text-xs text-gray-500'>
                  {currency === 'JPY' ? '¥' : '$'}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                    isLanguageMenuOpen ? 'rotate-180' : ''
                  }`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </button>

              {/* Language/Currency Dropdown */}
              {isLanguageMenuOpen && (
                <div
                  id='lang-currency-menu'
                  role='menu'
                  className='absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50'
                >
                  <div className='px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100'>
                    言語・通貨
                  </div>
                  <button
                    onClick={() => {
                      handleLocaleChange('ja');
                      handleCurrencyChange('JPY');
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors duration-200 ${
                      locale === 'ja'
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700'
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <span>日本語</span>
                      <span className='text-xs text-gray-500'>¥ JPY</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      handleLocaleChange('en');
                      handleCurrencyChange('USD');
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors duration-200 ${
                      locale === 'en'
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700'
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <span>English</span>
                      <span className='text-xs text-gray-500'>$ USD</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200'
              aria-label='メニューを開く'
              aria-controls='mobile-menu'
              aria-expanded={isMenuOpen}
            >
              <svg
                className='w-6 h-6 text-gray-700'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                ) : (
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 6h16M4 12h16M4 18h16'
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className='lg:hidden py-4 border-t border-gray-200'>
            <nav
              id='mobile-menu'
              role='navigation'
              aria-label='モバイルナビゲーション'
              className='flex flex-col space-y-4'
            >
              <Link
                href='/'
                aria-current={pathname === '/' ? 'page' : undefined}
                className={`font-medium transition-colors duration-200 py-2 ${pathname === '/' ? 'text-primary-700' : 'text-gray-700 hover:text-blue-600'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                ホーム
              </Link>
              <Link
                href='/about'
                aria-current={pathname === '/about' ? 'page' : undefined}
                className={`font-medium transition-colors duration-200 py-2 ${pathname === '/about' ? 'text-primary-700' : 'text-gray-700 hover:text-blue-600'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                サプティアとは
              </Link>
              <Link
                href='/ingredients'
                aria-current={
                  pathname?.startsWith('/ingredients') ? 'page' : undefined
                }
                className={`font-medium transition-colors duration-200 py-2 ${pathname?.startsWith('/ingredients') ? 'text-primary-700' : 'text-gray-700 hover:text-blue-600'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                成分ガイド
              </Link>
              <Link
                href='/compare'
                aria-current={pathname === '/compare' ? 'page' : undefined}
                className={`font-medium transition-colors duration-200 py-2 ${pathname === '/compare' ? 'text-primary-700' : 'text-gray-700 hover:text-blue-600'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                人気比較
              </Link>
              <Link
                href='/mypage'
                aria-current={
                  pathname?.startsWith('/mypage') ? 'page' : undefined
                }
                className={`font-medium transition-colors duration-200 py-2 ${pathname?.startsWith('/mypage') ? 'text-primary-700' : 'text-gray-700 hover:text-blue-600'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                マイページ
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* Backdrop for dropdowns */}
      {(isLanguageMenuOpen || isMenuOpen) && (
        <div
          className='fixed inset-0 z-40'
          onClick={() => {
            setIsLanguageMenuOpen(false);
            setIsMenuOpen(false);
          }}
        />
      )}
    </header>
  );
}
