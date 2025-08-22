# Suptia Platform Design Document

**specVersion**: 2025-08-15

## Overview

Suptiaは「誰もが最も安全で最も安価な自分にピッタリのサプリメントに出会える場所」を実現するプラットフォームです。AI診断エンジン、価格比較システム、安全性評価機能、成分ガイドCMS、個人健康追跡機能を統合し、ユーザーの健康目標達成を包括的にサポートします。

顧客導線：サイト訪問 → AI診断 → 最安値比較表示 → 購入先案内 + 継続的な成分学習とモニタリング

## Architecture

### Frontend Architecture
```
app/
├── (marketing)/
│   ├── page.tsx (ランディングページ)
│   ├── about/page.tsx (Suptiaについて)
│   └── how-it-works/page.tsx (使い方ガイド)
├── diagnosis/
│   ├── page.tsx (AI診断メイン)
│   ├── questionnaire/page.tsx (質問票)
│   ├── results/page.tsx (診断結果)
│   └── history/page.tsx (診断履歴)
├── products/
│   ├── page.tsx (商品一覧)
│   ├── [slug]/page.tsx (商品詳細)
│   ├── compare/page.tsx (価格比較)
│   └── search/page.tsx (商品検索)
├── ingredients/
│   ├── page.tsx (成分一覧)
│   ├── [slug]/page.tsx (成分詳細)
│   └── guide/page.tsx (成分ガイド)
├── blog/
│   ├── page.tsx (ブログ一覧)
│   ├── [slug]/page.tsx (記事詳細)
│   └── category/[category]/page.tsx (カテゴリ別)
├── dashboard/
│   ├── page.tsx (個人ダッシュボード)
│   ├── goals/page.tsx (健康目標)
│   ├── tracking/page.tsx (摂取記録)
│   └── reports/page.tsx (進捗レポート)
└── api/
    ├── diagnosis/route.ts (AI診断API)
    ├── products/route.ts (商品情報API)
    ├── prices/route.ts (価格比較API)
    └── tracking/route.ts (追跡データAPI)
```

### Component Architecture
```
components/
├── diagnosis/
│   ├── DiagnosisWizard.tsx (診断ウィザード)
│   ├── QuestionnaireForm.tsx (質問フォーム)
│   ├── ResultsDisplay.tsx (結果表示)
│   └── RecommendationCard.tsx (推奨カード)
├── products/
│   ├── ProductCard.tsx (商品カード)
│   ├── PriceComparison.tsx (価格比較)
│   ├── SafetyWarnings.tsx (安全性警告)
│   └── NutritionFacts.tsx (栄養成分表)
├── ingredients/
│   ├── IngredientProfile.tsx (成分プロファイル)
│   ├── EffectsChart.tsx (効果チャート)
│   ├── InteractionWarnings.tsx (相互作用警告)
│   └── DosageGuide.tsx (摂取量ガイド)
├── tracking/
│   ├── GoalSetting.tsx (目標設定)
│   ├── IntakeLogger.tsx (摂取記録)
│   ├── ProgressChart.tsx (進捗チャート)
│   └── HealthMetrics.tsx (健康指標)
├── blog/
│   ├── ArticleCard.tsx (記事カード)
│   ├── ContentRenderer.tsx (コンテンツ表示)
│   ├── RelatedArticles.tsx (関連記事)
│   └── ShareButtons.tsx (共有ボタン)
└── common/
    ├── Navigation.tsx (ナビゲーション)
    ├── SearchBar.tsx (検索バー)
    ├── UserProfile.tsx (ユーザープロファイル)
    └── NotificationCenter.tsx (通知センター)
```

