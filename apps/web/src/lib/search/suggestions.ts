import {
  fetchIngredientsForSuggestions,
  fetchProductsForSearch,
} from '@/lib/sanity/queries';
import type {
  SanityIngredientDocument,
  SanityProductDocument,
} from '@/lib/sanity/types';

export type SearchSuggestionType =
  | 'product'
  | 'ingredient'
  | 'goal'
  | 'brand'
  | 'category';

export interface SearchSuggestion {
  id: string;
  type: SearchSuggestionType;
  label: string;
  context?: string;
  score: number;
}

const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

let suggestionIndexCache: {
  expires: number;
  products: SanityProductDocument[];
  ingredients: SanityIngredientDocument[];
} | null = null;

const FALLBACK_TRENDING: SearchSuggestion[] = [
  {
    id: 'trend-immune',
    type: 'goal',
    label: '免疫ケア',
    context: '健康目標',
    score: 1,
  },
  {
    id: 'trend-sleep',
    type: 'goal',
    label: '睡眠サポート',
    context: '健康目標',
    score: 1,
  },
  {
    id: 'trend-vitamin-c',
    type: 'ingredient',
    label: 'ビタミンC',
    context: '美容・免疫サポート',
    score: 1,
  },
];

function normalise(value: string): string {
  return value.normalize('NFKC').toLowerCase();
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

async function loadSuggestionIndex() {
  const now = Date.now();
  if (suggestionIndexCache && suggestionIndexCache.expires > now) {
    return suggestionIndexCache;
  }

  const [products, ingredients] = await Promise.all([
    fetchProductsForSearch(),
    fetchIngredientsForSuggestions(),
  ]);

  suggestionIndexCache = {
    expires: now + CACHE_TTL_MS,
    products,
    ingredients,
  };

  return suggestionIndexCache;
}

function productToSuggestions(doc: SanityProductDocument): SearchSuggestion[] {
  const suggestions: SearchSuggestion[] = [];
  if (doc.name) {
    suggestions.push({
      id: `product:${doc._id}`,
      type: 'product',
      label: doc.name,
      context: doc.brand?.name ?? doc.category?.name,
      score: Math.max(1, (doc.rating ?? 4) * (doc.reviewCount ?? 120)),
    });
  }

  if (doc.brand?.name) {
    suggestions.push({
      id: `brand:${doc.brand._id ?? doc.brand.name}`,
      type: 'brand',
      label: doc.brand.name,
      context: doc.category?.name ?? 'ブランド',
      score: (doc.reviewCount ?? 0) + 50,
    });
  }

  (doc.targetGoals ?? []).forEach(goal => {
    if (!goal) return;
    suggestions.push({
      id: `goal:${goal}`,
      type: 'goal',
      label: goal,
      context: '健康目標',
      score: 200,
    });
  });

  normaliseMainIngredients(doc).forEach(ingredient => {
    suggestions.push({
      id: `ingredient:${ingredient}`,
      type: 'ingredient',
      label: ingredient,
      context: doc.brand?.name ?? doc.category?.name,
      score: 140,
    });
  });

  if (doc.category?.name) {
    suggestions.push({
      id: `category:${doc.category.slug ?? doc.category.name}`,
      type: 'category',
      label: doc.category.name,
      context: 'カテゴリ',
      score: (doc.reviewCount ?? 0) + 80,
    });
  }

  return suggestions;
}

function ingredientToSuggestion(
  doc: SanityIngredientDocument
): SearchSuggestion {
  return {
    id: `ingredient-doc:${doc._id}`,
    type: 'ingredient',
    label: doc.name,
    context: doc.category ?? '成分',
    score: (doc.popularityScore ?? 0) + 100,
  };
}

function rankSuggestions(candidates: SearchSuggestion[], limit: number) {
  const deduped = new Map<string, SearchSuggestion>();
  candidates.forEach(candidate => {
    const key = `${candidate.type}:${candidate.label}`;
    const existing = deduped.get(key);
    if (!existing || existing.score < candidate.score) {
      deduped.set(key, candidate);
    }
  });
  return Array.from(deduped.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function getSearchSuggestions(
  query: string,
  limit = 8
): Promise<SearchSuggestion[]> {
  const trimmed = query.trim();
  try {
    const { products, ingredients } = await loadSuggestionIndex();
    const candidates = [
      ...products.flatMap(productToSuggestions),
      ...ingredients.map(ingredientToSuggestion),
    ];

    if (!trimmed) {
      const trending = rankSuggestions(candidates, limit);
      return trending.length > 0 ? trending : FALLBACK_TRENDING.slice(0, limit);
    }

    const loweredQuery = normalise(trimmed);
    const filtered = candidates.filter(candidate => {
      const label = normalise(candidate.label);
      const context = candidate.context ? normalise(candidate.context) : '';
      return (
        label.includes(loweredQuery) ||
        (context && context.includes(loweredQuery))
      );
    });

    const ranked = rankSuggestions(filtered, limit);
    if (ranked.length > 0) {
      return ranked;
    }

    return FALLBACK_TRENDING.filter(item =>
      normalise(item.label).includes(loweredQuery)
    ).slice(0, limit);
  } catch (error) {
    console.error('Failed to load search suggestions', error);
    if (!trimmed) {
      return FALLBACK_TRENDING.slice(0, limit);
    }
    return FALLBACK_TRENDING.filter(item =>
      normalise(item.label).includes(normalise(trimmed))
    ).slice(0, limit);
  }
}

export const __internal = {
  clearCache() {
    suggestionIndexCache = null;
  },
};
