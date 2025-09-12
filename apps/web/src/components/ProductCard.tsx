import Image from 'next/image';
import Link from 'next/link';
import ClientPrice from '@/components/ClientPrice';

function shimmer(w: number, h: number) {
  return `\n  <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">\n    <defs>\n      <linearGradient id="g">\n        <stop stop-color="#f3f4f6" offset="20%"/>\n        <stop stop-color="#e5e7eb" offset="50%"/>\n        <stop stop-color="#f3f4f6" offset="70%"/>\n      </linearGradient>\n    </defs>\n    <rect width="${w}" height="${h}" fill="#f3f4f6"/>\n    <rect id="r" width="${w}" height="${h}" fill="url(#g)"/>\n    <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />\n  </svg>`;
}

function toBase64(str: string) {
  if (typeof window === 'undefined') {
    return Buffer.from(str).toString('base64');
  }
  return window.btoa(str);
}

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
      className='glass-effect rounded-2xl p-5 block shadow-soft hover:shadow-strong transition-all duration-200 ease-out hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 interactive'
    >
      <div className='mb-3'>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt || name}
            width={640}
            height={256}
            className='w-full h-40 object-cover rounded-lg border border-gray-100'
            sizes='(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
            placeholder='blur'
            blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(640, 256))}`}
          />
        ) : (
          <div
            className='w-full h-40 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl'
            aria-hidden='true'
          >
            💊
          </div>
        )}
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
        <span className='inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md'>
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
