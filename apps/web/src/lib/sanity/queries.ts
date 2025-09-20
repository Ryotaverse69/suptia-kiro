import groq from 'groq';
import imageUrlBuilder from '@sanity/image-url';
import { sanityServer } from '@/lib/sanityServer';
import { sanity } from '@/lib/sanity.client';
import type { SanityProductDocument, SanityIngredientDocument } from './types';

const builder = imageUrlBuilder(sanity);

const PRODUCT_SEARCH_QUERY = groq`
*[_type == "product" && defined(slug.current)]{
  _id,
  name,
  "slug": slug.current,
  "brand": brand->{
    _id,
    name,
    "slug": slug.current
  },
  category->{
    name,
    "slug": slug.current
  },
  description,
  "image": coalesce(image.asset->url, images[0].asset->url),
  images[]{
    "url": asset->url
  },
  prices[]{
    store,
    storeUrl,
    price,
    currency,
    inStock,
    onSale,
    salePrice,
    lastUpdated
  },
  priceJPY,
  servingsPerContainer,
  servingsPerDay,
  thirdPartyTested,
  form,
  ingredients[]{
    "name": ingredient->name,
    "slug": ingredient->slug.current
  },
  mainIngredients[]->name,
  targetGoals,
  primaryEffect,
  rating,
  reviewCount,
  evidenceLevel,
  safetyRating,
  _updatedAt
}`;

const INGREDIENT_SUGGESTION_QUERY = groq`
*[_type == "ingredient" && defined(slug.current)]{
  _id,
  name,
  "slug": slug.current,
  category,
  synonyms,
  tags,
  evidenceLevel,
  popularityScore
}`;

const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes

let productCache: { expires: number; items: SanityProductDocument[] } | null =
  null;
let ingredientCache: {
  expires: number;
  items: SanityIngredientDocument[];
} | null = null;

function buildImageUrl(source?: string | null) {
  if (!source) return undefined;
  try {
    return builder.image(source).width(600).height(400).fit('max').url();
  } catch {
    return source;
  }
}

export async function fetchProductsForSearch(
  force = false
): Promise<SanityProductDocument[]> {
  const now = Date.now();
  if (!force && productCache && productCache.expires > now) {
    return productCache.items;
  }

  try {
    const items =
      await sanityServer.fetch<SanityProductDocument[]>(PRODUCT_SEARCH_QUERY);
    const normalized = items.map(item => ({
      ...item,
      image: buildImageUrl(item.image),
      images:
        item.images?.map(entry => ({
          ...entry,
          url: buildImageUrl(entry.url),
        })) ?? null,
    }));
    productCache = { items: normalized, expires: now + CACHE_TTL_MS };
    return normalized;
  } catch (error) {
    console.error('Failed to fetch products from Sanity', error);
    if (productCache) {
      return productCache.items;
    }
    return [];
  }
}

export async function fetchIngredientsForSuggestions(
  force = false
): Promise<SanityIngredientDocument[]> {
  const now = Date.now();
  if (!force && ingredientCache && ingredientCache.expires > now) {
    return ingredientCache.items;
  }

  try {
    const items = await sanityServer.fetch<SanityIngredientDocument[]>(
      INGREDIENT_SUGGESTION_QUERY
    );
    ingredientCache = { items, expires: now + CACHE_TTL_MS };
    return items;
  } catch (error) {
    console.error('Failed to fetch ingredients from Sanity', error);
    if (ingredientCache) {
      return ingredientCache.items;
    }
    return [];
  }
}

export const __internal = {
  clearCaches() {
    productCache = null;
    ingredientCache = null;
  },
};
