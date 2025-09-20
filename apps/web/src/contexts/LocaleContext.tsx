'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  BASE_CURRENCY,
  convertFromJPY,
  refreshRates,
  type CurrencyCode,
} from '@/lib/exchange';
// import { useRouter, usePathname } from 'next/navigation';
import jaMessages from '@/messages/ja.json';
import enMessages from '@/messages/en.json';
import copyMessages from '@/messages/copy.json';
// 簡素化されたロケール設定
const locales = ['ja', 'en'] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = 'ja';
const currencies = {
  ja: 'JPY',
  en: 'USD',
} as const;

const normalizeCurrency = (value: string): CurrencyCode =>
  value === 'USD' ? 'USD' : 'JPY';

const COOKIE_LOCALE = 'suptia-locale';
const COOKIE_CURRENCY = 'suptia-currency';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function getCookie(name: string) {
  if (typeof document === 'undefined') return undefined;
  const value = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`));
  return value ? value.split('=')[1] : undefined;
}

function setCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

interface LocaleContextType {
  locale: Locale;
  currency: CurrencyCode;
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: CurrencyCode) => void;
  formatPrice: (amount: number) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  copy: (typeof copyMessages)['ja'];
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
  const [currency, setCurrencyState] = useState<CurrencyCode>(
    normalizeCurrency(currencies[initialLocale])
  );
  // const router = useRouter();
  // const pathname = usePathname();

  // ローカルストレージから設定を復元
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cookieLocale = getCookie(COOKIE_LOCALE) as Locale | undefined;
      const cookieCurrency = getCookie(COOKIE_CURRENCY);
      const savedLocale =
        (localStorage.getItem('suptia-locale') as Locale | null) ||
        cookieLocale ||
        null;
      const savedCurrency =
        localStorage.getItem('suptia-currency') || cookieCurrency || null;

      if (savedLocale && locales.includes(savedLocale)) {
        setLocaleState(savedLocale);
      }

      if (savedCurrency) {
        setCurrencyState(normalizeCurrency(savedCurrency));
      } else if (savedLocale) {
        setCurrencyState(normalizeCurrency(currencies[savedLocale]));
      }
    }
  }, []);

  useEffect(() => {
    refreshRates().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (currency === 'JPY') return;
    refreshRates().catch(() => undefined);
  }, [currency]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    const nextCurrency = normalizeCurrency(currencies[newLocale]);
    setCurrencyState(nextCurrency);

    // ローカルストレージに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('suptia-locale', newLocale);
      localStorage.setItem('suptia-currency', nextCurrency);
      setCookie(COOKIE_LOCALE, newLocale);
      setCookie(COOKIE_CURRENCY, nextCurrency);
    }

    // ルーティングのロケール対応は未実装のためURLは変更しない
    // 実装済みになったらここで /ja や /en プレフィックスに切り替える
  };

  const setCurrency = (newCurrency: CurrencyCode) => {
    const normalized = normalizeCurrency(newCurrency);
    setCurrencyState(normalized);

    // ローカルストレージに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('suptia-currency', normalized);
      setCookie(COOKIE_CURRENCY, normalized);
    }
  };

  // amount is assumed to be in JPY (base currency)
  const formatPrice = (amount: number): string => {
    const localeCode = locale === 'ja' ? 'ja-JP' : 'en-US';
    const currentCurrency = normalizeCurrency(currency);
    const converted =
      BASE_CURRENCY === 'JPY'
        ? convertFromJPY(amount, currentCurrency)
        : amount;
    const formatted = new Intl.NumberFormat(localeCode, {
      style: 'currency',
      currency: currentCurrency,
      minimumFractionDigits: currentCurrency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currentCurrency === 'JPY' ? 0 : 2,
    }).format(converted);
    if (currentCurrency === 'JPY') {
      return `${formatted} 税込`;
    }
    return formatted;
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
    copy: (copyMessages as Record<Locale, (typeof copyMessages)['ja']>)[locale],
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
