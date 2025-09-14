'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import Link from 'next/link';
import { Logo } from './Logo';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/contexts/LocaleContext';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { locale, currency, setLocale, setCurrency } = useLocale();
  const pathname = usePathname();
  const { t } = useTranslation();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen || isLanguageMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
  }, [isMenuOpen, isLanguageMenuOpen]);

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
    <header className={`fixed top-0 left-0 right-0 z-50 border-b border-gray-200 transition-[background-color,box-shadow] duration-200 ease-out ${isScrolled ? 'bg-white/95 shadow-sm' : 'bg-white'}`}>
      <div className='max-w-[1280px] mx-auto px-4'>
        <div className='flex items-center justify-between h-16'>
          {/* Left: Brand */}
          <Link href='/' aria-label='サプティア ホーム' className='flex items-center gap-2'>
            <span className='text-xl md:text-2xl font-bold tracking-tight text-gray-900'>サプティア</span>
          </Link>

          {/* Right: Icons + labels */}
          <div className='flex justify-end'>
            <div className='flex items-center gap-6 text-gray-800'>
              <Link href='/mypage/favorites' className='inline-flex items-center gap-2 hover:text-gray-900'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-7.682a4.5 4.5 0 010-6.364z' /></svg>
                <span className='hidden sm:inline text-sm'>お気に入り</span>
              </Link>

              <div className='relative'>
                <button onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)} className='inline-flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100' aria-label='言語・通貨切替' aria-expanded={isLanguageMenuOpen} aria-haspopup='menu' aria-controls='lang-currency-menu'>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 3c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9zm0 0v18m9-9H3' /></svg>
                  <span className='hidden sm:inline text-sm'>{locale === 'ja' ? 'JA' : 'EN'}・{currency === 'JPY' ? '¥' : '$'}</span>
                </button>
                {isLanguageMenuOpen && (
                  <div id='lang-currency-menu' role='menu' className='absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50'>
                    <div className='px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100'>言語・通貨</div>
                    <button onClick={() => { handleLocaleChange('ja'); handleCurrencyChange('JPY'); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${locale==='ja'?'text-blue-600 bg-blue-50':'text-gray-700'}`}>
                      <div className='flex items-center justify-between'><span>日本語</span><span className='text-xs text-gray-500'>¥ JPY</span></div>
                    </button>
                    <button onClick={() => { handleLocaleChange('en'); handleCurrencyChange('USD'); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${locale==='en'?'text-blue-600 bg-blue-50':'text-gray-700'}`}>
                      <div className='flex items-center justify-between'><span>English</span><span className='text-xs text-gray-500'>$ USD</span></div>
                    </button>
                  </div>
                )}
              </div>

              <Link href='/mypage' className='inline-flex items-center gap-2 hover:text-gray-900'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5.121 17.804A9 9 0 1112 21a8.963 8.963 0 01-6.879-3.196z' /></svg>
                <span className='hidden sm:inline text-sm'>ログイン</span>
              </Link>

              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className='inline-flex items-center gap-2 hover:text-gray-900' aria-label='メニューを開く' aria-controls='mobile-menu' aria-expanded={isMenuOpen}>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  {isMenuOpen ? (<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />) : (<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />)}
                </svg>
                <span className='hidden sm:inline text-sm'>メニュー</span>
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className='lg:hidden py-4 border-t border-gray-200'>
            <nav id='mobile-menu' role='navigation' aria-label='モバイルナビゲーション' className='flex flex-col space-y-4'>
              <Link href='/' aria-current={pathname === '/' ? 'page' : undefined} className={`font-medium transition-colors duration-200 py-2 ${pathname === '/' ? 'text-primary-700' : 'text-gray-700 hover:text-blue-600'}`} onClick={() => setIsMenuOpen(false)}>{t('navigation.home')}</Link>
              <Link href='/about' aria-current={pathname === '/about' ? 'page' : undefined} className={`font-medium transition-colors duration-200 py-2 ${pathname === '/about' ? 'text-primary-700' : 'text-gray-700 hover:text-blue-600'}`} onClick={() => setIsMenuOpen(false)}>{t('navigation.about')}</Link>
              <Link href='/ingredients' aria-current={pathname?.startsWith('/ingredients') ? 'page' : undefined} className={`font-medium transition-colors duration-200 py-2 ${pathname?.startsWith('/ingredients') ? 'text-primary-700' : 'text-gray-700 hover:text-blue-600'}`} onClick={() => setIsMenuOpen(false)}>{t('navigation.ingredients')}</Link>
              <Link href='/compare' aria-current={pathname === '/compare' ? 'page' : undefined} className={`font-medium transition-colors duration-200 py-2 ${pathname === '/compare' ? 'text-primary-700' : 'text-gray-700 hover:text-blue-600'}`} onClick={() => setIsMenuOpen(false)}>{t('navigation.compare')}</Link>
              <Link href='/mypage' aria-current={pathname?.startsWith('/mypage') ? 'page' : undefined} className={`font-medium transition-colors duration-200 py-2 ${pathname?.startsWith('/mypage') ? 'text-primary-700' : 'text-gray-700 hover:text-blue-600'}`} onClick={() => setIsMenuOpen(false)}>{t('navigation.mypage')}</Link>
            </nav>
          </div>
        )}
      </div>

      {(isLanguageMenuOpen || isMenuOpen) && (
        <div className='fixed inset-0 z-40' onClick={() => { setIsLanguageMenuOpen(false); setIsMenuOpen(false); }} />
      )}
    </header>
  );
}
