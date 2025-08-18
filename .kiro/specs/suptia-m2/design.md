# Suptia M2 Design Document

**specVersion**: 2025-08-16

## Overview

Suptia M2（信頼性 & 収益化強化）では、M1で構築したユーザー体験基盤を拡張し、信頼性向上と収益化機能を強化します。安全要約パイプライン、価格履歴チャート、アフィリエイトリンク最適化、Stripe+Entitlements有料プラン、JSON-LD拡張を通じて、ユーザーがより信頼できる情報に基づいて商品選択を行い、持続可能なビジネスモデルを実現します。

M2スコープ：口コミ安全要約 → 価格履歴グラフ → アフィリエイト最適化 → 有料プラン（機能制限・解放） → 収益分析ダッシュボード → JSON-LD拡張 → ドキュメント更新。禁止表現0、グラフ整合性、クリック計測重複なし、課金による機能解放を含む。

## Architecture

### Safe Review Summary Module (安全口コミ要約モジュール)
```
lib/reviews/
├── review-aggregator.ts (口コミ収集・統合)
├── safe-summarizer.ts (安全要約パイプライン)
├── compliance-filter.ts (薬機法準拠フィルタ)
├── summary-validator.ts (要約コンプライアンス検証)
└── fallback-handler.ts (要約失敗時の代替処理)

components/reviews/
├── ReviewSummary.tsx (要約表示コンポーネント)
├── ComplianceDisclaimer.tsx (免責事項表示)
├── ReviewStats.tsx (口コミ統計表示)
└── SafetyIndicator.tsx (安全性インジケータ)

services/
├── review-pipeline.ts (要約パイプライン実行)
└── content-safety.ts (コンテンツ安全性チェック)
```

### Price History Module (価格履歴モジュール)
```
lib/pricing/
├── price-history.ts (価格履歴データ管理)
├── chart-data-processor.ts (グラフデータ処理)
├── anomaly-detector.ts (異常値検出)
├── trend-analyzer.ts (価格トレンド分析)
└── prediction-engine.ts (価格予測エンジン)

components/pricing/
├── PriceHistoryChart.tsx (価格履歴グラフ)
├── PriceChartControls.tsx (期間選択・ソース選択)
├── AnomalyMarker.tsx (異常値マーカー)
├── TrendIndicator.tsx (トレンド表示)
└── PricePrediction.tsx (価格予測表示)

hooks/
├── usePriceHistory.ts (価格履歴状態管理)
├── useChartData.ts (グラフデータ管理)
└── usePriceTrends.ts (トレンド分析)
```

### Affiliate Optimization Module (アフィリエイト最適化モジュール)
```
lib/affiliate/
├── link-builder.ts (アフィリエイトリンク生成)
├── click-tracker.ts (クリック計測)
├── conversion-tracker.ts (コンバージョン追跡)
├── duplicate-filter.ts (重複クリック除外)
└── revenue-calculator.ts (収益計算)

components/affiliate/
├── OptimizedLink.tsx (最適化リンクコンポーネント)
├── ClickTracker.tsx (クリック追跡コンポーネント)
└── RevenueIndicator.tsx (収益インジケータ)

services/
├── affiliate-service.ts (アフィリエイトサービス統合)
├── tracking-service.ts (追跡サービス)
└── analytics-service.ts (分析サービス)
```

### Subscription & Entitlements Module (サブスクリプション・権限モジュール)
```
lib/subscription/
├── stripe-integration.ts (Stripe決済統合)
├── entitlements-manager.ts (権限管理)
├── plan-manager.ts (プラン管理)
├── billing-handler.ts (課金処理)
└── grace-period-manager.ts (猶予期間管理)

components/subscription/
├── PlanSelector.tsx (プラン選択)
├── PaymentForm.tsx (決済フォーム)
├── SubscriptionStatus.tsx (サブスクリプション状態)
├── FeatureLimits.tsx (機能制限表示)
└── UpgradePrompt.tsx (アップグレード促進)

services/
├── stripe-service.ts (Stripe API統合)
├── entitlements-service.ts (権限サービス)
└── billing-service.ts (課金サービス)

hooks/
├── useSubscription.ts (サブスクリプション状態)
├── useEntitlements.ts (権限状態)
└── useBilling.ts (課金状態)
```

