# Suptia MVP Design Document

**specVersion**: 2025-08-16

## Overview

Suptia M0（3週間）で「誰もが最も安全で最も安価な自分にピッタリのサプリメントに出会える場所」の核心体験を実現するシステムです。価格メタサーチ（楽天・Yahoo!）、AI診断（安全版）、商品詳細統合、成分ガイド基礎版を通じて、ユーザーが薬機法準拠の安全な環境で効果的なサプリメント選択を行える最小限の機能を提供します。

M0スコープ：価格コネクタ → 実効コスト/日計算 → AI診断（安全版）→ 商品詳細統合（スコア・警告・価格）→ 成分ガイド基礎記事。品質保証（A11yライトE2E・JSON-LD・Lighthouse予算警告運用）を含む。

## Architecture

### Security Layer
```
next.config.js
├── Security Headers Configuration
├── CSP Policy Definition
└── API Route Protection

middleware.ts
├── Request Validation
├── Rate Limiting
└── Security Headers Application

lib/security/
├── validation.ts (Zod schemas)
├── rate-limit.ts (IP-based limiting)
└── sanitize.ts (Content sanitization)
```

### SEO Layer
```
lib/seo/
├── metadata.ts (Dynamic metadata generation)
├── json-ld.ts (Structured data)
├── sitemap.ts (Sitemap generation)
└── canonical.ts (URL cleaning)

app/
├── sitemap.xml/route.ts
├── robots.txt/route.ts
└── layout.tsx (Global SEO setup)
```

### Accessibility Layer
```
components/ui/
├── AccessibleTable.tsx
├── AccessibleBanner.tsx
└── KeyboardNavigation.tsx

lib/a11y/
├── aria-utils.ts
└── keyboard-handlers.ts
```

### LLM/Agent Safety Layer
```
.kiro/steering/
├── security.md (Security guidelines)
└── communication.md (Language guidelines)

lib/agent/
├── content-filter.ts
└── domain-whitelist.ts
```

### Price Connector Module (価格コネクタモジュール)
```
lib/pricing/
├── rakuten-connector.ts (楽天API統合)
├── yahoo-connector.ts (Yahoo!ショッピングAPI統合)
├── price-normalizer.ts (価格正規化・税込・送料込み)
├── cost-calculator.ts (実効コスト/日計算)
└── price-matcher.ts (GTIN/JAN優先マッチング)

components/pricing/
├── PriceTable.tsx (価格比較テーブル)
├── CostPerDayBadge.tsx (実効コスト/日バッジ)
├── LowestPriceBadge.tsx (最安値バッジ)
└── PriceSourceLink.tsx (出典リンク)

mocks/
├── rakuten-mock.ts (楽天APIモック)
└── yahoo-mock.ts (Yahoo!APIモック)
```

### AI Diagnosis Module (AI診断モジュール - 安全版)
```
lib/diagnosis/
├── safe-questionnaire.ts (安全版質問フロー)
├── category-recommender.ts (カテゴリ推奨エンジン)
├── compliance-checker.ts (薬機法準拠チェック)
└── prohibited-terms.ts (禁止表現辞書)

components/diagnosis/
├── SafeDiagnosisFlow.tsx (安全版診断フロー)
├── CategoryRecommendation.tsx (カテゴリ推奨表示)
└── ComplianceWarning.tsx (注意喚起表示)

scripts/
└── lint-compliance.ts (薬機法Lintスクリプト)
```

### Enhanced SEO Module (拡張SEOモジュール)
```
lib/seo/
├── aggregate-rating.ts (総合評価JSON-LD)
├── json-ld-enhanced.ts (拡張構造化データ)
└── schema-validator.ts (schema.org検証)

components/seo/
├── AggregateRatingJsonLd.tsx
└── EnhancedProductJsonLd.tsx
```

