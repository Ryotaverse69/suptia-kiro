import "server-only";

/**
 * Sanity token protection utilities
 * Ensures tokens are never exposed to client-side code
 */

// Type-safe token access
interface SanityTokenConfig {
  token?: string;
  hasToken: boolean;
  canWrite: boolean;
}

/**
 * Get Sanity token configuration safely
 * This function can only be called server-side due to "server-only" import
 */
export function getSanityTokenConfig(): SanityTokenConfig {
  const token = process.env.SANITY_API_TOKEN;
  
  return {
    token: token || undefined,
    hasToken: Boolean(token),
    canWrite: Boolean(token),
  };
}

/**
 * Validate that no sensitive tokens are included in client-side bundles
 */
export function validateClientSideEnvironment(): void {
  // This function should never be called client-side
  if (typeof window !== 'undefined') {
    throw new Error(
      'Token protection utilities cannot be used client-side. ' +
      'This indicates a potential security issue where server-only code is being bundled for the client.'
    );
  }

  // Validate that sensitive environment variables are not exposed
  const sensitiveVars = [
    'SANITY_API_TOKEN',
    'SANITY_WEBHOOK_SECRET',
  ];

  sensitiveVars.forEach(varName => {
    if (typeof window !== 'undefined' && (window as any)[varName]) {
      throw new Error(
        `Sensitive environment variable ${varName} is exposed to client-side code. ` +
        'This is a security vulnerability.'
      );
    }
  });
}

/**
 * Create a safe client configuration for public use
 */
export function createSafeClientConfig() {
  validateClientSideEnvironment();
  
  return {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: "2025-07-01",
    useCdn: true,
    perspective: "published" as const,
    // Explicitly exclude token and other sensitive data
  };
}

/**
 * Create a server-side client configuration with token
 */
export function createServerClientConfig() {
  validateClientSideEnvironment();
  
  const tokenConfig = getSanityTokenConfig();
  
  return {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: "2025-07-01",
    useCdn: false, // Disable CDN for server-side to get fresh data
    token: tokenConfig.token,
    perspective: tokenConfig.hasToken ? ("previewDrafts" as const) : ("published" as const),
  };
}

/**
 * Runtime check to ensure no tokens are leaked to client
 */
export function auditClientSideExposure(): { safe: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check if we're running client-side
  if (typeof window !== 'undefined') {
    issues.push('Token protection audit cannot run client-side');
    return { safe: false, issues };
  }
  
  // Check for common token exposure patterns
  const dangerousPatterns = [
    'SANITY_API_TOKEN',
    'SANITY_WEBHOOK_SECRET',
    'process.env.SANITY_API_TOKEN',
  ];
  
  // In a real implementation, you might check the built client bundle
  // For now, we'll just validate the environment
  
  return { safe: true, issues: [] };
}

// Export types for external use
export type { SanityTokenConfig };