### Backend Services Architecture
```
lib/
├── ai/
│   ├── diagnosis-engine.ts (AI診断エンジン)
│   ├── recommendation-algorithm.ts (推奨アルゴリズム)
│   ├── safety-analyzer.ts (安全性分析)
│   └── interaction-checker.ts (相互作用チェック)
├── pricing/
│   ├── price-aggregator.ts (価格集約)
│   ├── retailer-apis.ts (通販サイトAPI)
│   ├── price-calculator.ts (実質価格計算)
│   └── price-monitor.ts (価格監視)
├── content/
│   ├── cms-client.ts (Sanity CMS クライアント)
│   ├── content-validator.ts (コンテンツ検証)
│   ├── seo-generator.ts (SEO メタデータ生成)
│   └── search-indexer.ts (検索インデックス)
├── tracking/
│   ├── goal-manager.ts (目標管理)
│   ├── intake-tracker.ts (摂取追跡)
│   ├── progress-analyzer.ts (進捗分析)
│   └── report-generator.ts (レポート生成)
└── security/
    ├── auth-provider.ts (認証プロバイダー)
    ├── data-anonymizer.ts (データ匿名化)
    ├── privacy-manager.ts (プライバシー管理)
    └── audit-logger.ts (監査ログ)
```

## Components and Interfaces

### AI Diagnosis Engine

```typescript
// lib/ai/diagnosis-engine.ts
interface UserProfile {
  id: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  healthConditions: string[];
  medications: string[];
  allergies: string[];
  lifestyle: {
    exerciseLevel: 'low' | 'moderate' | 'high';
    stressLevel: 'low' | 'moderate' | 'high';
    sleepHours: number;
    dietType: 'omnivore' | 'vegetarian' | 'vegan' | 'other';
  };
  goals: HealthGoal[];
}

interface HealthGoal {
  id: string;
  category: 'energy' | 'immunity' | 'cognitive' | 'fitness' | 'beauty' | 'other';
  description: string;
  priority: 'low' | 'medium' | 'high';
  targetDate?: string;
}

interface DiagnosisResult {
  userId: string;
  recommendedIngredients: Array<{
    ingredientId: string;
    name: string;
    confidence: number; // 0-1
    reasoning: string;
    dosageRecommendation: {
      min: number;
      max: number;
      unit: string;
      frequency: string;
    };
    safetyScore: number; // 0-10
    evidenceLevel: 'high' | 'moderate' | 'low';
  }>;
  warnings: Array<{
    type: 'interaction' | 'allergy' | 'condition' | 'dosage';
    severity: 'critical' | 'warning' | 'info';
    message: string;
    affectedIngredients: string[];
  }>;
  createdAt: string;
  expiresAt: string;
}

interface DiagnosisEngine {
  analyzeProfil(profile: UserProfile): Promise<DiagnosisResult>;
  updateRecommendations(userId: string, feedback: UserFeedback): Promise<DiagnosisResult>;
  checkSafety(ingredients: string[], profile: UserProfile): Promise<SafetyAssessment>;
}
```

### Price Comparison System

```typescript
// lib/pricing/price-aggregator.ts
interface ProductPrice {
  productId: string;
  retailerId: string;
  retailerName: string;
  price: number;
  currency: 'JPY';
  shippingCost: number;
  pointsReward?: number;
  pointsValue?: number; // JPY equivalent
  effectivePrice: number; // price + shipping - points value
  inStock: boolean;
  lastUpdated: string;
  productUrl: string;
  imageUrl?: string;
}

interface PriceComparison {
  productId: string;
  productName: string;
  prices: ProductPrice[];
  lowestPrice: ProductPrice;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  lastUpdated: string;
}

interface PriceAggregator {
  fetchPrices(productId: string): Promise<ProductPrice[]>;
  comparePrices(productIds: string[]): Promise<PriceComparison[]>;
  monitorPriceChanges(productId: string, threshold: number): Promise<void>;
  calculateEffectivePrice(price: ProductPrice): number;
}

// Retailer API integrations
interface RetailerAPI {
  name: string;
  baseUrl: string;
  searchProducts(query: string): Promise<Product[]>;
  getProductDetails(productId: string): Promise<ProductDetails>;
  checkStock(productId: string): Promise<boolean>;
  getShippingCost(productId: string, location: string): Promise<number>;
}
```