### Cross-Quality Module (横断品質モジュール)
```
lib/quality/
├── pr-monitor.ts (PR監視・automerge判定)
├── a11y-checker.ts (A11y自動点検)
├── jsonld-validator.ts (JSON-LD/CSP検証)
└── docs-generator.ts (ドキュメント自動生成)

scripts/quality/
├── check-pr-status.ts (PR状態確認スクリプト)
├── run-a11y-audit.ts (A11y監査実行)
├── validate-structured-data.ts (構造化データ検証)
└── generate-docs.ts (ドキュメント生成)

.github/workflows/
├── quality-check.yml (品質チェックワークフロー)
└── auto-docs.yml (ドキュメント自動更新)
```

## Components and Interfaces

### Price Connector System

```typescript
// lib/pricing/rakuten-connector.ts
interface RakutenProduct {
  itemCode: string;
  itemName: string;
  itemPrice: number;
  postageFlag: 0 | 1; // 0: 送料別, 1: 送料込み
  itemUrl: string;
  mediumImageUrls: string[];
  availability: 1 | 0; // 1: 在庫あり, 0: 在庫なし
  reviewCount: number;
  reviewAverage: number;
  shopName: string;
  genreId: string;
}

interface RakutenConnector {
  searchProducts(keyword: string, genreId?: string): Promise<RakutenProduct[]>;
  getProductByCode(itemCode: string): Promise<RakutenProduct>;
  checkStock(itemCode: string): Promise<boolean>;
}

// lib/pricing/yahoo-connector.ts
interface YahooProduct {
  code: string;
  name: string;
  price: number;
  shipping: {
    code: number; // 0: 送料別, 1: 送料込み
    price?: number;
  };
  url: string;
  image: {
    medium: string;
  };
  inStock: boolean;
  review: {
    count: number;
    rate: number;
  };
  seller: {
    name: string;
  };
}

interface YahooConnector {
  searchProducts(query: string, categoryId?: string): Promise<YahooProduct[]>;
  getProductDetails(code: string): Promise<YahooProduct>;
  getShippingCost(code: string, prefecture: string): Promise<number>;
}
```

### Price Normalization System

```typescript
// lib/pricing/price-normalizer.ts
interface NormalizedPrice {
  productId: string;
  source: 'rakuten' | 'yahoo';
  basePrice: number; // 税込価格
  shippingCost: number;
  totalPrice: number; // basePrice + shippingCost
  inStock: boolean;
  isSubscription: boolean;
  subscriptionDiscount?: number;
  lastUpdated: string;
  sourceUrl: string;
  shopName: string;
}

interface PriceNormalizer {
  normalizeRakutenPrice(product: RakutenProduct): NormalizedPrice;
  normalizeYahooPrice(product: YahooProduct): NormalizedPrice;
  calculateTotalPrice(basePrice: number, shippingCost: number): number;
  detectSubscription(productName: string): boolean;
}

// lib/pricing/cost-calculator.ts
interface CostPerDay {
  productId: string;
  servingSize: number; // 1回分の量
  servingsPerContainer: number; // 容器あたりの回数
  recommendedDailyIntake: number; // 推奨1日摂取量
  daysPerContainer: number; // 1容器で何日分
  costPerDay: number; // 1日あたりコスト
  costPerServing: number; // 1回分あたりコスト
}

interface CostCalculator {
  calculateCostPerDay(price: NormalizedPrice, product: ProductInfo): CostPerDay;
  compareCosts(costs: CostPerDay[]): CostPerDay[]; // 安い順にソート
  findLowestCost(costs: CostPerDay[]): CostPerDay;
}
```

### Product Matching System

```typescript
// lib/pricing/price-matcher.ts
interface ProductMatch {
  productId: string;
  gtin?: string; // Global Trade Item Number
  jan?: string; // Japanese Article Number
  name: string;
  brand: string;
  capacity: {
    amount: number;
    unit: string;
  };
  matchConfidence: number; // 0-1
}

interface PriceMatcher {
  matchByGTIN(gtin: string, sources: ('rakuten' | 'yahoo')[]): Promise<NormalizedPrice[]>;
  matchByJAN(jan: string, sources: ('rakuten' | 'yahoo')[]): Promise<NormalizedPrice[]>;
  matchByNameAndCapacity(product: ProductMatch, sources: ('rakuten' | 'yahoo')[]): Promise<NormalizedPrice[]>;
  validateMatch(product: ProductMatch, externalProduct: RakutenProduct | YahooProduct): boolean;
}
```

