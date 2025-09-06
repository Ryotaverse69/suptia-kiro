'use client';

import { useEffect } from 'react';
import { useLocale } from '@/contexts/LocaleContext';

// Keeps <html lang> in sync with current locale (client-side)
export default function LocaleHtmlLangSetter() {
  const { locale } = useLocale();

  useEffect(() => {
    try {
      const lang = locale === 'ja' ? 'ja' : 'en';
      if (document?.documentElement) {
        document.documentElement.setAttribute('lang', lang);
      }
    } catch {
      // no-op in non-browser or on failure
    }
  }, [locale]);

  return null;
}