### Safety Analysis System

```typescript
// lib/ai/safety-analyzer.ts
interface SafetyAssessment {
  overallSafetyScore: number; // 0-10
  interactions: Array<{
    ingredient1: string;
    ingredient2: string;
    severity: 'critical' | 'moderate' | 'mild';
    description: string;
    recommendation: string;
  }>;
  contraindications: Array<{
    ingredientId: string;
    condition: string;
    severity: 'critical' | 'warning';
    description: string;
  }>;
  allergyWarnings: Array<{
    ingredientId: string;
    allergen: string;
    crossReactivity: string[];
  }>;
  dosageWarnings: Array<{
    ingredientId: string;
    currentDosage: number;
    maxSafeDosage: number;
    unit: string;
    consequences: string;
  }>;
}

interface InteractionChecker {
  checkDrugInteractions(ingredients: string[], medications: string[]): Promise<Interaction[]>;
  checkSupplementInteractions(ingredients: string[]): Promise<Interaction[]>;
  checkAllergyRisks(ingredients: string[], allergies: string[]): Promise<AllergyRisk[]>;
  validateDosages(ingredients: Array<{id: string; dosage: number}>): Promise<DosageValidation[]>;
}
```

### Content Management System

```typescript
// lib/content/cms-client.ts
interface IngredientContent {
  id: string;
  name: string;
  slug: string;
  description: string;
  benefits: string[];
  mechanisms: string[];
  evidenceLevel: 'high' | 'moderate' | 'low';
  studies: Array<{
    title: string;
    url: string;
    year: number;
    participants: number;
    conclusion: string;
  }>;
  safetyProfile: {
    generalSafety: string;
    sideEffects: string[];
    contraindications: string[];
    interactions: string[];
  };
  dosageGuidelines: {
    recommendedDosage: string;
    maxDosage: string;
    timing: string;
    withFood: boolean;
  };
  sources: string[];
  lastUpdated: string;
}

interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: any; // Portable Text
  author: {
    name: string;
    credentials: string;
    bio: string;
    image?: string;
  };
  category: string;
  tags: string[];
  relatedIngredients: string[];
  publishedAt: string;
  updatedAt: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

interface CMSClient {
  getIngredient(slug: string): Promise<IngredientContent>;
  getIngredients(filters?: IngredientFilters): Promise<IngredientContent[]>;
  getBlogArticle(slug: string): Promise<BlogArticle>;
  getBlogArticles(filters?: ArticleFilters): Promise<BlogArticle[]>;
  searchContent(query: string): Promise<SearchResult[]>;
}
```

### Health Tracking System

```typescript
// lib/tracking/goal-manager.ts
interface HealthGoalTracking {
  goalId: string;
  userId: string;
  goal: HealthGoal;
  metrics: Array<{
    date: string;
    value: number;
    unit: string;
    notes?: string;
  }>;
  milestones: Array<{
    date: string;
    description: string;
    achieved: boolean;
  }>;
  progress: {
    currentValue: number;
    targetValue: number;
    percentComplete: number;
    trend: 'improving' | 'stable' | 'declining';
  };
}

interface IntakeRecord {
  id: string;
  userId: string;
  productId: string;
  ingredientId: string;
  dosage: number;
  unit: string;
  takenAt: string;
  notes?: string;
  sideEffects?: string[];
}

interface ProgressReport {
  userId: string;
  period: {
    start: string;
    end: string;
  };
  goals: HealthGoalTracking[];
  intakeConsistency: {
    totalDays: number;
    adherentDays: number;
    adherenceRate: number;
  };
  improvements: Array<{
    metric: string;
    change: number;
    significance: 'significant' | 'moderate' | 'minimal';
  }>;
  recommendations: Array<{
    type: 'continue' | 'adjust' | 'add' | 'remove';
    description: string;
    reasoning: string;
  }>;
}
```

## Data Models

