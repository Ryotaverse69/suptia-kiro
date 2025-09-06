'use client';

import { useTranslation } from '@/contexts/LocaleContext';

export default function HomePrimaryActions() {
  const { t } = useTranslation();
  const cards = [
    {
      href: '/compare',
      icon: '📊',
      title: t('home.actions.compare'),
      desc: t('home.actions.compareDesc'),
    },
    {
      href: '/diagnosis',
      icon: '🧭',
      title: t('home.actions.diagnosis'),
      desc: t('home.actions.diagnosisDesc'),
    },
    {
      href: '/ingredients',
      icon: '🧪',
      title: t('home.actions.guide'),
      desc: t('home.actions.guideDesc'),
    },
  ];

  return (
    <section className='py-16'>
      <div className='container mx-auto px-4'>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {cards.map(card => (
            <a
              key={card.href}
              href={card.href}
              className='glass-effect rounded-2xl p-7 shadow-soft hover:shadow-strong transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
            >
              <div className='text-3xl mb-3'>{card.icon}</div>
              <h3 className='text-xl font-bold text-gray-900 mb-1'>
                {card.title}
              </h3>
              <p className='text-gray-600'>{card.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
