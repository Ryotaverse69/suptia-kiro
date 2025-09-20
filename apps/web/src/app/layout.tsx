// Validate environment variables at startup
import '@/env';
import './globals.css';
import { headers } from 'next/headers';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import { Noto_Sans_JP } from 'next/font/google';
import type { Metadata } from 'next';
import { getSiteUrl } from '@/lib/runtimeConfig';
import { cn } from '@/lib/utils';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import SkipLinks from '@/components/SkipLinks';
import LocaleHtmlLangSetter from '@/components/LocaleHtmlLangSetter';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import { WebVitals } from '@/components/WebVitals';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});
const notoSans = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-noto-sans',
});

export const metadata: Metadata = {
  title: 'サプティア | サプリメント比較プラットフォーム',
  description:
    '科学的なデータと洗練されたUIでサプリメントを比較。成分情報・価格・エビデンスを1つの画面で素早く確認できます。',
  keywords:
    'サプリメント, 比較, 成分ガイド, ビタミン, プロテイン, サプティア, supplement comparison',
  authors: [{ name: 'サプティア' }],
  creator: 'サプティア',
  publisher: 'サプティア',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: 'https://suptia.com',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      {
        url: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    other: [{ rel: 'mask-icon', url: '/favicon.svg', color: '#2563eb' }],
  },
  openGraph: {
    title: 'サプティア | サプリメント比較プラットフォーム',
    description:
      '成分ごとのエビデンスや最安値をワンストップで。Apple/xAIレベルのUIで最適なサプリを見つけましょう。',
    type: 'website',
    locale: 'ja_JP',
    siteName: 'サプティア',
    url: 'https://suptia.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'サプティア | サプリメント比較プラットフォーム',
    description:
      '100+サイトの価格とエビデンスを横断比較。未来志向のサプリ選びをサポートします。',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = headers().get('x-nonce') || undefined;
  const siteUrl = getSiteUrl();

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'サプティア',
    alternateName: 'Suptia',
    url: siteUrl,
    description:
      'エビデンスと価格データを掛け合わせ、最適なサプリメント選びをサポートします。',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'サプティア',
    alternateName: 'Suptia',
    url: siteUrl,
    description: 'サプリメント比較・成分インテリジェンスプラットフォーム',
    logo: `${siteUrl}/logo.svg`,
    foundingDate: '2025',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'contact@suptia.com',
    },
  };

  return (
    <html
      lang='ja'
      className={cn('scroll-smooth', inter.variable, notoSans.variable)}
    >
      <head>
        <link rel='manifest' href='/site.webmanifest' />
        <meta name='theme-color' content='#2563eb' />

        {/* Preload frequently used SVG assets to tighten LCP */}
        <link rel='preload' as='image' href='/logo.svg' type='image/svg+xml' />
        <link
          rel='preload'
          as='image'
          href='/placeholders/product-placeholder.svg'
          type='image/svg+xml'
        />

        {/* DNS プリフェッチ / Preconnect */}
        <link rel='dns-prefetch' href='//cdn.sanity.io' />
        <link rel='preconnect' href='https://cdn.sanity.io' crossOrigin='' />

        {/* Service Worker 登録 */}
        <Script id='sw-register' strategy='afterInteractive'>
          {`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            }
          `}
        </Script>
      </head>
      <body className='min-h-screen bg-background-subtle font-sans text-text-default antialiased transition-colors duration-300 ease-apple'>
        {/* Global JSON-LD structured data */}
        <Script id='website-jsonld' type='application/ld+json' nonce={nonce}>
          {JSON.stringify(websiteJsonLd)}
        </Script>
        <Script
          id='organization-jsonld'
          type='application/ld+json'
          nonce={nonce}
        >
          {JSON.stringify(organizationJsonLd)}
        </Script>

        {/* Skip links for accessibility */}
        <SkipLinks />

        {/* Web Vitals monitoring */}
        <WebVitals />

        {/* Locale Provider for client-side components */}
        <LocaleProvider>
          {/* Sync <html lang> on client with current locale */}
          <LocaleHtmlLangSetter />
          {/* Header */}
          <Header />

          {/* Main Content */}
          <main
            id='main-content'
            role='main'
            tabIndex={-1}
            className='min-h-screen pt-[96px] md:pt-[110px]'
          >
            {children}
          </main>

          <CookieConsentBanner />

          {/* Footer */}
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