### User Data Model
```typescript
interface User {
  id: string;
  email: string;
  profile: UserProfile;
  preferences: {
    notifications: {
      priceAlerts: boolean;
      newArticles: boolean;
      goalReminders: boolean;
    };
    privacy: {
      shareAnonymousData: boolean;
      marketingEmails: boolean;
    };
  };
  subscription?: {
    plan: 'free' | 'premium';
    startDate: string;
    endDate?: string;
  };
  createdAt: string;
  lastLoginAt: string;
}
```

### Product Data Model
```typescript
interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
  ingredients: Array<{
    ingredientId: string;
    amount: number;
    unit: string;
    percentDV?: number;
  }>;
  servingSize: {
    amount: number;
    unit: string;
    servingsPerContainer: number;
  };
  categories: string[];
  certifications: string[]; // 'organic', 'gmp', 'third-party-tested'
  images: string[];
  nutritionFacts?: {
    calories?: number;
    macronutrients?: Record<string, number>;
    vitamins?: Record<string, number>;
    minerals?: Record<string, number>;
  };
  safetyInfo: {
    warnings: string[];
    allergens: string[];
    contraindications: string[];
  };
  retailerInfo: Array<{
    retailerId: string;
    productUrl: string;
    sku: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
```

### Ingredient Data Model
```typescript
interface Ingredient {
  id: string;
  name: string;
  slug: string;
  alternativeNames: string[];
  category: string;
  description: string;
  molecularFormula?: string;
  casNumber?: string;
  functions: string[]; // 'antioxidant', 'anti-inflammatory', etc.
  bioavailability: {
    absorption: 'high' | 'moderate' | 'low';
    factors: string[];
  };
  metabolism: {
    halfLife?: string;
    excretion: string;
  };
  safetyData: {
    ld50?: string;
    noael?: string; // No Observed Adverse Effect Level
    loael?: string; // Lowest Observed Adverse Effect Level
  };
  regulatoryStatus: {
    fda: 'approved' | 'gras' | 'dietary_supplement' | 'not_approved';
    efsa: 'approved' | 'under_review' | 'not_approved';
    japan: 'approved' | 'under_review' | 'not_approved';
  };
  researchStatus: {
    totalStudies: number;
    humanStudies: number;
    animalStudies: number;
    inVitroStudies: number;
    lastReviewDate: string;
  };
}
```

## Error Handling

### AI Diagnosis Errors
1. **Incomplete Profile Data**: 不完全なユーザープロファイルの検出と追加質問の提示
2. **Conflicting Health Information**: 矛盾する健康情報の検出と確認要求
3. **AI Model Failures**: AI推論エラーの検出とフォールバック推奨の提供
4. **Safety Check Failures**: 安全性チェックエラーの処理と保守的な推奨

### Price Comparison Errors
1. **Retailer API Failures**: 通販サイトAPI障害時の代替データソース利用
2. **Price Data Inconsistencies**: 価格データの異常値検出と検証
3. **Stock Information Errors**: 在庫情報の不整合処理と更新頻度調整
4. **Currency Conversion Errors**: 通貨換算エラーの処理と固定レート利用

### Content Management Errors
1. **CMS Connection Failures**: Sanity CMS接続エラーの処理とキャッシュ利用
2. **Content Validation Errors**: コンテンツ検証エラーの検出と修正提案
3. **Search Index Errors**: 検索インデックス更新エラーの処理と再試行
4. **Media Loading Failures**: 画像・動画読み込みエラーの代替表示

### User Data Errors
1. **Authentication Failures**: 認証エラーの処理と再認証フロー
2. **Data Synchronization Errors**: データ同期エラーの検出と修復
3. **Privacy Compliance Errors**: プライバシー規制違反の検出と修正
4. **Backup and Recovery Errors**: データバックアップ・復旧エラーの処理

## Testing Strategy

### AI Diagnosis Testing
```typescript
describe('AI Diagnosis Engine', () => {
  it('ユーザープロファイルから適切な推奨を生成する');
  it('安全性チェックで相互作用を正しく検出する');
  it('アレルギー情報を適切に考慮する');
  it('推奨の信頼度スコアが妥当である');
});
```

