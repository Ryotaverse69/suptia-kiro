# Implementation Plan

**specVersion**: 2025-08-16

- [ ] 1. Amazon/iHerbコネクタ実装＋モック＋envテンプレ更新
  - Create lib/pricing/amazon-connector.ts with Amazon Product Advertising API v5 integration
  - Implement lib/pricing/iherb-connector.ts with iHerb Affiliate API integration
  - Add mocks/amazon-mock.ts and mocks/iherb-mock.ts for development and testing
  - Update .env.example with AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_ASSOCIATE_TAG, IHERB_AFFILIATE_ID
  - Create API rate limiting and error handling for both new connectors
  - Add comprehensive unit tests for Amazon and iHerb connectors with mock data
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. 4ソース統合マッチャー＋信頼度スコア計算＋テスト
  - Update lib/pricing/price-matcher.ts to support 4 sources (Rakuten, Yahoo, Amazon, iHerb)
  - Implement lib/pricing/confidence-scorer.ts for GTIN/JAN priority matching with 0-1 confidence scores
  - Create lib/pricing/multi-source-matcher.ts for unified product matching across all sources
  - Add confidence score calculation: GTIN/JAN match = 1.0, name+capacity+brand = 0.7-0.9, fuzzy < 0.6
  - Implement warning display for confidence < 0.6 with manual confirmation prompts
  - Add comprehensive boundary value tests for multi-source matching scenarios
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3. 3ソース以上最安値表示＋価格集約＋信頼性バッジ
  - Create lib/pricing/price-aggregator.ts for 4-source price aggregation and analysis
  - Implement components/pricing/MultiSourcePriceTable.tsx with minimum 3-source requirement
  - Add components/pricing/ConfidenceIndicator.tsx for visual confidence score display
  - Create components/pricing/PriceReliabilityBadge.tsx for price reliability indication
  - Implement warning display when fewer than 3 sources available
  - Add price difference explanation (shipping, tax, subscription) when price spread is large
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. CompareView実装（最大4商品・並べ替え・フィルタ・URL共有）
  - Create components/compare/CompareView.tsx for side-by-side product comparison (max 4 products)
  - Implement components/compare/CompareTable.tsx with price, score, ingredients, capacity, cost per day
  - Add components/compare/CompareSorter.tsx for sorting by price, score, cost per day, confidence
  - Create components/compare/CompareFilter.tsx for filtering by brand, price range, capacity, rating score
  - Implement lib/compare/url-serializer.ts for shareable comparison URLs
  - Add hooks/useCompareState.ts for comparison state management
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5. Favorites機能（ローカルストレージ・価格同期・エクスポート・グループ化）
  - Create lib/favorites/favorites-storage.ts for local storage management with product IDs
  - Implement components/favorites/FavoritesList.tsx displaying latest price information for saved products
  - Add components/favorites/FavoriteButton.tsx for add/remove/reorder functionality
  - Create lib/favorites/favorites-export.ts for JSON format export/import functionality
  - Implement components/favorites/FavoritesGrouping.tsx for category/brand-based grouping
  - Add hooks/useFavorites.ts and hooks/useFavoritesSync.ts for state and price sync management
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 6. Price Alerts（通知キュー・重複防止・メール配信）
  - Create lib/alerts/alert-engine.ts for target price, discount rate, and stock availability alerts
  - Implement lib/alerts/notification-queue.ts with duplicate prevention (24-hour window per product/condition)
  - Add lib/alerts/duplicate-prevention.ts for preventing duplicate notifications within 24 hours
  - Create services/email-service.ts for email notifications with product name, current price, target price, product link
  - Implement components/alerts/AlertsManager.tsx for alert setup, management, and history display
  - Add hooks/useAlerts.ts and hooks/useNotifications.ts for alert and notification state management
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 7. メール通知システム（配信制限・リトライ・配信停止）
  - Implement email address registration with opt-in confirmation in services/email-service.ts
  - Add email delivery retry functionality for failed deliveries
  - Create delivery frequency limits: maximum 5 emails per day, 20 emails per week
  - Implement one-click unsubscribe functionality with secure tokens
  - Add email template system for price alert notifications
  - Create delivery tracking and statistics for monitoring email performance
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 8. CI a11y強化（axe-core・テーブルa11y・キーボードナビ・スクリーンリーダー）
  - Integrate axe-core automated testing for all pages in CI pipeline
  - Create lib/a11y/table-a11y.ts for PriceTable and CompareView caption, scope, aria-sort validation
  - Implement lib/a11y/keyboard-nav.ts for Tab, Enter, Space, Arrow key testing on all interactive elements
  - Add lib/a11y/screen-reader.ts for NVDA and JAWS screen reader compatibility testing automation
  - Update .github/workflows/ci.yml to fail on A11y violations with specific fix suggestions
  - Create comprehensive A11y test coverage for new M1 components
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 9. ドキュメント更新（README・API・A11Y・通知仕様書）
  - Update README.md with M1 new features: Compare View, Favorites, Price Alerts functionality
  - Create docs/API.md with Amazon and iHerb integration specifications and usage examples
  - Update docs/A11Y.md with table accessibility and keyboard navigation specifications
  - Create docs/NOTIFICATIONS.md with notification queue and email delivery specifications
  - Implement automatic documentation generation from code comments and type definitions
  - Create PR with documentation changes using draft status and automerge label
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_