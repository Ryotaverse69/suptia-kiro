import { Product } from "../compare/types";

/**
 * Props for CompareItemListJsonLd component
 */
export interface CompareItemListJsonLdProps {
  /** Array of products being compared (max 3) */
  products: Product[];
  /** Page URL where the comparison is displayed */
  pageUrl: string;
  /** Title for the ItemList (optional) */
  title?: string;
  /** Description for the ItemList (optional) */
  description?: string;
  /** Currency code for prices (default: JPY) */
  currency?: string;
}

/**
 * ItemList JSON-LD schema interface for type safety
 */
export interface CompareItemList {
  "@context": "https://schema.org";
  "@type": "ItemList";
  name: string;
  description: string;
  numberOfItems: number;
  url: string;
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    url: string;
    item: {
      "@type": "Product";
      name: string;
      url: string;
      offers?: {
        "@type": "Offer";
        price: number;
        priceCurrency: string;
        availability: string;
      };
    };
  }>;
}

/**
 * Validates ItemList JSON-LD structure for schema.org compliance
 */
export function validateItemList(itemList: CompareItemList): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields validation
  if (!itemList["@context"] || itemList["@context"] !== "https://schema.org") {
    errors.push('@context must be "https://schema.org"');
  }

  if (!itemList["@type"] || itemList["@type"] !== "ItemList") {
    errors.push('@type must be "ItemList"');
  }

  if (!itemList.name || typeof itemList.name !== "string") {
    errors.push("name is required and must be a string");
  }

  if (!itemList.description || typeof itemList.description !== "string") {
    errors.push("description is required and must be a string");
  }

  if (
    typeof itemList.numberOfItems !== "number" ||
    itemList.numberOfItems < 0
  ) {
    errors.push("numberOfItems must be a non-negative number");
  }

  if (!itemList.url || typeof itemList.url !== "string") {
    errors.push("url is required and must be a string");
  }

  // ItemListElement validation
  if (!Array.isArray(itemList.itemListElement)) {
    errors.push("itemListElement must be an array");
  } else {
    itemList.itemListElement.forEach((item, index) => {
      if (item["@type"] !== "ListItem") {
        errors.push(`itemListElement[${index}] @type must be "ListItem"`);
      }

      if (typeof item.position !== "number" || item.position < 1) {
        errors.push(
          `itemListElement[${index}] position must be a positive number`,
        );
      }

      if (!item.name || typeof item.name !== "string") {
        errors.push(
          `itemListElement[${index}] name is required and must be a string`,
        );
      }

      if (!item.url || typeof item.url !== "string") {
        errors.push(
          `itemListElement[${index}] url is required and must be a string`,
        );
      }

      // Product validation
      if (!item.item || item.item["@type"] !== "Product") {
        errors.push(`itemListElement[${index}] item @type must be "Product"`);
      } else {
        if (!item.item.name || typeof item.item.name !== "string") {
          errors.push(
            `itemListElement[${index}] item name is required and must be a string`,
          );
        }

        if (!item.item.url || typeof item.item.url !== "string") {
          errors.push(
            `itemListElement[${index}] item url is required and must be a string`,
          );
        }

        // Offer validation (optional)
        if (item.item.offers) {
          if (item.item.offers["@type"] !== "Offer") {
            errors.push(
              `itemListElement[${index}] item offers @type must be "Offer"`,
            );
          }

          if (
            typeof item.item.offers.price !== "number" ||
            item.item.offers.price < 0
          ) {
            errors.push(
              `itemListElement[${index}] item offers price must be a non-negative number`,
            );
          }

          if (
            !item.item.offers.priceCurrency ||
            typeof item.item.offers.priceCurrency !== "string"
          ) {
            errors.push(
              `itemListElement[${index}] item offers priceCurrency is required and must be a string`,
            );
          }

          if (
            !item.item.offers.availability ||
            typeof item.item.offers.availability !== "string"
          ) {
            errors.push(
              `itemListElement[${index}] item offers availability is required and must be a string`,
            );
          }
        }
      }
    });
  }

  // Cross-validation
  if (itemList.numberOfItems !== itemList.itemListElement?.length) {
    errors.push("numberOfItems must match itemListElement array length");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Creates a safe ItemList with fallback values
 */
export function createSafeItemList(
  products: Product[],
  pageUrl: string,
  title?: string,
  description?: string,
  currency = "JPY",
): CompareItemList {
  // Limit to maximum 3 products
  const limitedProducts = products.slice(0, 3);

  // Generate default title and description
  const defaultTitle =
    title || `製品比較: ${limitedProducts.map((p) => p.name).join(" vs ")}`;
  const defaultDescription =
    description ||
    `${limitedProducts.length}製品の価格・スコア・機能を比較。${limitedProducts.map((p) => p.name).join("、")}の詳細比較情報。`;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: defaultTitle,
    description: defaultDescription,
    numberOfItems: limitedProducts.length,
    url: pageUrl,
    itemListElement: limitedProducts.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: product.name,
      url: product.url,
      item: {
        "@type": "Product",
        name: product.name,
        url: product.url,
        offers: {
          "@type": "Offer",
          price: product.price,
          priceCurrency: currency,
          availability: "https://schema.org/InStock",
        },
      },
    })),
  };
}

/**
 * CompareItemListJsonLd component for product comparison pages
 * Generates schema.org compliant ItemList JSON-LD for SEO
 */
export function CompareItemListJsonLd({
  products,
  pageUrl,
  title,
  description,
  currency = "JPY",
}: CompareItemListJsonLdProps) {
  // Don't render if no products
  if (!products || products.length === 0) {
    return null;
  }

  // Create ItemList structure
  const itemList = createSafeItemList(
    products,
    pageUrl,
    title,
    description,
    currency,
  );

  // Validate structure
  const validation = validateItemList(itemList);
  if (!validation.isValid) {
    console.warn("CompareItemListJsonLd validation failed:", validation.errors);
    // Still render but log warnings
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(itemList, null, 0),
      }}
    />
  );
}

export default CompareItemListJsonLd;