### Safe AI Diagnosis System

```typescript
// lib/diagnosis/safe-questionnaire.ts
interface SafeQuestion {
  id: string;
  type: 'single' | 'multiple' | 'scale' | 'text';
  category: 'lifestyle' | 'goals' | 'preferences' | 'demographics';
  question: string;
  options?: Array<{
    value: string;
    label: string;
  }>;
  validation?: {
    required: boolean;
    min?: number;
    max?: number;
  };
  complianceNotes: string; // 薬機法準拠のための注意事項
}

interface SafeQuestionnaire {
  questions: SafeQuestion[];
  categories: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

// lib/diagnosis/category-recommender.ts
interface CategoryRecommendation {
  categoryId: string;
  categoryName: string;
  confidence: number; // 0-1
  reasoning: string[];
  suggestedProducts: string[]; // product IDs
  warnings: string[]; // 注意喚起（医療的断定は避ける）
  disclaimers: string[]; // 免責事項
}

interface CategoryRecommender {
  analyzeResponses(responses: Record<string, any>): CategoryRecommendation[];
  validateCompliance(recommendation: CategoryRecommendation): boolean;
  addDisclaimers(recommendation: CategoryRecommendation): CategoryRecommendation;
}

// lib/diagnosis/compliance-checker.ts
interface ComplianceViolation {
  type: 'medical_claim' | 'treatment_effect' | 'disease_name' | 'guarantee';
  severity: 'critical' | 'warning';
  text: string;
  suggestion: string;
}

interface ComplianceChecker {
  checkText(text: string): ComplianceViolation[];
  validateRecommendation(recommendation: CategoryRecommendation): ComplianceViolation[];
  getProhibitedTerms(): string[];
  getSafeAlternatives(prohibitedTerm: string): string[];
}
```

### Enhanced JSON-LD with Aggregate Rating

```typescript
// lib/seo/aggregate-rating.ts
interface AggregateRating {
  '@type': 'AggregateRating';
  ratingValue: number; // 0-5スケール、1桁小数
  bestRating: 5;
  worstRating: 0;
  ratingCount: number;
}

interface EnhancedProductJsonLd extends ProductJsonLd {
  aggregateRating?: AggregateRating;
}

interface RatingCalculator {
  convertToFivePointScale(score: number, maxScore: number): number;
  formatToOneDecimal(rating: number): number;
  calculateAggregateRating(scores: number[]): AggregateRating;
}

// components/seo/AggregateRatingJsonLd.tsx
interface AggregateRatingJsonLdProps {
  productId: string;
  totalScore: number;
  maxScore: number;
  reviewCount?: number;
}
```

### Security Configuration

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https://cdn.sanity.io data:; connect-src 'self' https://*.sanity.io; upgrade-insecure-requests;" 
    // GA4利用時のみ: script-src に https://www.googletagmanager.com を追加
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
];

// middleware.ts
interface RateLimitConfig {
  windowMs: number; // 600000 (10 minutes)
  maxRequests: number; // 60
  skipSuccessfulRequests: boolean;
  logIpHash: boolean; // IPハッシュをログに記録
  logRoute: boolean; // 経路をログに記録
}

interface SecurityMiddleware {
  validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T;
  checkRateLimit(ip: string): boolean;
  applySanitization(content: string): string;
}
```

### SEO Utilities

```typescript
// lib/seo/json-ld.ts
interface ProductJsonLd {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  brand: {
    '@type': 'Brand';
    name: string;
  };
  offers: {
    '@type': 'Offer';
    price: number;
    priceCurrency: 'JPY';
    availability: string;
  };
  url: string;
  image?: string;
  description?: string;
}

