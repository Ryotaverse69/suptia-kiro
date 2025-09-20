'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

export interface SellerPrice {
  site: string;
  price: number;
  url: string;
  currency?: 'JPY' | 'USD';
}

export interface ResultProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  rating: number;
  reviewCount: number;
  priceRange: [number, number];
  sellers: SellerPrice[];
  mainIngredients?: string[];
  imageUrl: string;
  description?: string;
  servingsPerContainer?: number;
  servingsPerDay?: number;
  thirdPartyTested?: boolean;
  form?: string;
  popularityScore?: number;
  isInStock?: boolean;
  isOnSale?: boolean;
  updatedAt?: number;
  targetGoals?: string[];
}

function StarRating({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  return (
    <span
      className='flex items-center gap-2 text-sm text-amber-500'
      aria-label={`評価 ${rating.toFixed(1)} / 5`}
    >
      <span className='font-semibold leading-none'>★ {rating.toFixed(1)}</span>
      <span className='text-xs text-text-muted'>
        ({reviewCount.toLocaleString()} レビュー)
      </span>
    </span>
  );
}

interface ResultCardProps {
  product: ResultProduct;
  onAddToCompare: (id: string) => void;
  isInCompare?: boolean;
}

export function ResultCard({
  product,
  onAddToCompare,
  isInCompare,
}: ResultCardProps) {
  const { formatPrice } = useLocale();
  const lowestPrice = useMemo(
    () => Math.min(...product.sellers.map(seller => seller.price)),
    [product.sellers]
  );
  const averagePrice = useMemo(
    () =>
      Math.round(
        product.sellers.reduce((acc, seller) => acc + seller.price, 0) /
          Math.max(product.sellers.length, 1)
      ),
    [product.sellers]
  );
  const primarySeller = product.sellers[0];
  const hasPurchaseLink = Boolean(
    primarySeller?.url && primarySeller.url !== '#'
  );

  return (
    <Card
      variant='product'
      hover='lift'
      padding='lg'
      className='group grid gap-6 border-border/70 bg-white/95 backdrop-blur-sm md:grid-cols-[minmax(0,260px)_1fr]'
      data-testid='product-card'
      role='listitem'
    >
      <div className='relative overflow-hidden rounded-2xl bg-background-surface shadow-soft transition-all duration-200 ease-apple group-hover:shadow-medium'>
        <OptimizedImage
          src={product.imageUrl || '/placeholders/product-placeholder.svg'}
          alt={`${product.name} の商品画像`}
          width={360}
          height={240}
          className='h-full w-full object-cover'
          sizes='(max-width:768px) 100vw, 260px'
          placeholder='blur'
          blurDataURL='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzYwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDM2MCAyNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjM2MCIgaGVpZ2h0PSIyNDAiIGZpbGw9IiNGRkZGRkYiLz48cmVjdCB3aWR0aD0iMzYwIiBoZWlnaHQ9IjI0MCIgZmlsbD0iI0VGRkZGRiIgb3BhY2l0eT0iMC45Ii8+PHJlY3Qgd2lkdGg9IjM2MCIgaGVpZ2h0PSIyNDAiIGZpbGw9IiNFM0VGRkYiIG9wYWNpdHk9IjAuOCI+PC9yZWN0Pjwvc3ZnPg=='
        />
        {product.isOnSale ? (
          <span className='absolute left-4 top-4 rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white shadow-soft'>
            セール対象
          </span>
        ) : null}
        <div className='absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-text-subtle shadow-soft'>
          最安 {formatPrice(lowestPrice)}
        </div>
      </div>

      <div className='flex flex-col gap-4'>
        <div className='flex flex-col gap-1'>
          <span className='text-xs font-semibold uppercase tracking-[0.28em] text-text-muted'>
            {product.brand}
          </span>
          <Link
            href={`/products/${product.id}`}
            className='text-lg font-semibold tracking-tight text-slate-900 hover:text-primary-600'
          >
            {product.name}
          </Link>
          <div className='flex flex-wrap items-center gap-2 text-xs text-text-muted'>
            <span>{product.category}</span>
            {product.thirdPartyTested ? (
              <Badge variant='success' size='sm'>
                第三者検査済
              </Badge>
            ) : null}
            {product.form ? (
              <Badge variant='outline' size='sm'>
                {product.form}
              </Badge>
            ) : null}
            {product.isInStock === false ? (
              <Badge variant='warning' size='sm'>
                在庫僅少
              </Badge>
            ) : null}
          </div>
        </div>

        <StarRating rating={product.rating} reviewCount={product.reviewCount} />

        {product.mainIngredients && product.mainIngredients.length > 0 ? (
          <div className='flex flex-wrap gap-2'>
            {product.mainIngredients.slice(0, 4).map(ingredient => (
              <Badge key={ingredient} variant='ingredient' size='sm'>
                {ingredient}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className='rounded-2xl bg-background-surface p-4 shadow-soft'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.28em] text-text-muted'>
                最安値
              </p>
              <p className='text-xl font-semibold text-slate-900'>
                {formatPrice(lowestPrice)}
              </p>
            </div>
            <div className='text-right'>
              <p className='text-xs font-semibold uppercase tracking-[0.28em] text-text-muted'>
                平均価格
              </p>
              <p className='text-sm font-medium text-text-subtle'>
                {formatPrice(averagePrice)}
              </p>
            </div>
          </div>
          <ul className='mt-4 space-y-2 text-sm text-text-subtle'>
            {product.sellers.slice(0, 3).map(seller => (
              <li
                key={seller.site}
                className='flex items-center justify-between'
              >
                <span>{seller.site}</span>
                <span>{formatPrice(seller.price)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className='mt-auto flex flex-wrap items-center gap-3'>
          {hasPurchaseLink ? (
            <Button
              asChild
              variant='primary'
              size='sm'
              hover='lift'
              className='rounded-full px-6'
            >
              <Link href={primarySeller!.url}>最安サイトへ</Link>
            </Button>
          ) : (
            <span className='text-xs text-text-muted'>
              公式サイトで詳細を確認してください
            </span>
          )}
          <Button
            type='button'
            variant={isInCompare ? 'secondary' : 'outline'}
            size='sm'
            hover='lift'
            className={cn(
              'rounded-full border-border/70',
              isInCompare && 'bg-primary-50 text-primary-700'
            )}
            onClick={() => onAddToCompare(product.id)}
          >
            {isInCompare ? '比較リストから外す' : '比較リストに追加'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
