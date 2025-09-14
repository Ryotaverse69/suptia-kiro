'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { BASE_CURRENCY, convertFromJPY } from '@/lib/exchange';
// import { useRouter, usePathname } from 'next/navigation';
import jaMessages from '@/messages/ja.json';
import enMessages from '@/messages/en.json';
// 簡素化されたロケール設定
const locales = ['ja', 'en'] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = 'ja';
const currencies = {
  ja: 'JPY',
  en: 'USD',
} as const;

interface LocaleContextType {
  locale: Locale;
  currency: string;
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: string) => void;
  formatPrice: (amount: number) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

interface LocaleProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function LocaleProvider({
  children,
  initialLocale = defaultLocale,
}: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [currency, setCurrencyState] = useState<string>(
    currencies[initialLocale]
  );
  // const router = useRouter();
  // const pathname = usePathname();

  // ローカルストレージから設定を復元
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('suptia-locale') as Locale;
      const savedCurrency = localStorage.getItem('suptia-currency');

      if (savedLocale && locales.includes(savedLocale)) {
        setLocaleState(savedLocale);
      }

      if (savedCurrency) {
        setCurrencyState(savedCurrency);
      } else if (savedLocale) {
        setCurrencyState(currencies[savedLocale]);
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    setCurrencyState(currencies[newLocale]);

    // ローカルストレージに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('suptia-locale', newLocale);
      localStorage.setItem('suptia-currency', currencies[newLocale]);
    }

    // ルーティングのロケール対応は未実装のためURLは変更しない
    // 実装済みになったらここで /ja や /en プレフィックスに切り替える
  };

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);

    // ローカルストレージに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('suptia-currency', newCurrency);
    }
  };

  // amount is assumed to be in JPY (base currency)
  const formatPrice = (amount: number): string => {
    const localeCode = locale === 'ja' ? 'ja-JP' : 'en-US';
    const converted =
      BASE_CURRENCY === 'JPY'
        ? convertFromJPY(amount, currency as any)
        : amount;
    return new Intl.NumberFormat(localeCode, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(converted);
  };

  const formatNumber = (
    value: number,
    options?: Intl.NumberFormatOptions
  ): string => {
    const localeCode = locale === 'ja' ? 'ja-JP' : 'en-US';
    return new Intl.NumberFormat(localeCode, options).format(value);
  };

  const formatDate = (
    date: Date,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    const localeCode = locale === 'ja' ? 'ja-JP' : 'en-US';
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Intl.DateTimeFormat(localeCode, {
      ...defaultOptions,
      ...options,
    }).format(date);
  };

  const value: LocaleContextType = {
    locale,
    currency,
    setLocale,
    setCurrency,
    formatPrice,
    formatNumber,
    formatDate,
  };

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextType {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

// 便利なフック
export function useTranslation() {
  const { locale } = useLocale();

  // メッセージ辞書をロード（軽量な静的インポート）
  const dict = locale === 'ja' ? jaMessages : enMessages;

  const getByPath = (obj: any, path: string) => {
    return path
      .split('.')
      .reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj);
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    const template = getByPath(dict, key) ?? key;
    if (typeof template !== 'string') return key;
    if (!params) return template;
    return Object.keys(params).reduce(
      (acc, k) => acc.replace(new RegExp(`{${k}}`, 'g'), String(params[k]!)),
      template
    );
  };

  return { t, locale };
}