interface BreadcrumbJsonLd {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

// lib/seo/canonical.ts
interface CanonicalUrlConfig {
  baseUrl: string;
  excludeParams: string[];
}

export function cleanUrl(url: string, config: CanonicalUrlConfig): string;
export function generateCanonical(path: string): string;
```

### Accessibility Components

```typescript
// components/ui/AccessibleTable.tsx
interface AccessibleTableProps {
  caption: string;
  headers: Array<{
    key: string;
    label: string;
    sortable?: boolean;
    sortDirection?: 'asc' | 'desc' | 'none';
  }>;
  data: Array<Record<string, any>>;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
}

// components/ui/AccessibleBanner.tsx
interface AccessibleBannerProps {
  type: 'warning' | 'error' | 'info' | 'success';
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  role?: 'alert' | 'status';
}
```

### LLM Agent Safety

```typescript
// lib/agent/content-filter.ts
interface ContentFilter {
  isExternalInstruction(content: string): boolean;
  sanitizeContent(content: string): string;
  validateDomain(url: string): boolean;
}

interface AgentSafetyConfig {
  allowedDomains: string[];
  blockedInstructions: string[];
  requireConfirmation: string[];
}

// lib/agent/domain-whitelist.ts
const ALLOWED_DOMAINS = [
  '*.sanity.io',
  '*.suptia.com',
  'localhost',
  '127.0.0.1'
];

export function isDomainAllowed(domain: string): boolean;
export function validateNetworkAccess(url: string): boolean;
```

### Cross-Quality Module Interfaces

```typescript
// lib/quality/pr-monitor.ts
interface PRCheckStatus {
  name: string;
  status: 'success' | 'failure' | 'pending' | 'error';
  conclusion?: string;
  logs?: string[];
}

interface PRMonitorResult {
  prNumber: number;
  requiredChecks: string[];
  checkResults: PRCheckStatus[];
  automergeReady: boolean;
  blockingFactors: string[];
  suggestedFixes?: Array<{
    file: string;
    diff: string;
    description: string;
  }>;
}

export interface PRMonitor {
  checkPRStatus(prNumber: number): Promise<PRMonitorResult>;
  generateMinimalFix(failedCheck: PRCheckStatus): Promise<string>;
  createFixPR(fixes: Array<{file: string; diff: string}>): Promise<string>;
}

// lib/quality/a11y-checker.ts
interface A11yViolation {
  type: 'contrast' | 'label' | 'focus' | 'aria' | 'keyboard';
  element: string;
  description: string;
  severity: 'error' | 'warning';
  suggestedFix: string;
}

interface A11yCheckResult {
  violations: A11yViolation[];
  passed: boolean;
  summary: {
    errors: number;
    warnings: number;
    components: string[];
  };
}

export interface A11yChecker {
  runStaticAnalysis(): Promise<A11yViolation[]>;
  runE2ETests(components: string[]): Promise<A11yViolation[]>;
  generateReport(): Promise<A11yCheckResult>;
}

// lib/quality/jsonld-validator.ts
interface JSONLDValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  structuredData: Array<{
    type: string;
    valid: boolean;
    issues: string[];
  }>;
}

interface CSPValidationResult {
  nonceValid: boolean;
  violations: string[];
  recommendations: string[];
}

export interface StructuredDataValidator {
  validateJSONLD(html: string): Promise<JSONLDValidationResult>;
  validateCSPNonce(html: string): Promise<CSPValidationResult>;
  generateReport(): Promise<{jsonld: JSONLDValidationResult; csp: CSPValidationResult}>;
}

// lib/quality/docs-generator.ts
interface DocTemplate {
  path: string;
  template: string;
  variables: Record<string, any>;
}

interface DocsGenerationResult {
  generated: Array<{
    file: string;
    content: string;
    changed: boolean;
  }>;
  prUrl?: string;
}

