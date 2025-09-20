import Link from 'next/link';
import Script from 'next/script';
import type { Metadata } from 'next';

import { ComparePageClient } from './ComparePageClient';
import { mockSearchResults, searchProducts } from '@/lib/search';
import type { ResultProduct } from '@/components/search/ResultCard';
import type { ComparisonProduct } from '@/components/compare/ComparisonTable';
import { getSiteUrl } from '@/lib/runtimeConfig';

export const revalidate = 180;

function formatVolume(product: ResultProduct) {
  const servingsPerContainer = product.servingsPerContainer ?? 60;
  const servingsPerDay = product.servingsPerDay ?? 2;
  return `${servingsPerContainer}回分 / 1日${servingsPerDay}回`;
}

function calculatePricePerDay(product: ResultProduct) {
  const price = product.priceRange[0];
  const servingsPerContainer = product.servingsPerContainer ?? 60;
  const servingsPerDay = product.servingsPerDay ?? 2;
  const totalDays = Math.max(
    1,
    Math.round(servingsPerContainer / Math.max(1, servingsPerDay))
  );
  return Math.max(0, Math.round(price / totalDays));
}

function toComparisonProduct(product: ResultProduct): ComparisonProduct {
  const lowestPrice = product.priceRange[0];
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    rating: product.rating,
    reviewCount: product.reviewCount,
    lowestPrice,
    pricePerDay: calculatePricePerDay(product),
    volume: formatVolume(product),
    ingredients: product.mainIngredients?.slice(0, 5) ?? [],
    testing: product.thirdPartyTested ? '第三者検査済み' : '検査情報なし',
    imageUrl: product.imageUrl,
    sellers: product.sellers.map(seller => ({ ...seller })),
  };
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const idsParam =
    typeof searchParams?.ids === 'string' ? searchParams?.ids : '';
  const requestedIds = idsParam
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);

  let results: ResultProduct[] = [];
  try {
    const response = await searchProducts({ pageSize: 60 });
    results = response.items;
  } catch (error) {
    console.error('Failed to fetch comparison data from Sanity', error);
    results = mockSearchResults;
  }

  if (results.length === 0) {
    results = mockSearchResults;
  }

  const lookup = new Map(results.map(product => [product.id, product]));
  const selectedProducts: ResultProduct[] = [];

  requestedIds.forEach(id => {
    const product = lookup.get(id);
    if (product) {
      selectedProducts.push(product);
    }
  });

  if (selectedProducts.length === 0) {
    selectedProducts.push(...results.slice(0, Math.min(4, results.length)));
  }

  const comparisonProducts = selectedProducts.map(toComparisonProduct);

  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/compare${idsParam ? `?ids=${encodeURIComponent(idsParam)}` : ''}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ProductCollection',
    name: 'サプリメント価格比較',
    url: canonicalUrl,
    numberOfItems: comparisonProducts.length,
    hasProduct: comparisonProducts.map(product => ({
      '@type': 'Product',
      name: product.name,
      brand: product.brand,
      category: product.category,
      offers: product.sellers.map(seller => ({
        '@type': 'Offer',
        priceCurrency: 'JPY',
        price: seller.price,
        url: seller.url,
        availability: 'https://schema.org/InStock',
      })),
    })),
  };

  return (
    <div className='bg-surface-subtle'>
      <section className='bg-gradient-to-r from-trivago-blue to-trivago-teal text-white'>
        <div className='mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-4 py-16 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-8'>
          <div>
            <h1 className='text-3xl font-semibold sm:text-4xl'>
              サプリメント比較
            </h1>
            <p className='mt-3 max-w-xl text-sm text-white/85'>
              人気のサプリメントを価格・成分・検査情報まで横断比較。トリバゴと同じ横スクロールUIで一目で違いが分かります。
            </p>
          </div>
          <div className='rounded-[12px] border border-white/30 bg-white/10 px-4 py-3 text-sm text-white/90 backdrop-blur'>
            最大4件まで商品を比較できます
          </div>
        </div>
      </section>

      <section className='mx-auto w-full max-w-[1100px] px-4 pb-16 sm:px-6 lg:px-8'>
        <div className='mt-[-40px] rounded-[20px] border border-[#e0e0e0] bg-white p-6 shadow-trivago-card'>
          <div className='flex flex-col gap-3 border-b border-[#e0e0e0] pb-6 md:flex-row md:items-center md:justify-between'>
            <div>
              <h2 className='text-xl font-semibold text-[#1f242f]'>
                比較テーブル
              </h2>
              <p className='mt-1 text-sm text-neutral-600'>
                価格・成分・検査情報を横並びで確認できます
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <button className='rounded-pill border border-white bg-white px-4 py-2 text-sm font-semibold text-trivago-blue shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition hover:bg-trivago-blue hover:text-white'>
                CSVでエクスポート
              </button>
              <Link
                href='/search'
                className='rounded-pill border border-white bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition hover:bg-neutral-100'
              >
                商品を追加する
              </Link>
            </div>
          </div>
          <Script id='compare-products-jsonld' type='application/ld+json'>
            {JSON.stringify(structuredData)}
          </Script>
          <ComparePageClient initialProducts={comparisonProducts} />
        </div>
      </section>
    </div>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const idsParam =
    typeof searchParams?.ids === 'string' ? searchParams?.ids : '';
  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/compare${idsParam ? `?ids=${encodeURIComponent(idsParam)}` : ''}`;
  const title = idsParam
    ? '選択したサプリメント比較 - サプティア'
    : 'サプリメント比較テーブル - サプティア';
  const description =
    '人気サプリメントを横並びで比較。価格・成分・検査情報・レビューをまとめてチェックできます。';

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
    },
  };
}
