import { render, waitFor } from '@testing-library/react';
import LocaleHtmlLangSetter from '@/components/LocaleHtmlLangSetter';
import { LocaleProvider, useLocale } from '@/contexts/LocaleContext';
import { useEffect } from 'react';

function SwitchToEn() {
  const { setLocale } = useLocale();
  useEffect(() => {
    setLocale('en');
  }, [setLocale]);
  return null;
}

describe('LocaleHtmlLangSetter', () => {
  it('updates <html lang> when locale changes', async () => {
    // Ensure initial lang is ja
    document.documentElement.setAttribute('lang', 'ja');
    render(
      <LocaleProvider initialLocale='ja'>
        <LocaleHtmlLangSetter />
        <SwitchToEn />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.getAttribute('lang')).toBe('en');
    });
  });
});
