import { getSiteUrl } from '@/lib/runtimeConfig';

export interface BreadcrumbEntry {
  name: string;
  url: string;
}

export interface ItemListEntry {
  id: string;
  name: string;
  url: string;
  brand?: string;
  position?: number;
  price?: number;
  priceHigh?: number;
  priceCurrency?: string;
}

export interface ProductJsonLdInput {
  id: string;
  name: string;
  description?: string;
  url?: string;
  image?: string;
  brand?: string;
  price: number;
  priceCurrency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  ratingValue?: number;
  reviewCount?: number;
}

function absoluteUrl(path: string): string {
  if (!path) {
    return getSiteUrl();
  }
  const siteUrl = getSiteUrl();
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildCanonicalUrl(pathname?: string): string {
  return absoluteUrl(pathname ?? '');
}

export function buildBreadcrumbJsonLd(items: BreadcrumbEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

export function buildItemListJsonLd({
  name,
  description,
  items,
}: {
  name: string;
  description?: string;
  items: ItemListEntry[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: item.position ?? index + 1,
      name: item.name,
      url: absoluteUrl(item.url),
      item: {
        '@type': 'Product',
        '@id': item.id,
        name: item.name,
        brand: item.brand,
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: item.priceCurrency ?? 'JPY',
          lowPrice: item.price,
          highPrice: item.priceHigh ?? item.price,
        },
      },
    })),
  };
}

export function buildProductJsonLd(product: ProductJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': absoluteUrl(product.url ?? `/products/${product.id}`),
    name: product.name,
    description: product.description,
    image:
      product.image ?? `${getSiteUrl()}/placeholders/product-placeholder.svg`,
    brand: product.brand
      ? {
          '@type': 'Brand',
          name: product.brand,
        }
      : undefined,
    offers: {
      '@type': 'Offer',
      price: Number(product.price.toFixed(0)),
      priceCurrency: product.priceCurrency ?? 'JPY',
      availability: `https://schema.org/${product.availability ?? 'InStock'}`,
      url: absoluteUrl(product.url ?? `/products/${product.id}`),
    },
    aggregateRating:
      product.ratingValue && product.reviewCount
        ? {
            '@type': 'AggregateRating',
            ratingValue: Number(product.ratingValue.toFixed(1)),
            reviewCount: Math.round(product.reviewCount),
          }
        : undefined,
  };
}

export function buildOgImageUrl(path: string): string {
  return absoluteUrl(path);
}
