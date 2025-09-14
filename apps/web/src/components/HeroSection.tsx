'use client';

import dynamic from 'next/dynamic';
import { sanitizeSearchQuery } from '@/lib/validate';
import TrivagoLikeSearchBar from '@/components/TrivagoLikeSearchBar';

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
          <div className='pt-8'>
            <h1 className='text-3xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6'>
              あなたに最も合うサプリを最も安い価格で。
            </h1>
          </div>
          <div className='max-w-3xl mx-auto'>
            <TrivagoLikeSearchBar />
          </div>
        </div>
      </div>
    </section>
  );
}
