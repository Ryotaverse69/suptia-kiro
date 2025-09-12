"use client";

import ProductCard from '@/components/ProductCard';
import { calculateEffectiveCostPerDay } from '@/lib/cost';
import { useTranslation } from '@/contexts/LocaleContext';

export interface PopularProduct {
  name: string;
  priceJPY: number;
  servingsPerContainer: number;
  servingsPerDay: number;
  slug: { current: string };
  imageUrl?: string;
  imageAlt?: string;
}

export default function PopularProductsSection({
  products,
}: {
  products: PopularProduct[];
}) {
  const { t } = useTranslation();
  const enriched = (products || []).slice(0, 6).map(p => {
    let costPerDay = 0;
    try {
      costPerDay = calculateEffectiveCostPerDay({
        priceJPY: p.priceJPY,
        servingsPerContainer: p.servingsPerContainer,
        servingsPerDay: p.servingsPerDay,
      });
    } catch { }
    return { ...p, costPerDay };
  });

  return (
    <section className='py-16 bg-white animate-fade-in'>
      <div className='container mx-auto px-4'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-3'>
            <span className='gradient-text'>{t('home.popular.title')}</span>
          </h2>
          <p className='text-gray-700'>{t('home.popular.subtitle')}</p>
        </div>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {enriched.map(p => (
            <ProductCard
              key={p.slug.current}
              href={`/products/${p.slug.current}`}
              name={p.name}
              priceJPY={p.priceJPY}
              servingsPerContainer={p.servingsPerContainer}
              servingsPerDay={p.servingsPerDay}
              imageUrl={p.imageUrl}
              imageAlt={p.imageAlt}
              costPerDay={p.costPerDay}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
