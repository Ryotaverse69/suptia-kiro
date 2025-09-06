import { useTranslation } from '@/contexts/LocaleContext';

"use client";

export default function TrustIndicatorsSection() {
  const { t } = useTranslation();
  const items = [
    {
      icon: '🛡️',
      title: t('home.trust.safety'),
      desc: t('home.trust.safetyDesc'),
    },
    { icon: '💰', title: t('home.trust.cost'), desc: t('home.trust.costDesc') },
    { icon: '🤖', title: t('home.trust.ai'), desc: t('home.trust.aiDesc') },
  ];

  return (
    <section className='py-16'>
      <div className='container mx-auto px-4'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-3'>
            <span className='gradient-text'>{t('home.trust.title')}</span>
          </h2>
        </div>
        <div className='grid gap-6 md:grid-cols-3'>
          {items.map(it => (
            <div
              key={it.title}
              className='glass-effect rounded-2xl p-6 shadow-soft text-center'
            >
              <div className='text-3xl mb-2' aria-hidden='true'>
                {it.icon}
              </div>
              <div className='text-2xl font-bold text-gray-900 mb-1'>
                {it.title}
              </div>
              <div className='text-gray-600'>{it.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
