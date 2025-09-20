import Link from 'next/link';
import { LogoWordmark } from './LogoWordmark';
import { LangCurrencySwitcher } from './LangCurrencySwitcher';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/LocaleContext';

const seoSections: Array<{
  title: string;
  links: Array<{ label: string; query: string }>;
}> = [
  {
    title: '人気のカテゴリ',
    links: [
      { label: 'ビタミンD', query: 'ビタミンD サプリ' },
      { label: 'マルチビタミン', query: 'マルチビタミン' },
      { label: 'プロテイン', query: 'プロテイン サプリ' },
      { label: 'オメガ3', query: 'オメガ3 サプリ' },
      { label: 'コラーゲン', query: 'コラーゲン サプリ' },
      { label: 'プロバイオティクス', query: 'プロバイオティクス' },
    ],
  },
  {
    title: '目的から探す',
    links: [
      { label: '疲労回復', query: '疲労回復 サプリ' },
      { label: '美容ケア', query: '美容 サプリ' },
      { label: '免疫サポート', query: '免疫 サプリ' },
      { label: '睡眠の質向上', query: '睡眠 サプリ' },
      { label: '筋力アップ', query: '筋力アップ サプリ' },
      { label: 'メンタルバランス', query: 'メンタルヘルス サプリ' },
    ],
  },
  {
    title: '主要ブランド',
    links: [
      { label: 'Nature Made', query: 'Nature Made' },
      { label: 'Now Foods', query: 'Now Foods' },
      { label: 'DHC', query: 'DHC サプリ' },
      { label: 'マイプロテイン', query: 'マイプロテイン' },
      { label: 'サントリー', query: 'サントリー サプリ' },
      { label: 'ファンケル', query: 'ファンケル サプリ' },
    ],
  },
  {
    title: '調達・ポリシー',
    links: [
      { label: '国内ブランド', query: '国内 ブランド サプリ' },
      { label: 'オーガニック', query: 'オーガニック サプリ' },
      { label: 'ビーガン対応', query: 'ビーガン サプリ' },
      { label: '低アレルゲン', query: '低アレルゲン サプリ' },
      { label: '第三者検査済み', query: '第三者検査 サプリ' },
      { label: 'GMP 認証', query: 'GMP 認証 サプリ' },
    ],
  },
];

const supportSections: Array<{
  title: string;
  links: Array<{ label: string; href: string }>;
}> = [
  {
    title: 'サポート',
    links: [
      { label: 'お問い合わせ', href: '/contact' },
      { label: 'ヘルプセンター', href: '/contact#help' },
      { label: 'FAQ', href: '/contact#faq' },
      { label: 'パートナー募集', href: '/contact#partners' },
    ],
  },
  {
    title: 'サプティアについて',
    links: [
      { label: 'サービス概要', href: '/about' },
      { label: '採用情報', href: '/about#careers' },
      { label: 'プレスルーム', href: '/about#press' },
      { label: '研究とレビュー', href: '/about#research' },
    ],
  },
  {
    title: '法的情報',
    links: [
      { label: 'プライバシーポリシー', href: '/legal/privacy' },
      { label: '利用規約', href: '/legal/terms' },
      { label: '特商法に基づく表示', href: '/legal/disclaimer' },
      { label: 'クッキーポリシー', href: '/legal/privacy#cookies' },
    ],
  },
];

const currentYear = new Date().getFullYear();

export function Footer({ className }: { className?: string }) {
  const { copy } = useLocale();
  return (
    <footer
      className={cn(
        'border-t border-border/60 bg-background-subtle text-text-subtle',
        className
      )}
    >
      <div className='container flex w-full flex-col gap-16 py-16'>
        <div className='grid gap-10 lg:grid-cols-[1.2fr_1fr]'>
          <div className='space-y-8'>
            <LogoWordmark showEnglish={false} />
            <p
              className='max-w-lg text-sm leading-relaxed text-text-muted'
              data-testid='footer-copy-about'
            >
              {copy.footer.about}
            </p>
            <p
              className='text-sm text-text-subtle'
              data-testid='footer-copy-contact'
            >
              {copy.footer.contact}
            </p>
            <LangCurrencySwitcher align='left' size='compact' />
          </div>

          <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-3'>
            {supportSections.map(section => (
              <div key={section.title}>
                <h2 className='text-xs font-semibold uppercase tracking-[0.28em] text-text-muted'>
                  {section.title}
                </h2>
                <ul className='mt-3 space-y-2 text-sm'>
                  {section.links.map(link => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className='text-text-subtle transition-colors duration-200 ease-apple hover:text-primary-600'
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className='grid gap-10 md:grid-cols-2 lg:grid-cols-4'>
          {seoSections.map(section => (
            <div key={section.title}>
              <h3 className='text-xs font-semibold uppercase tracking-[0.28em] text-text-muted'>
                {section.title}
              </h3>
              <ul className='mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm'>
                {section.links.map(link => (
                  <li key={link.label}>
                    <Link
                      href={`/search?q=${encodeURIComponent(link.query)}`}
                      className='text-text-subtle transition-colors duration-200 ease-apple hover:text-primary-600'
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className='flex flex-col gap-4 border-t border-border/50 pt-6 text-xs text-text-muted md:flex-row md:items-center md:justify-between'>
          <p>© {currentYear} Suptia. All rights reserved.</p>
          <div className='flex flex-wrap items-center gap-3'>
            <Link
              href='/legal/privacy'
              className='transition-colors duration-200 ease-apple hover:text-primary-600'
            >
              プライバシー
            </Link>
            <span aria-hidden='true'>·</span>
            <Link
              href='/legal/terms'
              className='transition-colors duration-200 ease-apple hover:text-primary-600'
            >
              利用規約
            </Link>
            <span aria-hidden='true'>·</span>
            <Link
              href='/sitemap.xml'
              className='transition-colors duration-200 ease-apple hover:text-primary-600'
            >
              サイトマップ
            </Link>
            <span aria-hidden='true'>·</span>
            <span>日本 / 日本語</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
