# Implementation Plan

- [ ] 1. Set up lib/cost.ts with precise calculation functions **[M]**
  - Create lib directory structure if it doesn't exist
  - Implement calculateEffectiveCostPerDay function with proper error handling
  - Implement calculateNormalizedCostPerMgPerDay function with mg/day = sum(ingredients.amountMgPerServing) * servingsPerDay formula
  - Implement calculateProductCosts wrapper function with full precision internal calculation
  - Add TypeScript interfaces for ProductCostData and CostCalculationResult
  - Add Intl.NumberFormat('ja-JP',{style:'currency',currency:'JPY'}) for display formatting
  - _Requirements: 1.1, 2.1, 2.2, 4.3, 4.4, 5.1, 5.2, 6.5_

- [ ] 2. Create comprehensive unit tests for cost calculation logic
  - Set up test file lib/__tests__/cost.test.ts
  - Write tests for calculateEffectiveCostPerDay with normal cases and edge cases
  - Write tests for calculateNormalizedCostPerMgPerDay with multiple ingredients
  - Write tests for error handling (zero values, negative values, missing data)
  - Write tests for calculateProductCosts integration function
  - _Requirements: 3.1, 3.2, 3.3, 5.3_

- [ ] 3. Create PriceTable component with proper formatting
  - Create components directory structure in app/products/[slug]/
  - Implement PriceTable component with TypeScript interfaces
  - Add proper currency formatting using Intl.NumberFormat
  - Implement responsive design with Tailwind CSS (desktop table, mobile stack)
  - Add error state handling and display
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 4. Create component tests for PriceTable
  - Set up test file for PriceTable component
  - Write tests for normal price display with mock product data
  - Write tests for error state display when calculation fails
  - Write tests for responsive behavior and accessibility
  - Write tests for currency formatting and decimal precision
  - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.3_

- [ ] 5. Create products/[slug] page structure
  - Create app/products/[slug]/page.tsx file
  - Set up basic page layout with product information display
  - Integrate PriceTable component into the page
  - Add proper TypeScript types for product data from Sanity
  - Implement error boundaries for price calculation failures
  - _Requirements: 1.1, 2.1, 4.1, 5.1_

- [ ] 6. Add integration between Sanity product data and price calculations
  - Create utility functions to transform Sanity product data to ProductCostData
  - Handle missing or invalid data from Sanity gracefully
  - Add proper error handling for data transformation
  - Ensure price calculations work with real Sanity schema structure
  - _Requirements: 1.2, 1.3, 2.3, 5.1_

- [ ] 7. Implement accessibility features and final polish **[R]**
  - Add proper ARIA labels and table headers for screen readers
  - Implement <caption> element, <th scope="col"> attributes, and aria-sort functionality
  - Implement keyboard navigation support
  - Ensure color contrast 4.5:1 compliance
  - Add loading states and skeleton UI for price calculations
  - Add proper semantic HTML structure for price information
  - _Requirements: 4.1, 4.2, 4.3, 7.1, 7.2, 7.3, 7.4_