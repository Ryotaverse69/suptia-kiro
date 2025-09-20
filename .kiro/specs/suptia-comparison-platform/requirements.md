# Requirements Document

## Introduction

サプリメント比較プラットフォーム「サプティア」の構築。Trivagoの情報設計（検索→結果比較→絞り込み→詳細）を踏襲し、Apple/xAIのミニマル＆上質感を持つ視覚表現で実現する。Next.js 14 App Router、TypeScript、Tailwind CSS、Sanityを使用し、レスポンシブ最適化と高速パフォーマンス（Lighthouse モバイル 90+）を達成する。

## Requirements

### Requirement 1: デザインシステム基盤

**User Story:** As a developer, I want a consistent design system, so that all UI components maintain visual coherence and Apple/xAI-level quality.

#### Acceptance Criteria

1. WHEN implementing layout tokens THEN container SHALL use max-w-[1280px] on desktop and xl:max-w-[1440px] with 24px left/right gutters
2. WHEN defining spacing scale THEN system SHALL use space-2(8px), space-3(12px), space-4(16px), space-6(24px), space-8(32px), space-12(48px) as primary values
3. WHEN styling components THEN cards/inputs SHALL use rounded-2xl (16px) and pill buttons SHALL use rounded-full
4. WHEN applying shadows THEN default SHALL be shadow-[0_8px_24px_rgba(0,0,0,0.08)] and hover SHALL be 0.12 opacity
5. WHEN defining colors THEN background SHALL be #FFFFFF, text #0F172A, sub-text #334155, accent #2563EB, border #E5E7EB
6. WHEN setting typography THEN system SHALL use Inter + Noto Sans JP with Apple-style wide leading (leading-7)
7. WHEN defining breakpoints THEN system SHALL use sm:640, md:768, lg:1024, xl:1280, 2xl:1440

### Requirement 2: ヘッダーコンポーネント

**User Story:** As a user, I want a sticky header with navigation and controls, so that I can access key features from any page.

#### Acceptance Criteria

1. WHEN viewing header THEN left side SHALL display "サプティア | Suptia" logo with futuristic thin design and subtle gradient SVG
2. WHEN viewing header THEN right side SHALL show navigation ("サプティアとは", "成分ガイド", "比較"), language JA/EN switcher, currency JPY/USD switcher
3. WHEN scrolling page THEN header SHALL shrink in height and transition background from semi-transparent to solid white with Apple-style animation
4. WHEN header is sticky THEN it SHALL remain at top with proper z-index and backdrop blur effect
5. WHEN on mobile THEN header SHALL adapt to smaller screen with appropriate responsive behavior

### Requirement 3: ヒーローセクション

**User Story:** As a user, I want a full-screen hero section with prominent search, so that I can immediately start searching for supplements.

#### Acceptance Criteria

1. WHEN viewing hero THEN section SHALL be 100dvh height and complete within one screen (no scroll required to see next section)
2. WHEN viewing hero THEN center SHALL display large search box with Trivago-style layout
3. WHEN using search box THEN left input SHALL accept product name/ingredient/purpose with auto-suggest
4. WHEN using search box THEN middle SHALL show category multi-select (e.g., "筋トレ", "美容", "睡眠")
5. WHEN using search box THEN right SHALL display price range slider and search button
6. WHEN viewing hero THEN bottom center SHALL show scroll indicator with slow fade animation
7. WHEN viewing hero THEN background SHALL be white base with subtle radial gradient and fine abstract line patterns (xAI-style, light colors)

### Requirement 4: 人気比較セクション

**User Story:** As a user, I want to see popular product comparisons, so that I can quickly access trending supplements.

#### Acceptance Criteria

1. WHEN viewing popular section THEN it SHALL appear immediately below fold with 3-6 cards in horizontal grid
2. WHEN viewing cards THEN layout SHALL use grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 responsive grid
3. WHEN viewing card THEN it SHALL display product thumbnail, name, main ingredient pills, lowest price, star rating
4. WHEN hovering card THEN it SHALL lift up with smooth transition and enhanced shadow
5. WHEN viewing section THEN top-right SHALL show "すべて見る" button for navigation to full results

### Requirement 5: 成分ガイドセクション

**User Story:** As a user, I want to explore ingredients by category, so that I can learn about different supplement components.

#### Acceptance Criteria

