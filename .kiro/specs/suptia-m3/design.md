# Suptia M3 Design Document

**specVersion**: 2025-08-16

## Overview

Suptia M3（プラットフォーム化）では、M2で構築した収益化基盤を拡張し、プラットフォーム化機能を実現します。摂取ログ/目標管理、継続学習リコメンド、外部連携、コミュニティ機能を通じて、ユーザーが継続的にサプリメント摂取を管理し、パーソナライズされた推奨を受け、他のユーザーと情報共有できるプラットフォームを構築します。

M3スコープ：摂取ログスキーマ → 重み再学習（説明可能AI） → OAuth/同意管理 → コミュニティMVP → モデレーション → ログ復元機能 → 重み変更説明 → 外部データオプトイン必須。

## Architecture

### Intake Logging Module (摂取ログモジュール)
```
lib/intake/
├── log-manager.ts (摂取ログ管理)
├── goal-tracker.ts (目標追跡)
├── progress-analyzer.ts (進捗分析)
├── log-recovery.ts (ログ復元機能)
└── intake-scheduler.ts (摂取スケジュール)

components/intake/
├── IntakeLogger.tsx (摂取ログ入力)
├── IntakeHistory.tsx (摂取履歴表示)
├── GoalSetter.tsx (目標設定)
├── ProgressDashboard.tsx (進捗ダッシュボード)
└── IntakeCalendar.tsx (摂取カレンダー)

hooks/
├── useIntakeLogs.ts (摂取ログ状態管理)
├── useGoals.ts (目標状態管理)
└── useProgress.ts (進捗状態管理)

schemas/
├── intake-log.schema.ts (摂取ログスキーマ)
└── goal.schema.ts (目標スキーマ)
```

### Continuous Learning Module (継続学習モジュール)
```
lib/learning/
├── recommendation-engine.ts (推奨エンジン)
├── weight-updater.ts (重み更新)
├── explainable-ai.ts (説明可能AI)
├── feedback-processor.ts (フィードバック処理)
└── accuracy-tracker.ts (精度追跡)

components/learning/
├── RecommendationList.tsx (推奨リスト)
├── RecommendationExplanation.tsx (推奨理由説明)
├── FeedbackForm.tsx (フィードバックフォーム)
├── LearningProgress.tsx (学習進捗)
└── AccuracyMetrics.tsx (精度指標)

services/
├── ml-service.ts (機械学習サービス)
├── feature-extractor.ts (特徴量抽出)
└── model-trainer.ts (モデル訓練)

hooks/
├── useRecommendations.ts (推奨状態管理)
├── useLearning.ts (学習状態管理)
└── useFeedback.ts (フィードバック状態管理)
```

### External Integration Module (外部連携モジュール)
```
lib/integrations/
├── oauth-manager.ts (OAuth管理)
├── consent-manager.ts (同意管理)
├── data-connector.ts (データコネクタ)
├── sync-scheduler.ts (同期スケジューラ)
└── integration-validator.ts (連携検証)

components/integrations/
├── IntegrationSetup.tsx (連携設定)
├── ConsentForm.tsx (同意フォーム)
├── DataSyncStatus.tsx (同期状態)
├── ConnectedServices.tsx (連携サービス一覧)
└── IntegrationSettings.tsx (連携設定管理)

services/
├── oauth-service.ts (OAuthサービス)
├── health-app-connector.ts (健康アプリ連携)
├── purchase-history-connector.ts (購入履歴連携)
└── activity-data-connector.ts (活動データ連携)

hooks/
├── useIntegrations.ts (連携状態管理)
├── useConsent.ts (同意状態管理)
└── useDataSync.ts (同期状態管理)
```

