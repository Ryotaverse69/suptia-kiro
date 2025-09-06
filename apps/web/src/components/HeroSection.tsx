'use client';

import dynamic from 'next/dynamic';

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
    <section className='relative overflow-hidden min-h-[70vh] flex items-center'>
      <div className='relative container mx-auto px-4 py-16 w-full'>
        <div className='text-center max-w-5xl mx-auto'>
          <div className='animate-fade-in'>
            <h1 className='text-5xl md:text-7xl font-bold mb-6 tracking-tight'>
              <span className='gradient-text drop-shadow-sm'>サプティア</span>
            </h1>
            <p className='text-xl md:text-2xl text-gray-700 mb-10 font-semibold text-balance'>
              {t('header.tagline')}
            </p>
            <div className='mb-10 max-w-3xl mx-auto'>
              <div className='relative'>
                <div className='absolute -inset-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl blur opacity-20 animate-pulse-gentle' />
                <div className='relative'>
                  <AIRecommendationSearchBar
                    onSearch={q => {
                      if (!q?.trim()) return;
                      window.location.href = `/products?search=${encodeURIComponent(q.trim())}`;
                    }}
                    placeholder={t('search.placeholder')}
                    size='large'
                    className='animate-fade-in-up shadow-strong'
                    enablePopularOnFocus
                    maxRecommendations={5}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
