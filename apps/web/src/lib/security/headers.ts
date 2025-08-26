/**
 * Security headers utility functions
 * Provides consistent security header management across the application
 */

export interface SecurityHeaders {
  'Content-Security-Policy'?: string;
  'Strict-Transport-Security'?: string;
  'X-Content-Type-Options'?: string;
  'X-Frame-Options'?: string;
  'Referrer-Policy'?: string;
  'Permissions-Policy'?: string;
  'X-DNS-Prefetch-Control'?: string;
}

/**
 * Generate Content Security Policy for production
 */
export function generateCSP(nonce?: string): string {
  const policies = [
    "default-src 'self'",
    nonce ? `script-src 'self' 'nonce-${nonce}'` : "script-src 'self'",
    "style-src 'self' 'unsafe-inline'", // Required for CSS-in-JS and Tailwind
    "img-src 'self' https://cdn.sanity.io data:",
    "connect-src 'self' https://*.sanity.io",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];

  return policies.join("; ");
}

/**
 * Generate Content Security Policy for development
 */
export function generateDevCSP(): string {
  const policies = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Dev needs unsafe-eval for HMR
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://cdn.sanity.io data: blob:",
    "connect-src 'self' https://*.sanity.io ws: wss:", // WebSocket for HMR
    "font-src 'self' data:",
    "upgrade-insecure-requests",
  ];

  return policies.join("; ");
}

/**
 * Get standard security headers
 */
export function getSecurityHeaders(): SecurityHeaders {
  return {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'X-DNS-Prefetch-Control': 'on',
  };
}

/**
 * Apply security headers to a Response object
 */
export function applySecurityHeaders(response: Response, nonce?: string): Response {
  const headers = getSecurityHeaders();
  
  // Add CSP based on environment
  if (process.env.NODE_ENV === 'production') {
    headers['Content-Security-Policy'] = generateCSP(nonce);
  } else {
    headers['Content-Security-Policy'] = generateDevCSP();
  }

  // Apply all headers
  Object.entries(headers).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value);
    }
  });

  return response;
}

/**
 * Validate CSP compliance for external resources
 */
export function isAllowedDomain(url: string): boolean {
  const allowedDomains = [
    'cdn.sanity.io',
    'suptia.com',
    'www.suptia.com',
    // Add other allowed domains here
  ];

  try {
    const urlObj = new URL(url);
    
    // Allow localhost for development
    if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
      return true;
    }
    
    return allowedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Sanitize external URLs for safe usage
 */
export function sanitizeExternalUrl(url: string): string | null {
  if (!isAllowedDomain(url)) {
    return null;
  }

  try {
    const urlObj = new URL(url);
    // Ensure HTTPS for external resources
    if (urlObj.protocol !== 'https:' && urlObj.hostname !== 'localhost') {
      urlObj.protocol = 'https:';
    }
    return urlObj.toString();
  } catch {
    return null;
  }
}