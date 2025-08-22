import type {
  Product,
  SortField,
  SortDirection,
  SortConfig,
} from "@/components/compare/types";

/**
 * Product sorting utilities for comparison table
 */

export interface ProductSorter {
  sortProducts(products: Product[], config: SortConfig): Product[];
  sortByScore(products: Product[], direction: SortDirection): Product[];
  sortByPrice(products: Product[], direction: SortDirection): Product[];
  sortByName(products: Product[], direction: SortDirection): Product[];
  sortByWarnings(products: Product[], direction: SortDirection): Product[];
}

/**
 * Sort products by score (total score)
 */
export function sortByScore(
  products: Product[],
  direction: SortDirection = "desc",
): Product[] {
  return [...products].sort((a, b) => {
    const scoreA = a.totalScore;
    const scoreB = b.totalScore;

    if (direction === "desc") {
      return scoreB - scoreA;
    } else {
      return scoreA - scoreB;
    }
  });
}

/**
 * Sort products by price
 */
export function sortByPrice(
  products: Product[],
  direction: SortDirection = "asc",
): Product[] {
  return [...products].sort((a, b) => {
    const priceA = a.price;
    const priceB = b.price;

    if (direction === "desc") {
      return priceB - priceA;
    } else {
      return priceA - priceB;
    }
  });
}

/**
 * Sort products by name (alphabetical)
 */
export function sortByName(
  products: Product[],
  direction: SortDirection = "asc",
): Product[] {
  return [...products].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();

    if (direction === "desc") {
      return nameB.localeCompare(nameA, "ja");
    } else {
      return nameA.localeCompare(nameB, "ja");
    }
  });
}

/**
 * Sort products by warning count and severity
 */
export function sortByWarnings(
  products: Product[],
  direction: SortDirection = "asc",
): Product[] {
  return [...products].sort((a, b) => {
    // Calculate warning score (count + severity weight)
    const getWarningScore = (product: Product) => {
      const warningCount = product.warnings.length;
      const severitySum = product.warnings.reduce(
        (sum, warning) => sum + warning.severity,
        0,
      );
      const criticalCount = product.warnings.filter(
        (w) => w.type === "critical",
      ).length;

      // Weight: critical warnings count more, then total severity, then total count
      return criticalCount * 100 + severitySum + warningCount;
    };

    const scoreA = getWarningScore(a);
    const scoreB = getWarningScore(b);

    if (direction === "desc") {
      return scoreB - scoreA;
    } else {
      return scoreA - scoreB;
    }
  });
}

/**
 * Main sorting function that delegates to specific sort functions
 */
export function sortProducts(
  products: Product[],
  config: SortConfig,
): Product[] {
  switch (config.field) {
    case "score":
      return sortByScore(products, config.direction);
    case "price":
      return sortByPrice(products, config.direction);
    case "name":
      return sortByName(products, config.direction);
    case "warnings":
      return sortByWarnings(products, config.direction);
    default:
      return products;
  }
}

/**
 * Product sorter implementation
 */
export const productSorter: ProductSorter = {
  sortProducts,
  sortByScore,
  sortByPrice,
  sortByName,
  sortByWarnings,
};

/**
 * Get default sort direction for a field
 */
export function getDefaultSortDirection(field: SortField): SortDirection {
  switch (field) {
    case "score":
      return "desc"; // Higher scores first
    case "price":
      return "asc"; // Lower prices first
    case "name":
      return "asc"; // Alphabetical order
    case "warnings":
      return "asc"; // Fewer warnings first
    default:
      return "asc";
  }
}

/**
 * Validate sort configuration
 */
export function validateSortConfig(config: SortConfig): boolean {
  const validFields: SortField[] = ["score", "price", "name", "warnings"];
  const validDirections: SortDirection[] = ["asc", "desc"];

  return (
    validFields.includes(config.field) &&
    validDirections.includes(config.direction)
  );
}

/**
 * Create sort configuration with validation
 */
export function createSortConfig(
  field: SortField,
  direction?: SortDirection,
): SortConfig {
  const config: SortConfig = {
    field,
    direction: direction || getDefaultSortDirection(field),
  };

  if (!validateSortConfig(config)) {
    throw new Error(
      `Invalid sort configuration: field=${field}, direction=${direction}`,
    );
  }

  return config;
}