### Community Module (コミュニティモジュール)
```
lib/community/
├── post-manager.ts (投稿管理)
├── moderation-engine.ts (モデレーションエンジン)
├── user-reputation.ts (ユーザー評価)
├── content-filter.ts (コンテンツフィルタ)
└── community-analytics.ts (コミュニティ分析)

components/community/
├── PostEditor.tsx (投稿エディタ)
├── PostList.tsx (投稿一覧)
├── PostDetail.tsx (投稿詳細)
├── UserProfile.tsx (ユーザープロフィール)
├── ModerationQueue.tsx (モデレーションキュー)
└── CommunityStats.tsx (コミュニティ統計)

services/
├── moderation-service.ts (モデレーションサービス)
├── notification-service.ts (通知サービス)
└── reputation-service.ts (評価サービス)

hooks/
├── usePosts.ts (投稿状態管理)
├── useModeration.ts (モデレーション状態管理)
└── useCommunity.ts (コミュニティ状態管理)
```

### Privacy & Data Management Module (プライバシー・データ管理モジュール)
```
lib/privacy/
├── data-manager.ts (データ管理)
├── consent-tracker.ts (同意追跡)
├── data-exporter.ts (データエクスポート)
├── deletion-manager.ts (削除管理)
└── audit-logger.ts (監査ログ)

components/privacy/
├── PrivacyDashboard.tsx (プライバシーダッシュボード)
├── DataUsageView.tsx (データ使用状況)
├── ConsentManager.tsx (同意管理)
├── DataExport.tsx (データエクスポート)
└── DeletionRequest.tsx (削除要求)

services/
├── gdpr-service.ts (GDPR準拠サービス)
├── audit-service.ts (監査サービス)
└── compliance-service.ts (コンプライアンスサービス)

hooks/
├── usePrivacy.ts (プライバシー状態管理)
├── useDataManagement.ts (データ管理状態管理)
└── useConsent.ts (同意状態管理)
```

### Performance Monitoring Module (パフォーマンス監視モジュール)
```
lib/monitoring/
├── performance-tracker.ts (パフォーマンス追跡)
├── metrics-collector.ts (指標収集)
├── alert-manager.ts (アラート管理)
├── log-analyzer.ts (ログ分析)
└── health-checker.ts (ヘルスチェック)

components/monitoring/
├── PerformanceDashboard.tsx (パフォーマンスダッシュボード)
├── MetricsChart.tsx (指標チャート)
├── AlertsList.tsx (アラート一覧)
└── SystemHealth.tsx (システムヘルス)

services/
├── monitoring-service.ts (監視サービス)
├── alerting-service.ts (アラートサービス)
└── analytics-service.ts (分析サービス)
```

## Components and Interfaces

### Intake Logging System

```typescript
// schemas/intake-log.schema.ts
interface IntakeLog {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  unit: string;
  timestamp: string;
  notes?: string;
  mood?: 'excellent' | 'good' | 'neutral' | 'poor' | 'terrible';
  sideEffects?: string[];
  effectiveness?: number; // 1-5 scale
  createdAt: string;
  updatedAt: string;
  deletedAt?: string; // for soft delete and recovery
}

interface IntakeGoal {
  id: string;
  userId: string;
  productId: string;
  targetAmount: number;
  targetFrequency: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate?: string;
  alertSettings: {
    reminderTime?: string;
    missedDoseAlert: boolean;
    progressAlert: boolean;
  };
  isActive: boolean;
  createdAt: string;
}

// lib/intake/log-manager.ts
interface LogManager {
  createLog(log: Omit<IntakeLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  updateLog(id: string, updates: Partial<IntakeLog>): Promise<void>;
  deleteLog(id: string): Promise<void>; // soft delete
  recoverLog(id: string): Promise<void>; // recovery within 30 days
  getLogs(userId: string, filters?: LogFilters): Promise<IntakeLog[]>;
  getLogsByDateRange(userId: string, startDate: string, endDate: string): Promise<IntakeLog[]>;
}

interface LogFilters {
  productId?: string;
  dateRange?: {start: string; end: string};
  includeDeleted?: boolean;
}

// lib/intake/progress-analyzer.ts
interface ProgressAnalysis {
  userId: string;
  goalId: string;
  period: 'daily' | 'weekly' | 'monthly';
  progress: {
    target: number;
    actual: number;
    percentage: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  predictions: {
    goalAchievementDate?: string;
    completionProbability: number;
    recommendedAdjustments: string[];
  };
  insights: {
    bestPerformingDays: string[];
    commonMissedDoses: string[];
    effectivenessCorrelation: number;
  };
}

interface ProgressAnalyzer {
  analyzeProgress(userId: string, goalId: string): Promise<ProgressAnalysis>;
  generateInsights(logs: IntakeLog[], goal: IntakeGoal): Promise<string[]>;
  predictGoalAchievement(logs: IntakeLog[], goal: IntakeGoal): Promise<{date?: string; probability: number}>;
}
```