export interface DocsGenerator {
  extractTypeInfo(): Promise<Record<string, any>>;
  generateFromTemplate(template: DocTemplate): Promise<string>;
  updateREADME(envVars: Record<string, string>): Promise<string>;
  createScoringDocs(examples: Array<{input: any; output: any}>): Promise<string>;
  createA11yDocs(guidelines: string[]): Promise<string>;
  createPR(changes: Array<{file: string; content: string}>): Promise<string>;
}
```

## Data Models

### Price Data Model
```typescript
interface PriceData {
  productId: string;
  prices: NormalizedPrice[];
  lowestPrice: NormalizedPrice;
  costPerDay: CostPerDay[];
  lowestCostPerDay: CostPerDay;
  lastUpdated: string;
  matchQuality: {
    gtinMatch: boolean;
    janMatch: boolean;
    nameMatch: boolean;
    capacityMatch: boolean;
  };
}

interface ProductInfo {
  id: string;
  name: string;
  brand: string;
  gtin?: string;
  jan?: string;
  capacity: {
    amount: number;
    unit: string;
    servingsPerContainer: number;
  };
  recommendedDailyIntake: {
    amount: number;
    unit: string;
  };
  category: string;
}
```

### Diagnosis Data Model
```typescript
interface DiagnosisSession {
  id: string;
  userId?: string;
  responses: Record<string, any>;
  recommendations: CategoryRecommendation[];
  createdAt: string;
  completedAt?: string;
  complianceChecked: boolean;
  disclaimersShown: string[];
}

interface UserProfile {
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  lifestyle: {
    exerciseFrequency?: 'none' | 'light' | 'moderate' | 'intense';
    stressLevel?: 'low' | 'moderate' | 'high';
    sleepHours?: number;
    dietType?: 'balanced' | 'vegetarian' | 'vegan' | 'low_carb' | 'other';
  };
  goals: Array<{
    category: 'energy' | 'immunity' | 'cognitive' | 'fitness' | 'beauty' | 'general_health';
    priority: 'low' | 'medium' | 'high';
  }>;
  preferences: {
    formType?: 'tablet' | 'capsule' | 'powder' | 'liquid' | 'gummy';
    priceRange?: 'budget' | 'mid_range' | 'premium';
    brandPreference?: string[];
  };
}
```

### Environment Configuration Model
```typescript
interface PricingEnvironment {
  rakuten: {
    applicationId: string;
    affiliateId?: string;
    baseUrl: string;
  };
  yahoo: {
    clientId: string;
    clientSecret: string;
    baseUrl: string;
  };
  cache: {
    ttl: number; // seconds
    maxEntries: number;
  };
}

interface ComplianceConfig {
  prohibitedTerms: string[];
  warningPhrases: string[];
  requiredDisclaimers: string[];
  safeAlternatives: Record<string, string>;
}
```

### Lighthouse Budget Model
```typescript
interface PerformanceMetrics {
  lcp: number; // Largest Contentful Paint (ms)
  tbt: number; // Total Blocking Time (ms)
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint (ms)
  si: number;  // Speed Index
  jsSize: number; // JavaScript bundle size (KB)
  cssSize: number; // CSS bundle size (KB)
  imageSize: number; // Image total size (KB)
}

interface BudgetThresholds {
  lcp: { warning: 2500, error: 4000 };
  tbt: { warning: 200, error: 600 };
  cls: { warning: 0.1, error: 0.25 };
  jsSize: { warning: 300, error: 500 }; // KB
}
```

### Security Headers Configuration
```typescript
interface SecurityHeadersConfig {
  csp: {
    defaultSrc: string[];
    scriptSrc: string[];
    styleSrc: string[];
    imgSrc: string[];
    fontSrc: string[];
  };
  frameOptions: 'DENY' | 'SAMEORIGIN';
  contentTypeOptions: 'nosniff';
  referrerPolicy: string;
  permissionsPolicy: Record<string, string[]>;
}
```

### SEO Metadata Schema
```typescript
interface SEOMetadata {
  title: string;
  description: string;
  canonical: string;
  openGraph: {
    title: string;
    description: string;
    url: string;
    type: string;
    images?: string[];
  };
  twitter: {
    card: 'summary' | 'summary_large_image';
    title: string;
    description: string;
    images?: string[];
  };
  jsonLd: Array<ProductJsonLd | BreadcrumbJsonLd>;
}
```

### ISR Configuration
```typescript
interface ISRConfig {
  '/products/[slug]': {
    revalidate: 600; // 10 minutes
  };
  '/': {
    revalidate: 3600; // 1 hour
  };
  '/products': {
    revalidate: 1800; // 30 minutes
  };
}
```

### Quality Check Configuration
```typescript
interface QualityConfig {
  requiredChecks: string[];
  a11yTargets: string[];
  docsTemplates: Record<string, string>;
  prSettings: {
    autoMergeLabel: string;
    draftByDefault: boolean;
  };
}