### Revenue Analytics Module (収益分析モジュール)
```
lib/analytics/
├── revenue-tracker.ts (収益追跡)
├── affiliate-analytics.ts (アフィリエイト分析)
├── subscription-analytics.ts (サブスクリプション分析)
├── conversion-analytics.ts (コンバージョン分析)
└── forecast-engine.ts (収益予測)

components/analytics/
├── RevenueDashboard.tsx (収益ダッシュボード)
├── AffiliateMetrics.tsx (アフィリエイト指標)
├── SubscriptionMetrics.tsx (サブスクリプション指標)
├── ConversionFunnel.tsx (コンバージョンファネル)
└── RevenueChart.tsx (収益チャート)

services/
├── analytics-aggregator.ts (分析データ集約)
├── metrics-calculator.ts (指標計算)
└── report-generator.ts (レポート生成)
```

### Enhanced JSON-LD Module (拡張JSON-LDモジュール)
```
lib/seo/
├── review-jsonld.ts (レビュー構造化データ)
├── itemlist-jsonld.ts (ItemList構造化データ)
├── structured-data-validator.ts (構造化データ検証)
└── rich-results-tester.ts (Rich Results Test統合)

components/seo/
├── ReviewJsonLd.tsx (レビューJSON-LD)
├── ItemListJsonLd.tsx (ItemListJSON-LD)
└── StructuredDataDebugger.tsx (構造化データデバッガ)

scripts/
├── validate-structured-data.ts (構造化データ検証スクリプト)
└── rich-results-check.ts (Rich Results自動チェック)
```

### Enhanced A11y for M2 Features (M2機能アクセシビリティ)
```
lib/a11y/
├── chart-a11y.ts (グラフアクセシビリティ)
├── table-data-a11y.ts (データテーブルa11y)
├── keyboard-chart-nav.ts (グラフキーボードナビ)
└── screen-reader-data.ts (スクリーンリーダーデータ対応)

components/a11y/
├── AccessibleChart.tsx (アクセシブルグラフ)
├── AccessibleDataTable.tsx (アクセシブルデータテーブル)
├── AccessiblePricingTable.tsx (アクセシブル料金テーブル)
└── AccessibleDashboard.tsx (アクセシブルダッシュボード)
```

## Components and Interfaces

### Safe Review Summary System

```typescript
// lib/reviews/safe-summarizer.ts
interface ReviewInput {
  id: string;
  productId: string;
  source: 'rakuten' | 'yahoo' | 'amazon' | 'iherb';
  rating: number;
  title: string;
  content: string;
  author: string;
  date: string;
  verified: boolean;
}

interface SafeSummary {
  productId: string;
  summary: string;
  disclaimers: string[];
  sourceCount: number;
  averageRating: number;
  totalReviews: number;
  safetyScore: number; // 0-1, compliance confidence
  generatedAt: string;
  filteringStats: {
    originalReviews: number;
    filteredOut: number;
    safeReviews: number;
  };
}

interface ComplianceFilter {
  checkMedicalClaims(text: string): boolean;
  checkDiseaseNames(text: string): boolean;
  checkTreatmentEffects(text: string): boolean;
  filterProhibitedTerms(text: string): string;
  addDisclaimers(summary: string): string;
}

// services/review-pipeline.ts
interface ReviewPipeline {
  collectReviews(productId: string): Promise<ReviewInput[]>;
  filterContent(reviews: ReviewInput[]): Promise<ReviewInput[]>;
  generateSummary(reviews: ReviewInput[]): Promise<string>;
  validateCompliance(summary: string): Promise<boolean>;
  addSafetyDisclaimers(summary: string): Promise<SafeSummary>;
  handleFailure(productId: string): Promise<SafeSummary | null>;
}

// components/reviews/ReviewSummary.tsx
interface ReviewSummaryProps {
  productId: string;
  summary?: SafeSummary;
  loading?: boolean;
  error?: string;
  showStats?: boolean;
  showSafetyIndicator?: boolean;
}
```

### Price History System