### Price Comparison Testing
```typescript
describe('Price Comparison System', () => {
  it('複数通販サイトから価格を正しく取得する');
  it('実質価格計算が正確である');
  it('最安値を正しく特定する');
  it('価格変動を適切に監視する');
});
```

### Content Management Testing
```typescript
describe('Content Management', () => {
  it('成分情報を正しく取得・表示する');
  it('ブログ記事の検索が正常に動作する');
  it('関連コンテンツ推奨が適切である');
  it('SEOメタデータが正しく生成される');
});
```

### Health Tracking Testing
```typescript
describe('Health Tracking', () => {
  it('健康目標の設定・追跡が正常に動作する');
  it('摂取記録の入力・集計が正確である');
  it('進捗レポートが適切に生成される');
  it('目標達成度の計算が正しい');
});
```

### Integration Testing
```typescript
describe('Platform Integration', () => {
  it('診断から商品推奨まで一連のフローが動作する');
  it('価格比較から購入リンクまで正常に機能する');
  it('ユーザー追跡データが適切に統合される');
  it('コンテンツ推奨が診断結果と連携する');
});
```

## Performance Considerations

### AI Processing Optimization
- **Model Caching**: AI推論結果のキャッシュ化
- **Batch Processing**: 複数ユーザーの診断バッチ処理
- **Edge Computing**: 地理的に近いサーバーでの処理

### Price Data Optimization
- **API Rate Limiting**: 通販サイトAPI呼び出し頻度の最適化
- **Data Caching**: 価格データの効率的なキャッシュ戦略
- **Background Updates**: バックグラウンドでの価格情報更新

### Content Delivery Optimization
- **CDN Integration**: 静的コンテンツのCDN配信
- **Image Optimization**: 製品画像の最適化と遅延読み込み
- **Search Performance**: 検索インデックスの最適化

## Security Considerations

### Data Protection
- **Encryption**: 個人健康情報の暗号化保存
- **Anonymization**: 分析用データの匿名化処理
- **Access Control**: 適切な認証・認可機能

### API Security
- **Rate Limiting**: API呼び出し頻度制限
- **Input Validation**: 全入力データの検証
- **HTTPS Enforcement**: 全通信のHTTPS強制

### Privacy Compliance
- **GDPR Compliance**: EU一般データ保護規則への準拠
- **Cookie Management**: 適切なCookie管理と同意取得
- **Data Retention**: データ保持期間の管理と自動削除

## Definition of Done (DoD)

### Core Functionality
- [ ] AI診断エンジンが個人最適化推奨を生成
- [ ] 価格比較システムが複数通販サイトから最安値を特定
- [ ] 安全性チェックが相互作用・アレルギーを検出
- [ ] 成分ガイドとブログ記事が適切に表示
- [ ] 健康目標追跡と進捗レポートが機能

### User Experience
- [ ] レスポンシブデザインでモバイル最適化
- [ ] アクセシビリティ（WCAG 2.1 AA）準拠
- [ ] PWA機能でアプリライクな体験
- [ ] 直感的なUI/UXで顧客導線が明確

### Performance & Quality
- [ ] Lighthouse予算遵守（LCP≤2.5s, TBT≤200ms, CLS≤0.1）
- [ ] 全機能の自動テストが通過
- [ ] セキュリティ監査が完了
- [ ] プライバシー規制への準拠確認

### SEO & Content
- [ ] 構造化データ（Product, Article, WebApplication JSON-LD）実装
- [ ] サイトマップとrobots.txt生成
- [ ] メタデータとcanonical URL設定
- [ ] コンテンツ管理システム（Sanity CMS）統合

### Business Logic
- [ ] 顧客導線（訪問→診断→比較→案内）が完全に機能
- [ ] 管理者向けコンテンツ・商品管理機能
- [ ] 分析・レポート機能でビジネス指標測定
- [ ] スケーラブルなアーキテクチャで成長対応