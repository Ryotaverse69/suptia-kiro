# Implementation Plan

**specVersion**: 2025-08-13

- [ ] 1. Configure Next.js security headers and strict CSP **[M]**
  - Update next.config.js with strict CSP: script-src 'self' (no unsafe-inline), style-src 'self' 'unsafe-inline', img-src 'self' https://cdn.sanity.io data:, connect-src 'self' https://*.sanity.io, upgrade-insecure-requests
  - Add conditional GA4 support with gtm (commented configuration)
  - Add X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy headers
  - Create middleware.ts for request-level security header application
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ] 2. Implement enhanced rate limiting with logging **[M]**
  - Create lib/security/rate-limit.ts with 60 req/10 min/IP limit
  - Implement 429 status code with Retry-After header
  - Add IP hash and route logging for rate limit violations
  - Create lib/security/validation.ts with Zod schemas for API endpoints
  - Ensure Sanity tokens are not exposed to client-side code
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3. Create enhanced LLM agent safety framework **[M]**
  - Update .kiro/steering/security.md with dry-run → approval → execution workflow
  - Implement lib/agent/content-filter.ts for external instruction detection
  - Create lib/agent/domain-whitelist.ts with sanity.io and company domain restrictions
  - Add MCP configuration with autoApprove: [] and restricted fetch domains
  - Add confirmation requirements for Git/Sanity write operations
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Implement comprehensive SEO optimization
  - Create lib/seo/json-ld.ts for Product and BreadcrumbList structured data
  - Implement app/sitemap.xml/route.ts for dynamic sitemap generation
  - Create app/robots.txt/route.ts for robots.txt serving
  - Add lib/seo/canonical.ts for URL cleaning (UTM parameter removal)
  - Update product pages with proper JSON-LD integration
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5. Create accessible UI components
  - Implement components/ui/AccessibleTable.tsx with caption and scope attributes
  - Create components/ui/AccessibleBanner.tsx with role="status" support
  - Add aria-sort functionality for sortable table headers
  - Implement keyboard navigation support for interactive elements
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 6. Implement strict Portable Text sanitization **[M]**
  - Create lib/content/portable-text-sanitizer.ts with React component allowlist only
  - Prohibit raw HTML rendering completely
  - Add external links with rel="nofollow noopener noreferrer" attributes
  - Ensure image alt attributes are properly handled
  - Integrate sanitization into existing Portable Text rendering
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 7. Configure ISR policies
  - Update product detail pages with revalidate: 600 configuration
  - Set appropriate ISR policies for different page types
  - Implement cache invalidation strategies for content updates
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 8. Create comprehensive testing and CI pipeline **[M]**
  - Write security tests for headers, validation, and rate limiting
  - Create SEO tests for JSON-LD, sitemap, and canonical URLs
  - Implement accessibility tests for ARIA attributes and keyboard navigation
  - Add agent safety tests for content filtering and domain validation
  - Set up CI pipeline with pnpm audit + semgrep(js/ts minimum) + Lighthouse CI (perf/bp >= 90, warning level)
  - Verify DoD criteria with automated checks
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_