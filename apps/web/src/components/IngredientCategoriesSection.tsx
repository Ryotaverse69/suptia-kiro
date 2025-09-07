"use client";

import { useTranslation } from '@/contexts/LocaleContext';

export default function IngredientCategoriesSection() {
  const { t } = useTranslation();
  const cats = [
    {
      key: 'vitamins',
      label: t('ingredients.vitamins'),
      icon: '🍊',
      desc: t('home.categories.vitaminsDesc'),
    },
    {
      key: 'minerals',
      label: t('ingredients.minerals'),
      icon: '⚡',
      desc: t('home.categories.mineralsDesc'),
    },
    {
      key: 'herbs',
      label: t('ingredients.herbs'),
      icon: '🌿',
      desc: t('home.categories.herbsDesc'),
    },
    {
      key: 'amino-acids',
      label: t('ingredients.aminoAcids'),
      icon: '💪',
      desc: t('home.categories.aminoAcidsDesc'),
    },
  ];

  return (
    <section className='py-16 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 relative overflow-hidden'>
      <div className='container mx-auto px-4'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-3'>
            <span className='gradient-text'>{t('ingredients.guide')}</span>
          </h2>
          <p className='text-gray-700'>{t('home.categories.subtitle')}</p>
        </div>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
          {cats.map(c => (
            <a
              key={c.key}
              href={`/ingredients?category=${encodeURIComponent(c.key)}`}
              className='ingredient-category-card glass-effect rounded-2xl p-7 text-center shadow-soft hover:shadow-strong transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
            >
              <div className='w-20 h-20 bg-gradient-to-br from-white to-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl'>
                <span aria-hidden='true'>{c.icon}</span>
              </div>
              <h3 className='text-xl font-bold text-gray-900 mb-1'>
                {c.label}
              </h3>
              <p className='text-gray-700 text-sm'>{c.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
