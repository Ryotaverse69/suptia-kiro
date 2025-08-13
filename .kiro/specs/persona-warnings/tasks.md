# Implementation Plan

- [ ] 1. Create compliance checker service with rules.json integration **[R]**
  - Create lib/compliance.ts with ComplianceChecker interface and implementation
  - Implement checkText function that loads and applies rules from tools/phrase-checker/rules.json
  - Add loadRules function to dynamically read rules.json file
  - Implement suggestAlternatives function for providing replacement suggestions
  - Add proper error handling for file loading and pattern matching failures
  - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2_

- [ ] 2. Create minimal persona rules engine with required fields **[R]**
  - Create lib/persona-rules.ts with PersonaRule interfaces using required fields {tag, ingredient, severity('low'|'mid'|'high'), message}
  - Implement getMinimalPersonaRules function with basic pregnancy, lactation, medication, and stimulant sensitivity rules
  - Implement checkPersonaRules function with severity-descending sort and message deduplication
  - Add warning aggregation logic for folding duplicate messages
  - Include proper TypeScript types for all persona-related data structures
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.1, 6.2, 6.3_

- [ ] 3. Create comprehensive unit tests for compliance and persona services
  - Set up test files lib/__tests__/compliance.test.ts and lib/__tests__/persona-rules.test.ts
  - Write tests for compliance checker with various NG phrase patterns
  - Write tests for persona rules matching with different ingredient combinations
  - Write tests for error handling scenarios (missing files, invalid data)
  - Write tests for edge cases (empty strings, null values, malformed rules)
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 4. Create WarningBanner component with enhanced accessibility **[R]**
  - Create components/WarningBanner.tsx with proper TypeScript interfaces
  - Implement severity-based styling (high=red, mid=orange, low=yellow) using Tailwind CSS
  - Add dismiss functionality with onDismiss callback and focus management
  - Implement responsive design for mobile and desktop layouts
  - Add proper ARIA attributes (role="status", aria-level) and keyboard navigation (Esc/× to close, focus return)
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 5. Create PersonaWarnings container component
  - Create components/PersonaWarnings.tsx that integrates compliance and persona checking
  - Implement state management for dismissed warnings using React hooks
  - Add logic to combine and prioritize multiple warning types
  - Implement conditional rendering based on warning presence
  - Add proper error boundaries for warning check failures
  - _Requirements: 1.4, 2.4, 4.1, 6.4_

- [ ] 6. Create component tests for warning UI components
  - Set up test files for WarningBanner and PersonaWarnings components
  - Write tests for different severity levels and visual styling
  - Write tests for dismiss functionality and state management
  - Write tests for accessibility features (keyboard navigation, screen reader support)
  - Write tests for responsive behavior and mobile layout
  - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.3, 4.4_

- [ ] 7. Integrate warning system into products/[slug] page
  - Update or create app/products/[slug]/page.tsx to include PersonaWarnings component
  - Add logic to extract product description and ingredient data for warning checks
  - Implement user persona detection (mock for MVP, real integration later)
  - Add proper error handling for warning system failures
  - Ensure warnings display prominently but non-blockingly on the product page
  - _Requirements: 1.1, 2.1, 4.1, 5.1, 6.4_

- [ ] 8. Add integration tests and final accessibility polish
  - Create integration tests that verify end-to-end warning functionality
  - Test warning system with real product data from Sanity
  - Implement keyboard navigation support (Tab, Enter, Escape keys)
  - Add screen reader optimizations and WCAG compliance verification
  - Test warning system performance with multiple simultaneous warnings
  - _Requirements: 3.1, 4.4, 5.4_