// 簡素化されたロケール設定
type Locale = 'ja' | 'en';
const currencies = { ja: 'JPY', en: 'USD' } as const;
const numberFormats = { ja: 'ja-JP', en: 'en-US' } as const;
const dateFormats = { ja: 'ja-JP', en: 'en-US' } as const;

/**
 * 価格をフォーマットする
 */
export function formatPrice(
  amount: number,
  locale: Locale,
  currency?: string
): string {
  const targetCurrency = currency || currencies[locale];
  const localeCode = numberFormats[locale];
  
  return new Intl.NumberFormat(localeCode, {
    style: 'currency',
    currency: targetCurrency,
    minimumFractionDigits: targetCurrency === 'JPY' ? 0 : 2,
    maximumFractionDigits: targetCurrency === 'JPY' ? 0 : 2,
  }).format(amount);
}

/**
 * 数値をフォーマットする
 */
export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  const localeCode = numberFormats[locale];
  
  return new Intl.NumberFormat(localeCode, options).format(value);
}

/**
 * 日付をフォーマットする
 */
export function formatDate(
  date: Date,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  const localeCode = dateFormats[locale];
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat(localeCode, { ...defaultOptions, ...options }).format(date);
}

/**
 * 相対時間をフォーマットする
 */
export function formatRelativeTime(
  date: Date,
  locale: Locale
): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const localeCode = numberFormats[locale];
  const rtf = new Intl.RelativeTimeFormat(localeCode, { numeric: 'auto' });
  
  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  }
}

/**
 * パーセンテージをフォーマットする
 */
export function formatPercentage(
  value: number,
  locale: Locale,
  minimumFractionDigits: number = 1,
  maximumFractionDigits: number = 1
): string {
  const localeCode = numberFormats[locale];
  
  return new Intl.NumberFormat(localeCode, {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value / 100);
}

/**
 * 通貨記号を取得する
 */
export function getCurrencySymbol(locale: Locale): string {
  const currency = currencies[locale];
  const localeCode = numberFormats[locale];
  
  const formatter = new Intl.NumberFormat(localeCode, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  // 0をフォーマットして数字部分を除去し、通貨記号のみを取得
  return formatter.format(0).replace(/[\d\s]/g, '');
}

/**
 * ロケールに応じたテキストの方向を取得
 */
export function getTextDirection(locale: Locale): 'ltr' | 'rtl' {
  // 現在サポートしているロケールはすべて左から右
  return 'ltr';
}

/**
 * ロケールに応じた言語名を取得
 */
export function getLanguageName(locale: Locale, displayLocale?: Locale): string {
  const displayLoc = displayLocale || locale;
  const localeCode = numberFormats[displayLoc];
  
  const displayNames = new Intl.DisplayNames([localeCode], { type: 'language' });
  return displayNames.of(locale) || locale;
}

/**
 * ロケールに応じた国名を取得
 */
export function getCountryName(countryCode: string, locale: Locale): string {
  const localeCode = numberFormats[locale];
  
  const displayNames = new Intl.DisplayNames([localeCode], { type: 'region' });
  return displayNames.of(countryCode) || countryCode;
}

/**
 * 複数形の処理
 */
export function pluralize(
  count: number,
  locale: Locale,
  options: {
    zero?: string;
    one?: string;
    two?: string;
    few?: string;
    many?: string;
    other: string;
  }
): string {
  const localeCode = numberFormats[locale];
  const pr = new Intl.PluralRules(localeCode);
  const rule = pr.select(count);
  
  return options[rule] || options.other;
}

export type { Locale };