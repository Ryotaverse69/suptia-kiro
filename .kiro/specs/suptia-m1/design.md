# Suptia M1 Design Document

**specVersion**: 2025-08-16

## Overview

Suptia M1（ユーザー体験拡張）では、M0で構築した価格比較基盤を拡張し、Amazon/iHerbコネクタの追加、CompareView機能、Favorites機能、Price Alerts機能を実装します。GTIN/JAN優先マッチングによる信頼度スコア、3ソース以上での最安値表示、テーブルa11y強化、通知キューによる単発保証を通じて、ユーザーがより多くの選択肢から最適なサプリメントを見つけ、継続的に利用できる体験を提供します。

M1スコープ：4ソース価格コネクタ → 信頼度スコア付きマッチング → CompareView（並べ替え・フィルタ） → Favorites管理 → Price Alerts（通知キュー・メール配信） → CI a11y強化 → ドキュメント更新。

## Architecture

### Extended Price Connector Module (拡張価格コネクタモジュール)
```
lib/pricing/
├── amazon-connector.ts (Amazon Product Advertising API v5統合)
├── iherb-connector.ts (iHerb Affiliate API統合)
├── multi-source-matcher.ts (4ソース統合マッチング)
├── confidence-scorer.ts (信頼度スコア計算)
└── price-aggregator.ts (4ソース価格集約)

components/pricing/
├── ConfidenceIndicator.tsx (信頼度スコア表示)
├── MultiSourcePriceTable.tsx (4ソース価格テーブル)
└── PriceReliabilityBadge.tsx (価格信頼性バッジ)

mocks/
├── amazon-mock.ts (Amazon APIモック)
└── iherb-mock.ts (iHerb APIモック)
```

### Compare View Module (商品比較ビューモジュール)
```
components/compare/
├── CompareView.tsx (商品比較メインビュー)
├── CompareTable.tsx (比較テーブル)
├── CompareSorter.tsx (並べ替えコントロール)
├── CompareFilter.tsx (フィルタコントロール)
└── CompareShareUrl.tsx (比較結果URL共有)

lib/compare/
├── compare-manager.ts (比較セット管理)
├── sort-algorithms.ts (並べ替えアルゴリズム)
├── filter-engine.ts (フィルタエンジン)
└── url-serializer.ts (比較状態URL化)

hooks/
├── useCompareState.ts (比較状態管理)
├── useCompareSorting.ts (並べ替え状態)
└── useCompareFilters.ts (フィルタ状態)
```

### Favorites Module (お気に入りモジュール)
```
components/favorites/
├── FavoritesList.tsx (お気に入り一覧)
├── FavoriteButton.tsx (お気に入りボタン)
├── FavoritesManager.tsx (お気に入り管理)
├── FavoritesExport.tsx (エクスポート機能)
└── FavoritesGrouping.tsx (カテゴリ別グループ化)

lib/favorites/
├── favorites-storage.ts (ローカルストレージ管理)
├── favorites-sync.ts (価格情報同期)
├── favorites-export.ts (JSON エクスポート/インポート)
└── favorites-grouping.ts (グループ化ロジック)

hooks/
├── useFavorites.ts (お気に入り状態管理)
└── useFavoritesSync.ts (価格同期)
```

### Price Alerts Module (価格アラートモジュール)
```
components/alerts/
├── AlertsManager.tsx (アラート管理画面)
├── AlertSetup.tsx (アラート設定)
├── AlertsList.tsx (アラート一覧)
├── AlertHistory.tsx (アラート履歴)
└── AlertNotification.tsx (通知表示)

lib/alerts/
├── alert-engine.ts (アラート検知エンジン)
├── notification-queue.ts (通知キュー管理)
├── duplicate-prevention.ts (重複通知防止)
├── alert-conditions.ts (アラート条件判定)
└── price-tracking.ts (価格推移追跡)

services/
├── email-service.ts (メール配信サービス)
├── notification-scheduler.ts (通知スケジューラ)
└── delivery-tracker.ts (配信追跡)

hooks/
├── useAlerts.ts (アラート状態管理)
├── useNotifications.ts (通知状態管理)
└── useEmailSettings.ts (メール設定管理)
```

