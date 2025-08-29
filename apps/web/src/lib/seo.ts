import { Metadata } from "next";
import { getSiteUrl } from "./runtimeConfig";
import { generateCanonical, cleanUrl } from "./seo/canonical";
import { type ProductSEOData } from "./seo/json-ld";

// Base SEO configuration
const SITE_NAME = "サプティア";
const SITE_DESCRIPTION = "安全 × 価格 × 説明可能性のサプリ意思決定エンジン";

export interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
  keywords?: string[];
}

export function generateMetadata({
  title,
  description = SITE_DESCRIPTION,
  canonical,
  ogImage,
  noIndex = false,
  keywords = [],
}: SEOProps = {}): Metadata {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const siteUrl = getSiteUrl();
  // Use canonical URL generation with UTM parameter cleaning (要件4.3準拠)
  const canonicalUrl = canonical ? generateCanonical(canonical) : siteUrl;
  const imageUrl = ogImage || `${siteUrl}/og-default.jpg`;

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(", "),
    alternates: {
      canonical: canonicalUrl,
    },
    robots: noIndex ? "noindex,nofollow" : "index,follow",

    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title || SITE_NAME,
        },
      ],
      locale: "ja_JP",
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
    },
  };
}

// Product-specific SEO (type imported from json-ld module)

export function generateProductMetadata(product: ProductSEOData): Metadata {
  const title = `${product.name} - ${product.brand}`;
  const description =
    product.description ||
    `${product.brand}の${product.name}。価格: ¥${product.priceJPY.toLocaleString()}。詳細な価格分析と成分情報をご覧いただけます。`;

  return generateMetadata({
    title,
    description,
    canonical: `/products/${product.slug}`, // generateCanonical will be used internally
    keywords: [
      product.name,
      product.brand,
      "サプリメント",
      "栄養補助食品",
      "価格比較",
      "コスト分析",
    ],
  });
}

// JSON-LD functions are now imported from ./seo/json-ld module

// Re-export canonical utilities from dedicated module
export { 
  cleanUrl, 
  generateCanonical, 
  generateCanonicalFromUrl,
  isValidCanonicalUrl,
  extractPathFromCanonical 
} from "./seo/canonical";

// Re-export JSON-LD utilities from dedicated module
export {
  generateProductJsonLd,
  generateBreadcrumbJsonLd,
  generateWebsiteJsonLd,
  generateOrganizationJsonLd,
  type ProductSEOData,
  type BreadcrumbItem,
  type ProductJsonLd,
  type BreadcrumbJsonLd,
  type WebsiteJsonLd,
  type OrganizationJsonLd
} from "./seo/json-ld";

// Font preloading utilities
export function getFontPreloadLinks() {
  return [
    {
      rel: "preload",
      href: "/fonts/inter-var.woff2",
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous",
    },
  ];
}