### Continuous Learning System

```typescript
// lib/learning/recommendation-engine.ts
interface UserFeatures {
  userId: string;
  demographics: {
    age?: number;
    gender?: string;
    lifestyle: string[];
  };
  intakeHistory: {
    products: string[];
    frequency: Record<string, number>;
    effectiveness: Record<string, number>;
    sideEffects: Record<string, string[]>;
  };
  goals: {
    categories: string[];
    priorities: Record<string, number>;
  };
  preferences: {
    formTypes: string[];
    brands: string[];
    priceRange: {min: number; max: number};
  };
  feedback: {
    ratings: Record<string, number>;
    reviews: Record<string, string>;
  };
}

interface RecommendationResult {
  productId: string;
  score: number; // 0-1
  confidence: number; // 0-1
  reasoning: {
    factors: Array<{
      factor: string;
      weight: number;
      contribution: number;
      explanation: string;
    }>;
    primaryReasons: string[];
    concerns: string[];
  };
  metadata: {
    modelVersion: string;
    generatedAt: string;
    personalizedFor: string;
  };
}

// lib/learning/explainable-ai.ts
interface ExplanationEngine {
  explainRecommendation(recommendation: RecommendationResult, userFeatures: UserFeatures): Promise<string>;
  explainWeightChange(oldWeights: Record<string, number>, newWeights: Record<string, number>): Promise<string>;
  generateFactorExplanation(factor: string, weight: number, contribution: number): string;
  createPersonalizedExplanation(userId: string, productId: string, factors: any[]): Promise<string>;
}

// lib/learning/weight-updater.ts
interface ModelWeights {
  version: string;
  weights: Record<string, number>;
  metadata: {
    trainingData: {
      samples: number;
      features: string[];
      lastUpdated: string;
    };
    performance: {
      accuracy: number;
      precision: number;
      recall: number;
      f1Score: number;
    };
    changes: Array<{
      factor: string;
      oldWeight: number;
      newWeight: number;
      reason: string;
      impact: string;
    }>;
  };
}

interface WeightUpdater {
  updateWeights(feedbackData: UserFeedback[]): Promise<ModelWeights>;
  validateWeightChanges(oldWeights: ModelWeights, newWeights: ModelWeights): boolean;
  explainWeightChanges(changes: ModelWeights['metadata']['changes']): string[];
  rollbackWeights(version: string): Promise<ModelWeights>;
}

interface UserFeedback {
  userId: string;
  productId: string;
  recommendationId: string;
  rating: number; // 1-5
  purchased: boolean;
  helpful: boolean;
  reasons: string[];
  timestamp: string;
}
```

### External Integration System

```typescript
// lib/integrations/oauth-manager.ts
interface OAuthProvider {
  id: string;
  name: string;
  type: 'health_app' | 'purchase_history' | 'activity_tracker' | 'nutrition_app';
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  dataTypes: string[];
}

interface OAuthConnection {
  id: string;
  userId: string;
  providerId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  scopes: string[];
  status: 'active' | 'expired' | 'revoked' | 'error';
  lastSync: string;
  createdAt: string;
}

interface ConsentRecord {
  id: string;
  userId: string;
  providerId: string;
  dataTypes: string[];
  purposes: string[];
  consentedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  isActive: boolean;
}

// lib/integrations/data-connector.ts
interface ExternalData {
  source: string;
  type: 'health_metrics' | 'purchase_history' | 'activity_data' | 'nutrition_data';
  data: any;
  timestamp: string;
  userId: string;
  consentId: string;
}

interface DataConnector {
  connectProvider(userId: string, providerId: string, scopes: string[]): Promise<string>; // auth URL
  handleCallback(code: string, state: string): Promise<OAuthConnection>;
  syncData(connectionId: string): Promise<ExternalData[]>;
  revokeConnection(connectionId: string): Promise<void>;
  validateConsent(userId: string, providerId: string, dataType: string): Promise<boolean>;
}

// services/health-app-connector.ts
interface HealthAppData {
  steps: number;
  heartRate: {average: number; resting: number};
  sleep: {duration: number; quality: number};
  weight: number;
  bloodPressure?: {systolic: number; diastolic: number};
  date: string;
}

interface PurchaseHistoryData {
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  purchaseDate: string;
  source: string;
}
```

