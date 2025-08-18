# Implementation Plan

**specVersion**: 2025-08-16

- [ ] 1. 安全口コミ要約パイプライン（入力→フィルタ→要約→検証→出力）
  - Create lib/reviews/safe-summarizer.ts with pharmaceutical law compliant review summarization pipeline
  - Implement lib/reviews/compliance-filter.ts for medical claims, disease names, and treatment effects filtering
  - Add services/review-pipeline.ts for input→filtering→summary→compliance check→output workflow
  - Create components/reviews/ReviewSummary.tsx with mandatory disclaimers ("個人の感想です", "効果には個人差があります")
  - Implement fallback handling for summary generation failures (show review count only)
  - Add comprehensive tests for prohibited expression detection and filtering (target: 0 violations)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. 価格履歴グラフ（3期間・4ソース・異常値検出・ツールチップ）
  - Create lib/pricing/price-history.ts for historical price data management across 4 sources
  - Implement components/pricing/PriceHistoryChart.tsx with 3 months, 6 months, 1 year period selection
  - Add lib/pricing/anomaly-detector.ts for detecting price anomalies (50%+ day-over-day changes)
  - Create components/pricing/PriceChartControls.tsx for period and source selection
  - Implement tooltip display with date, price, source information on mouseover
  - Add data validation and integrity checks for price history consistency
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3. アフィリエイトリンク最適化（4ソース・クリック計測・重複除外）
  - Create lib/affiliate/link-builder.ts for optimized affiliate link generation across Rakuten, Yahoo, Amazon, iHerb
  - Implement lib/affiliate/click-tracker.ts for tracking product ID, source, user session, timestamp
  - Add lib/affiliate/duplicate-filter.ts for excluding duplicate clicks (5 minutes, same session, same product, same source)
  - Create services/affiliate-service.ts for conversion tracking across affiliate programs
  - Implement automatic fallback to alternative sources when links are invalid
  - Add comprehensive testing for duplicate click prevention (target: 0 duplicate clicks)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Stripe+Entitlements有料プラン（月額・年額・機能制限・解放）
  - Create lib/subscription/stripe-integration.ts for monthly and yearly plan payments via Stripe
  - Implement lib/subscription/entitlements-manager.ts for feature access control based on subscription status
  - Add feature limits: free plan (3 compare products, 10 favorites, 5 alerts) vs premium plan (10 compare, 100 favorites, 50 alerts)
  - Create components/subscription/PlanSelector.tsx and components/subscription/PaymentForm.tsx
  - Implement lib/subscription/grace-period-manager.ts for 7-day grace period with gradual feature restrictions
  - Add real-time subscription status validation and feature access enforcement
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5. 収益分析ダッシュボード（アフィリエイト・サブスク・予測・エクスポート）
  - Create lib/analytics/revenue-tracker.ts for affiliate revenue, subscription revenue, and total revenue tracking
  - Implement components/analytics/RevenueDashboard.tsx displaying click counts, conversion rates by source/product/time
  - Add lib/analytics/subscription-analytics.ts for new registrations, cancellations, MRR, churn rate analysis
  - Create lib/analytics/forecast-engine.ts for monthly and yearly revenue forecasting based on historical data
  - Implement CSV and JSON format data export functionality for revenue analytics
  - Add comprehensive revenue calculation validation and reporting accuracy tests
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 6. JSON-LD拡張（Review・ItemList・Rich Results検証）
  - Update lib/seo/json-ld.ts to include Review structured data with reviewBody, author, datePublished, reviewRating
  - Create lib/seo/itemlist-jsonld.ts for ItemList structured data on product lists, comparison results, favorites
  - Implement lib/seo/structured-data-validator.ts with Google Rich Results Test integration
  - Add automatic structured data validation in CI pipeline with specific error reporting and fix suggestions
  - Create components/seo/ReviewJsonLd.tsx and components/seo/ItemListJsonLd.tsx components
  - Add comprehensive schema.org compliance testing and Rich Results eligibility verification
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_