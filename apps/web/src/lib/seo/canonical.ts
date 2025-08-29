import { getSiteUrl } from "../runtimeConfig";

// Canonical URL configuration
export interface CanonicalUrlConfig {
  baseUrl: string;
  excludeParams: string[];
}

// Default parameters to exclude from canonical URLs (要件4.3準拠)
const DEFAULT_EXCLUDE_PARAMS = [
  // UTM tracking parameters
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  
  // Google Analytics parameters
  "gclid",
  "gclsrc",
  "dclid",
  
  // Facebook tracking parameters
  "fbclid",
  
  // Other common tracking parameters
  "ref",
  "referrer",
  "source",
  "campaign",
  "medium",
  
  // Session and temporary parameters
  "sessionid",
  "timestamp",
  "cache",
  "v",
  "version",
];

// Clean URL by removing tracking parameters (要件4.3準拠)
export function cleanUrl(url: string, config?: Partial<CanonicalUrlConfig>): string {
  try {
    const urlObj = new URL(url);
    const excludeParams = config?.excludeParams || DEFAULT_EXCLUDE_PARAMS;
    
    // Remove excluded parameters
    excludeParams.forEach((param) => {
      urlObj.searchParams.delete(param);
    });
    
    // Remove fragment (hash) for canonical URLs
    urlObj.hash = "";
    
    return urlObj.toString();
  } catch (error) {
    console.error("Failed to clean URL:", error);
    // Return original URL if parsing fails
    return url;
  }
}

// Generate canonical URL from path (要件4.3準拠)
export function generateCanonical(path: string): string {
  const siteUrl = getSiteUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  return `${siteUrl}${cleanPath}`;
}

// Generate canonical URL from full URL (要件4.3準拠)
export function generateCanonicalFromUrl(url: string): string {
  try {
    const cleanedUrl = cleanUrl(url);
    const urlObj = new URL(cleanedUrl);
    
    // Use site URL as base to ensure consistency
    const siteUrl = getSiteUrl();
    const siteUrlObj = new URL(siteUrl);
    
    // Preserve path and clean search params
    return `${siteUrlObj.origin}${urlObj.pathname}${urlObj.search}`;
  } catch (error) {
    console.error("Failed to generate canonical from URL:", error);
    // Fallback to site URL
    return getSiteUrl();
  }
}

// Validate canonical URL format
export function isValidCanonicalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const siteUrl = getSiteUrl();
    const siteUrlObj = new URL(siteUrl);
    
    // Must be same origin as site URL
    return urlObj.origin === siteUrlObj.origin;
  } catch (error) {
    return false;
  }
}

// Extract path from canonical URL
export function extractPathFromCanonical(canonicalUrl: string): string {
  try {
    const urlObj = new URL(canonicalUrl);
    return urlObj.pathname;
  } catch (error) {
    console.error("Failed to extract path from canonical URL:", error);
    return "/";
  }
}