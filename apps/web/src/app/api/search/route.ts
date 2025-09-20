import { NextRequest, NextResponse } from 'next/server';

import {
  mockSearchResults,
  searchProducts,
  type SearchFiltersInput,
} from '@/lib/search';

export const revalidate = 120;

function parseNumber(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q')?.trim() ?? '';
  const categories = searchParams.getAll('category');
  const brands = searchParams.getAll('brand');
  const goals = searchParams.getAll('goal');
  const ingredients = searchParams.getAll('ingredient');
  const rating = parseNumber(searchParams.get('rating'), 0);
  const minPrice = parseNumber(
    searchParams.get('price_min'),
    parseNumber(searchParams.get('minPrice'), 0)
  );
  const maxPrice = parseNumber(
    searchParams.get('price_max'),
    parseNumber(searchParams.get('maxPrice'), Number.MAX_SAFE_INTEGER)
  );
  const page = parseNumber(searchParams.get('page'), 1);
  const pageSize = parseNumber(searchParams.get('page_size'), 20);
  const inStock = searchParams.get('stock') === 'in';
  const sale = searchParams.get('sale') === 'true';
  const sort =
    (searchParams.get('sort') as SearchFiltersInput['sort']) ||
    'popularity_desc';

  const filters: SearchFiltersInput = {
    searchTerm: q,
    categories: categories.length > 0 ? categories : undefined,
    brands: brands.length > 0 ? brands : undefined,
    goals: goals.length > 0 ? goals : undefined,
    ingredients: ingredients.length > 0 ? ingredients : undefined,
    rating: rating > 0 ? rating : undefined,
    minPrice,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    inStockOnly: inStock,
    onSale: sale,
    sort,
    page,
    pageSize,
  };

  try {
    const results = await searchProducts(filters);
    const response = NextResponse.json({
      results: results.items,
      total: results.total,
      page: results.page,
      pageSize: results.pageSize,
      facets: results.facets,
    });
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=120, stale-while-revalidate=300'
    );
    return response;
  } catch (error) {
    console.error('Failed to fetch search results', error);
    return NextResponse.json(
      {
        results: mockSearchResults,
        total: mockSearchResults.length,
        page: 1,
        pageSize: mockSearchResults.length,
        facets: {
          categories: [],
          brands: [],
          ingredients: [],
          priceRange: { min: 0, max: 0 },
        },
        fallback: true,
      },
      { status: 200 }
    );
  }
}
