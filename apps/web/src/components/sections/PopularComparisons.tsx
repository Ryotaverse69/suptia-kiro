'use client';

import { OptimizedImage } from '@/components/ui/OptimizedImage';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';

export interface PopularComparisonProduct {
  id: string;
  name: string;
  brand: string;
  imageUrl?: string;
  mainIngredients: string[];
  lowestPrice: number;
  rating: number;
  reviewCount: number;
  url?: string;
}

interface PopularComparisonsProps {
  products: PopularComparisonProduct[];
  heading?: string;
  subheading?: string;
  ctaLabel?: string;
  className?: string;
}

const FALLBACK_IMAGE = '/placeholders/product-placeholder.svg';

function ProductCard({
  product,
  formatPrice,
}: {
  product: PopularComparisonProduct;
  formatPrice: (value: number) => string;
}) {
  const href = product.url || `/products/${product.id}`;

  return (
    <Card
      variant='product'
      hover='lift'
      padding='lg'
      className='group flex h-full flex-col gap-4 border-border/80 bg-white/95'
    >
      <Link
        href={href}
        className='flex flex-col gap-4 focus-visible:outline-none'
      >
        <div className='relative overflow-hidden rounded-2xl bg-background-surface shadow-soft transition-all duration-200 ease-apple group-hover:shadow-medium'>
          <div className='absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/30 opacity-0 transition-opacity duration-200 ease-apple group-hover:opacity-100' />
          <OptimizedImage
            src={product.imageUrl || FALLBACK_IMAGE}
            alt={product.name}
            width={260}
            height={180}
            className='h-40 w-full object-cover'
            sizes='(max-width:640px) 100vw, (max-width:1024px) 50vw, 260px'
            placeholder='blur'
            blurDataURL='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjYwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDI2MCAxODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjI2MCIgaGVpZ2h0PSIxODAiIGZpbGw9IiNGRkZGRkYiLz48cmVjdCB3aWR0aD0iMjYwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iI0VGRkZGRiIgb3BhY2l0eT0iMC44Ii8+PHJlY3Qgd2lkdGg9IjI2MCIgaGVpZ2h0PSIxODAiIGZpbGw9IiNFM0VGRkYiIG9wYWNpdHk9IjAuNiIvPjwvc3ZnPg=='
          />
        </div>

        <div className='flex flex-col gap-3 text-left'>
          <div className='space-y-1'>
            <p className='text-xs uppercase tracking-[0.28em] text-text-muted'>
              {product.brand}
            </p>
            <h3 className='text-lg font-semibold tracking-tight text-slate-900'>
              {product.name}
            </h3>
          </div>

          <div className='flex items-center gap-2 text-sm text-text-muted'>
            <span className='text-base font-semibold text-amber-500'>
              ★ {product.rating.toFixed(1)}
            </span>
            <span>({product.reviewCount.toLocaleString()} レビュー)</span>
          </div>

          <div className='flex items-baseline justify-between'>
            <span className='text-xs uppercase tracking-[0.24em] text-text-muted'>
              最安値
            </span>
            <span className='text-lg font-semibold text-slate-900'>
              {formatPrice(product.lowestPrice)}
            </span>
          </div>

          <div className='flex flex-wrap gap-2 pt-1'>
            {product.mainIngredients.slice(0, 3).map(ingredient => (
              <Badge
                key={ingredient}
                variant='ingredient'
                size='sm'
                hover='lift'
              >
                {ingredient}
              </Badge>
            ))}
          </div>
        </div>
      </Link>
    </Card>
  );
}

export function PopularComparisonsSection({
  products,
  heading = '人気の比較',
  subheading = 'Trending Comparisons',
  ctaLabel = 'すべて見る',
  className,
}: PopularComparisonsProps) {
  const { formatPrice } = useLocale();

  return (
    <section
      id='popular-comparisons'
      className={cn('relative py-20', className)}
      aria-labelledby='popular-comparisons-heading'
    >
      <div
        className='absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white/80'
        aria-hidden='true'
      />
      <div className='container relative flex w-full flex-col gap-12'>
        <div className='flex flex-col items-center gap-3 text-center'>
          <span className='text-xs font-semibold uppercase tracking-[0.32em] text-primary-600'>
            Curated for you
          </span>
          <div className='space-y-2'>
            <h2
              id='popular-comparisons-heading'
              className='text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl'
            >
              {heading}
            </h2>
            <p className='text-sm text-text-muted md:text-base'>{subheading}</p>
          </div>
        </div>

        <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6'>
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              formatPrice={formatPrice}
            />
          ))}
        </div>

        <div className='flex items-center justify-center'>
          <Button
            asChild
            variant='ghost'
            size='lg'
            className='rounded-full border border-border/60 px-8 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-text-muted hover:border-primary-300 hover:text-primary-600'
          >
            <Link href='/compare'>{ctaLabel}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default PopularComparisonsSection;