### Community System

```typescript
// lib/community/post-manager.ts
interface CommunityPost {
  id: string;
  userId: string;
  type: 'review' | 'experience' | 'question' | 'answer';
  title: string;
  content: string;
  productId?: string;
  tags: string[];
  status: 'published' | 'pending' | 'rejected' | 'deleted';
  moderationFlags: string[];
  stats: {
    views: number;
    likes: number;
    replies: number;
    helpfulVotes: number;
  };
  createdAt: string;
  updatedAt: string;
  moderatedAt?: string;
}

interface PostReply {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentReplyId?: string;
  status: 'published' | 'pending' | 'rejected' | 'deleted';
  moderationFlags: string[];
  stats: {
    likes: number;
    helpfulVotes: number;
  };
  createdAt: string;
}

// lib/community/moderation-engine.ts
interface ModerationRule {
  id: string;
  type: 'prohibited_terms' | 'medical_claims' | 'spam_detection' | 'inappropriate_content';
  pattern: string | RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'flag' | 'auto_reject' | 'require_review' | 'auto_approve';
  description: string;
}

interface ModerationResult {
  postId: string;
  status: 'approved' | 'rejected' | 'flagged' | 'requires_review';
  flags: Array<{
    rule: string;
    severity: string;
    reason: string;
    confidence: number;
  }>;
  suggestedActions: string[];
  autoModerated: boolean;
  reviewRequired: boolean;
}

interface ModerationEngine {
  moderatePost(post: CommunityPost): Promise<ModerationResult>;
  moderateReply(reply: PostReply): Promise<ModerationResult>;
  updateModerationRules(rules: ModerationRule[]): Promise<void>;
  escalateToHuman(postId: string, reason: string): Promise<void>;
  applyPenalty(userId: string, violation: string, severity: string): Promise<void>;
}

// lib/community/user-reputation.ts
interface UserReputation {
  userId: string;
  score: number; // 0-1000
  level: 'newcomer' | 'contributor' | 'trusted' | 'expert' | 'moderator';
  badges: Array<{
    id: string;
    name: string;
    description: string;
    earnedAt: string;
  }>;
  stats: {
    postsCreated: number;
    helpfulVotes: number;
    moderationActions: number;
    violations: number;
  };
  restrictions: Array<{
    type: string;
    reason: string;
    expiresAt?: string;
  }>;
}

interface ReputationManager {
  calculateReputation(userId: string): Promise<UserReputation>;
  awardPoints(userId: string, action: string, points: number): Promise<void>;
  deductPoints(userId: string, violation: string, points: number): Promise<void>;
  checkPermissions(userId: string, action: string): Promise<boolean>;
  applyRestriction(userId: string, type: string, duration?: string): Promise<void>;
}
```

### Privacy & Data Management System