### Enhanced A11y Module (拡張アクセシビリティモジュール)
```
lib/a11y/
├── axe-integration.ts (axe-core統合)
├── table-a11y.ts (テーブルa11y検証)
├── keyboard-nav.ts (キーボードナビゲーション)
├── screen-reader.ts (スクリーンリーダー対応)
└── a11y-reporter.ts (a11y違反レポート)

components/a11y/
├── AccessibleCompareTable.tsx (アクセシブル比較テーブル)
├── AccessibleFavoriteButton.tsx (アクセシブルお気に入りボタン)
├── AccessibleAlertForm.tsx (アクセシブルアラートフォーム)
└── AccessibleNotification.tsx (アクセシブル通知)

scripts/a11y/
├── run-axe-tests.ts (axe自動テスト実行)
├── keyboard-test.ts (キーボードテスト)
└── screen-reader-test.ts (スクリーンリーダーテスト)
```

### Documentation Module (ドキュメントモジュール)
```
docs/
├── API.md (API仕様書)
├── COMPARE.md (比較機能仕様)
├── FAVORITES.md (お気に入り仕様)
├── NOTIFICATIONS.md (通知仕様)
└── A11Y.md (アクセシビリティ仕様)

scripts/docs/
├── generate-api-docs.ts (API仕様書生成)
├── generate-feature-docs.ts (機能仕様書生成)
└── update-readme.ts (README更新)
```

## Components and Interfaces

### Extended Price Connector System

```typescript
// lib/pricing/amazon-connector.ts
interface AmazonProduct {
  asin: string;
  title: string;
  price: {
    amount: number;
    currency: 'USD' | 'JPY';
    displayAmount: string;
  };
  availability: {
    message: string;
    type: 'InStock' | 'OutOfStock' | 'Unknown';
  };
  images: {
    primary: {
      medium: {
        url: string;
        height: number;
        width: number;
      };
    };
  };
  detailPageURL: string;
  brand: {
    displayValue: string;
  };
  features?: string[];
  customerReviews?: {
    count: number;
    starRating: {
      value: number;
    };
  };
}

interface AmazonConnector {
  searchItems(keywords: string, searchIndex?: string): Promise<AmazonProduct[]>;
  getItems(asins: string[]): Promise<AmazonProduct[]>;
  getBrowseNodes(browseNodeId: string): Promise<AmazonProduct[]>;
}

// lib/pricing/iherb-connector.ts
interface iHerbProduct {
  productId: number;
  productName: string;
  price: {
    discountPrice: number;
    listPrice: number;
    currency: 'USD';
  };
  inStock: boolean;
  productUrl: string;
  imageUrl: string;
  brand: string;
  rating: {
    average: number;
    count: number;
  };
  shipping: {
    isFreeShipping: boolean;
    shippingCost?: number;
  };
  discount: {
    percentage?: number;
    amount?: number;
  };
}

interface iHerbConnector {
  searchProducts(query: string, categoryId?: number): Promise<iHerbProduct[]>;
  getProduct(productId: number): Promise<iHerbProduct>;
  getCategories(): Promise<Array<{id: number; name: string}>>;
}
```

### Multi-Source Matching System