interface CheckJobConfig {
  name: string;
  timeout: number; // milliseconds
  retryCount: number;
  logTailLines: number; // 80
}
```

## Error Handling

### Price Connector Error Handling
1. **API Rate Limiting**: 楽天・Yahoo! API制限時のリトライとバックオフ
2. **Network Failures**: ネットワークエラー時のモックデータフォールバック
3. **Invalid Product Data**: 不正な商品データの検出とスキップ
4. **Price Mismatch**: 価格データ不整合の検出と警告表示

### Diagnosis Safety Error Handling
1. **Compliance Violations**: 薬機法違反表現の検出と修正提案
2. **Invalid Responses**: 不正な回答データの検証と再入力要求
3. **Recommendation Failures**: 推奨生成エラー時の安全なフォールバック
4. **Disclaimer Missing**: 免責事項不足の検出と自動追加

### Product Matching Error Handling
1. **GTIN/JAN Mismatch**: 商品コード不一致時の代替マッチング
2. **Capacity Validation**: 容量データ不整合の検出と手動確認要求
3. **Brand Mismatch**: ブランド名不一致の警告と確認プロセス
4. **Stock Information**: 在庫情報エラーの処理と更新頻度調整

### Performance Budget Error Handling
1. **Budget Exceeded**: 予算超過時の警告レポート（ビルド継続）
2. **Metric Collection Failures**: Lighthouse実行エラーの処理
3. **Threshold Configuration Errors**: 予算設定の検証と修正提案
4. **CI Integration Issues**: Lighthouse CI統合エラーの処理

### Security Error Handling
1. **CSP Violations**: ログ記録と適切なフォールバック
2. **Rate Limit Exceeded**: 429ステータスコードと適切なRetry-Afterヘッダー
3. **Input Validation Errors**: 400ステータスコードと詳細なエラーメッセージ
4. **Unauthorized Access**: 401/403ステータスコードと適切なリダイレクト

### SEO Error Handling
1. **Invalid JSON-LD**: 構造化データの検証とフォールバック
2. **Missing Metadata**: デフォルト値の適用
3. **Canonical URL Errors**: 基本URLへのフォールバック

### Agent Safety Error Handling
1. **External Instruction Detection**: 指示の実行拒否とログ記録
2. **Domain Violation**: ネットワークアクセスの拒否
3. **Unauthorized Operations**: 操作の停止と確認要求

### Quality Module Error Handling
1. **PR Check Timeout**: 長時間Pendingの場合のログ取得と分析
2. **A11y Test Failures**: 具体的な修正提案の生成
3. **JSON-LD Validation Errors**: 構造化データの修正提案
4. **Docs Generation Failures**: テンプレート解析エラーの処理
5. **Auto-PR Creation Failures**: ブランチ作成・コミット・PR作成の各段階でのエラー処理

## Testing Strategy

### Price Connector Testing
```typescript
describe('Price Connectors', () => {
  it('楽天APIから商品価格を正しく取得する');
  it('Yahoo!APIから商品価格を正しく取得する');
  it('価格正規化が税込・送料込みで正確である');
  it('実効コスト/日の計算が正しい');
  it('APIエラー時にモックデータを使用する');
});

