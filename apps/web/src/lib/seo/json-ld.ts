import { getSiteUrl } from "../runtimeConfig";

// JSON-LD structured data types
export interface ProductJsonLd {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  brand: {
    "@type": "Brand";
    name: string;
  };
  offers: {
    "@type": "Offer";
    price: number;
    priceCurrency: "JPY";
    availability: string;
    url: string;
  };
  url: string;
  image?: string;
  description?: string;
}

export interface BreadcrumbJsonLd {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

export interface WebsiteJsonLd {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  description: string;
  inLanguage: "ja";
}

export interface OrganizationJsonLd {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  description: string;
}

// Product JSON-LD generator (要件4.1準拠)
export interface ProductSEOData {
  name: string;
  brand: string;
  description?: string;
  priceJPY: number;
  slug: string;
  images?: string[];
}

export function generateProductJsonLd(product: ProductSEOData): ProductJsonLd {
  const siteUrl = getSiteUrl();
  
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    description: product.description || `${product.brand}の${product.name}`,
    offers: {
      "@type": "Offer",
      price: product.priceJPY,
      priceCurrency: "JPY",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/products/${product.slug}`,
    },
    image: product.images?.[0] || `${siteUrl}/product-placeholder.jpg`,
    url: `${siteUrl}/products/${product.slug}`,
  };
}

// BreadcrumbList JSON-LD generator (要件4.4準拠)
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbJsonLd(items: BreadcrumbItem[]): BreadcrumbJsonLd {
  const siteUrl = getSiteUrl();
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.url}`,
    })),
  };
}

// Website JSON-LD generator
export function generateWebsiteJsonLd(): WebsiteJsonLd {
  const siteUrl = getSiteUrl();
  
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "サプティア",
    url: siteUrl,
    description: "安全 × 価格 × 説明可能性のサプリ意思決定エンジン",
    inLanguage: "ja",
  };
}

// Organization JSON-LD generator
export function generateOrganizationJsonLd(): OrganizationJsonLd {
  const siteUrl = getSiteUrl();
  
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "サプティア",
    url: siteUrl,
    description: "安全 × 価格 × 説明可能性のサプリ意思決定エンジン",
  };
}