```typescript
// lib/privacy/data-manager.ts
interface DataInventory {
  userId: string;
  categories: Array<{
    category: string;
    dataTypes: string[];
    purposes: string[];
    retention: string;
    sharing: string[];
    lastUpdated: string;
  }>;
  consents: Array<{
    purpose: string;
    granted: boolean;
    grantedAt?: string;
    revokedAt?: string;
  }>;
  requests: Array<{
    type: 'access' | 'rectification' | 'erasure' | 'portability';
    status: 'pending' | 'completed' | 'rejected';
    requestedAt: string;
    completedAt?: string;
  }>;
}

interface DataExportPackage {
  userId: string;
  exportedAt: string;
  format: 'json' | 'csv';
  data: {
    profile: any;
    intakeLogs: IntakeLog[];
    goals: IntakeGoal[];
    recommendations: any[];
    communityPosts: CommunityPost[];
    integrations: OAuthConnection[];
    consents: ConsentRecord[];
  };
  metadata: {
    version: string;
    totalRecords: number;
    categories: string[];
  };
}

// lib/privacy/deletion-manager.ts
interface DeletionRequest {
  id: string;
  userId: string;
  type: 'full_account' | 'specific_data';
  dataCategories?: string[];
  reason?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scheduledFor: string;
  completedAt?: string;
  verificationRequired: boolean;
  verificationToken?: string;
}

interface DeletionManager {
  requestDeletion(userId: string, type: string, categories?: string[]): Promise<string>;
  verifyDeletion(requestId: string, token: string): Promise<void>;
  processDeletion(requestId: string): Promise<void>;
  anonymizeData(userId: string, categories: string[]): Promise<void>;
  generateDeletionReport(requestId: string): Promise<any>;
}

// lib/privacy/consent-tracker.ts
interface ConsentEvent {
  id: string;
  userId: string;
  purpose: string;
  action: 'granted' | 'revoked' | 'updated';
  details: {
    dataTypes: string[];
    retention: string;
    sharing: string[];
  };
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

interface ConsentTracker {
  recordConsent(event: Omit<ConsentEvent, 'id' | 'timestamp'>): Promise<string>;
  getConsentHistory(userId: string): Promise<ConsentEvent[]>;
  checkConsentStatus(userId: string, purpose: string): Promise<boolean>;
  revokeConsent(userId: string, purpose: string): Promise<void>;
  updateConsent(userId: string, purpose: string, details: any): Promise<void>;
}
```

## Data Models

### Intake & Goals Data Model
```typescript
interface IntakeDatabase {
  logs: IntakeLog[];
  goals: IntakeGoal[];
  progress: ProgressAnalysis[];
  deletedLogs: Array<IntakeLog & {deletedAt: string}>; // for 30-day recovery
}
```

### Learning Data Model
```typescript
interface LearningDatabase {
  userFeatures: UserFeatures[];
  modelWeights: ModelWeights[];
  recommendations: RecommendationResult[];
  feedback: UserFeedback[];
  explanations: Array<{
    userId: string;
    recommendationId: string;
    explanation: string;
    timestamp: string;
  }>;
}
```

### Community Data Model
```typescript
interface CommunityDatabase {
  posts: CommunityPost[];
  replies: PostReply[];
  moderationResults: ModerationResult[];
  userReputations: UserReputation[];
  moderationRules: ModerationRule[];
}
```

### Integration Data Model
```typescript
interface IntegrationDatabase {
  connections: OAuthConnection[];
  consents: ConsentRecord[];
  externalData: ExternalData[];
  syncLogs: Array<{
    connectionId: string;
    status: 'success' | 'error';
    recordsProcessed: number;
    timestamp: string;
    error?: string;
  }>;
}
```

### Privacy Data Model
```typescript
interface PrivacyDatabase {
  dataInventory: DataInventory[];
  consentEvents: ConsentEvent[];
  deletionRequests: DeletionRequest[];
  exportRequests: Array<{
    userId: string;
    requestedAt: string;
    completedAt?: string;
    downloadUrl?: string;
    expiresAt?: string;
  }>;
  auditLogs: Array<{
    userId: string;
    action: string;
    details: any;
    timestamp: string;
    ipAddress: string;
  }>;
}
```

## Error Handling

### Intake Logging Error Handling
1. **Log Recovery Failures**: 30日以内の削除ログ復元エラー時の部分復元と通知
2. **Goal Tracking Errors**: 目標追跡エラー時のデフォルト設定適用
3. **Progress Analysis Failures**: 分析エラー時の基本統計のみ表示
4. **Data Validation Errors**: 不正な摂取データの検証と修正提案

### Learning System Error Handling
1. **Model Training Failures**: 重み更新エラー時の前バージョンへのロールバック
2. **Recommendation Generation Errors**: 推奨生成エラー時の人気商品フォールバック
3. **Explanation Generation Failures**: 説明生成エラー時の基本情報のみ表示
4. **Feedback Processing Errors**: フィードバック処理エラー時の手動確認キュー

