export interface SanityPriceEntry {
  store?: string;
  storeUrl?: string;
  price?: number;
  currency?: 'JPY' | 'USD';
  inStock?: boolean;
  onSale?: boolean;
  salePrice?: number;
  lastUpdated?: string;
}

export interface SanityProductDocument {
  _id: string;
  name: string;
  slug?: string;
  brand?: {
    _id?: string;
    name?: string;
    slug?: string;
  } | null;
  category?: {
    name?: string;
    slug?: string;
  } | null;
  description?: string;
  image?: string | null;
  images?: Array<{ url?: string } & Record<string, unknown>> | null;
  prices?: SanityPriceEntry[];
  priceJPY?: number | null;
  servingsPerContainer?: number | null;
  servingsPerDay?: number | null;
  thirdPartyTested?: boolean | null;
  form?: string | null;
  ingredients?: Array<{
    name?: string;
    slug?: string;
  }> | null;
  mainIngredients?: string[] | null;
  targetGoals?: string[] | null;
  primaryEffect?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  evidenceLevel?: 'A' | 'B' | 'C' | null;
  safetyRating?: 'high' | 'medium' | 'low' | null;
  _updatedAt?: string;
}

export interface SanityIngredientDocument {
  _id: string;
  name: string;
  slug?: string;
  category?: string;
  synonyms?: string[];
  tags?: string[];
  evidenceLevel?: 'A' | 'B' | 'C';
  popularityScore?: number;
}

export interface SanityIngredientDetail {
  _id: string;
  overview?: string;
  tldr?: string;
  benefits?: string[];
  safetyNotes?: string[];
  evidenceLevel?: 'A' | 'B' | 'C';
  evidenceSummary?: Array<{
    title?: string;
    level?: 'A' | 'B' | 'C';
    description?: string;
  }>;
  recommendedDosage?: {
    amount?: number;
    unit?: string;
    frequency?: string;
  } | null;
  representativeProducts?: Array<{
    _id?: string;
    name?: string;
    slug?: string;
    brand?: { name?: string };
    image?: string;
    priceJPY?: number;
  }>;
  seoTitle?: string;
  seoDescription?: string;
}