describe('Price Matcher', () => {
  it('GTIN/JAN優先でマッチングする');
  it('容量一致が必須条件として機能する');
  it('マッチング信頼度が適切に計算される');
  it('境界値テストで異常データを処理する');
});
```

### Safe Diagnosis Testing
```typescript
describe('Safe AI Diagnosis', () => {
  it('薬機法準拠の質問のみを表示する');
  it('医療的断定を避けたカテゴリ推奨を生成する');
  it('禁止表現を自動検出する');
  it('適切な免責事項を追加する');
  it('注意喚起が適切に表示される');
});

describe('Compliance Checker', () => {
  it('禁止辞書に基づいてNG表現を検出する');
  it('PRで薬機法違反を自動チェックする');
  it('安全な代替表現を提案する');
  it('重要度に応じて警告レベルを設定する');
});
```

### Product Integration Testing
```typescript
describe('Product Detail Integration', () => {
  it('ScoreDisplay + PersonaWarnings + PriceTableが統合表示される');
  it('最安値バッジが正しく表示される');
  it('取得時刻と出典リンクが明示される');
  it('実効コスト/日での並べ替えが機能する');
});
```

### Lighthouse Budget Testing
```typescript
describe('Lighthouse Budget', () => {
  it('LCP≤2.5sの予算を正しく監視する');
  it('TBT≤200msの予算を適切にチェックする');
  it('CLS≤0.1の予算を正確に測定する');
  it('JS≤300KBの予算を監視する');
  it('予算超過時に警告のみ出力する（ビルド継続）');
});
```

### A11y Light E2E Testing
```typescript
describe('A11y Light E2E', () => {
  it('WarningBannerの存在と読み上げを確認する');
  it('ScoreDisplayの存在と読み上げを確認する');
  it('PriceTableの存在と読み上げを確認する');
  it('キーボードナビゲーションが機能する');
  it('適切なARIA属性が設定されている');
});
```

### Enhanced JSON-LD Testing
```typescript
describe('Enhanced JSON-LD', () => {
  it('aggregateRatingを正しく生成する');
  it('0-5スケールに適切に換算する');
  it('1桁小数で評価値を出力する');
  it('schema.org仕様に準拠する');
});
```

### Security Testing
```typescript
describe('Security Headers', () => {
  it('CSPヘッダーが正しく設定される');
  it('X-Frame-Optionsが適切に設定される');
  it('レート制限が正常に動作する');
  it('入力検証が不正データを拒否する');
});

describe('Agent Safety', () => {
  it('外部指示を検出して拒否する');
  it('許可されていないドメインへのアクセスを拒否する');
  it('書き込み操作前に確認を要求する');
});
```

### SEO Testing
```typescript
describe('SEO Optimization', () => {
  it('Product JSON-LDが正しく生成される');
  it('BreadcrumbList JSON-LDが適切に設定される');
  it('canonical URLからトラッキングパラメータが除去される');
  it('sitemap.xmlが正しく生成される');
});
```

### Accessibility Testing
```typescript
describe('Accessibility', () => {
  it('テーブルに適切なcaptionが設定される');
  it('ソート可能なヘッダーにaria-sort属性が設定される');
  it('警告バナーにrole="status"が設定される');
  it('キーボードナビゲーションが正常に動作する');
});
```

### Quality Module Testing
```typescript
describe('PR Monitor', () => {
  it('必須チェックの状態を正しく取得する');
  it('automerge可否を適切に判定する');
  it('失敗時に最小修正diffを生成する');
  it('「apply」承認でPRを自動作成する');
});

describe('A11y Checker', () => {
  it('eslint-plugin-jsx-a11yによる静的解析が動作する');
  it('Playwrightによる軽量E2Eが実行される');
  it('WarningBanner/ScoreDisplayのa11yを検証する');
  it('WCAG 2.1 AAコア要件を検証する');
});