### External Integration Error Handling
1. **OAuth Authentication Failures**: 認証エラー時の再認証フローと詳細エラー説明
2. **Data Sync Failures**: 同期エラー時のリトライ処理と部分同期
3. **Consent Validation Errors**: 同意検証エラー時の安全側制限適用
4. **API Rate Limiting**: 外部API制限時の適応的リクエスト間隔調整

### Community Error Handling
1. **Moderation Failures**: 自動モデレーションエラー時の人的確認キュー送信
2. **Content Publishing Errors**: 投稿エラー時の下書き保存と復元
3. **Reputation Calculation Errors**: 評価計算エラー時の手動確認と修正
4. **Spam Detection Failures**: スパム検出エラー時の追加検証フロー

### Privacy Management Error Handling
1. **Data Export Failures**: エクスポートエラー時の部分エクスポートと通知
2. **Deletion Processing Errors**: 削除処理エラー時の手動確認と完了保証
3. **Consent Tracking Errors**: 同意追跡エラー時の保守的制限適用
4. **Audit Log Failures**: 監査ログエラー時の代替記録手段

## Testing Strategy

### Intake Logging Testing
```typescript
describe('Intake Logging', () => {
  it('摂取ログの記録・更新・削除が正常に動作する');
  it('30日以内の削除ログが完全に復元される');
  it('摂取目標の設定・追跡・アラートが動作する');
  it('進捗分析が正確な予測と提案を生成する');
  it('ログデータの整合性が保たれる');
});

describe('Progress Analysis', () => {
  it('目標達成予測が過去データに基づいて計算される');
  it('摂取パターンの分析が正確に実行される');
  it('改善提案が具体的で実行可能である');
});
```

### Continuous Learning Testing
```typescript
describe('Recommendation Engine', () => {
  it('ユーザー特徴量に基づく推奨が生成される');
  it('重み更新がフィードバックに基づいて実行される');
  it('推奨理由が具体的で理解しやすく説明される');
  it('重み変更の根拠と影響が明確に説明される');
  it('推奨精度の向上が定量的に測定される');
});

describe('Explainable AI', () => {
  it('推奨アルゴリズムの重み変更理由が具体的に説明される');
  it('各要因の寄与度と重要度が適切に表示される');
  it('パーソナライズされた説明が生成される');
});
```

### External Integration Testing
```typescript
describe('OAuth Integration', () => {
  it('OAuth 2.0による安全な認証・認可が動作する');
  it('ユーザーの明示的な同意が必須として機能する');
  it('外部データの取得・同期が正常に実行される');
  it('ワンクリックでの連携解除と関連データ削除が動作する');
});

describe('Consent Management', () => {
  it('外部データ使用時にオプトイン必須が強制される');
  it('データ使用目的が明確に説明される');
  it('同意履歴が適切に記録・追跡される');
});
```

### Community Testing
```typescript
describe('Community Features', () => {
  it('商品レビュー・摂取体験・質問・回答の投稿が動作する');
  it('薬機法準拠の自動モデレーションが機能する');
  it('投稿の有用性評価・いいね・フォロー機能が動作する');
  it('不適切投稿の報告・削除・ユーザー制限が機能する');
  it('必須免責事項が全ての投稿に表示される');
});

describe('Moderation System', () => {
  it('医療効果・疾患名・治療効果の断定表現が自動検出される');
  it('疑わしい投稿が管理者キューに送信される');
  it('段階的制裁（警告・一時制限・永久制限）が適用される');
  it('異議申し立てと再審査機能が動作する');
});
```

### Privacy Management Testing
```typescript
describe('Privacy & Data Management', () => {
  it('収集データ・使用目的・共有先・保存期間が明示される');
  it('30日以内のユーザーデータ完全削除が実行される');
  it('不正確なデータの修正・更新機能が動作する');
  it('JSON形式でのデータエクスポートが動作する');
  it('各機能・データ使用に対する個別同意管理が動作する');
});

describe('GDPR Compliance', () => {
  it('データポータビリティ要求が適切に処理される');
  it('削除権（忘れられる権利）が確実に実行される');
  it('データ処理の透明性が確保される');
  it('同意撤回が即座に反映される');
});
```

