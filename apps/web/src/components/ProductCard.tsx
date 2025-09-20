import Link from 'next/link';
import ClientPrice from '@/components/ClientPrice';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

export interface ProductCardProps {
  href: string;
  name: string;
  priceJPY: number;
  servingsPerContainer: number;
  servingsPerDay: number;
  imageUrl?: string;
  imageAlt?: string;
  costPerDay?: number;
}

export default function ProductCard({
  href,
  name,
  priceJPY,
  servingsPerContainer,
  servingsPerDay,
  imageUrl,
  imageAlt,
  costPerDay,
}: ProductCardProps) {
  return (
    <Link
      href={href}
      className='glass-effect rounded-xl p-5 block shadow-soft hover:shadow-strong transition-all duration-200 ease-out hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 interactive'
    >
      <div className='mb-3'>
        <div className='relative h-40 w-full overflow-hidden rounded-lg border border-gray-100 bg-gray-50'>
          {imageUrl ? (
            <OptimizedImage
              src={imageUrl}
              alt={imageAlt || name}
              width={640}
              height={256}
              className='h-full w-full object-cover'
              sizes='(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
              placeholder='blur'
              blurDataURL='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDY0MCAyNTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0MCIgaGVpZ2h0PSIyNTYiIGZpbGw9IiNGRkZGRkYiLz48cmVjdCB3aWR0aD0iNjQwIiBoZWlnaHQ9IjI1NiIgZmlsbD0iI0VPRUYwRSIgb3BhY2l0eT0iMC45Ii8+PHJlY3Qgd2lkdGg9IjY0MCIgaGVpZ2h0PSIyNTYiIGZpbGw9IiNFN0ZGRjgiIG9wYWNpdHk9IjAuNyIvPjwvc3ZnPg=='
            />
          ) : (
            <div
              className='flex h-full w-full items-center justify-center text-4xl text-primary-500'
              aria-hidden='true'
            >
              💊
            </div>
          )}
        </div>
      </div>
      <div className='flex items-start justify-between gap-3 mb-2'>
        <h3
          className='font-semibold text-gray-900'
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {name}
        </h3>
        <span className='text-primary-700 font-bold whitespace-nowrap'>
          <ClientPrice amount={priceJPY} />
        </span>
      </div>
      <div className='flex items-center gap-2 text-sm text-gray-600'>
        <span className='inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md'>
          {servingsPerContainer}回分
        </span>
        <span className='inline-flex items-center gap-1 bg-primary-100 text-primary-800 px-2 py-1 rounded-md'>
          1日{servingsPerDay}回
        </span>
      </div>
      {costPerDay && costPerDay > 0 && (
        <div className='mt-2 text-sm'>
          <span className='text-gray-500 mr-2'>実効コスト/日</span>
          <span className='font-semibold text-secondary-700'>
            <ClientPrice amount={costPerDay} />
          </span>
        </div>
      )}
    </Link>
  );
}
