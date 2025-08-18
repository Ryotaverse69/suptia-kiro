w# Implementation Plan

**specVersion**: 2025-08-16

- [x] 1. 楽天/Yahoo!コネクタ＋モック、envテンプレ更新
  - Create lib/pricing/rakuten-connector.ts with Rakuten Ichiba API integration
  - Implement lib/pricing/yahoo-connector.ts with Yahoo! Shopping API integration
  - Add mocks/rakuten-mock.ts and mocks/yahoo-mock.ts for development and testing
  - Update .env.example with RAKUTEN_APPLICATION_ID, YAHOO_CLIENT_ID, YAHOO_CLIENT_SECRET
  - Create API rate limiting and error handling for both connectors
  - Add comprehensive unit tests for both connectors with mock data
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. マッチャー（GTIN/JAN優先＋容量一致必須のフォールバック）＋テスト
  - Implement lib/pricing/price-matcher.ts with GTIN/JAN priority matching logic
  - Add capacity matching as mandatory fallback when GTIN/JAN unavailable
  - Create product matching confidence scoring (0-1 scale)
  - Implement validation logic for brand name and capacity consistency
  - Add comprehensive boundary value tests for edge cases and invalid data
  - Create integration tests for multi-source product matching scenarios
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [x] 3. Normalizer（税・送料・サブスク・在庫）＋境界値テスト
  - Create lib/pricing/price-normalizer.ts for unified price format conversion
  - Implement tax-inclusive price calculation and shipping cost integration
  - Add subscription detection and discount calculation logic
  - Create stock status normalization across different retailer formats
  - Implement lib/pricing/cost-calculator.ts for effective cost per day calculation
  - Add comprehensive boundary value tests for price edge cases and invalid data
  - _Requirements: 1.2, 2.1, 2.2, 2.3_

- [x] 4. Product詳細のPriceTable統合（実効コスト/日バッジ・取得時刻・リンク）
  - Create components/pricing/PriceTable.tsx integrated with existing ScoreDisplay and PersonaWarnings
  - Implement components/pricing/CostPerDayBadge.tsx for daily cost visualization
  - Add components/pricing/LowestPriceBadge.tsx for best deal highlighting
  - Create components/pricing/PriceSourceLink.tsx with timestamp and retailer links
  - Integrate price sorting functionality (ascending/descending by cost per day)
  - Update app/products/[slug]/page.tsx to display unified product information
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5. 診断フロー（安全版）＋文言Lint（禁止辞書）
  - Create lib/diagnosis/safe-questionnaire.ts with pharmaceutical law compliant questions
  - Implement components/diagnosis/SafeDiagnosisFlow.tsx avoiding medical claims and treatment effects
  - Add lib/diagnosis/compliance-checker.ts with prohibited terms dictionary
  - Create scripts/lint-compliance.ts for automated pharmaceutical law violation detection
  - Implement category-based recommendations without disease name assertions
  - Add .github/workflows/compliance-check.yml for PR-based automatic compliance validation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6. JSON-LDに aggregateRating 追加＋テスト
  - Update lib/seo/aggregate-rating.ts to convert existing scores to 0-5 scale
  - Implement components/seo/AggregateRatingJsonLd.tsx component
  - Add aggregateRating to existing Product JSON-LD with ratingValue, bestRating, worstRating, ratingCount
  - Format rating values to 1 decimal place precision
  - Create comprehensive tests for schema.org compliance validation
  - Integrate aggregate rating into product detail pages with existing JSON-LD
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7. A11yライトE2E（1本）＆ CIワークフロー更新
  - Create single E2E test covering WarningBanner, ScoreDisplay, and PriceTable accessibility
  - Implement screen reader compatibility testing for all three components
  - Add keyboard navigation testing (Tab, Enter, Space keys) for interactive elements
  - Verify proper ARIA attributes (role, aria-label, aria-describedby) are present
  - Update .github/workflows/ci.yml to include A11y light E2E test execution
  - Ensure test covers component existence and screen reader announcements
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8. DoDチェックリストをPRテンプレに組み込み
  - Update .github/pull_request_template.md with M0 DoD checklist items
  - Add mandatory CI checks verification: ["format:check","lint","test","typecheck","build","headers","jsonld"]
  - Include price matching validation (2 sources per product with lowest price indication)
  - Add effective cost per day sorting verification and compliance expression check
  - Create diagnosis → product detail flow validation with zero prohibited expressions
  - Implement automated DoD verification in CI pipeline with clear pass/fail reporting
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 9. lighthouse-budget.json を追加し CI で警告運用 **[継続]**
  - Create lighthouse-budget.json with LCP≤2.5s, TBT≤200ms, CLS≤0.1, JS≤300KB thresholds
  - Implement lib/release/lighthouse-budget.ts for budget management
  - Add scripts/release/check-lighthouse-budget.ts for CI integration
  - Create .github/workflows/lighthouse-budget.yml for performance monitoring
  - Configure warning-only operation (no build failures)
  - Add Lighthouse CI integration with temporary public storage
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 10. Configure Next.js security headers and strict CSP **[継続]**
  - Update next.config.js with strict CSP: script-src 'self' (no unsafe-inline), style-src 'self' 'unsafe-inline', img-src 'self' https://cdn.sanity.io data:, connect-src 'self' https://*.sanity.io, upgrade-insecure-requests
  - Add conditional GA4 support with gtm (commented configuration)
  - Add X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy headers
  - Create middleware.ts for request-level security header application
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 11. Implement enhanced rate limiting with logging **[継続]**
  - Create lib/security/rate-limit.ts with 60 req/10 min/IP limit
  - Implement 429 status code with Retry-After header
  - Add IP hash and route logging for rate limit violations
  - Create lib/security/validation.ts with Zod schemas for API endpoints
  - Ensure Sanity tokens are not exposed to client-side code
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 12. Create enhanced LLM agent safety framework **[継続]**
  - Update .kiro/steering/security.md with dry-run → approval → execution workflow
  - Implement lib/agent/content-filter.ts for external instruction detection
  - Create lib/agent/domain-whitelist.ts with sanity.io and company domain restrictions
  - Add MCP configuration with autoApprove: [] and restricted fetch domains
  - Add confirmation requirements for Git/Sanity write operations
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_