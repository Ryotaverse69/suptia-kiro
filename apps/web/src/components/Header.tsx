'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LanguageCurrencySelector } from './LanguageCurrencySelector';
import { useFocusManagement } from './SkipLinks';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { trapFocus, restoreFocus } = useFocusManagement();
  const previousActiveElementRef = useRef<Element | null>(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      // フォーカストラップを設定
      previousActiveElementRef.current = document.activeElement;
      if (mobileMenuRef.current) {
        const cleanup = trapFocus(mobileMenuRef.current);
        return cleanup;
      }
    } else {
      document.body.style.overflow = '';
      // 前のフォーカス位置を復元
      if (previousActiveElementRef.current) {
        restoreFocus(previousActiveElementRef.current);
        previousActiveElementRef.current = null;
      }
    }
  }, [isMenuOpen, trapFocus, restoreFocus]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header
      id='navigation'
      role='banner'
      className={`sticky top-0 z-50 backdrop-blur-md border-b border-gray-200/30 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 shadow-sm' : 'bg-white/95'
      }`}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12'>
        <div className='flex items-center justify-between h-16'>
          {/* Left: Logo「サプティア / Suptia」 */}
          <Link
            href='/'
            aria-label='サプティア ホーム'
            className='flex items-center'
          >
            <div className='text-xl font-medium text-gray-900'>
              サプティア{' '}
              <span className='text-blue-600 font-light'>/ Suptia</span>
            </div>
          </Link>

          {/* Center: Navigation (hidden on mobile) */}
          <nav
            role='navigation'
            aria-label='メインナビゲーション'
            className='hidden md:flex items-center space-x-8'
          >
            <Link
              href='/compare'
              className={`text-gray-600 hover:text-gray-900 transition-colors duration-200 ${
                pathname === '/compare' ? 'text-gray-900 font-medium' : ''
              }`}
            >
              製品比較
            </Link>
            <Link
              href='/ingredients'
              className={`text-gray-600 hover:text-gray-900 transition-colors duration-200 ${
                pathname?.startsWith('/ingredients')
                  ? 'text-gray-900 font-medium'
                  : ''
              }`}
            >
              成分ガイド
            </Link>
            <Link
              href='/mypage/alerts'
              className={`text-gray-600 hover:text-gray-900 transition-colors duration-200 ${
                pathname?.startsWith('/mypage/alerts')
                  ? 'text-gray-900 font-medium'
                  : ''
              }`}
            >
              価格アラート
            </Link>
            <Link
              href='/about'
              className={`text-gray-600 hover:text-gray-900 transition-colors duration-200 ${
                pathname === '/about' ? 'text-gray-900 font-medium' : ''
              }`}
            >
              サプティアとは
            </Link>
          </nav>

          {/* Right: Language/Currency Switcher + Search + Mobile Menu */}
          <div className='flex items-center space-x-4'>
            <LanguageCurrencySelector />

            <button
              className='p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200'
              aria-label='検索'
            >
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
            </button>

            {/* Mobile menu button */}
            <button
              ref={menuButtonRef}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg'
              aria-label={isMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
              aria-expanded={isMenuOpen}
              aria-controls='mobile-menu'
            >
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M6 18L18 6M6 6l12 12'
                  />
                ) : (
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M4 6h16M4 12h16M4 18h16'
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div
            ref={mobileMenuRef}
            id='mobile-menu'
            role='navigation'
            aria-label='モバイルナビゲーション'
            className='md:hidden py-4 border-t border-gray-200/30'
          >
            <nav className='flex flex-col space-y-4'>
              <Link
                href='/compare'
                className={`font-medium transition-colors duration-200 py-2 ${
                  pathname === '/compare'
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                製品比較
              </Link>
              <Link
                href='/ingredients'
                className={`font-medium transition-colors duration-200 py-2 ${
                  pathname?.startsWith('/ingredients')
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                成分ガイド
              </Link>
              <Link
                href='/mypage/alerts'
                className={`font-medium transition-colors duration-200 py-2 ${
                  pathname?.startsWith('/mypage/alerts')
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                価格アラート
              </Link>
              <Link
                href='/about'
                className={`font-medium transition-colors duration-200 py-2 ${
                  pathname === '/about'
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                サプティアとは
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div
          className='fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden'
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </header>
  );
}