```typescript
// lib/pricing/price-history.ts
interface PriceHistoryPoint {
  date: string;
  source: 'rakuten' | 'yahoo' | 'amazon' | 'iherb';
  price: number;
  isAnomaly: boolean;
  confidence: number;
  metadata?: {
    originalPrice?: number;
    discount?: number;
    shipping?: number;
  };
}

interface PriceHistoryData {
  productId: string;
  period: '3months' | '6months' | '1year';
  points: PriceHistoryPoint[];
  statistics: {
    minPrice: number;
    maxPrice: number;
    averagePrice: number;
    medianPrice: number;
    volatility: number; // standard deviation
  };
  trends: {
    overall: 'rising' | 'falling' | 'stable';
    recent: 'rising' | 'falling' | 'stable'; // last 30 days
    prediction: 'up' | 'down' | 'stable';
  };
  anomalies: Array<{
    date: string;
    source: string;
    price: number;
    reason: string;
    verified: boolean;
  }>;
}

// lib/pricing/anomaly-detector.ts
interface AnomalyDetector {
  detectPriceAnomalies(points: PriceHistoryPoint[]): PriceHistoryPoint[];
  validateAnomalies(anomalies: PriceHistoryPoint[]): PriceHistoryPoint[];
  calculateConfidence(point: PriceHistoryPoint, context: PriceHistoryPoint[]): number;
  flagForManualReview(anomaly: PriceHistoryPoint): boolean;
}

// lib/pricing/trend-analyzer.ts
interface TrendAnalyzer {
  analyzeTrend(points: PriceHistoryPoint[], period: number): 'rising' | 'falling' | 'stable';
  calculateVolatility(points: PriceHistoryPoint[]): number;
  predictNextPeriod(points: PriceHistoryPoint[]): {direction: string; confidence: number};
  detectSeasonality(points: PriceHistoryPoint[]): Array<{period: string; pattern: string}>;
}

// components/pricing/PriceHistoryChart.tsx
interface PriceHistoryChartProps {
  productId: string;
  data: PriceHistoryData;
  period: '3months' | '6months' | '1year';
  sources: Array<'rakuten' | 'yahoo' | 'amazon' | 'iherb'>;
  showAnomalies?: boolean;
  showTrends?: boolean;
  interactive?: boolean;
  onPeriodChange?: (period: string) => void;
  onSourceToggle?: (source: string, enabled: boolean) => void;
}
```

### Affiliate Optimization System

```typescript
// lib/affiliate/link-builder.ts
interface AffiliateConfig {
  rakuten: {
    affiliateId: string;
    applicationId: string;
  };
  yahoo: {
    pid: string;
    sid: string;
  };
  amazon: {
    associateTag: string;
    trackingId: string;
  };
  iherb: {
    affiliateId: string;
    trackingCode: string;
  };
}

interface OptimizedLink {
  originalUrl: string;
  affiliateUrl: string;
  source: 'rakuten' | 'yahoo' | 'amazon' | 'iherb';
  trackingParams: Record<string, string>;
  expiresAt?: string;
  metadata: {
    productId: string;
    userId?: string;
    sessionId: string;
    campaign?: string;
  };
}

interface LinkBuilder {
  buildAffiliateLink(productUrl: string, source: string, metadata: any): OptimizedLink;
  validateLink(link: OptimizedLink): boolean;
  refreshExpiredLink(link: OptimizedLink): OptimizedLink;
  getFallbackLink(originalLink: OptimizedLink): OptimizedLink;
}

// lib/affiliate/click-tracker.ts
interface ClickEvent {
  id: string;
  productId: string;
  source: string;
  userId?: string;
  sessionId: string;
  timestamp: string;
  userAgent: string;
  referrer: string;
  metadata: {
    page: string;
    position: string;
    campaign?: string;
  };
}

interface DuplicateRule {
  sessionId: string;
  productId: string;
  source: string;
  windowMinutes: number; // default: 5
  lastClick: string;
}

interface ClickTracker {
  trackClick(link: OptimizedLink, context: any): Promise<string>;
  isDuplicate(event: ClickEvent): Promise<boolean>;
  updateDuplicateRule(event: ClickEvent): Promise<void>;
  getClickStats(productId?: string, timeRange?: string): Promise<any>;
}

// lib/affiliate/conversion-tracker.ts
interface ConversionEvent {
  clickId: string;
  productId: string;
  source: string;
  orderId?: string;
  amount: number;
  commission: number;
  currency: 'JPY' | 'USD';
  timestamp: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface ConversionTracker {
  trackConversion(clickId: string, orderData: any): Promise<void>;
  updateConversionStatus(conversionId: string, status: string): Promise<void>;
  calculateCommission(source: string, amount: number): number;
  getConversionRate(source?: string, period?: string): Promise<number>;
}
```

