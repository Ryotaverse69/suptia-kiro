import type {
  ResultProduct,
  SellerPrice,
} from '@/components/search/ResultCard';
import { convertToJPY } from '@/lib/exchange';
import { fetchProductsForSearch } from '@/lib/sanity/queries';
import type { SanityProductDocument } from '@/lib/sanity/types';

export type SearchSortOption =
  | 'popularity_desc'
  | 'price_asc'
  | 'price_desc'
  | 'rating_desc'
  | 'newest';

export interface SearchFiltersInput {
  searchTerm?: string;
  categories?: string[];
  brands?: string[];
  goals?: string[];
  ingredients?: string[];
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStockOnly?: boolean;
  onSale?: boolean;
  sort?: SearchSortOption;
  page?: number;
  pageSize?: number;
}

export interface SearchFacetEntry {
  value: string;
  count: number;
}

export interface SearchFacets {
  categories: SearchFacetEntry[];
  brands: SearchFacetEntry[];
  ingredients: SearchFacetEntry[];
  goals: SearchFacetEntry[];
  priceRange: { min: number; max: number };
}

export interface SearchProductsResult {
  items: ResultProduct[];
  total: number;
  page: number;
  pageSize: number;
  facets: SearchFacets;
}

const MAX_PAGE_SIZE = 60;
const FALLBACK_PRICE_MAX = 20000;

function fallbackRating(doc: SanityProductDocument): number {
  if (typeof doc.rating === 'number' && !Number.isNaN(doc.rating)) {
    return Math.max(0, Math.min(5, Number(doc.rating.toFixed(1))));
  }
  const formBoost = doc.form === 'capsule' || doc.form === 'softgel' ? 0.1 : 0;
  const ingredientBoost = Math.min(
    0.6,
    (doc.mainIngredients?.length ?? doc.ingredients?.length ?? 0) * 0.08
  );
  const testingBoost = doc.thirdPartyTested ? 0.2 : 0;
  const derived = 4.1 + ingredientBoost + testingBoost + formBoost;
  return Math.max(3.6, Math.min(4.9, Number(derived.toFixed(1))));
}

function fallbackReviewCount(doc: SanityProductDocument): number {
  if (typeof doc.reviewCount === 'number' && !Number.isNaN(doc.reviewCount)) {
    return Math.max(0, Math.round(doc.reviewCount));
  }
  const servingsPerContainer = doc.servingsPerContainer ?? 60;
  const servingsPerDay = Math.max(1, doc.servingsPerDay ?? 2);
  const estimatedCustomers = Math.max(
    48,
    Math.round((servingsPerContainer / servingsPerDay) * 3)
  );
  return estimatedCustomers;
}

function computePopularityScore(rating: number, reviewCount: number): number {
  return Math.round(rating * reviewCount);
}

function normaliseMainIngredients(doc: SanityProductDocument): string[] {
  if (Array.isArray(doc.mainIngredients) && doc.mainIngredients.length > 0) {
    return doc.mainIngredients.filter(Boolean) as string[];
  }
  if (Array.isArray(doc.ingredients)) {
    return doc.ingredients
      .map(entry => entry.name)
      .filter((name): name is string => Boolean(name));
  }
  return [];
}

function buildSellers(doc: SanityProductDocument): SellerPrice[] {
  const sellers: SellerPrice[] = [];
  if (Array.isArray(doc.prices)) {
    doc.prices.forEach(entry => {
      if (entry == null) return;
      const basePrice =
        entry.onSale && entry.salePrice ? entry.salePrice : entry.price;
      if (typeof basePrice !== 'number' || Number.isNaN(basePrice)) return;
      const currency = (entry.currency ?? 'JPY') as 'JPY' | 'USD';
      const converted = convertToJPY(basePrice, currency);
      sellers.push({
        site: entry.store || 'オンラインストア',
        price: Math.round(converted),
        url: entry.storeUrl || '#',
        currency,
      });
    });
  }

  if (
    sellers.length === 0 &&
    typeof doc.priceJPY === 'number' &&
    doc.priceJPY > 0
  ) {
    sellers.push({
      site: doc.brand?.name ? `${doc.brand.name} 公式` : '参考価格',
      price: Math.round(doc.priceJPY),
      url: '#',
      currency: 'JPY',
    });
  }

  if (sellers.length === 0) {
    sellers.push({ site: '価格情報なし', price: 0, url: '#', currency: 'JPY' });
  }

  return sellers;
}

