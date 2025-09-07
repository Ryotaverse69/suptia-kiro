'use client';

import dynamic from 'next/dynamic';
import { sanitizeSearchQuery } from '@/lib/validate';

const AIRecommendationSearchBar = dynamic(
  () =>
    import('@/components/AIRecommendationSearchBar').then(m => ({
      default: m.AIRecommendationSearchBar,
    })),
  {
    ssr: false,
    loading: () => (
      <div className='max-w-2xl mx-auto'>
        <div className='h-16 bg-gray-200 rounded-2xl animate-pulse' />
      </div>
    ),
  }
);

import { useTranslation } from '@/contexts/LocaleContext';

export default function HeroSection() {
  const { t } = useTranslation();
  return (
    <section className='hero-section'>
      <div className='hero-background' aria-hidden='true' />
      <div className='relative z-10 w-full'>
        <div className='text-center max-w-5xl mx-auto px-4'>
          <div className='animate-fade-in'>
            <h1 className='text-hero text-gray-900 mb-2'>サプティア</h1>
            <p className='text-display text-gray-600 mb-4'>Suptia</p>
            <p className='text-body-large text-gray-500 mb-10 max-w-3xl mx-auto'>
              {t('header.tagline')}
            </p>
          </div>
          <div className='max-w-2xl mx-auto animate-fade-in-up'>
            <AIRecommendationSearchBar
              onSearch={q => {
                const safe = sanitizeSearchQuery(q || '');
                if (!safe) return;
                window.location.href = `/products?search=${encodeURIComponent(safe)}`;
              }}
              placeholder={t('search.placeholder')}
              size='large'
              className='shadow-strong'
              variant='glass'
              enablePopularOnFocus
              maxRecommendations={5}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