### Subscription & Entitlements System

```typescript
// lib/subscription/stripe-integration.ts
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
    currency: 'JPY';
  };
  features: {
    compareProducts: number; // 3 for free, 10 for premium
    favorites: number; // 10 for free, 100 for premium
    alerts: number; // 5 for free, 50 for premium
    priceHistory: boolean;
    reviewSummary: boolean;
    prioritySupport: boolean;
  };
  stripePriceIds: {
    monthly: string;
    yearly: string;
  };
}

interface SubscriptionStatus {
  userId: string;
  planId: string;
  status: 'active' | 'past_due' | 'cancelled' | 'unpaid';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
  gracePeriodEnd?: string;
}

// lib/subscription/entitlements-manager.ts
interface UserEntitlements {
  userId: string;
  planId: string;
  features: {
    compareProducts: number;
    favorites: number;
    alerts: number;
    priceHistory: boolean;
    reviewSummary: boolean;
    prioritySupport: boolean;
  };
  usage: {
    compareProducts: number;
    favorites: number;
    alerts: number;
  };
  limits: {
    compareProducts: boolean;
    favorites: boolean;
    alerts: boolean;
  };
  lastUpdated: string;
}

interface EntitlementsManager {
  getUserEntitlements(userId: string): Promise<UserEntitlements>;
  checkFeatureAccess(userId: string, feature: string): Promise<boolean>;
  updateUsage(userId: string, feature: string, delta: number): Promise<void>;
  enforceLimit(userId: string, feature: string): Promise<boolean>;
  upgradeEntitlements(userId: string, newPlanId: string): Promise<void>;
}

// lib/subscription/grace-period-manager.ts
interface GracePeriodRule {
  duration: number; // 7 days
  features: {
    compareProducts: number; // reduced to 1
    favorites: number; // reduced to 5
    alerts: number; // reduced to 2
    priceHistory: boolean; // disabled
    reviewSummary: boolean; // disabled
  };
}

interface GracePeriodManager {
  startGracePeriod(userId: string): Promise<void>;
  checkGracePeriodStatus(userId: string): Promise<{active: boolean; endsAt?: string}>;
  applyGracePeriodLimits(userId: string): Promise<UserEntitlements>;
  endGracePeriod(userId: string): Promise<void>;
}
```

### Revenue Analytics System

```typescript
// lib/analytics/revenue-tracker.ts
interface RevenueMetrics {
  period: string;
  affiliate: {
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    conversionRate: number;
    averageOrderValue: number;
    bySource: Record<string, {
      clicks: number;
      conversions: number;
      revenue: number;
      conversionRate: number;
    }>;
  };
  subscription: {
    newSubscriptions: number;
    cancellations: number;
    mrr: number; // Monthly Recurring Revenue
    arr: number; // Annual Recurring Revenue
    churnRate: number;
    ltv: number; // Lifetime Value
    byPlan: Record<string, {
      subscribers: number;
      revenue: number;
      churnRate: number;
    }>;
  };
  total: {
    revenue: number;
    growth: number; // percentage
    forecast: number;
  };
}

interface RevenueTracker {
  getMetrics(period: string): Promise<RevenueMetrics>;
  trackAffiliateRevenue(conversionEvent: ConversionEvent): Promise<void>;
  trackSubscriptionRevenue(subscriptionEvent: any): Promise<void>;
  calculateGrowthRate(current: number, previous: number): number;
  generateForecast(historicalData: RevenueMetrics[]): number;
}

// lib/analytics/conversion-analytics.ts
interface ConversionFunnel {
  stage: string;
  users: number;
  conversionRate: number;
  dropoffRate: number;
}

interface ConversionAnalytics {
  getConversionFunnel(period: string): Promise<ConversionFunnel[]>;
  getTopPerformingProducts(limit: number): Promise<Array<{productId: string; revenue: number}>>;
  getSourcePerformance(): Promise<Record<string, {revenue: number; efficiency: number}>>;
  getCohortAnalysis(cohortType: 'monthly' | 'weekly'): Promise<any>;
}

// components/analytics/RevenueDashboard.tsx
interface RevenueDashboardProps {
  period: 'day' | 'week' | 'month' | 'year';
  metrics: RevenueMetrics;
  loading?: boolean;
  onPeriodChange?: (period: string) => void;
  onExport?: (format: 'csv' | 'json') => void;
}
```

