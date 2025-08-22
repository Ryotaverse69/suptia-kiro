/**
 * Schema.org validation utilities for structured data compliance
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates schema.org ItemList structure
 */
export function validateSchemaOrgItemList(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required properties validation
  if (!data["@context"]) {
    errors.push("Missing required property: @context");
  } else if (data["@context"] !== "https://schema.org") {
    errors.push('Invalid @context: must be "https://schema.org"');
  }

  if (!data["@type"]) {
    errors.push("Missing required property: @type");
  } else if (data["@type"] !== "ItemList") {
    errors.push('Invalid @type: must be "ItemList"');
  }

  if (!data.name || typeof data.name !== "string") {
    errors.push("Missing or invalid name property");
  }

  if (!data.itemListElement || !Array.isArray(data.itemListElement)) {
    errors.push("Missing or invalid itemListElement array");
  } else {
    // Validate each list item
    data.itemListElement.forEach((item: any, index: number) => {
      const itemErrors = validateListItem(item, index);
      errors.push(...itemErrors.errors);
      warnings.push(...itemErrors.warnings);
    });

    // Check numberOfItems consistency
    if (typeof data.numberOfItems === "number") {
      if (data.numberOfItems !== data.itemListElement.length) {
        errors.push(
          "numberOfItems does not match itemListElement array length",
        );
      }
    } else {
      warnings.push("numberOfItems property is recommended");
    }
  }

  // Optional but recommended properties
  if (!data.description) {
    warnings.push("description property is recommended for better SEO");
  }

  if (!data.url) {
    warnings.push("url property is recommended for better SEO");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates individual ListItem in ItemList
 */
function validateListItem(item: any, index: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const prefix = `itemListElement[${index}]`;

  if (!item["@type"] || item["@type"] !== "ListItem") {
    errors.push(`${prefix}: Invalid @type, must be "ListItem"`);
  }

  if (typeof item.position !== "number" || item.position < 1) {
    errors.push(`${prefix}: position must be a positive number`);
  }

  if (!item.name || typeof item.name !== "string") {
    errors.push(`${prefix}: name is required and must be a string`);
  }

  if (!item.url || typeof item.url !== "string") {
    errors.push(`${prefix}: url is required and must be a string`);
  }

  // Validate nested Product
  if (!item.item) {
    errors.push(`${prefix}: item property is required`);
  } else {
    const productErrors = validateProduct(item.item, `${prefix}.item`);
    errors.push(...productErrors.errors);
    warnings.push(...productErrors.warnings);
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validates Product schema
 */
function validateProduct(product: any, prefix: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!product["@type"] || product["@type"] !== "Product") {
    errors.push(`${prefix}: Invalid @type, must be "Product"`);
  }

  if (!product.name || typeof product.name !== "string") {
    errors.push(`${prefix}: name is required and must be a string`);
  }

  if (!product.url || typeof product.url !== "string") {
    errors.push(`${prefix}: url is required and must be a string`);
  }

  // Validate Offer if present
  if (product.offers) {
    const offerErrors = validateOffer(product.offers, `${prefix}.offers`);
    errors.push(...offerErrors.errors);
    warnings.push(...offerErrors.warnings);
  } else {
    warnings.push(
      `${prefix}: offers property is recommended for e-commerce products`,
    );
  }

  // Optional but recommended properties
  if (!product.description) {
    warnings.push(`${prefix}: description property is recommended`);
  }

  if (!product.image) {
    warnings.push(`${prefix}: image property is recommended`);
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validates Offer schema
 */
function validateOffer(offer: any, prefix: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!offer["@type"] || offer["@type"] !== "Offer") {
    errors.push(`${prefix}: Invalid @type, must be "Offer"`);
  }

  if (typeof offer.price !== "number" || offer.price < 0) {
    errors.push(`${prefix}: price must be a non-negative number`);
  }

  if (!offer.priceCurrency || typeof offer.priceCurrency !== "string") {
    errors.push(`${prefix}: priceCurrency is required and must be a string`);
  } else if (!/^[A-Z]{3}$/.test(offer.priceCurrency)) {
    warnings.push(
      `${prefix}: priceCurrency should be a valid 3-letter ISO currency code`,
    );
  }

  // Validate availability URL
  if (offer.availability) {
    if (typeof offer.availability !== "string") {
      errors.push(`${prefix}: availability must be a string`);
    } else if (!offer.availability.startsWith("https://schema.org/")) {
      warnings.push(`${prefix}: availability should use schema.org vocabulary`);
    }
  } else {
    warnings.push(`${prefix}: availability property is recommended`);
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validates JSON-LD syntax and structure
 */
export function validateJsonLdSyntax(jsonString: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const parsed = JSON.parse(jsonString);

    // Basic JSON-LD validation
    if (!parsed["@context"]) {
      errors.push("Missing @context property");
    }

    if (!parsed["@type"]) {
      errors.push("Missing @type property");
    }

    // Check for common issues
    if (jsonString.includes("undefined")) {
      errors.push("JSON contains undefined values");
    }

    if (jsonString.includes("null")) {
      warnings.push("JSON contains null values - ensure this is intentional");
    }

    return { isValid: errors.length === 0, errors, warnings };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        `Invalid JSON syntax: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
      warnings: [],
    };
  }
}

/**
 * Comprehensive schema.org validation for ItemList
 */
export function validateItemListSchema(jsonString: string): ValidationResult {
  // First validate JSON syntax
  const syntaxValidation = validateJsonLdSyntax(jsonString);
  if (!syntaxValidation.isValid) {
    return syntaxValidation;
  }

  try {
    const data = JSON.parse(jsonString);
    return validateSchemaOrgItemList(data);
  } catch (error) {
    return {
      isValid: false,
      errors: [
        `Failed to parse JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
      warnings: [],
    };
  }
}

/**
 * Schema.org testing tool URL generator
 */
export function generateSchemaTestUrl(pageUrl: string): string {
  const encodedUrl = encodeURIComponent(pageUrl);
  return `https://search.google.com/test/rich-results?url=${encodedUrl}`;
}

/**
 * Structured Data Testing Tool URL generator (legacy)
 */
export function generateStructuredDataTestUrl(pageUrl: string): string {
  const encodedUrl = encodeURIComponent(pageUrl);
  return `https://search.google.com/structured-data/testing-tool?url=${encodedUrl}`;
}
