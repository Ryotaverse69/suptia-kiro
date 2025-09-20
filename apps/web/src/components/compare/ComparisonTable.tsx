import Link from 'next/link';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

export interface ComparisonSeller {
  site: string;
  price: number;
  url: string;
}

export interface ComparisonProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  rating: number;
  reviewCount: number;
  lowestPrice: number;
  pricePerDay: number;
  volume: string;
  ingredients: string[];
  testing: string;
  imageUrl: string;
  sellers: ComparisonSeller[];
}

const priceFormatter = new Intl.NumberFormat('ja-JP');

interface ComparisonTableProps {
  products: ComparisonProduct[];
  onRemove?: (id: string) => void;
}

export function ComparisonTable({ products, onRemove }: ComparisonTableProps) {
  return (
    <div className='overflow-x-auto py-6'>
      <div className='flex min-w-max gap-5'>
        {products.map(product => (
          <article
            key={product.id}
            className='flex w-[250px] shrink-0 flex-col gap-4 rounded-[16px] border border-[#e0e0e0] bg-white p-4 shadow-trivago-card transition hover:-translate-y-[2px] hover:shadow-trivago-hover'
          >
            <div className='relative h-[140px] w-full overflow-hidden rounded-[12px] bg-neutral-100'>
              <OptimizedImage
                src={product.imageUrl}
                alt={`${product.name} のパッケージ`}
                fill
                className='object-cover'
                sizes='250px'
                placeholder='blur'
                blurDataURL='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjE0MCIgdmlld0JveD0iMCAwIDI1MCAxNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjI1MCIgaGVpZ2h0PSIxNDAiIGZpbGw9IiNGRkZGRkYiLz48cmVjdCB3aWR0aD0iMjUwIiBoZWlnaHQ9IjE0MCIgZmlsbD0iI0VGRkZGRiIgb3BhY2l0eT0iMC44Ii8+PHJlY3Qgd2lkdGg9IjI1MCIgaGVpZ2h0PSIxNDAiIGZpbGw9IiNFM0VGRkYiIG9wYWNpdHk9IjAuNiIvPjwvc3ZnPg=='
              />
              {onRemove && (
                <button
                  type='button'
                  className='absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-neutral-500 shadow-md transition hover:bg-primary-50 hover:text-primary-500'
                  aria-label={`${product.name} を比較から外す`}
                  onClick={() => onRemove(product.id)}
                >
                  ×
                </button>
              )}
            </div>
            <div className='space-y-2'>
              <p className='text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500'>
                {product.category} / {product.brand}
              </p>
              <h3 className='text-lg font-semibold leading-tight text-[#1f242f]'>
                {product.name}
              </h3>
              <div className='flex items-center gap-2 text-xs text-neutral-500'>
                <span className='text-[#f59e0b]'>
                  ★ {product.rating.toFixed(1)}
                </span>
                <span>{product.reviewCount.toLocaleString()}件レビュー</span>
              </div>
            </div>

            <div className='rounded-[12px] bg-neutral-50 p-3 text-sm text-neutral-600'>
              <div className='flex items-baseline justify-between'>
                <span className='text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500'>
                  最安値
                </span>
                <span className='text-lg font-semibold text-primary-500'>
                  ¥{priceFormatter.format(product.lowestPrice)}
                </span>
              </div>
              <div className='mt-2 flex items-center justify-between text-xs text-neutral-500'>
                <span>1日あたり</span>
                <span>¥{priceFormatter.format(product.pricePerDay)}</span>
              </div>
            </div>

            <div className='space-y-1 text-xs text-neutral-600'>
              <div className='flex justify-between'>
                <span className='text-neutral-500'>内容量</span>
                <span>{product.volume}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-neutral-500'>検査</span>
                <span>{product.testing}</span>
              </div>
            </div>

            <div className='space-y-2'>
              <p className='text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500'>
                主要成分
              </p>
              <ul className='space-y-1 text-sm text-neutral-600'>
                {product.ingredients.map(ingredient => (
                  <li key={ingredient} className='flex items-center gap-2'>
                    <span
                      className='h-2 w-2 rounded-full bg-trivago-blue'
                      aria-hidden='true'
                    />
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className='space-y-2 text-sm text-neutral-600'>
              <p className='text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500'>
                価格比較
              </p>
              {product.sellers.slice(0, 3).map(seller => (
                <div
                  key={seller.site}
                  className='flex items-center justify-between rounded-[10px] border border-[#f1f3f5] bg-neutral-50 px-3 py-2'
                >
                  <span>{seller.site}</span>
                  <span className='font-semibold text-[#1f242f]'>
                    ¥{priceFormatter.format(seller.price)}
                  </span>
                </div>
              ))}
            </div>

            {product.sellers[0]?.url && product.sellers[0].url !== '#' ? (
              <Link
                href={product.sellers[0].url}
                className='mt-auto flex h-11 items-center justify-center rounded-pill bg-primary-500 text-sm font-semibold text-white transition-colors duration-200 ease-trivago hover:bg-primary-600'
              >
                最安値で購入
              </Link>
            ) : (
              <span
                className='mt-auto flex h-11 items-center justify-center rounded-pill bg-neutral-200 text-sm font-semibold text-neutral-500'
                aria-disabled='true'
              >
                価格情報を確認中
              </span>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