```typescript
// lib/pricing/multi-source-matcher.ts
interface ProductMatchResult {
  productId: string;
  sources: Array<{
    source: 'rakuten' | 'yahoo' | 'amazon' | 'iherb';
    product: RakutenProduct | YahooProduct | AmazonProduct | iHerbProduct;
    normalizedPrice: NormalizedPrice;
    confidence: number; // 0-1
    matchType: 'gtin' | 'jan' | 'name_capacity' | 'name_brand' | 'fuzzy';
  }>;
  overallConfidence: number;
  recommendedSource: string;
  priceRange: {
    min: number;
    max: number;
    spread: number; // max - min
    spreadPercentage: number; // (max - min) / min * 100
  };
}

interface ConfidenceScorer {
  calculateGTINMatch(gtin1: string, gtin2: string): number;
  calculateJANMatch(jan1: string, jan2: string): number;
  calculateNameMatch(name1: string, name2: string): number;
  calculateCapacityMatch(capacity1: any, capacity2: any): number;
  calculateBrandMatch(brand1: string, brand2: string): number;
  calculateOverallConfidence(matches: Array<{type: string; score: number}>): number;
}

// lib/pricing/price-aggregator.ts
interface PriceAggregation {
  productId: string;
  sourceCount: number;
  lowestPrice: NormalizedPrice & {confidence: number};
  highestPrice: NormalizedPrice & {confidence: number};
  averagePrice: number;
  medianPrice: number;
  priceSpread: {
    amount: number;
    percentage: number;
  };
  reliabilityScore: number; // 0-1 based on source count and confidence
  lastUpdated: string;
  updateFrequency: 'realtime' | 'hourly' | 'daily';
}
```

### Compare View System

```typescript
// components/compare/CompareView.tsx
interface CompareViewProps {
  products: ProductMatchResult[];
  maxProducts?: number; // default: 4
  defaultSortBy?: 'price' | 'score' | 'costPerDay' | 'confidence';
  defaultSortOrder?: 'asc' | 'desc';
  enableFilters?: boolean;
  enableSharing?: boolean;
}

interface CompareState {
  selectedProducts: string[];
  sortBy: 'price' | 'score' | 'costPerDay' | 'confidence';
  sortOrder: 'asc' | 'desc';
  filters: {
    brands: string[];
    priceRange: {min: number; max: number};
    capacityRange: {min: number; max: number};
    scoreRange: {min: number; max: number};
    confidenceThreshold: number;
  };
  shareUrl?: string;
}

// lib/compare/sort-algorithms.ts
interface SortAlgorithm {
  sortByPrice(products: ProductMatchResult[], order: 'asc' | 'desc'): ProductMatchResult[];
  sortByScore(products: ProductMatchResult[], order: 'asc' | 'desc'): ProductMatchResult[];
  sortByCostPerDay(products: ProductMatchResult[], order: 'asc' | 'desc'): ProductMatchResult[];
  sortByConfidence(products: ProductMatchResult[], order: 'asc' | 'desc'): ProductMatchResult[];
}

// lib/compare/filter-engine.ts
interface FilterCriteria {
  brands?: string[];
  priceRange?: {min: number; max: number};
  capacityRange?: {min: number; max: number};
  scoreRange?: {min: number; max: number};
  confidenceThreshold?: number;
  inStockOnly?: boolean;
  sourcesRequired?: number; // minimum number of sources
}

interface FilterEngine {
  applyFilters(products: ProductMatchResult[], criteria: FilterCriteria): ProductMatchResult[];
  getAvailableFilters(products: ProductMatchResult[]): {
    brands: string[];
    priceRange: {min: number; max: number};
    capacityRange: {min: number; max: number};
    scoreRange: {min: number; max: number};
  };
}
```

### Favorites System

