import Link from 'next/link';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface CategoryCard {
  name: string;
  href: string;
  productCount: number;
  averagePrice: number;
  imageUrl?: string;
}

const fallbackCategories: CategoryCard[] = [
  {
    name: 'ビタミンD',
    href: '/search?q=' + encodeURIComponent('ビタミンD'),
    productCount: 1234,
    averagePrice: 2980,
    imageUrl: '/placeholders/product-placeholder.svg',
  },
  {
    name: 'プロテイン',
    href: '/search?q=' + encodeURIComponent('プロテイン'),
    productCount: 1587,
    averagePrice: 4380,
    imageUrl: '/placeholders/product-placeholder.svg',
  },
  {
    name: 'マルチビタミン',
    href: '/search?q=' + encodeURIComponent('マルチビタミン'),
    productCount: 980,
    averagePrice: 3180,
    imageUrl: '/placeholders/product-placeholder.svg',
  },
  {
    name: 'オメガ3',
    href: '/search?q=' + encodeURIComponent('オメガ3'),
    productCount: 612,
    averagePrice: 3560,
    imageUrl: '/placeholders/product-placeholder.svg',
  },
  {
    name: 'コラーゲン',
    href: '/search?q=' + encodeURIComponent('コラーゲン'),
    productCount: 742,
    averagePrice: 2980,
    imageUrl: '/placeholders/product-placeholder.svg',
  },
  {
    name: '鉄分サプリ',
    href: '/search?q=' + encodeURIComponent('鉄分'),
    productCount: 515,
    averagePrice: 2480,
    imageUrl: '/placeholders/product-placeholder.svg',
  },
];

const formatter = new Intl.NumberFormat('ja-JP');

interface PopularSearchesProps {
  categories?: CategoryCard[];
}

export function PopularSearches({ categories }: PopularSearchesProps) {
  const displayCategories =
    categories && categories.length > 0 ? categories : fallbackCategories;

  return (
    <section className='bg-white py-16'>
      <div className='mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-8'>
        <header className='mb-10'>
          <p className='text-sm font-semibold uppercase tracking-[0.4em] text-neutral-500'>
            POPULAR SEARCHES
          </p>
          <h2 className='mt-2 text-3xl font-semibold text-[#1f242f] sm:text-[34px]'>
            話題のサプリカテゴリー
          </h2>
        </header>

        <div className='grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-6'>
          {displayCategories.map(category => (
            <article
              key={category.name}
              className='group relative aspect-square overflow-hidden rounded-[16px] shadow-trivago-card transition-transform duration-200 ease-trivago hover:-translate-y-1 hover:shadow-trivago-hover'
            >
              <Link href={category.href} className='absolute inset-0'>
                <span className='sr-only'>{category.name}を検索</span>
              </Link>
              <OptimizedImage
                src={
                  category.imageUrl || '/placeholders/product-placeholder.svg'
                }
                alt={`${category.name} のイメージ`}
                fill
                sizes='(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 16vw'
                className='object-cover'
                placeholder='blur'
                blurDataURL='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgdmlld0JveD0iMCAwIDMyMCAzMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyMCIgaGVpZ2h0PSIzMjAiIGZpbGw9IiNGRkZGRkYiLz48cmVjdCB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgZmlsbD0iI0VGRkZGRiIgb3BhY2l0eT0iMC44Ii8+PHJlY3Qgd2lkdGg9IjMyMCIgaGVpZ2h0PSIzMjAiIGZpbGw9IiNFM0VGRkYiIG9wYWNpdHk9IjAuNiIvPjwvc3ZnPg=='
              />
              <div className='absolute inset-0 bg-gradient-to-t from-[#1f242f]/80 via-[#1f242f]/20 to-transparent' />
              <div className='absolute inset-x-0 bottom-0 p-4 text-white'>
                <h3 className='text-lg font-semibold'>{category.name}</h3>
                <p className='mt-1 text-sm text-white/80'>
                  {formatter.format(category.productCount)}商品 平均価格 ¥
                  {formatter.format(category.averagePrice)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