### Enhanced JSON-LD System

```typescript
// lib/seo/review-jsonld.ts
interface ReviewJsonLd {
  '@context': 'https://schema.org';
  '@type': 'Review';
  reviewBody: string;
  author: {
    '@type': 'Person';
    name: string;
  };
  datePublished: string;
  reviewRating: {
    '@type': 'Rating';
    ratingValue: number;
    bestRating: number;
    worstRating: number;
  };
  itemReviewed: {
    '@type': 'Product';
    name: string;
    brand: string;
  };
}

interface ItemListJsonLd {
  '@context': 'https://schema.org';
  '@type': 'ItemList';
  numberOfItems: number;
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    item: {
      '@type': 'Product';
      name: string;
      url: string;
      offers: {
        '@type': 'Offer';
        price: number;
        priceCurrency: 'JPY';
      };
    };
  }>;
}

// lib/seo/structured-data-validator.ts
interface StructuredDataValidation {
  valid: boolean;
  errors: Array<{
    type: string;
    message: string;
    path: string;
  }>;
  warnings: Array<{
    type: string;
    message: string;
    path: string;
  }>;
  richResultsEligible: boolean;
}

interface StructuredDataValidator {
  validateReviewJsonLd(data: ReviewJsonLd): StructuredDataValidation;
  validateItemListJsonLd(data: ItemListJsonLd): StructuredDataValidation;
  testWithGoogleRichResults(url: string): Promise<StructuredDataValidation>;
  generateFixSuggestions(validation: StructuredDataValidation): string[];
}
```

## Data Models

### Review Summary Data Model
```typescript
interface ReviewSummaryData {
  productId: string;
  summaries: {
    safe: SafeSummary;
    original?: string; // for comparison
  };
  compliance: {
    score: number;
    violations: string[];
    warnings: string[];
    disclaimers: string[];
  };
  sources: Array<{
    source: string;
    reviewCount: number;
    averageRating: number;
    lastUpdated: string;
  }>;
}
```

### Price History Data Model
```typescript
interface PriceHistoryDatabase {
  productId: string;
  history: PriceHistoryPoint[];
  metadata: {
    firstRecorded: string;
    lastUpdated: string;
    dataQuality: number; // 0-1
    completeness: number; // 0-1
  };
  analysis: {
    trends: any;
    seasonality: any;
    predictions: any;
  };
}
```

### Revenue Data Model
```typescript
interface RevenueDatabase {
  date: string;
  affiliate: {
    clicks: ClickEvent[];
    conversions: ConversionEvent[];
    revenue: number;
  };
  subscription: {
    newSubscriptions: number;
    cancellations: number;
    mrr: number;
    churn: number;
  };
  totals: {
    revenue: number;
    growth: number;
  };
}
```

### Subscription Data Model
```typescript
interface SubscriptionDatabase {
  userId: string;
  subscription: SubscriptionStatus;
  entitlements: UserEntitlements;
  billing: {
    customerId: string;
    subscriptionId: string;
    paymentMethodId: string;
    invoices: Array<{
      id: string;
      amount: number;
      status: string;
      date: string;
    }>;
  };
  usage: {
    history: Array<{
      date: string;
      feature: string;
      usage: number;
    }>;
  };
}
```

## Error Handling

### Review Summary Error Handling
1. **Compliance Violations**: 薬機法違反検出時の要約生成停止と代替処理
2. **API Failures**: 口コミ取得エラー時のキャッシュデータ使用
3. **Summary Generation Failures**: AI要約エラー時の統計情報のみ表示
4. **Content Safety Issues**: 不適切コンテンツ検出時の自動除外

### Price History Error Handling
1. **Data Anomalies**: 異常値検出時の確認マーク表示と手動検証
2. **Missing Data**: データ欠損時の補間処理と警告表示
3. **Chart Rendering Errors**: グラフ描画エラー時のテーブル表示フォールバック
4. **Trend Analysis Failures**: 分析エラー時の基本統計のみ表示

