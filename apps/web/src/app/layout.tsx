// Validate environment variables at startup
import '@/env';
import './globals.css';
import { headers } from 'next/headers';
import Script from 'next/script';
import { getSiteUrl } from '@/lib/runtimeConfig';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SkipLinks } from '@/components/SkipLinks';
import dynamic from 'next/dynamic';

// パフォーマンス監視コンポーネントを動的インポート
const PerformanceMonitor = dynamic(
  () => import('@/components/PerformanceMonitor'),
  { ssr: false }
);

export const metadata = {
  title: 'サプティア - あなたに最も合うサプリを最も安い価格で',
  description:
    'あなたに最も合うサプリを最も安い価格で。科学的根拠に基づいた分析で、安全で効果的なサプリメント選択をサポートします。AIレコメンド機能、詳細な商品分析、個人診断機能を提供。',
  keywords:
    'サプリメント, 比較, 安全性, コスト, AI, 健康, レコメンド, 診断, 成分分析',
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
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/favicon.svg', color: '#3b82f6' },
    ],
  },
  openGraph: {
    title: 'サプティア - あなたに最も合うサプリを最も安い価格で',
    description:
      '科学的根拠に基づいた分析で、安全で効果的なサプリメント選択をサポート。AIレコメンド機能と個人診断で最適なサプリメントを見つけます。',
    type: 'website',
    locale: 'ja_JP',
    siteName: 'サプティア',
    url: 'https://suptia.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'サプティア - あなたに最も合うサプリを最も安い価格で',
    description:
      '科学的根拠に基づいた分析で、安全で効果的なサプリメント選択をサポート',
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
      'あなたに最も合うサプリを最も安い価格で。科学的根拠に基づいた分析で、安全で効果的なサプリメント選択をサポート。',
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
    description: 'サプリメント選択支援サービス',
    logo: `${siteUrl}/logo.svg`,
    foundingDate: '2025',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'contact@suptia.com',
    },
  };

  return (
    <html lang='ja' className='scroll-smooth'>
      <head>
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href='/favicon.svg' type='image/svg+xml' />
        <link rel='icon' href='/favicon.svg' sizes='any' type='image/svg+xml' />
        <link rel='manifest' href='/site.webmanifest' />
        <meta name='theme-color' content='#2563eb' />

        {/* DNS プリフェッチ */}
        <link rel='dns-prefetch' href='//cdn.sanity.io' />
        <link rel='dns-prefetch' href='//fonts.googleapis.com' />
        <link rel='dns-prefetch' href='//fonts.gstatic.com' />

        {/* フォントのプリロードは外部CDNに依存するため一旦無効化 */}

        {/* Service Worker 登録 */}
        <Script id='sw-register' strategy='afterInteractive'>
          {`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            }
          `}
        </Script>
      </head>
      <body className='min-h-screen bg-white text-gray-900 antialiased'>
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

        {/* Locale Provider for client-side components */}
        <LocaleProvider>
          {/* Header */}
          <Header />

          {/* Main Content */}
          <main id='main-content' className='pt-16 min-h-screen'>
            {children}
          </main>

          {/* Footer */}
          <Footer />

          {/* パフォーマンス監視（開発環境のみ） */}
          {process.env.NODE_ENV === 'development' && (
            <PerformanceMonitor enableLogging={true} />
          )}
        </LocaleProvider>
      </body>
    </html>
  );
}