```typescript
// lib/favorites/favorites-storage.ts
interface FavoriteItem {
  productId: string;
  addedAt: string;
  category?: string;
  customName?: string;
  notes?: string;
  alertSettings?: {
    priceThreshold?: number;
    discountThreshold?: number;
    stockAlert?: boolean;
  };
}

interface FavoritesStorage {
  add(productId: string, options?: Partial<FavoriteItem>): Promise<void>;
  remove(productId: string): Promise<void>;
  get(productId: string): Promise<FavoriteItem | null>;
  getAll(): Promise<FavoriteItem[]>;
  update(productId: string, updates: Partial<FavoriteItem>): Promise<void>;
  export(): Promise<string>; // JSON string
  import(data: string): Promise<void>;
  clear(): Promise<void>;
}

// lib/favorites/favorites-sync.ts
interface FavoriteWithPrices extends FavoriteItem {
  currentPrices: PriceAggregation;
  priceHistory: Array<{
    date: string;
    lowestPrice: number;
    source: string;
  }>;
  priceChange: {
    amount: number;
    percentage: number;
    direction: 'up' | 'down' | 'stable';
    since: string;
  };
}

interface FavoritesSync {
  syncPrices(favorites: FavoriteItem[]): Promise<FavoriteWithPrices[]>;
  trackPriceChanges(productId: string): Promise<void>;
  getPriceHistory(productId: string, days: number): Promise<Array<{date: string; price: number}>>;
}

// lib/favorites/favorites-grouping.ts
interface FavoriteGroup {
  id: string;
  name: string;
  items: FavoriteItem[];
  createdAt: string;
  color?: string;
  icon?: string;
}

interface FavoritesGrouping {
  createGroup(name: string, options?: {color?: string; icon?: string}): Promise<FavoriteGroup>;
  addToGroup(groupId: string, productId: string): Promise<void>;
  removeFromGroup(groupId: string, productId: string): Promise<void>;
  getGroups(): Promise<FavoriteGroup[]>;
  autoGroup(favorites: FavoriteItem[]): Promise<FavoriteGroup[]>; // by category/brand
}
```

### Price Alerts System

```typescript
// lib/alerts/alert-engine.ts
interface AlertCondition {
  id: string;
  productId: string;
  type: 'price_drop' | 'discount_percentage' | 'stock_available' | 'price_threshold';
  condition: {
    targetPrice?: number;
    discountPercentage?: number;
    priceChangePercentage?: number;
  };
  isActive: boolean;
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

interface AlertTrigger {
  alertId: string;
  productId: string;
  triggeredAt: string;
  condition: AlertCondition;
  currentPrice: number;
  previousPrice?: number;
  source: string;
  message: string;
}

interface AlertEngine {
  createAlert(productId: string, condition: Omit<AlertCondition, 'id' | 'createdAt' | 'triggerCount'>): Promise<string>;
  checkAlerts(priceUpdates: Array<{productId: string; prices: PriceAggregation}>): Promise<AlertTrigger[]>;
  getActiveAlerts(productId?: string): Promise<AlertCondition[]>;
  updateAlert(alertId: string, updates: Partial<AlertCondition>): Promise<void>;
  deleteAlert(alertId: string): Promise<void>;
}

// lib/alerts/notification-queue.ts
interface NotificationItem {
  id: string;
  alertTrigger: AlertTrigger;
  channels: Array<'email' | 'push' | 'sms'>;
  scheduledAt: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  lastAttempt?: string;
  error?: string;
}

interface DuplicatePreventionRule {
  productId: string;
  alertType: string;
  windowHours: number; // 24 hours default
  lastSent?: string;
}

interface NotificationQueue {
  enqueue(trigger: AlertTrigger, channels: string[]): Promise<string>;
  process(): Promise<void>;
  checkDuplicate(productId: string, alertType: string): Promise<boolean>;
  updateDuplicateRule(productId: string, alertType: string): Promise<void>;
  getQueueStatus(): Promise<{pending: number; failed: number; sent: number}>;
  retryFailed(): Promise<void>;
}

// services/email-service.ts
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
  variables: Record<string, any>;
}

interface EmailDeliveryResult {
  messageId: string;
  status: 'sent' | 'failed';
  error?: string;
  deliveredAt?: string;
}

interface EmailService {
  sendPriceAlert(
    to: string,
    productName: string,
    currentPrice: number,
    targetPrice: number,
    productUrl: string
  ): Promise<EmailDeliveryResult>;
  sendBulkAlerts(notifications: NotificationItem[]): Promise<EmailDeliveryResult[]>;
  validateEmail(email: string): boolean;
  unsubscribe(email: string, token: string): Promise<void>;
  getDeliveryStats(): Promise<{sent: number; failed: number; bounced: number}>;
}
```

