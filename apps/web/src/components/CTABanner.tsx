"use client";

import { useTranslation } from '@/contexts/LocaleContext';

export default function CTABanner() {
  const { t } = useTranslation();
  return (
    <section className='py-20 bg-gradient-to-br from-primary-600 via-blue-600 to-secondary-600 relative overflow-hidden'>
      <div
        className='absolute inset-0 bg-grid-pattern opacity-10'
        aria-hidden='true'
      ></div>
      <div
        className='absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary-600/90 to-secondary-600/90'
        aria-hidden='true'
      ></div>

      <div className='container mx-auto px-4 text-center relative'>
        <h2 className='text-4xl md:text-5xl font-bold text-white mb-8'>
          {t('home.cta.titleLine1')}
          <br />
          <span className='text-yellow-300'>{t('home.cta.titleEmphasis')}</span>
        </h2>
        <p className='text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed'>
          {t('home.cta.subtitle')}
        </p>

        <div className='flex flex-col sm:flex-row gap-6 justify-center items-center'>
          <a
            href='/compare'
            className='inline-flex items-center gap-3 bg-white text-primary-600 font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 text-lg'
          >
            <span className='text-2xl' aria-hidden='true'>
              🚀
            </span>
            {t('home.cta.btnCompare')}
          </a>

          <a
            href='/ingredients'
            className='inline-flex items-center gap-3 bg-transparent border-2 border-white text-white font-bold py-4 px-8 rounded-2xl hover:bg-white hover:text-primary-600 transform hover:-translate-y-2 transition-all duration-300 text-lg'
          >
            <span className='text-2xl' aria-hidden='true'>
              📚
            </span>
            {t('home.cta.btnGuide')}
          </a>
        </div>
      </div>
    </section>
  );
}