describe('Structured Data Validator', () => {
  it('JSON-LD構造化データを検証する');
  it('CSP nonceの有効性を確認する');
  it('合否を明示的に出力する');
});

describe('Docs Generator', () => {
  it('型定義から情報を抽出する');
  it('READMEに環境変数を追記する');
  it('SCORING.mdを生成する');
  it('差分のみでPRを作成する');
});
```

## Performance Considerations

### ISR Optimization
- 商品詳細ページ: 10分間隔での再生成
- 一覧ページ: 30分間隔での再生成
- 静的ページ: 1時間間隔での再生成

### Security Performance
- レート制限: メモリベースの簡易実装（Redis移行を将来検討）
- CSP: インライン許可を最小限に抑制
- 入力検証: Zodスキーマの最適化

### SEO Performance
- JSON-LD: 必要最小限のデータのみ含める
- Sitemap: 動的生成とキャッシュ
- Canonical URL: 効率的なパラメータ除去

## Accessibility Considerations

### WCAG 2.1 AA Compliance
- テーブル: caption、scope属性、aria-sort
- フォーム: 適切なラベルとエラーメッセージ
- ナビゲーション: キーボードアクセス、フォーカス管理
- 色彩: 十分なコントラスト比の確保

### Screen Reader Support
- セマンティックHTML構造
- 適切なARIA属性
- 読み上げ順序の最適化

## Security Considerations

### Content Security Policy
- スクリプト実行の制限
- インライン実行の最小化
- 外部リソースの制限

### Input Validation
- すべてのAPI入力のZod検証
- SQLインジェクション防止
- XSS防止のサニタイゼーション

### Agent Safety
- 外部コンテンツの指示実行禁止
- ドメインホワイトリスト制限
- 書き込み操作の事前確認

## Definition of Done (DoD)

### M0 Core Functionality
- [ ] 楽天・Yahoo!から価格取得が動作（モック含む）
- [ ] 1商品につき2ソースの価格が一致マッチ
- [ ] 実効コスト/日の計算と並べ替えが正しく動作
- [ ] 最安値バッジがUIで明示される
- [ ] AI診断（安全版）→商品詳細の流れが完成

### Price Integration
- [ ] PriceTableがScoreDisplay・PersonaWarningsと統合表示
- [ ] 取得時刻と出典リンクが明示される
- [ ] 税込・送料込み・在庫・サブスク情報が正規化表示
- [ ] GTIN/JAN優先マッチング＋容量一致フォールバックが動作

### Compliance & Safety
- [ ] 薬機法準拠の診断フローが実装済み
- [ ] 禁止表現辞書による文言Lintが動作
- [ ] PRで自動コンプライアンスチェックが実行
- [ ] 疾患名・治療効果の断定表現がゼロ

### Quality Assurance
- [ ] CI必須7チェック["format:check","lint","test","typecheck","build","headers","jsonld"]が緑色
- [ ] JSON-LD aggregateRatingが実装・検証済み
- [ ] A11yライトE2E（WarningBanner/Score/PriceTable）が通過
- [ ] Lighthouse予算（LCP≤2.5s, TBT≤200ms, CLS≤0.1, JS≤300KB）警告運用

### Content & SEO
- [ ] 成分ガイド基礎記事5本がSanityで作成済み
- [ ] 0-5スケール換算のaggregateRatingが正しく動作
- [ ] schema.org仕様準拠が検証済み
- [ ] 商品詳細ページでスコア・警告・価格が同時表示

### Testing & CI
- [ ] 境界値テストで価格正規化が検証済み
- [ ] マッチャーのGTIN/JAN優先ロジックがテスト済み
- [ ] DoDチェックリストがPRテンプレートに組み込み済み
- [ ] CIワークフローが更新済み

### User Experience
- [ ] 診断→商品詳細の導線でNG表現ゼロ
- [ ] 実効コスト/日バッジが視覚的に分かりやすい
- [ ] 価格情報の信頼性（取得時刻・出典）が明確
- [ ] アクセシビリティ（スクリーンリーダー対応）が確保済み