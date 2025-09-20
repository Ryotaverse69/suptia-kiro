import SearchPageClient, { type ClientSearchPayload } from './SearchPageClient';
import {
  generateRecommendations,
  type UserContext,
} from '@/lib/ai-recommendations';
import {
  mockSearchResults,
  searchProducts,
  type SearchFiltersInput,
  type SearchProductsResult,
} from '@/lib/search';
import type { Metadata } from 'next';
import Script from 'next/script';
import { buildCanonicalUrl, buildItemListJsonLd } from '@/lib/utils/seo';
import { z } from 'zod';

export const revalidate = 180;

const searchSchema = z.object({
  q: z.string().optional(),
  goal: z.union([z.string(), z.array(z.string())]).optional(),
  ingredient: z.union([z.string(), z.array(z.string())]).optional(),
  category: z.union([z.string(), z.array(z.string())]).optional(),
  brand: z.union([z.string(), z.array(z.string())]).optional(),
  price_min: z.string().optional(),
  price_max: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  rating: z.string().optional(),
  sort: z.string().optional(),
  page: z.string().optional(),
  page_size: z.string().optional(),
  stock: z.string().optional(),
  sale: z.string().optional(),
});

function toArray(value: string | string[] | undefined): string[] | undefined {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  return undefined;
}

function parseFilters(raw: { [key: string]: string | string[] | undefined }): {
  query: string;
  filters: SearchFiltersInput;
} {
  const parsed = searchSchema.safeParse(
    Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, value]))
  );

  const data = parsed.success ? parsed.data : {};
  const query = typeof data.q === 'string' ? data.q.trim() : '';

  const toNumber = (value?: string | null) => {
    if (!value) return undefined;
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : undefined;
  };

  const filters: SearchFiltersInput = {
    searchTerm: query,
    goals: toArray(data.goal),
    ingredients: toArray(data.ingredient),
    categories: toArray(data.category),
    brands: toArray(data.brand),
    minPrice: toNumber(data.price_min ?? data.minPrice),
    maxPrice: toNumber(data.price_max ?? data.maxPrice),
    rating: toNumber(data.rating),
    sort: data.sort as SearchFiltersInput['sort'],
    page: toNumber(data.page),
    pageSize: toNumber(data.page_size),
    inStockOnly: data.stock === 'in',
    onSale: data.sale === 'true',
  };

  return { query, filters };
}

export default async function SearchPage({
  searchParams = {},
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { query, filters } = parseFilters(searchParams);

  let payload: SearchProductsResult;
  try {
    payload = await searchProducts(filters);
    if (payload.total === 0) {
      payload = {
        items: mockSearchResults,
        total: mockSearchResults.length,
        page: 1,
        pageSize: mockSearchResults.length,
        facets: {
          categories: [],
          brands: [],
          ingredients: [],
          goals: [],
          priceRange: { min: 0, max: 0 },
        },
      };
    }
  } catch (error) {
    console.error('Failed to load search results from Sanity', error);
    payload = {
      items: mockSearchResults,
      total: mockSearchResults.length,
      page: 1,
      pageSize: mockSearchResults.length,
      facets: {
        categories: [],
        brands: [],
        ingredients: [],
        goals: [],
        priceRange: { min: 0, max: 0 },
      },
    };
  }

  let aiConditions: string[] | undefined;
  try {
    const user: UserContext | undefined = undefined;
    const recommendations = generateRecommendations(query || '', user, 3);
    if (recommendations.length > 0) {
      const top = recommendations[0];
      const conditions: string[] = [];
      if (top.tags.length) conditions.push(top.tags[0]);
      if (top.priceRange)
        conditions.push(`¥${top.priceRange[0]}〜¥${top.priceRange[1]}`);
      aiConditions = conditions.length ? conditions : undefined;
    }
  } catch {
    aiConditions = undefined;
  }

  const canonicalUrl = buildCanonicalUrl(
    `/search${query ? `?q=${encodeURIComponent(query)}` : ''}`
  );

  const structuredData = buildItemListJsonLd({
    name: query ? `${query} のサプリメント一覧` : 'サプリメント検索結果一覧',
    description: query
      ? `${query} に関連するサプリメントの横断比較結果`
      : '人気サプリメントの価格・成分・評価を横断比較',
    items: payload.items.slice(0, 10).map((product, index) => ({
      id: product.id,
      name: product.name,
      url: `/products/${encodeURIComponent(product.id)}`,
      brand: product.brand,
      position: index + 1,
      price: product.priceRange[0],
      priceHigh: product.priceRange[1],
      priceCurrency: 'JPY',
    })),
  });

  const clientPayload: ClientSearchPayload = {
    initialQuery: query,
    initialFilters: filters,
    initialData: payload,
    aiConditions,
  };

  return (
    <>
      <Script id='search-results-jsonld' type='application/ld+json'>
        {JSON.stringify(structuredData)}
      </Script>
      <SearchPageClient payload={clientPayload} />
    </>
  );
}

export async function generateMetadata({
  searchParams = {},
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const queryParam =
    typeof searchParams?.q === 'string' ? searchParams.q.trim() : '';
  const canonicalUrl = buildCanonicalUrl(
    `/search${queryParam ? `?q=${encodeURIComponent(queryParam)}` : ''}`
  );
  const title = queryParam
    ? `${queryParam} のサプリメント価格比較 - サプティア`
    : 'サプリメント価格比較検索 - サプティア';
  const description = queryParam
    ? `${queryParam} サプリメントを複数サイトから比較。価格・成分・レビューを一目で確認できます。`
    : '人気サプリメントを価格・成分で横断検索。100以上のECサイトから最安値を比較できます。';

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
