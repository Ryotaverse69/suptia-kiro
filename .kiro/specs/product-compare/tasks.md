# Implementation Plan

**specVersion**: 2025-08-15

- [x] 1. Create core comparison logic and utilities
  - Implement lib/compare/compare-logic.ts for product comparison data processing
  - Create lib/compare/sort-utils.ts with sortByScore, sortByPrice, sortByName functions
  - Add lib/compare/score-summary.ts for calculating max, min, average scores per category
  - Implement lib/compare/warning-analyzer.ts for finding most important warnings and counting by severity
  - Create TypeScript interfaces for Product, ScoreSummary, WarningAnalysis, SortConfig
  - Add unit tests for all comparison logic functions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_

- [x] 2. Build accessible table components with proper ARIA attributes
  - Create components/compare/ProductCompareTable.tsx with proper table structure
  - Implement components/compare/CompareTableHeader.tsx with sortable headers and aria-sort attributes
  - Add components/compare/CompareTableRow.tsx with scope="row" attributes for product names
  - Create components/compare/ScoreSummaryRow.tsx for displaying score breakdown summaries
  - Implement proper table caption generation describing the comparison
  - Add keyboard navigation support (Tab, Enter, Space, Arrow keys) to table components
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.5_

- [x] 3. Implement warning highlight and summary features
  - Create components/compare/WarningHighlight.tsx for displaying critical warnings
  - Add warning count display showing total warnings per product
  - Implement most important warning identification and highlighting
  - Create visual indicators for different warning severity levels
  - Add accessible descriptions for warning highlights using aria-label
  - Integrate warning analysis into comparison table display
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [x] 4. Add sorting functionality with accessibility support
  - Implement components/compare/CompareControls.tsx for sort controls
  - Create sortable column headers with proper aria-sort state management
  - Add keyboard-accessible sort buttons (Enter and Space activation)
  - Implement sort state persistence and visual indicators
  - Create accessible announcements for sort state changes using live regions
  - Add sort functionality for score (ascending/descending) and price (ascending/descending)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 1.3, 1.4_

- [x] 5. Create JSON-LD ItemList structured data component
  - Implement components/seo/CompareItemListJsonLd.tsx for ItemList schema
  - Generate ListItem entries for each compared product with position, name, url
  - Include Product schema with name, url, and Offer schema with price and currency
  - Add schema.org compliance validation for ItemList structure
  - Integrate JSON-LD component into comparison page layout
  - Create tests to verify JSON-LD output matches schema.org specification
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Build main comparison page with product limit enforcement
  - Create app/compare/page.tsx as main comparison page component
  - Implement maximum 3 products limit with appropriate error messaging
  - Add dynamic layout adjustment based on number of selected products
  - Create empty state display when no products are selected for comparison
  - Implement product removal functionality with table updates
  - Add responsive design for mobile and desktop viewing
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7. Implement comprehensive accessibility testing
  - Set up eslint-plugin-jsx-a11y rules specifically for table components
  - Create accessibility test suite for keyboard navigation (Tab, Enter, Space, Arrow keys)
  - Add screen reader testing for proper table structure and content reading
  - Implement ARIA attribute validation tests (aria-sort, scope, caption)
  - Create focus management tests for table navigation
  - Add contrast ratio and text scaling tests for accessibility compliance
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 8. Create E2E test covering main comparison workflow
  - Implement single E2E test covering product selection → comparison display → sorting → detail review
  - Add keyboard-only navigation test using Tab, Enter, Space, and Arrow keys
  - Create screen reader compatibility test with accessibility tools
  - Test sorting functionality for both score and price in ascending/descending order
  - Verify JSON-LD output in rendered page using structured data testing tools
  - Add performance validation within E2E test to ensure Lighthouse budget compliance
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 9. Add performance optimization and Lighthouse budget compliance
  - Optimize component rendering with React.memo for expensive calculations
  - Implement lazy loading for product images and non-critical content
  - Add code splitting for comparison page to reduce initial bundle size
  - Optimize score calculation algorithms for better performance
  - Create performance monitoring to ensure LCP≤2.5s, TBT≤200ms, CLS≤0.1, JS≤300KB
  - Add performance regression tests in CI pipeline
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 10. Create comprehensive test suite and integration
  - Write unit tests for all comparison logic, sorting, and warning analysis functions
  - Create component tests for ProductCompareTable, ScoreSummaryRow, WarningHighlight
  - Add integration tests for complete comparison workflow from data to display
  - Implement accessibility integration tests combining multiple a11y features
  - Create JSON-LD validation tests using schema.org testing tools
  - Add performance integration tests to verify Lighthouse budget compliance
  - _Requirements: 1.1-1.5, 2.1-2.5, 3.1-3.5, 4.1-4.5, 5.1-5.5, 6.1-6.5, 7.1-7.5, 8.1-8.5_