# Implementation Plan

**specVersion**: 2025-08-16

- [ ] 1. 摂取ログ/目標管理（記録・履歴・進捗・30日復元）
  - Create schemas/intake-log.schema.ts and schemas/goal.schema.ts for intake logging and goal management data structures
  - Implement lib/intake/log-manager.ts for recording product ID, intake amount, timestamp, notes with soft delete and 30-day recovery
  - Add lib/intake/goal-tracker.ts for period, target intake amount, alert settings management
  - Create components/intake/IntakeLogger.tsx and components/intake/ProgressDashboard.tsx for daily, weekly, monthly intake status graphs
  - Implement lib/intake/log-recovery.ts for deleted log recovery within 30 days with complete restoration capability
  - Add comprehensive testing for log data integrity and recovery functionality
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. 継続学習リコメンド（重み再学習・説明可能AI）
  - Create lib/learning/recommendation-engine.ts using intake history, goals, ratings, purchase history as learning data
  - Implement lib/learning/weight-updater.ts for algorithm weight re-learning based on user feedback
  - Add lib/learning/explainable-ai.ts for generating specific explanations of "why this product is recommended"
  - Create components/learning/RecommendationExplanation.tsx for displaying weight change rationale and impact
  - Implement accuracy measurement and quantitative improvement tracking for recommendation precision
  - Add comprehensive testing for explainable AI functionality and weight change explanations
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3. 外部連携（OAuth/同意管理・オプトイン必須）
  - Create lib/integrations/oauth-manager.ts for OAuth 2.0 secure authentication and authorization
  - Implement lib/integrations/consent-manager.ts for mandatory explicit user consent for external data usage
  - Add services/health-app-connector.ts, services/purchase-history-connector.ts, services/activity-data-connector.ts for external service integration
  - Create components/integrations/ConsentForm.tsx with clear data usage purpose explanations and opt-in requirements
  - Implement one-click connection revocation and related data deletion functionality
  - Add comprehensive testing for consent enforcement and data usage transparency
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. コミュニティMVP（投稿・モデレーション・評価・制裁）
  - Create lib/community/post-manager.ts for product reviews, intake experiences, questions, and answers posting
  - Implement lib/community/moderation-engine.ts for pharmaceutical law compliant automatic moderation detecting medical effects, disease names, treatment effect assertions
  - Add components/community/PostEditor.tsx and components/community/ModerationQueue.tsx for post usefulness evaluation, likes, follow features
  - Create lib/community/user-reputation.ts for inappropriate post reporting, deletion, user restriction functionality
  - Implement mandatory disclaimer display ("個人の体験です" etc.) for all posts
  - Add comprehensive testing for automatic moderation and pharmaceutical law compliance (target: 0 violations)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_