function mapSanityProduct(doc: SanityProductDocument): ResultProduct {
  const sellers = buildSellers(doc);
  const prices = sellers.map(entry => entry.price);
  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);

  const rating = fallbackRating(doc);
  const reviewCount = fallbackReviewCount(doc);

  return {
    id: doc._id,
    name: doc.name,
    brand: doc.brand?.name ?? 'ブランド不明',
    category: doc.category?.name ?? 'サプリメント',
    rating,
    reviewCount,
    priceRange: [lowest, highest],
    sellers,
    mainIngredients: normaliseMainIngredients(doc),
    imageUrl: doc.image ?? '/placeholders/product-placeholder.svg',
    description: doc.description,
    servingsPerContainer: doc.servingsPerContainer ?? undefined,
    servingsPerDay: doc.servingsPerDay ?? undefined,
    thirdPartyTested: Boolean(doc.thirdPartyTested),
    form: doc.form ?? undefined,
    popularityScore: computePopularityScore(rating, reviewCount),
    isInStock: sellers.some(entry => entry.price > 0),
    isOnSale: sellers.some(
      entry => entry.currency === 'JPY' && entry.price < highest
    ),
    updatedAt: doc._updatedAt ? Date.parse(doc._updatedAt) : Date.now(),
    targetGoals: doc.targetGoals ?? [],
  };
}

function buildFacets(products: ResultProduct[]): SearchFacets {
  const categoryMap = new Map<string, number>();
  const brandMap = new Map<string, number>();
  const ingredientMap = new Map<string, number>();
  const goalMap = new Map<string, number>();
  let minPrice = Number.POSITIVE_INFINITY;
  let maxPrice = 0;

  products.forEach(product => {
    categoryMap.set(
      product.category,
      (categoryMap.get(product.category) || 0) + 1
    );
    brandMap.set(product.brand, (brandMap.get(product.brand) || 0) + 1);
    (product.mainIngredients || []).forEach(ingredient => {
      if (!ingredient) return;
      ingredientMap.set(ingredient, (ingredientMap.get(ingredient) || 0) + 1);
    });
    (product.targetGoals || []).forEach(goal => {
      if (!goal) return;
      goalMap.set(goal, (goalMap.get(goal) || 0) + 1);
    });
    const lowest = Math.min(...product.sellers.map(seller => seller.price));
    const highest = Math.max(...product.sellers.map(seller => seller.price));
    minPrice = Math.min(minPrice, lowest);
    maxPrice = Math.max(maxPrice, highest);
  });

  if (!Number.isFinite(minPrice)) {
    minPrice = 0;
  }

  return {
    categories: Array.from(categoryMap.entries()).map(([value, count]) => ({
      value,
      count,
    })),
    brands: Array.from(brandMap.entries()).map(([value, count]) => ({
      value,
      count,
    })),
    ingredients: Array.from(ingredientMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([value, count]) => ({ value, count })),
    goals: Array.from(goalMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, count })),
    priceRange: {
      min: Math.max(0, Math.floor(minPrice)),
      max: Math.max(maxPrice, minPrice > 0 ? maxPrice : FALLBACK_PRICE_MAX),
    },
  };
}

function matchesAny(values: string[] | undefined, filters?: string[]) {
  if (!filters || filters.length === 0) return true;
  if (!values || values.length === 0) return false;
  return values.some(value =>
    filters.some(filter => value.toLowerCase().includes(filter.toLowerCase()))
  );
}

function productMatchesFilters(
  product: ResultProduct,
  filters: SearchFiltersInput,
  normalizedQuery: string
) {
  const lowestPrice = Math.min(...product.sellers.map(seller => seller.price));

  if (normalizedQuery) {
    const haystack =
      `${product.name} ${product.brand} ${product.category} ${(product.mainIngredients || []).join(' ')}`.toLowerCase();
    if (!haystack.includes(normalizedQuery)) {
      return false;
    }
  }

  if (filters.categories?.length) {
    const loweredCategory = product.category.toLowerCase();
    if (
      !filters.categories.some(value =>
        loweredCategory.includes(value.toLowerCase())
      )
    ) {
      return false;
    }
  }

  if (filters.brands?.length) {
    const loweredBrand = product.brand.toLowerCase();
    if (
      !filters.brands.some(value => loweredBrand.includes(value.toLowerCase()))
    ) {
      return false;
    }
  }

  if (!matchesAny(product.mainIngredients, filters.ingredients)) {
    return false;
  }

  if (!matchesAny(product.targetGoals, filters.goals)) {
    return false;
  }

  if (typeof filters.minPrice === 'number' && lowestPrice < filters.minPrice) {
    return false;
  }

  if (typeof filters.maxPrice === 'number' && lowestPrice > filters.maxPrice) {
    return false;
  }

  if (typeof filters.rating === 'number' && product.rating < filters.rating) {
    return false;
  }

  if (filters.inStockOnly && product.isInStock === false) {
    return false;
  }

  if (filters.onSale && !product.isOnSale) {
    return false;
  }

  return true;
}