### Enhanced A11y System

```typescript
// lib/a11y/axe-integration.ts
interface AxeResult {
  violations: Array<{
    id: string;
    impact: 'minor' | 'moderate' | 'serious' | 'critical';
    description: string;
    nodes: Array<{
      html: string;
      target: string[];
      failureSummary: string;
    }>;
  }>;
  passes: Array<{
    id: string;
    description: string;
  }>;
  incomplete: Array<{
    id: string;
    description: string;
    nodes: Array<{
      html: string;
      target: string[];
    }>;
  }>;
}

interface AxeIntegration {
  runAxeTests(selector?: string): Promise<AxeResult>;
  runAxeOnPage(url: string): Promise<AxeResult>;
  generateReport(results: AxeResult[]): Promise<string>;
  checkTableA11y(tableSelector: string): Promise<AxeResult>;
}

// lib/a11y/table-a11y.ts
interface TableA11yCheck {
  hasCaption: boolean;
  hasProperHeaders: boolean;
  hasScopeAttributes: boolean;
  hasAriaSortAttributes: boolean;
  keyboardNavigable: boolean;
  screenReaderFriendly: boolean;
  violations: string[];
  suggestions: string[];
}

interface TableA11yValidator {
  validateCompareTable(tableElement: HTMLTableElement): TableA11yCheck;
  validatePriceTable(tableElement: HTMLTableElement): TableA11yCheck;
  generateA11yAttributes(tableType: 'compare' | 'price'): Record<string, string>;
}

// lib/a11y/keyboard-nav.ts
interface KeyboardNavTest {
  element: string;
  keys: Array<'Tab' | 'Enter' | 'Space' | 'Escape' | 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'>;
  expectedBehavior: string;
  passed: boolean;
  error?: string;
}

interface KeyboardNavValidator {
  testCompareView(): Promise<KeyboardNavTest[]>;
  testFavoritesManager(): Promise<KeyboardNavTest[]>;
  testAlertsSetup(): Promise<KeyboardNavTest[]>;
  testAllInteractiveElements(): Promise<KeyboardNavTest[]>;
}

// lib/a11y/screen-reader.ts
interface ScreenReaderTest {
  element: string;
  expectedAnnouncement: string;
  actualAnnouncement?: string;
  passed: boolean;
  ariaAttributes: Record<string, string>;
}

interface ScreenReaderValidator {
  testCompareTableAnnouncements(): Promise<ScreenReaderTest[]>;
  testFavoriteButtonAnnouncements(): Promise<ScreenReaderTest[]>;
  testAlertNotificationAnnouncements(): Promise<ScreenReaderTest[]>;
  validateAriaLabels(): Promise<ScreenReaderTest[]>;
}
```

## Data Models

### Extended Product Data Model
```typescript
interface ExtendedProductInfo extends ProductInfo {
  sources: Array<{
    source: 'rakuten' | 'yahoo' | 'amazon' | 'iherb';
    available: boolean;
    lastChecked: string;
    confidence: number;
  }>;
  aggregatedPricing: PriceAggregation;
  compareMetrics: {
    priceRank: number; // 1-based ranking
    scoreRank: number;
    costPerDayRank: number;
    overallRank: number;
  };
  isFavorite: boolean;
  activeAlerts: AlertCondition[];
}
```

### Compare Session Data Model
```typescript
interface CompareSession {
  id: string;
  products: string[]; // product IDs
  settings: CompareState;
  createdAt: string;
  lastModified: string;
  shareToken?: string;
  isPublic: boolean;
  metadata: {
    title?: string;
    description?: string;
    tags?: string[];
  };
}
```