## Performance Considerations

### Intake Logging Performance
- バッチ処理による大量ログデータの効率的処理
- インデックス最適化による履歴検索の高速化
- 圧縮による長期保存データのサイズ削減

### Learning System Performance
- 増分学習による効率的なモデル更新
- 特徴量キャッシュによる推奨生成の高速化
- 並列処理による大規模データセットの処理

### Community Performance
- コンテンツキャッシュによる表示速度向上
- 非同期モデレーションによるリアルタイム投稿
- 検索インデックス最適化による高速検索

### Integration Performance
- バックグラウンド同期による UI ブロック回避
- API制限に応じた適応的リクエスト制御
- 差分同期による通信量削減

## Accessibility Considerations

### Intake Management Accessibility
- ログ入力フォームの適切なラベル関連付け
- 摂取履歴グラフのテーブル代替表示
- キーボード操作による全機能アクセス

### Community Accessibility
- 投稿フォームのエラーメッセージ明確化
- スクリーンリーダー対応の投稿読み上げ
- キーボードナビゲーション対応

### Learning System Accessibility
- 推奨理由の詳細説明提供
- 視覚的インジケータの代替テキスト
- 音声読み上げ対応の説明文

## Security Considerations

### Data Protection
- 個人健康情報の暗号化保存
- アクセス制御による機密情報保護
- 監査ログによる不正アクセス検出

### OAuth Security
- PKCE対応による認証セキュリティ強化
- トークン管理の安全な実装
- スコープ制限による最小権限原則

### Community Security
- コンテンツフィルタリングによる不適切投稿防止
- ユーザー認証による投稿者検証
- レート制限によるスパム防止

## Definition of Done (DoD)

### Intake Logging & Goals
- [ ] 摂取ログ（商品ID・摂取量・摂取時刻・メモ）の記録が動作
- [ ] 摂取目標（期間・目標摂取量・アラート設定）の管理が動作
- [ ] 日次・週次・月次の摂取状況グラフ表示が動作
- [ ] 削除されたログの30日以内復元機能が動作

### Continuous Learning
- [ ] 摂取履歴・目標・評価・購入履歴を学習データとした推奨生成が動作
- [ ] ユーザーフィードバックに基づく重み再学習が動作
- [ ] 推奨理由（なぜこの商品が推奨されるか）の具体的説明が動作
- [ ] 重み変更の根拠と影響の説明可能性が実装済み

### External Integration
- [ ] OAuth 2.0による安全な認証・認可が動作
- [ ] 外部データ使用時のユーザー明示的同意が必須として機能
- [ ] 健康管理アプリ・購入履歴・活動データの連携が動作
- [ ] ワンクリック連携解除と関連データ削除が動作

### Community MVP
- [ ] 商品レビュー・摂取体験・質問・回答の投稿機能が動作
- [ ] 薬機法準拠の自動モデレーション（医療効果・疾患名・治療効果断定表現の検出・削除）が動作
- [ ] 投稿の有用性評価・いいね・フォロー機能が動作
- [ ] 不適切投稿の報告・削除・ユーザー制限機能が動作

### Privacy & Data Management
- [ ] 収集データ・使用目的・共有先・保存期間の明示が動作
- [ ] 30日以内のユーザーデータ完全削除が動作
- [ ] JSON形式でのデータエクスポート機能が動作
- [ ] 各機能・データ使用に対する個別同意管理が動作

### Quality Assurance
- [ ] CI品質チェック（ログ復元・重み変更説明・外部データオプトイン必須・モデレーション）が全て通過
- [ ] A11y強化（ログ入力フォーム・履歴グラフ・投稿フォーム・OAuth画面・推奨説明）が実装済み
- [ ] ドキュメント更新（LEARNING・INTEGRATIONS・COMMUNITY仕様書）が完了
- [ ] パフォーマンス監視（ログ処理・学習処理・コミュニティ・外部連携）が実装済み