function sortProducts(
  products: ResultProduct[],
  sort: SearchSortOption | undefined
): ResultProduct[] {
  const items = [...products];
  switch (sort) {
    case 'price_asc':
      return items.sort(
        (a, b) => a.priceRange[0] - b.priceRange[0] || b.rating - a.rating
      );
    case 'price_desc':
      return items.sort(
        (a, b) => b.priceRange[0] - a.priceRange[0] || b.rating - a.rating
      );
    case 'rating_desc':
      return items.sort(
        (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount
      );
    case 'newest':
      return items.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    case 'popularity_desc':
    default:
      return items.sort(
        (a, b) =>
          (b.popularityScore ?? 0) - (a.popularityScore ?? 0) ||
          b.rating - a.rating ||
          a.priceRange[0] - b.priceRange[0]
      );
  }
}

export async function searchProducts(
  filters: SearchFiltersInput = {}
): Promise<SearchProductsResult> {
  const products = await fetchProductsForSearch();
  const mapped = products.map(mapSanityProduct);
  const normalizedQuery = filters.searchTerm?.trim().toLowerCase() ?? '';

  const filtered = mapped.filter(product =>
    productMatchesFilters(product, filters, normalizedQuery)
  );
  const facets = buildFacets(filtered);
  const sorted = sortProducts(filtered, filters.sort);

  const pageSize = Math.max(1, Math.min(filters.pageSize ?? 20, MAX_PAGE_SIZE));
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const requestedPage = Math.max(1, filters.page ?? 1);
  const page = Math.min(requestedPage, totalPages);
  const startIndex = (page - 1) * pageSize;
  const items = sorted.slice(startIndex, startIndex + pageSize);

  return {
    items,
    total: sorted.length,
    page,
    pageSize,
    facets,
  };
}

export const mockSearchResults: ResultProduct[] = [
  {
    id: 'vitamin-d3-2000',
    name: 'ビタミンD3 2000IU ソフトジェル',
    brand: 'Nature Made',
    category: 'ビタミンD',
    rating: 4.7,
    reviewCount: 842,
    priceRange: [1980, 2280],
    sellers: [
      { site: 'Amazon', price: 1980, url: '#', currency: 'JPY' },
      { site: 'iHerb', price: 2040, url: '#', currency: 'JPY' },
      { site: '楽天', price: 2280, url: '#', currency: 'JPY' },
    ],
    mainIngredients: ['ビタミンD3', 'オリーブオイル'],
    imageUrl: '/placeholders/product-placeholder.svg',
    thirdPartyTested: true,
    form: 'softgel',
    servingsPerContainer: 120,
    servingsPerDay: 2,
    popularityScore: 3957,
    isInStock: true,
    isOnSale: true,
    updatedAt: Date.now() - 1000 * 60 * 60 * 12,
    targetGoals: ['免疫ケア', '骨密度ケア'],
  },
  {
    id: 'omega3-softgel',
    name: 'オメガ3 フィッシュオイル 120ソフトジェル',
    brand: 'Now Foods',
    category: 'オメガ3',
    rating: 4.5,
    reviewCount: 654,
    priceRange: [3480, 3980],
    sellers: [
      { site: 'iHerb', price: 3480, url: '#', currency: 'JPY' },
      { site: 'Amazon', price: 3580, url: '#', currency: 'JPY' },
      { site: '楽天', price: 3980, url: '#', currency: 'JPY' },
    ],
    mainIngredients: ['EPA', 'DHA'],
    imageUrl: '/placeholders/product-placeholder.svg',
    thirdPartyTested: true,
    form: 'softgel',
    servingsPerContainer: 120,
    servingsPerDay: 2,
    popularityScore: 2943,
    isInStock: true,
    isOnSale: true,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
    targetGoals: ['心血管サポート', '集中力'],
  },
];

export const __internal = {
  fallbackRating,
  fallbackReviewCount,
  buildSellers,
  productMatchesFilters,
};