### Notification Data Model
```typescript
interface NotificationPreferences {
  email: {
    address: string;
    verified: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
    maxPerDay: number; // default: 5
    maxPerWeek: number; // default: 20
    unsubscribeToken: string;
  };
  push: {
    enabled: boolean;
    endpoint?: string;
    keys?: {
      p256dh: string;
      auth: string;
    };
  };
  preferences: {
    priceDrops: boolean;
    stockAlerts: boolean;
    discountAlerts: boolean;
    weeklyDigest: boolean;
  };
}
```

### A11y Test Results Data Model
```typescript
interface A11yTestSuite {
  timestamp: string;
  version: string;
  results: {
    axe: AxeResult;
    tableA11y: TableA11yCheck[];
    keyboardNav: KeyboardNavTest[];
    screenReader: ScreenReaderTest[];
  };
  summary: {
    totalViolations: number;
    criticalViolations: number;
    passedTests: number;
    failedTests: number;
    coverage: number; // percentage
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    component: string;
    issue: string;
    solution: string;
    effort: 'low' | 'medium' | 'high';
  }>;
}
```

## Error Handling

### Multi-Source Connector Error Handling
1. **API Rate Limiting**: Amazon PA-API・iHerb API制限時のリトライとバックオフ
2. **Currency Conversion**: USD→JPY変換エラー時の為替レート取得とフォールバック
3. **Product Matching Failures**: 4ソース間でのマッチング失敗時の部分マッチング表示
4. **Confidence Score Calculation**: 信頼度計算エラー時のデフォルト値設定

### Compare View Error Handling
1. **Product Loading Failures**: 一部商品の読み込み失敗時の部分表示
2. **Sort/Filter Errors**: 並べ替え・フィルタエラー時のデフォルト状態復帰
3. **URL Sharing Failures**: 共有URL生成エラー時の代替手段提供
4. **Performance Issues**: 大量商品比較時のページネーション自動適用

### Favorites Error Handling
1. **Storage Quota Exceeded**: ローカルストレージ容量超過時の古いデータ削除
2. **Sync Failures**: 価格同期エラー時のキャッシュデータ表示
3. **Export/Import Errors**: データ形式エラー時の検証と修復提案
4. **Grouping Conflicts**: グループ化エラー時の手動分類オプション

### Price Alerts Error Handling
1. **Notification Delivery Failures**: メール配信エラー時のリトライとエラー通知
2. **Duplicate Detection Errors**: 重複防止機能エラー時の手動確認
3. **Alert Condition Parsing**: 条件設定エラー時の入力検証と修正提案
4. **Queue Processing Failures**: 通知キュー処理エラー時の優先度付きリトライ

### A11y Testing Error Handling
1. **Axe Test Failures**: axe-core実行エラー時の代替テスト手法
2. **Keyboard Navigation Errors**: キーボードテストエラー時の手動検証ガイド
3. **Screen Reader Simulation Errors**: 読み上げテストエラー時のARIA属性検証
4. **CI Integration Failures**: A11yテストCI統合エラー時の段階的導入

## Testing Strategy

### Multi-Source Integration Testing
```typescript
describe('Multi-Source Price Connectors', () => {
  it('Amazon PA-APIから商品価格を正しく取得する');
  it('iHerb APIから商品価格を正しく取得する');
  it('4ソース全てで価格正規化が正確である');
  it('GTIN/JAN優先マッチングが正しく動作する');
  it('信頼度スコアが適切に計算される');
  it('3ソース未満の場合に警告を表示する');
});

describe('Price Aggregation', () => {
  it('4ソースの価格集約が正確である');
  it('最安値・最高値・平均値・中央値が正しく計算される');
  it('価格差の説明が適切に生成される');
  it('信頼度に基づく推奨ソースが選択される');
});
```

