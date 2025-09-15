import { sanity } from '@/lib/sanity.client';
import Link from 'next/link';
import Image from 'next/image';
import ClientPrice from '@/components/ClientPrice';
import { calculateEffectiveCostPerDay } from '@/lib/cost';

interface ProductListItem {
  name: string;
  priceJPY: number;
  servingsPerContainer: number;
  servingsPerDay: number;
  slug: { current: string };
  imageUrl?: string;
  imageAlt?: string;
}

async function getProducts(): Promise<ProductListItem[]> {
  const query = `*[_type == "product"] | order(_createdAt desc)[0..20]{
    name,
    priceJPY,
    servingsPerContainer,
    servingsPerDay,
    slug,
    "imageUrl": images[0].asset->url,
    "imageAlt": images[0].alt
  }`;
  try {
    const products = await sanity.fetch(query);
    if (products && products.length > 0) {
      return products;
    }
  } catch (e) {
    console.error('Failed to fetch product list:', e);
  }

  // デモデータを返す（Sanity接続エラーまたはデータなしの場合）
  return [
    {
      name: 'マルチビタミン プレミアム',
      priceJPY: 2980,
      servingsPerContainer: 60,
      servingsPerDay: 2,
      slug: { current: 'multivitamin-premium' },
    },
    {
      name: 'オメガ3 フィッシュオイル',
      priceJPY: 3480,
      servingsPerContainer: 90,
      servingsPerDay: 3,
      slug: { current: 'omega3-fish-oil' },
    },
    {
      name: 'ビタミンD3 + K2',
      priceJPY: 1980,
      servingsPerContainer: 120,
      servingsPerDay: 1,
      slug: { current: 'vitamin-d3-k2' },
    },
    {
      name: 'プロバイオティクス',
      priceJPY: 4280,
      servingsPerContainer: 30,
      servingsPerDay: 1,
      slug: { current: 'probiotics' },
    },
    {
      name: 'ビタミンC 1000mg',
      priceJPY: 1580,
      servingsPerContainer: 90,
      servingsPerDay: 1,
      slug: { current: 'vitamin-c-1000mg' },
    },
    {
      name: 'マグネシウム グリシネート',
      priceJPY: 2280,
      servingsPerContainer: 120,
      servingsPerDay: 2,
      slug: { current: 'magnesium-glycinate' },
    },
    {
      name: 'コエンザイムQ10',
      priceJPY: 3980,
      servingsPerContainer: 60,
      servingsPerDay: 1,
      slug: { current: 'coenzyme-q10' },
    },
    {
      name: 'アシュワガンダ エキス',
      priceJPY: 2680,
      servingsPerContainer: 90,
      servingsPerDay: 2,
      slug: { current: 'ashwagandha-extract' },
    },
  ];
}

export default async function ProductsIndexPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const products = await getProducts();
  const query =
    typeof searchParams?.search === 'string' ? searchParams?.search.trim() : '';
  const sort =
    typeof searchParams?.sort === 'string' ? searchParams?.sort : 'new';

  const filtered = query
    ? products.filter(p =>
      [p.name]
        .filter(Boolean)
        .some(field =>
          String(field).toLowerCase().includes(query.toLowerCase())
        )
    )
    : products;

  // enrich with cost/day for sorting and display
  const enriched = filtered.map(p => {
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

  const sorted = [...enriched].sort((a, b) => {
    switch (sort) {
      case 'price-asc':
        return a.priceJPY - b.priceJPY;
      case 'price-desc':
        return b.priceJPY - a.priceJPY;
      case 'cost-asc':
        return a.costPerDay - b.costPerDay;
      case 'cost-desc':
        return b.costPerDay - a.costPerDay;
      case 'name-asc':
        return a.name.localeCompare(b.name, 'ja');
      default:
        return 0;
    }
  });

  return (
    <div className='container mx-auto px-4 py-10'>
      <div className='mb-8'>
        {query ? (
          <>
            <h1 className='text-3xl font-bold text-gray-900'>検索結果</h1>
            <p className='text-gray-600 mt-2'>
              「{query}」の検索結果を表示しています（{sorted.length}件）
            </p>
          </>
        ) : (
          <>
            <h1 className='text-3xl font-bold text-gray-900'>商品一覧</h1>
            <p className='text-gray-600 mt-2'>最新の商品を一覧表示します。</p>
          </>
        )}
      </div>

      {/* Controls */}
      <form
        role='search'
        className='mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center'
        method='get'
      >
        <div className='relative flex-1'>
          <input
            type='search'
            name='search'
            defaultValue={query}
            placeholder='商品名で検索...'
            aria-label='商品検索'
            className='w-full h-12 px-4 pr-28 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
          />
          <div className='absolute inset-y-0 right-2 flex items-center gap-2'>
            <select
              name='sort'
              defaultValue={sort}
              aria-label='並び替え'
              className='h-9 px-2 rounded-md border border-gray-300 text-sm bg-white'
            >
              <option value='new'>新着順</option>
              <option value='price-asc'>価格が安い順</option>
              <option value='price-desc'>価格が高い順</option>
              <option value='cost-asc'>1日あたりが安い順</option>
              <option value='cost-desc'>1日あたりが高い順</option>
              <option value='name-asc'>名前順</option>
            </select>
            <button
              type='submit'
              className='h-9 px-4 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700'
            >
              検索
            </button>
          </div>
        </div>
        {query && (
          <Link
            className='text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 ease-out'
            href='/products'
            aria-label='検索条件をクリア'
          >
            クリア
          </Link>
        )}
      </form>

      {sorted.length === 0 ? (
        <div className='text-center py-16 text-gray-500'>
          表示できる商品がありません
          <div className='mt-4'>
            <a href='/' className='btn-secondary'>
              ホームに戻る
            </a>
          </div>
        </div>
      ) : (
        <ul
          className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          role='list'
        >
          {sorted.map(p => (
            <li key={p.slug.current} role='listitem'>
              <Link
                href={`/products/${p.slug.current}`}
                className='card p-6 hover:shadow-soft block focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-xl'
              >
                {/* Image / placeholder */}
                <div className='mb-4'>
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt={p.imageAlt || p.name}
                      width={640}
                      height={256}
                      className='w-full h-40 object-cover rounded-lg border border-gray-100'
                      sizes='(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
                      priority={false}
                    />
                  ) : (
                    <div className='w-full h-40 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl'>
                      💊
                    </div>
                  )}
                </div>
                <div className='flex items-start justify-between gap-3 mb-3'>
                  <h2
                    className='text-lg font-semibold text-gray-900'
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {p.name}
                  </h2>
                  <span className='text-primary-700 font-bold whitespace-nowrap'>
                    <ClientPrice amount={p.priceJPY} />
                  </span>
                </div>
                <div className='flex items-center gap-3 text-sm text-gray-600'>
                  <span className='inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md'>
                    {p.servingsPerContainer}回分
                  </span>
                  <span className='inline-flex items-center gap-1 bg-blue-100 text-primary-800 px-2 py-1 rounded-md'>
                    1日{p.servingsPerDay}回
                  </span>
                </div>
                {p.costPerDay > 0 && (
                  <div className='mt-3 text-sm'>
                    <span className='text-gray-500 mr-2'>実効コスト/日</span>
                    <span className='font-semibold text-secondary-700'>
                      <ClientPrice amount={p.costPerDay} />
                    </span>
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className='mt-10'>
        <Link href='/' className='btn-secondary transition-all duration-200 ease-out'>
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}