1. WHEN viewing ingredient guide THEN it SHALL display ingredient tag cloud with "効果", "安全性", "エビデンス" simple indicators
2. WHEN clicking ingredient tag THEN it SHALL navigate to comparison search with pre-filled query
3. WHEN viewing tags THEN they SHALL be styled as pills with appropriate hover effects
4. WHEN viewing indicators THEN they SHALL provide quick visual reference for ingredient properties

### Requirement 6: 検索結果ページ

**User Story:** As a user, I want to filter and sort search results, so that I can find the most suitable supplements efficiently.

#### Acceptance Criteria

1. WHEN viewing search results THEN left sidebar SHALL display filters (price, brand, ingredients, purpose, rating, stock, sale)
2. WHEN viewing search results THEN right area SHALL show result list in card format with optional 2-column layout
3. WHEN viewing result card THEN it SHALL display thumbnail, product name, main ingredients, price range, store badges, "最安値を見る" button
4. WHEN viewing top section THEN it SHALL show sort options (recommended/price/rating), result count, active filter pills
5. WHEN scrolling results THEN header SHALL shrink and sort/filter bar SHALL stick to top
6. WHEN applying filters THEN URL SHALL update with query parameters for bookmarking and sharing

### Requirement 7: フッターコンポーネント

**User Story:** As a user, I want access to legal and informational links, so that I can understand terms and contact support.

#### Acceptance Criteria

1. WHEN viewing footer THEN it SHALL display "サプティアとは", "プライバシーポリシー", "免責", "利用規約", "お問い合わせ" links
2. WHEN viewing footer THEN it SHALL include duplicate language/currency switchers for accessibility
3. WHEN viewing footer THEN styling SHALL maintain consistency with overall design system
4. WHEN clicking footer links THEN they SHALL navigate to appropriate pages or modals

### Requirement 8: インタラクション＆アクセシビリティ

**User Story:** As a user with accessibility needs, I want keyboard navigation and proper focus management, so that I can use the site effectively.

#### Acceptance Criteria