### Compare View Testing
```typescript
describe('Compare View', () => {
  it('最大4商品の横並び比較が表示される');
  it('価格・スコア・実効コスト/日・信頼度で並べ替えできる');
  it('ブランド・価格帯・容量・評価スコアでフィルタリングできる');
  it('比較結果をURLで共有できる');
  it('比較セットの保存・読み込みが正常に動作する');
});

describe('Compare Table A11y', () => {
  it('比較テーブルに適切なcaption・rowheader・columnheader属性が設定される');
  it('並べ替え可能な列にaria-sort属性が設定される');
  it('キーボードナビゲーションが正常に動作する');
  it('スクリーンリーダーで適切に読み上げられる');
});
```

### Favorites Testing
```typescript
describe('Favorites Management', () => {
  it('お気に入りの追加・削除・並べ替えが正常に動作する');
  it('価格情報の同期が正確に実行される');
  it('JSON形式でのエクスポート・インポートが動作する');
  it('カテゴリ別・ブランド別グループ化が機能する');
  it('ローカルストレージの容量制限が適切に処理される');
});

describe('Favorites A11y', () => {
  it('お気に入りボタンでaria-pressed・aria-labelが適切に更新される');
  it('お気に入り一覧でキーボードナビゲーションが動作する');
  it('グループ化操作がスクリーンリーダーで理解できる');
});
```

### Price Alerts Testing
```typescript
describe('Price Alerts Engine', () => {
  it('目標価格・割引率・在庫復活の3種類のアラートが設定できる');
  it('価格変動検知が正確に動作する');
  it('24時間以内の重複通知が防止される');
  it('通知キューの処理が正常に実行される');
  it('メール配信の失敗時リトライが動作する');
});

describe('Email Notifications', () => {
  it('価格アラートメールが正しい内容で送信される');
  it('1日最大5通、週最大20通の制限が機能する');
  it('ワンクリック配信停止が動作する');
  it('配信失敗時のエラーハンドリングが適切である');
});

describe('Alerts A11y', () => {
  it('アラート設定フォームでaria-describedby・aria-invalid属性が設定される');
  it('価格変動通知でrole="alert"・aria-live="assertive"属性が設定される');
  it('アラート管理画面でキーボード操作が可能である');
});
```

### Enhanced A11y Testing
```typescript
describe('Enhanced A11y Validation', () => {
  it('axe-coreによる自動テストが全ページで実行される');
  it('PriceTable・CompareViewでcaption・scope・aria-sort属性が確認される');
  it('全インタラクティブ要素でTab・Enter・Space・Arrow操作が確認される');
  it('NVDA・JAWSでの読み上げテストが自動化される');
  it('A11y違反検出時にCIが失敗し、具体的な修正提案が出力される');
});

describe('Table A11y Compliance', () => {
  it('比較テーブルがWCAG 2.1 AA基準を満たす');
  it('価格テーブルがキーボードナビゲーション対応している');
  it('ソート機能がスクリーンリーダーで理解できる');
  it('テーブルキャプションが適切に設定されている');
});
```

### Documentation Testing
```typescript
describe('Documentation Generation', () => {
  it('README.mdにM1新機能が正しく追記される');
  it('API仕様書にAmazon・iHerb連携仕様が記載される');
  it('A11y仕様書にテーブルa11y・キーボードナビ仕様が記載される');
  it('通知仕様書に通知キュー・メール配信仕様が記載される');
  it('差分のみでPRが作成され、automergeラベルが付与される');
});
```

## Performance Considerations

### Multi-Source API Optimization
- 並列API呼び出しによる応答時間短縮
- レスポンスキャッシュによる重複リクエスト削減
- API制限に応じた適応的リクエスト間隔調整

### Compare View Performance
- 仮想スクロールによる大量商品表示最適化
- 遅延読み込みによる初期表示速度向上
- メモ化による再レンダリング抑制