### Affiliate System Error Handling
1. **Link Generation Failures**: アフィリエイトリンク生成エラー時の直接リンク提供
2. **Tracking Failures**: クリック追跡エラー時のログ記録と手動確認
3. **Conversion Sync Issues**: コンバージョン同期エラー時のリトライ処理
4. **Commission Calculation Errors**: 手数料計算エラー時のデフォルト値適用

### Subscription Error Handling
1. **Payment Failures**: 決済エラー時の猶予期間適用と段階的制限
2. **Entitlements Sync Issues**: 権限同期エラー時の安全側制限適用
3. **Stripe Webhook Failures**: Webhook処理エラー時のリトライと手動確認
4. **Usage Tracking Errors**: 使用量追跡エラー時の保守的制限適用

## Testing Strategy

### Review Summary Testing
```typescript
describe('Safe Review Summary', () => {
  it('薬機法違反表現を含む口コミを適切にフィルタリングする');
  it('要約に必須免責事項が含まれる');
  it('禁止表現検出時に要約生成を停止する');
  it('要約生成失敗時に統計情報のみ表示する');
  it('コンプライアンススコアが適切に計算される');
});

describe('Review Pipeline', () => {
  it('入力→フィルタリング→要約→検証→出力の順序で処理される');
  it('各段階でのエラーハンドリングが適切に動作する');
  it('安全性チェックが確実に実行される');
});
```

### Price History Testing
```typescript
describe('Price History Chart', () => {
  it('3ヶ月・6ヶ月・1年の期間選択が動作する');
  it('各ソース別の価格推移が異なる色・線種で表示される');
  it('異常値が適切に検出され、確認マークが表示される');
  it('マウスオーバーでツールチップが正しく表示される');
  it('データ不足時に警告と利用可能期間が表示される');
});

describe('Anomaly Detection', () => {
  it('前日比50%以上の変動を異常値として検出する');
  it('異常値の信頼度が適切に計算される');
  it('手動確認が必要な異常値が適切にフラグされる');
});
```

### Affiliate Optimization Testing
```typescript
describe('Affiliate Link Builder', () => {
  it('各ソースの最適なアフィリエイトパラメータが付与される');
  it('リンクの有効性が適切に検証される');
  it('期限切れリンクが自動更新される');
  it('無効リンク時に代替ソースへフォールバックする');
});

describe('Click Tracking', () => {
  it('クリック情報が正確に記録される');
  it('5分以内の重複クリックが除外される');
  it('同一セッション・同一商品・同一ソースの重複が検出される');
  it('クリック統計が正確に計算される');
});
```

### Subscription Testing
```typescript
describe('Stripe Integration', () => {
  it('月額・年額プランの決済が正常に処理される');
  it('サブスクリプション状態が正確に同期される');
  it('Webhookイベントが適切に処理される');
  it('決済エラー時に猶予期間が適用される');
});

describe('Entitlements Management', () => {
  it('無料プランで比較3個・お気に入り10個・アラート5個に制限される');
  it('有料プランで比較10個・お気に入り100個・アラート50個が解放される');
  it('使用量が正確に追跡される');
  it('制限超過時に適切にブロックされる');
});
```

### Revenue Analytics Testing
```typescript
describe('Revenue Tracking', () => {
  it('アフィリエイト収益が正確に計算される');
  it('サブスクリプション収益（MRR・ARR）が正確に計算される');
  it('コンバージョン率が正確に計算される');
  it('収益予測が過去データに基づいて生成される');
});

describe('Analytics Dashboard', () => {
  it('収益ダッシュボードが正確なデータを表示する');
  it('ソース別・商品別・時間別の分析が動作する');
  it('CSV・JSON形式でのデータエクスポートが動作する');
});
```

### Enhanced JSON-LD Testing
```typescript
describe('Review JSON-LD', () => {
  it('Review構造化データが正しく生成される');
  it('reviewBody・author・datePublished・reviewRatingが含まれる');
  it('Google Rich Results Testで検証が通過する');
  it('構造化データエラー時に修正提案が出力される');
});

describe('ItemList JSON-LD', () => {
  it('商品一覧・比較結果・お気に入り一覧でItemListが出力される');
  it('numberOfItems・itemListElementが正確に設定される');
  it('schema.org仕様に準拠する');
});
```

