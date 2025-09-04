import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  formatNumber,
  formatPercent,
  formatDate,
  formatRelativeTime,
  convertCurrency,
  getTextDirection,
  getDecimalSeparator,
  getThousandsSeparator,
} from '../i18n-utils';

describe('i18n-utils', () => {
  describe('formatPrice', () => {
    it('should format price in Japanese locale with JPY', () => {
      const result = formatPrice(1000, 'ja', 'JPY');
      expect(result).toBe('￥1,000');
    });

    it('should format price in English locale with USD', () => {
      const result = formatPrice(10.99, 'en', 'USD');
      expect(result).toBe('$10.99');
    });

    it('should use default currency for locale when not specified', () => {
      const resultJa = formatPrice(1000, 'ja');
      const resultEn = formatPrice(10.99, 'en');
      
      expect(resultJa).toBe('￥1,000');
      expect(resultEn).toBe('$10.99');
    });
  });

  describe('formatNumber', () => {
    it('should format number in Japanese locale', () => {
      const result = formatNumber(1234.56, 'ja');
      expect(result).toBe('1,234.56');
    });

    it('should format number in English locale', () => {
      const result = formatNumber(1234.56, 'en');
      expect(result).toBe('1,234.56');
    });

    it('should respect custom options', () => {
      const result = formatNumber(1234.56, 'ja', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      expect(result).toBe('1,235');
    });
  });

  describe('formatPercent', () => {
    it('should format percentage in Japanese locale', () => {
      const result = formatPercent(75.5, 'ja');
      expect(result).toBe('75.5%');
    });

    it('should format percentage in English locale', () => {
      const result = formatPercent(75.5, 'en');
      expect(result).toBe('75.5%');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2025-01-15T10:30:00Z');

    it('should format date in short format for Japanese locale', () => {
      const result = formatDate(testDate, 'ja', 'short');
      expect(result).toMatch(/2025\/01\/15/);
    });

    it('should format date in short format for English locale', () => {
      const result = formatDate(testDate, 'en', 'short');
      expect(result).toMatch(/01\/15\/2025/);
    });

    it('should format date in long format for Japanese locale', () => {
      const result = formatDate(testDate, 'ja', 'long');
      expect(result).toMatch(/2025年1月15日/);
    });

    it('should format date in long format for English locale', () => {
      const result = formatDate(testDate, 'en', 'long');
      expect(result).toMatch(/January 15, 2025/);
    });
  });

  describe('formatRelativeTime', () => {
    it('should format relative time for past dates', () => {
      const baseDate = new Date('2025-01-15T10:00:00Z');
      const pastDate = new Date('2025-01-14T10:00:00Z'); // 1 day ago
      
      const resultJa = formatRelativeTime(pastDate, 'ja', baseDate);
      const resultEn = formatRelativeTime(pastDate, 'en', baseDate);
      
      expect(resultJa).toMatch(/昨日|1日前/);
      expect(resultEn).toMatch(/yesterday|1 day ago/);
    });

    it('should format relative time for future dates', () => {
      const baseDate = new Date('2025-01-15T10:00:00Z');
      const futureDate = new Date('2025-01-16T10:00:00Z'); // 1 day later
      
      const resultJa = formatRelativeTime(futureDate, 'ja', baseDate);
      const resultEn = formatRelativeTime(futureDate, 'en', baseDate);
      
      expect(resultJa).toMatch(/明日|1日後/);
      expect(resultEn).toMatch(/tomorrow|in 1 day/);
    });
  });

  describe('convertCurrency', () => {
    it('should return same amount for same currency', () => {
      const result = convertCurrency(1000, 'JPY', 'JPY');
      expect(result).toBe(1000);
    });

    it('should convert JPY to USD', () => {
      const result = convertCurrency(1000, 'JPY', 'USD');
      expect(result).toBeCloseTo(6.7, 1); // Approximate conversion
    });

    it('should convert USD to JPY', () => {
      const result = convertCurrency(10, 'USD', 'JPY');
      expect(result).toBeCloseTo(1492.5, 1); // Approximate conversion
    });

    it('should return original amount for unknown currency pair', () => {
      const result = convertCurrency(1000, 'EUR', 'GBP');
      expect(result).toBe(1000);
    });
  });

  describe('getTextDirection', () => {
    it('should return ltr for Japanese locale', () => {
      const result = getTextDirection('ja');
      expect(result).toBe('ltr');
    });

    it('should return ltr for English locale', () => {
      const result = getTextDirection('en');
      expect(result).toBe('ltr');
    });
  });

  describe('getDecimalSeparator', () => {
    it('should return decimal separator for Japanese locale', () => {
      const result = getDecimalSeparator('ja');
      expect(result).toBe('.');
    });

    it('should return decimal separator for English locale', () => {
      const result = getDecimalSeparator('en');
      expect(result).toBe('.');
    });
  });

  describe('getThousandsSeparator', () => {
    it('should return thousands separator for Japanese locale', () => {
      const result = getThousandsSeparator('ja');
      expect(result).toBe(',');
    });

    it('should return thousands separator for English locale', () => {
      const result = getThousandsSeparator('en');
      expect(result).toBe(',');
    });
  });
});