### Favorites Sync Performance
- バックグラウンド価格同期による UI ブロック回避
- 差分更新による通信量削減
- ローカルキャッシュによる表示速度向上

### Notification Queue Performance
- バッチ処理による配信効率向上
- 優先度付きキューによる重要通知の優先配信
- 失敗時の指数バックオフによるシステム負荷軽減

## Accessibility Considerations

### WCAG 2.1 AA Enhanced Compliance
- 比較テーブル: 複雑なヘッダー構造の適切な実装
- フォーム: エラーメッセージとヘルプテキストの関連付け
- 通知: 適切なライブリージョンによる動的コンテンツ通知
- キーボードナビゲーション: 論理的なタブ順序とフォーカス管理

### Advanced Screen Reader Support
- 比較テーブルの行・列ヘッダーの明確な関連付け
- お気に入り状態の変更通知
- 価格変動アラートの即座な通知
- 複雑なUI操作の段階的ガイダンス

## Security Considerations

### API Key Management
- Amazon PA-API・iHerb APIキーの安全な管理
- 環境変数による機密情報の分離
- API使用量の監視とアラート

### Email Security
- メールアドレスの検証とサニタイゼーション
- 配信停止トークンの安全な生成と検証
- スパム防止のための配信頻度制限

### Data Privacy
- お気に入りデータのローカル保存
- 個人情報の最小限収集
- GDPR準拠のデータ削除機能

## Definition of Done (DoD)

### Multi-Source Integration
- [ ] Amazon・iHerbコネクタが動作（モック含む）
- [ ] 4ソースでの価格取得・正規化が完了
- [ ] GTIN/JAN優先マッチング＋信頼度スコアが実装済み
- [ ] 3ソース以上での最安値表示が動作

### Compare View
- [ ] 最大4商品の横並び比較が実装済み
- [ ] 価格・スコア・実効コスト/日・信頼度での並べ替えが動作
- [ ] ブランド・価格帯・容量・評価スコアでのフィルタリングが動作
- [ ] 比較結果のURL共有機能が実装済み

### Favorites Management
- [ ] お気に入り追加・削除・並べ替えが動作
- [ ] 価格情報の自動同期が実装済み
- [ ] JSON形式でのエクスポート・インポートが動作
- [ ] カテゴリ別・ブランド別グループ化が実装済み

### Price Alerts
- [ ] 目標価格・割引率・在庫復活の3種類アラートが設定可能
- [ ] 通知キューによる重複防止（24時間以内）が動作
- [ ] メール通知（1日最大5通、週最大20通）が実装済み
- [ ] ワンクリック配信停止機能が動作

### Enhanced A11y
- [ ] axe-coreによる全ページ自動テストが通過
- [ ] 比較テーブル・価格テーブルでcaption・scope・aria-sort属性が適切
- [ ] 全インタラクティブ要素でキーボードナビゲーション（Tab・Enter・Space・Arrow）が動作
- [ ] お気に入りボタンでaria-pressed・aria-label更新が動作
- [ ] アラート設定フォームでaria-describedby・aria-invalid属性が適切
- [ ] 価格変動通知でrole="alert"・aria-live="assertive"属性が適切

### Documentation
- [ ] README.mdにM1新機能（Compare・Favorites・Alerts）が追記済み
- [ ] docs/API.mdにAmazon・iHerb連携仕様が記載済み
- [ ] docs/A11Y.mdにテーブルa11y・キーボードナビ仕様が記載済み
- [ ] docs/NOTIFICATIONS.mdに通知キュー・メール配信仕様が記載済み

### Quality Assurance
- [ ] CI必須チェックが全て緑色で通過
- [ ] A11y違反検出時にCIが失敗し、具体的な修正提案が出力される
- [ ] 境界値テストで4ソース価格正規化が検証済み
- [ ] 通知の単発保証（重複防止）がテスト済み