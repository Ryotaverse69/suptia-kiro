'use client';

import { useEffect, useMemo, useState } from 'react';

const COOKIE_NAME = 'suptia-cookie-consent';
const CONSENT_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

type ConsentState = {
  necessary: boolean;
  analytics: boolean;
};

function parseConsentCookie(): ConsentState | null {
  if (typeof document === 'undefined') return null;
  const cookieMatch = document.cookie.match(
    new RegExp(`${COOKIE_NAME}=([^;]+)`)
  );
  if (!cookieMatch) return null;
  try {
    const decoded = decodeURIComponent(cookieMatch[1]);
    const parsed = JSON.parse(decoded) as ConsentState;
    if (typeof parsed.analytics === 'boolean') {
      return {
        necessary: true,
        analytics: parsed.analytics,
      };
    }
  } catch (error) {
    console.warn('Failed to parse consent cookie', error);
  }
  return null;
}

function persistConsent(consent: ConsentState) {
  const value = encodeURIComponent(JSON.stringify(consent));
  document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax`;
  window.dispatchEvent(
    new CustomEvent('suptia-consent-updated', { detail: consent })
  );
}

export default function CookieConsentBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    necessary: true,
    analytics: false,
  });

  useEffect(() => {
    const saved = parseConsentCookie();
    if (saved) {
      setConsent(saved);
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, []);

  const actions = useMemo(
    () => ({
      acceptAll() {
        const next = { necessary: true, analytics: true } as ConsentState;
        setConsent(next);
        persistConsent(next);
        setIsOpen(false);
      },
      save() {
        persistConsent(consent);
        setIsOpen(false);
      },
      closeWithoutAnalytics() {
        const next = { necessary: true, analytics: false } as ConsentState;
        setConsent(next);
        persistConsent(next);
        setIsOpen(false);
      },
    }),
    [consent]
  );

  if (!isOpen) return null;

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label='Cookie consent'
      className='fixed bottom-4 left-1/2 z-[1200] w-[min(90vw,480px)] -translate-x-1/2 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.18)] backdrop-blur-sm'
    >
      <div className='flex flex-col gap-4'>
        <div className='space-y-2'>
          <h2 className='text-lg font-semibold text-slate-900'>クッキー設定</h2>
          <p className='text-sm text-slate-600'>
            サプティアはサイトの基本機能に必要なクッキーと、利用体験を最適化する分析クッキーを使用します。分析クッキーは任意で、同意状況は一年間保存されます。
          </p>
        </div>

        <div className='space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4'>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <p className='text-sm font-semibold text-slate-800'>
                必須クッキー
              </p>
              <p className='text-xs text-slate-500'>
                サイトのセキュリティと基本機能に不可欠です。
              </p>
            </div>
            <span className='rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600'>
              必須
            </span>
          </div>
        </div>

        <label className='flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-soft'>
          <div>
            <span className='text-sm font-semibold text-slate-800'>
              分析クッキー
            </span>
            <p className='text-xs text-slate-500'>
              利用状況を匿名で収集し、機能改善に活用します。
            </p>
          </div>
          <input
            type='checkbox'
            className='h-5 w-5 accent-primary-600'
            checked={consent.analytics}
            onChange={event =>
              setConsent(prev => ({ ...prev, analytics: event.target.checked }))
            }
            aria-label='分析クッキーを許可する'
          />
        </label>

        <div className='flex flex-col gap-2 sm:flex-row sm:justify-end'>
          <button
            type='button'
            onClick={actions.closeWithoutAnalytics}
            className='w-full rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700 sm:w-auto'
          >
            必須のみ許可
          </button>
          <button
            type='button'
            onClick={actions.acceptAll}
            className='w-full rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-700 sm:w-auto'
          >
            すべて許可
          </button>
          <button
            type='button'
            onClick={actions.save}
            className='w-full rounded-full border border-primary-200 px-4 py-2 text-sm font-semibold text-primary-600 transition hover:border-primary-300 hover:text-primary-700 sm:w-auto'
          >
            選択を保存
          </button>
        </div>

        <p className='text-xs text-slate-500'>
          詳しくは
          <a
            href='/legal/privacy'
            className='ml-1 text-primary-600 underline underline-offset-2 hover:text-primary-700'
          >
            プライバシーポリシー
          </a>
          をご覧ください。
        </p>
      </div>
    </div>
  );
}