1. WHEN using keyboard navigation THEN focus rings SHALL be visible with focus:outline-none focus:ring-2 focus:ring-[#2563EB]
2. WHEN interacting with elements THEN animations SHALL be minimal using transition-all duration-200 ease-out
3. WHEN hovering elements THEN they SHALL show appropriate shadow/lift effects
4. WHEN focusing hero search THEN surrounding area SHALL show subtle glow effect
5. WHEN using search input THEN it SHALL debounce at 300ms and show max 5 suggestions below

### Requirement 9: レスポンシブデザイン

**User Story:** As a mobile user, I want the site to work perfectly on my device, so that I can search and compare supplements on the go.

#### Acceptance Criteria

1. WHEN viewing on desktop (1280px) THEN layout SHALL achieve Trivago-style density and grid feel with proper card width and spacing
2. WHEN viewing on different screen sizes THEN components SHALL adapt using defined breakpoints (sm:640, md:768, lg:1024, xl:1280, 2xl:1440)
3. WHEN viewing on mobile THEN all interactions SHALL be touch-friendly with appropriate target sizes
4. WHEN viewing cards THEN they SHALL reflow appropriately across different screen sizes
5. WHEN using filters on mobile THEN they SHALL be accessible through appropriate mobile UI patterns

### Requirement 10: パフォーマンス最適化

**User Story:** As a user, I want fast loading times, so that I can quickly access supplement information.

#### Acceptance Criteria

1. WHEN measuring performance THEN Lighthouse mobile scores SHALL be Performance/Best Practices/Accessibility 90+
2. WHEN checking accessibility THEN axe SHALL report 0 critical violations
3. WHEN using keyboard only THEN user SHALL be able to complete search→results→filter operations
4. WHEN loading content THEN skeleton displays SHALL appear and LCP target SHALL stabilize within 2.5s
5. WHEN switching language/currency THEN UI display changes SHALL be immediately visible (mock functionality)

### Requirement 11: データ連携

**User Story:** As a user, I want my search preferences to be preserved, so that I can bookmark and share specific searches.

#### Acceptance Criteria

1. WHEN performing search THEN query SHALL be reflected in URL (/search?q=...&cat=...&min=...&max=...)
2. WHEN using auto-suggest THEN system SHALL use mock JSON data (replaceable with Sanity/GROQ later)
3. WHEN applying filters THEN state SHALL be maintained in URL parameters
4. WHEN sharing URL THEN recipient SHALL see same search results and filter state
5. WHEN navigating back THEN previous search state SHALL be restored

### Requirement 12: ヒーロー検索仕様詳細

**User Story:** As a user, I want precise search controls, so that I can find supplements matching my specific needs and budget.

#### Acceptance Criteria

1. WHEN using search input THEN it SHALL accept free-form text with category/purpose selection (例: 筋肥大, 集中力) and budget slider
2. WHEN typing in search THEN suggestions SHALL show recent searches, popular keywords, ingredient candidates (GROQ prefix search)
3. WHEN submitting search THEN URL SHALL follow format /search?q=&goal=&price_min=&price_max=&sort=
4. WHEN viewing suggestions THEN they SHALL be limited to max 5 items with clear categorization
5. WHEN using budget slider THEN it SHALL show real-time price range with currency formatting

### Requirement 13: フィルター仕様詳細

**User Story:** As a user, I want comprehensive filtering options, so that I can narrow down supplement choices effectively.

#### Acceptance Criteria

1. WHEN viewing filters THEN minimum set SHALL include 価格帯, 主要成分, 目的（効果カテゴリ）, 在庫, ブランド, 並び替え(価格・人気・評価・効果推定)
2. WHEN applying filters THEN each SHALL sync with URL query parameters for back/share functionality
3. WHEN using price filter THEN it SHALL show range slider with min/max values
4. WHEN selecting ingredients THEN it SHALL show multi-select with search capability
5. WHEN changing sort order THEN results SHALL update immediately with loading state

### Requirement 14: 人気比較カード情報密度

**User Story:** As a user, I want detailed product information at a glance, so that I can make informed comparisons quickly.

#### Acceptance Criteria

1. WHEN viewing card THEN it SHALL display 画像, 名称, 主成分タグ(最大3), 想定効果ピル（1個）, 最安値, 比較CTA as required elements
2. WHEN hovering/tapping card THEN it SHALL reveal 主要スペック行（用量・形状・容量）in expandable section
3. WHEN viewing tags THEN they SHALL be truncated with ellipsis if exceeding 2 lines
4. WHEN viewing price THEN it SHALL show formatted currency with comparison indicator
5. WHEN clicking CTA THEN it SHALL add to comparison or navigate to details

### Requirement 15: 成分ガイド粒度

**User Story:** As a user, I want detailed ingredient information, so that I can understand supplement components and their benefits.

#### Acceptance Criteria

1. WHEN clicking ingredient tag THEN it SHALL navigate to /ingredients/[slug] with 利点, 注意, 代表商品3件
2. WHEN viewing ingredient content THEN text SHALL have character limits with 2-line ellipsis rule
3. WHEN viewing ingredient page THEN it SHALL show structured information with clear sections
4. WHEN viewing representative products THEN they SHALL link back to comparison search
5. WHEN browsing ingredients THEN navigation SHALL maintain search context

### Requirement 16: i18n/通貨切替モック定義

**User Story:** As a user, I want language and currency options, so that I can use the platform in my preferred format.

#### Acceptance Criteria

1. WHEN switching language THEN system SHALL support ja/en with static dictionary lookup
2. WHEN switching currency THEN system SHALL support JPY/USD with fixed exchange rate conversion
3. WHEN changing preferences THEN state SHALL persist via cookie storage
4. WHEN reloading page THEN previous language/currency selections SHALL be restored
5. WHEN viewing prices THEN they SHALL format according to selected currency with proper symbols

### Requirement 17: アニメーション＆モーション制限

**User Story:** As a user, I want smooth interactions without performance impact, so that the site feels responsive and professional.

#### Acceptance Criteria

1. WHEN applying animations THEN duration SHALL be limited to 0.2-0.4s with ease-out timing
2. WHEN using hover effects THEN they SHALL not impact Lighthouse performance scores
3. WHEN loading content THEN animations SHALL not delay LCP or cause layout shifts
4. WHEN using reduced motion preference THEN animations SHALL respect user accessibility settings
5. WHEN measuring performance THEN motion SHALL not cause frame drops or jank

### Requirement 18: Lighthouse 90+根拠

**User Story:** As a stakeholder, I want performance optimization details, so that we achieve and maintain high Lighthouse scores.

#### Acceptance Criteria

1. WHEN optimizing images THEN system SHALL use next/image with AVIF/WebP formats and proper sizing
2. WHEN measuring CLS THEN score SHALL be 0.02 or below with stable layout
3. WHEN loading fonts THEN they SHALL use display=swap to prevent layout shifts
4. WHEN loading JavaScript THEN non-critical code SHALL be deferred or lazy-loaded
5. WHEN measuring LCP THEN target SHALL be < 1.0s on Fast 3G mobile simulation

### Requirement 19: 品質保証＆受け入れ基準

**User Story:** As a stakeholder, I want comprehensive quality assurance, so that we deliver a production-ready platform.

#### Acceptance Criteria

1. WHEN using keyboard navigation THEN Tab order SHALL be logical: ヘッダー>検索>結果 with Enter execution on search box
2. WHEN using screen reader THEN search SHALL have aria-label, card CTAs SHALL have role attribution, hero SHALL use role="region" + aria-labelledby
3. WHEN accessing URL directly THEN /search?... SHALL restore same results on reload
4. WHEN measuring initial load THEN LCP SHALL be < 1.0s on Fast 3G mobile simulation
5. WHEN running E2E tests THEN 検索→結果→詳細→戻る happy path SHALL complete successfully in Playwright

### Requirement 20: スコープ境界

**User Story:** As a project stakeholder, I want clear scope definition, so that we focus on core functionality without scope creep.

#### Acceptance Criteria

1. WHEN defining scope THEN current phase SHALL include 検索・比較・成分ガイド・詳細のUIと土台 only
2. WHEN implementing purchase flow THEN external EC navigation SHALL be deferred to next phase
3. WHEN handling price data THEN crawling/sync SHALL use dummy data for MVP
4. WHEN building features THEN focus SHALL remain on core comparison and search functionality
5. WHEN evaluating additions THEN they SHALL be assessed against defined scope boundaries

### Requirement 21: 検索・並び替え厳密定義

**User Story:** As a user, I want predictable search and sorting behavior, so that I can efficiently find relevant supplements.

#### Acceptance Criteria

1. WHEN sorting results THEN available options SHALL be price_asc, price_desc, rating_desc, popularity_desc, new_arrivals with popularity_desc as default
2. WHEN searching with free text THEN system SHALL search across 商品名, ブランド, 主要成分, キャッチコピー fields
3. WHEN normalizing queries THEN empty/unselected parameters SHALL be excluded from URL, with proper URL encoding
4. WHEN handling search scope THEN each field SHALL have defined weight and matching priority
5. WHEN displaying sort options THEN current selection SHALL be clearly indicated with proper ARIA attributes

### Requirement 22: ページング・結果上限

**User Story:** As a user, I want manageable result sets, so that I can browse products efficiently without overwhelming load times.

#### Acceptance Criteria

1. WHEN displaying results THEN page size SHALL be 20 items with pagination controls (not infinite scroll)
2. WHEN loading results THEN skeleton placeholders SHALL show during fetch operations
3. WHEN reaching result limits THEN UI SHALL indicate total count and provide navigation options
4. WHEN encountering 0 results THEN system SHALL suggest 3+ alternative keywords and popular category links
5. WHEN navigating pages THEN URL SHALL update with page parameter for bookmarking

### Requirement 23: 成分データ構造・表示粒度

**User Story:** As a user, I want detailed ingredient information, so that I can make informed decisions about supplement components.

#### Acceptance Criteria

1. WHEN viewing /ingredients/[slug] THEN page SHALL include 概要(160-240字), エビデンスレベル, 推奨摂取量, 注意事項, 関連商品3件
2. WHEN displaying summaries THEN TL;DR sections SHALL be 80-120 characters with clear truncation
3. WHEN selecting related products THEN system SHALL use popularity + rating + relevance scoring
4. WHEN showing evidence levels THEN system SHALL use standardized A/B/C grading with explanations
5. WHEN displaying dosage info THEN format SHALL include units, ranges, and timing recommendations

### Requirement 24: 価格表記・通貨切替

**User Story:** As a user, I want consistent price formatting, so that I can easily compare costs across products.

#### Acceptance Criteria

1. WHEN displaying prices THEN format SHALL use proper decimal places, thousand separators, tax-inclusive notation, and currency symbol positioning
2. WHEN switching currency THEN exchange rates SHALL be build-time fixed values stored in environment variables
3. WHEN showing price ranges THEN format SHALL be ¥1,980 - ¥3,240 (税込) with consistent spacing
4. WHEN converting currencies THEN system SHALL round to appropriate decimal places (JPY: 0, USD: 2)
5. WHEN updating rates THEN process SHALL be documented for future maintenance

### Requirement 25: 画像・アセット規格

**User Story:** As a developer, I want standardized asset specifications, so that all images display consistently and perform optimally.

#### Acceptance Criteria

1. WHEN using product images THEN minimum resolution SHALL be 400x400px with 1:1 aspect ratio for cards
2. WHEN displaying hero images THEN aspect ratio SHALL be 16:9 with minimum 1920x1080px resolution
3. WHEN handling missing images THEN system SHALL show branded placeholder with proper aspect ratio
4. WHEN loading images THEN LQIP blur effects SHALL be implemented for smooth progressive loading
5. WHEN optimizing images THEN next/image SHALL generate AVIF/WebP with appropriate sizes array

### Requirement 26: SEO・メタデータ・構造化データ

**User Story:** As a business stakeholder, I want proper SEO implementation, so that our platform ranks well in search results.

#### Acceptance Criteria

1. WHEN generating structured data THEN system SHALL implement JSON-LD for Product, ItemList, BreadcrumbList schemas
2. WHEN creating sitemaps THEN system SHALL generate dynamic XML with proper priority and changefreq values
3. WHEN setting meta tags THEN canonical URLs, OG tags, Twitter Cards SHALL be implemented with fallback defaults
4. WHEN handling errors THEN 404/500/empty pages SHALL have lightweight designs with clear navigation back to search
5. WHEN validating structured data THEN Google Rich Results Test SHALL show 0 errors

### Requirement 27: セキュリティ・コンプライアンス

**User Story:** As a compliance officer, I want proper security and legal protections, so that we meet regulatory requirements.

#### Acceptance Criteria

1. WHEN implementing CSP THEN rules SHALL allow Sanity CDN, image CDN, and essential analytics domains only
2. WHEN handling cookies THEN consent mechanism SHALL control analytics activation with clear opt-in/out
3. WHEN displaying medical information THEN disclaimer notices SHALL appear on ingredient and product detail pages
4. WHEN collecting user data THEN privacy policy SHALL be accessible and compliant with applicable regulations
5. WHEN implementing tracking THEN user consent SHALL be respected with proper data handling

### Requirement 28: 計測・SLO

**User Story:** As a product manager, I want performance metrics and SLOs, so that we can monitor and maintain quality standards.

#### Acceptance Criteria

1. WHEN measuring Core Web Vitals THEN LCP P75 SHALL be ≤ 1.0s and CLS P75 SHALL be ≤ 0.02
2. WHEN tracking user journeys THEN 検索→結果表示 apdex and 比較→詳細タップ CVR SHALL be monitored
3. WHEN measuring TTFB THEN server response SHALL be ≤ 200ms for cached content
4. WHEN monitoring performance THEN alerts SHALL trigger when metrics exceed thresholds by 20%
5. WHEN reporting metrics THEN dashboard SHALL show real-time and historical performance data

### Requirement 29: タイポグラフィ・モーション詳細

**User Story:** As a designer, I want refined typography and motion, so that the platform achieves Apple/xAI-level visual quality.

#### Acceptance Criteria

1. WHEN setting typography THEN Hero SHALL use tracking-tight, Body SHALL use normal tracking with Inter + Noto Sans JP
2. WHEN implementing motion THEN initial display SHALL use fade + subtle parallax, subsequent interactions SHALL respect reduced motion
3. WHEN applying shadows THEN opacity SHALL be < 8% for subtle depth with Apple-style air feel
4. WHEN using gradients THEN they SHALL be minimal and refined, limited to accent areas only
5. WHEN spacing components THEN card padding SHALL use 8/12/16px three-tier system with section consistency

### Requirement 30: 並び替え・価格・通貨詳細仕様

**User Story:** As a user, I want consistent sorting and pricing behavior, so that results are predictable and reliable.

#### Acceptance Criteria

1. WHEN sorting with ties THEN tiebreaker SHALL follow popularity_desc → rating_desc → price_asc → name_asc order
2. WHEN calculating tax-inclusive prices THEN system SHALL use 四捨五入 rounding with clear formula documentation
3. WHEN updating exchange rates THEN process SHALL occur daily at 0:00 UTC with automatic rebuild/ISR
4. WHEN displaying currency THEN ja/JPY SHALL be default with URL strategy /en for English and cookie persistence
5. WHEN formatting prices THEN system SHALL use locale-appropriate thousand separators and currency symbol positioning

### Requirement 31: ページング・フィルター・URL戦略

**User Story:** As a user, I want bookmarkable searches with proper SEO, so that I can share and return to specific results.

#### Acceptance Criteria

1. WHEN implementing pagination THEN system SHALL use rel="prev/next" with canonical pointing to page 1
2. WHEN applying filters THEN URL SHALL include ?ingr=vitamin-c&brand=...&price_lte=... format for restoration
3. WHEN showing 0 results THEN 3 alternatives SHALL be selected by popularity × category similarity algorithm
4. WHEN using "Load More" THEN URL parameters SHALL enable state restoration on reload
5. WHEN filtering results THEN active filters SHALL persist across navigation and be clearable individually

### Requirement 32: 画像最適化・キャッシュ戦略

**User Story:** As a developer, I want optimized asset handling, so that performance targets are consistently met.

#### Acceptance Criteria

1. WHEN uploading images THEN maximum resolution SHALL be 2048x2048px with next/image quality=80 default
2. WHEN caching content THEN product pages SHALL revalidate every 1 hour, listings every 10 minutes
3. WHEN serving images THEN sizes attribute SHALL be "(max-width:1280px) 100vw, 1280px" with proper breakpoints
4. WHEN handling cache invalidation THEN manual purge mechanism SHALL be available for urgent updates
5. WHEN optimizing delivery THEN AVIF/WebP SHALL be prioritized with JPEG fallback

### Requirement 33: JSON-LD・エラーハンドリング詳細

**User Story:** As an SEO specialist, I want complete structured data, so that search engines can properly index our content.

#### Acceptance Criteria

1. WHEN implementing Product schema THEN required fields SHALL include name, image, description, brand, sku, offers.price, offers.priceCurrency, aggregateRating
2. WHEN implementing ItemList THEN itemListOrder SHALL be "https://schema.org/ItemListOrderDescending" for sorted results
3. WHEN handling 404/500 errors THEN lightweight templates SHALL include clear navigation back to search/home
4. WHEN showing loading states THEN skeleton UI SHALL maintain consistent heights and element counts
5. WHEN validating structured data THEN Search Console Rich Results SHALL show 0 errors for all schemas

### Requirement 34: アナリティクス・監視・アラート

**User Story:** As a site reliability engineer, I want comprehensive monitoring, so that we can maintain performance SLOs.

#### Acceptance Criteria

1. WHEN measuring Core Web Vitals THEN data SHALL be sent to Vercel Analytics with 10% sampling rate
2. WHEN SLO violations occur THEN GitHub Issues SHALL be automatically created with performance data
3. WHEN tracking user journeys THEN key conversion funnels SHALL be monitored with proper attribution
4. WHEN CSP violations occur THEN reports SHALL be collected and reviewed before enforcing policies
5. WHEN performance degrades THEN alerts SHALL trigger at 20% threshold exceedance with escalation paths

### Requirement 35: 受け入れ基準詳細

**User Story:** As a QA engineer, I want comprehensive acceptance criteria, so that we can verify all functionality meets requirements.

#### Acceptance Criteria

1. WHEN testing sort stability THEN identical results SHALL appear in same order across 10 reload attempts
2. WHEN using JPY currency THEN all pages SHALL consistently show "￥", thousand separators, and "税込" notation
3. WHEN bookmarking filtered URLs THEN filter + page + sort state SHALL be completely restorable from URL alone
4. WHEN encountering 0 results THEN 3 suggestions SHALL be unique, in-stock, and price-ascending ordered
5. WHEN validating JSON-LD THEN Search Console Rich Results SHALL show 0 errors for Product and ItemList schemas
6. WHEN enforcing CSP THEN production deployment SHALL have 0 blocked resources after report-only analysis
7. WHEN using keyboard navigation THEN complete search→results→filter→detail journey SHALL be accessible without mouse
8. WHEN switching i18n/currency THEN FCP/LCP SHALL not degrade by more than ±5% from baseline measurements

### Requirement 31: リスク対策

**User Story:** As a development team, I want risk mitigation strategies, so that we can handle common implementation challenges.

#### Acceptance Criteria

1. WHEN handling image assets THEN dummy images SHALL be prepared in public/placeholders/\* with fixed aspect ratios
2. WHEN managing copy text THEN content SHALL be externalized to copy.json for easy replacement
3. WHEN designing Sanity schema THEN MVP schema (product/ingredient/brand) SHALL be developed in parallel
4. WHEN encountering missing assets THEN fallback strategies SHALL be implemented
5. WHEN facing content gaps THEN placeholder content SHALL maintain design integrity