## Performance Considerations

### Review Summary Performance
- バッチ処理による複数商品の要約生成効率化
- キャッシュによる重複要約生成の回避
- 非同期処理による UI ブロック防止

### Price History Performance
- データ圧縮による履歴データサイズ削減
- 遅延読み込みによる初期表示速度向上
- インデックス最適化による検索性能向上

### Affiliate Tracking Performance
- バッチ処理による追跡データの効率的保存
- 重複除外による不要なデータ削減
- 非同期処理による追跡処理の高速化

### Revenue Analytics Performance
- 事前集計による分析クエリの高速化
- キャッシュによる頻繁アクセスデータの最適化
- 段階的データ読み込みによる大量データ処理

## Accessibility Considerations

### Chart Accessibility
- 価格履歴グラフのテーブル形式代替表示
- キーボード操作によるデータポイント間移動
- スクリーンリーダー対応のデータ説明

### Dashboard Accessibility
- 収益ダッシュボードの数値データにaria-label属性
- 料金・機能比較テーブルの適切なcaption・scope属性
- キーボードナビゲーション対応

### Form Accessibility
- 有料プラン選択フォームの適切なラベル関連付け
- エラーメッセージの明確な表示
- 決済フォームのセキュリティ配慮

## Security Considerations

### Payment Security
- Stripe PCI DSS準拠による決済情報の安全な処理
- API キーの環境変数による安全な管理
- Webhook署名検証による不正リクエスト防止

### Revenue Data Security
- 収益データの暗号化保存
- アクセス制御による機密情報保護
- 監査ログによる不正アクセス検出

### User Data Privacy
- 個人情報の最小限収集
- GDPR準拠のデータ削除機能
- 匿名化による分析データ保護

## Definition of Done (DoD)

### Safe Review Summary
- [ ] 口コミ要約で薬機法違反表現が0件
- [ ] 必須免責事項が全ての要約に含まれる
- [ ] 禁止表現検出時の要約生成停止が動作
- [ ] 要約生成失敗時の代替処理が動作

### Price History
- [ ] 3ヶ月・6ヶ月・1年の期間選択が実装済み
- [ ] 各ソース別の価格推移表示が動作
- [ ] 異常値検出（前日比50%以上変動）が動作
- [ ] グラフデータの整合性検証が通過

### Affiliate Optimization
- [ ] 4ソース全てのアフィリエイトリンク生成が動作
- [ ] クリック計測で重複除外（5分以内・同一セッション・同一商品・同一ソース）が0件
- [ ] コンバージョン追跡が各アフィリエイトプログラムで動作
- [ ] 収益計算が正確に実行される

### Subscription & Entitlements
- [ ] Stripe決済による月額・年額プランが動作
- [ ] 無料プラン制限（比較3個・お気に入り10個・アラート5個）が適用される
- [ ] 有料プラン解放（比較10個・お気に入り100個・アラート50個）が動作
- [ ] 課金エラー時の猶予期間（7日間）と段階的制限が動作

### Revenue Analytics
- [ ] アフィリエイト収益・サブスクリプション収益・総収益の表示が動作
- [ ] ソース別・商品別・時間別のクリック数とコンバージョン率表示が動作
- [ ] MRR・チャーン率・収益予測の計算が正確
- [ ] CSV・JSON形式でのデータエクスポートが動作

### Enhanced JSON-LD
- [ ] Review構造化データ（reviewBody・author・datePublished・reviewRating）が実装済み
- [ ] ItemList構造化データ（商品一覧・比較結果・お気に入り一覧）が実装済み
- [ ] Google Rich Results Testでの検証が通過
- [ ] 構造化データエラー時の修正提案が出力される

### Quality Assurance
- [ ] CI品質チェック（禁止表現0・グラフ整合性・クリック重複なし・課金機能解放）が全て通過
- [ ] A11y強化（グラフテーブル代替・キーボードナビ・料金テーブルa11y）が実装済み
- [ ] ドキュメント更新（MONETIZATION・COMPLIANCE・SEO仕様書）が完了