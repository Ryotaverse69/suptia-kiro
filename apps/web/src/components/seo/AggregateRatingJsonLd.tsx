import { ScoreResult } from "../../lib/scoring";
import {
  calculateAggregateRating,
  AggregateRating,
  validateAggregateRating,
  createSafeAggregateRating,
  DEFAULT_RATING_CONFIG,
} from "../../lib/seo/aggregate-rating";

/**
 * Props for AggregateRatingJsonLd component
 */
export interface AggregateRatingJsonLdProps {
  /** Product ID for identification */
  productId: string;
  /** Product scoring result (0-100 scale) */
  scoreResult?: ScoreResult;
  /** Total score (0-100 scale) - alternative to scoreResult */
  totalScore?: number;
  /** Maximum possible score (default: 100) */
  maxScore?: number;
  /** Number of reviews/evaluations (default: 1) */
  reviewCount?: number;
  /** Custom aggregate rating object */
  customRating?: AggregateRating;
  /** Whether to validate the rating before rendering */
  validate?: boolean;
}

/**
 * AggregateRating JSON-LD component for schema.org compliance
 * Converts product scores to 0-5 scale aggregate ratings
 */
export function AggregateRatingJsonLd({
  productId,
  scoreResult,
  totalScore,
  maxScore = 100,
  reviewCount = 1,
  customRating,
  validate = true,
}: AggregateRatingJsonLdProps) {
  // Generate aggregate rating
  let aggregateRating: AggregateRating;

  if (customRating) {
    // Use custom rating if provided
    aggregateRating = customRating;
  } else if (scoreResult) {
    // Calculate from ScoreResult
    aggregateRating = calculateAggregateRating(scoreResult, reviewCount);
  } else if (typeof totalScore === "number") {
    // Calculate from total score
    const config = { ...DEFAULT_RATING_CONFIG, maxScore };
    const ratingValue = (totalScore / maxScore) * 5;
    aggregateRating = createSafeAggregateRating(ratingValue, reviewCount);
  } else {
    // Fallback: no rating available
    aggregateRating = createSafeAggregateRating(0, 0);
  }

  // Validate rating if requested
  if (validate) {
    const validation = validateAggregateRating(aggregateRating);
    if (!validation.isValid) {
      console.warn(
        `AggregateRating validation failed for product ${productId}:`,
        validation.errors,
      );
      // Use safe fallback
      aggregateRating = createSafeAggregateRating(0, 0);
    }
  }

  // Don't render if no valid rating
  if (aggregateRating.ratingCount === 0) {
    return null;
  }

  // Create JSON-LD script
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    ratingValue: aggregateRating.ratingValue,
    bestRating: aggregateRating.bestRating,
    worstRating: aggregateRating.worstRating,
    ratingCount: aggregateRating.ratingCount,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
      }}
    />
  );
}

/**
 * Enhanced Product JSON-LD component with integrated aggregate rating
 */
export interface EnhancedProductJsonLdProps {
  /** Product information */
  product: {
    name: string;
    brand: string;
    description?: string;
    priceJPY: number;
    slug: string;
    images?: string[];
  };
  /** Product scoring result */
  scoreResult?: ScoreResult;
  /** Number of reviews */
  reviewCount?: number;
  /** Additional offers data */
  offers?: Array<{
    price: number;
    priceCurrency: string;
    availability: string;
    seller?: string;
    url?: string;
  }>;
}

/**
 * Enhanced Product JSON-LD with integrated aggregate rating
 */
export function EnhancedProductJsonLd({
  product,
  scoreResult,
  reviewCount = 1,
  offers = [],
}: EnhancedProductJsonLdProps) {
  // Calculate aggregate rating if score is available
  let aggregateRating: AggregateRating | undefined;

  if (scoreResult && scoreResult.total > 0) {
    aggregateRating = calculateAggregateRating(scoreResult, reviewCount);

    // Validate rating
    const validation = validateAggregateRating(aggregateRating);
    if (!validation.isValid) {
      console.warn(
        `AggregateRating validation failed for product ${product.slug}:`,
        validation.errors,
      );
      aggregateRating = undefined;
    }
  }

  // Build base product JSON-LD
  const productJsonLd: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    description: product.description || `${product.brand}の${product.name}`,
    image: product.images?.[0] || "/product-placeholder.jpg",
    url: `/products/${product.slug}`,
  };

  // Add aggregate rating if available
  if (aggregateRating && aggregateRating.ratingCount > 0) {
    productJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: aggregateRating.ratingValue,
      bestRating: aggregateRating.bestRating,
      worstRating: aggregateRating.worstRating,
      ratingCount: aggregateRating.ratingCount,
    };
  }

  // Add offers
  if (offers.length > 0) {
    productJsonLd.offers = offers.map((offer) => ({
      "@type": "Offer",
      price: offer.price,
      priceCurrency: offer.priceCurrency,
      availability: offer.availability,
      seller: offer.seller
        ? {
            "@type": "Organization",
            name: offer.seller,
          }
        : undefined,
      url: offer.url,
    }));
  } else {
    // Default offer
    productJsonLd.offers = {
      "@type": "Offer",
      price: product.priceJPY,
      priceCurrency: "JPY",
      availability: "https://schema.org/InStock",
      url: `/products/${product.slug}`,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(productJsonLd),
      }}
    />
  );
}

export default AggregateRatingJsonLd;
