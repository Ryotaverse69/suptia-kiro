'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale } from '@/contexts/LocaleContext';

export function LanguageCurrencySelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { locale, currency, setLocale, setCurrency } = useLocale();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleOptionSelect = (
    newLocale: 'ja' | 'en',
    newCurrency: 'JPY' | 'USD'
  ) => {
    setLocale(newLocale);
    setCurrency(newCurrency);
    setIsOpen(false);
  };

  return (
    <div className='relative' ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50'
        aria-label='言語・通貨切替'
        aria-expanded={isOpen}
        aria-haspopup='menu'
      >
        {locale === 'ja' ? '日本語' : 'English'} /{' '}
        {currency === 'JPY' ? 'JPY ¥' : 'USD $'}
      </button>

      {isOpen && (
        <div
          role='menu'
          className='absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-gray-200/50 py-2 z-50'
        >
          <div className='px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100/50'>
            言語・通貨
          </div>

          <button
            onClick={() => handleOptionSelect('ja', 'JPY')}
            className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50/80 transition-colors duration-200 ${locale === 'ja' && currency === 'JPY'
              ? 'text-primary-600 bg-primary-50/50'
              : 'text-gray-700'
              }`}
            role='menuitem'
          >
            <div className='flex items-center justify-between'>
              <span>日本語</span>
              <span className='text-xs text-gray-500'>¥ JPY</span>
            </div>
          </button>

          <button
            onClick={() => handleOptionSelect('en', 'USD')}
            className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50/80 transition-colors duration-200 ${locale === 'en' && currency === 'USD'
              ? 'text-primary-600 bg-primary-50/50'
              : 'text-gray-700'
              }`}
            role='menuitem'
          >
            <div className='flex items-center justify-between'>
              <span>English</span>
              <span className='text-xs text-gray-500'>$ USD</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
