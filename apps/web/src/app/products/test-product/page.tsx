/**
 * Test Product Page for A11y E2E Testing
 * WarningBanner、ScoreDisplay、PriceTableのテスト用ページ
 */

import { PersonaWarnings } from "@/components/PersonaWarnings";
import { PriceTable } from "@/components/pricing/PriceTable";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import type { ScoreResult } from "@/lib/scoring";
import type { NormalizedPrice } from "@/lib/pricing/price-normalizer";
import type { CostPerDay } from "@/lib/pricing/cost-calculator";

// Mock data for testing
const mockScoreResult: ScoreResult = {
  total: 75,
  components: {
    evidence: 80,
    safety: 85,
    cost: 60,
    practicality: 75,
  },
  weights: {
    evidence: 0.3,
    safety: 0.3,
    cost: 0.2,
    practicality: 0.2,
  },
  breakdown: {
    evidence: {
      score: 80,
      factors: [
        {
          name: "研究品質",
          value: 85,
          weight: 0.4,
          description: "高品質な研究が複数存在",
        },
        { name: "研究数", value: 80, weight: 0.3, description: "十分な研究数" },
        {
          name: "一貫性",
          value: 75,
          weight: 0.3,
          description: "結果の一貫性が高い",
        },
      ],
      explanation: "エビデンスレベルA: 3件の高品質研究",
    },
    safety: {
      score: 85,
      factors: [
        {
          name: "副作用レベル",
          value: 90,
          weight: 0.5,
          description: "副作用リスクが低い",
        },
        {
          name: "相互作用",
          value: 80,
          weight: 0.3,
          description: "薬物相互作用が少ない",
        },
        {
          name: "禁忌事項",
          value: 85,
          weight: 0.2,
          description: "禁忌事項が明確",
        },
      ],
      explanation: "副作用リスク: 低",
    },
    cost: {
      score: 60,
      factors: [
        { name: "価格", value: 50, weight: 0.4, description: "市場平均価格" },
        { name: "容量", value: 70, weight: 0.3, description: "適切な容量設定" },
        {
          name: "実効コスト",
          value: 60,
          weight: 0.3,
          description: "1日あたりコストは普通",
        },
      ],
      explanation: "コストパフォーマンス: 普通",
    },
    practicality: {
      score: 75,
      factors: [
        {
          name: "摂取しやすさ",
          value: 80,
          weight: 0.4,
          description: "カプセル形状で摂取しやすい",
        },
        {
          name: "継続性",
          value: 70,
          weight: 0.3,
          description: "継続しやすい摂取量",
        },
        {
          name: "利便性",
          value: 75,
          weight: 0.3,
          description: "携帯性に優れる",
        },
      ],
      explanation: "実用性: 良好",
    },
  },
  isComplete: true,
  missingData: [],
};

const mockPrices: NormalizedPrice[] = [
  {
    productId: "test-product",
    source: "rakuten",
    sourceProductId: "rakuten-123",
    basePrice: 2980,
    shippingCost: 0,
    totalPrice: 2980,
    inStock: true,
    isSubscription: false,
    lastUpdated: new Date().toISOString(),
    sourceUrl: "https://rakuten.co.jp/test-product",
    shopName: "テストショップ楽天店",
    currency: "JPY",
    taxIncluded: true,
    metadata: {
      originalPrice: 2980,
      taxRate: 0.1,
      freeShippingThreshold: 3000,
    },
  },
  {
    productId: "test-product",
    source: "yahoo",
    sourceProductId: "yahoo-456",
    basePrice: 3200,
    shippingCost: 500,
    totalPrice: 3700,
    inStock: true,
    isSubscription: true,
    subscriptionDiscount: 0.1,
    lastUpdated: new Date().toISOString(),
    sourceUrl: "https://shopping.yahoo.co.jp/test-product",
    shopName: "テストショップYahoo!店",
    currency: "JPY",
    taxIncluded: true,
    metadata: {
      originalPrice: 3200,
      taxRate: 0.1,
      freeShippingThreshold: 2000,
    },
  },
];

const mockCosts: CostPerDay[] = [
  {
    productId: "test-product",
    source: "rakuten",
    sourceProductId: "rakuten-123",
    servingSize: 2,
    servingsPerContainer: 60,
    recommendedDailyIntake: 2,
    daysPerContainer: 30,
    costPerDay: 99.33,
    costPerServing: 49.67,
    costPerUnit: 24.83,
    totalPrice: 2980,
    currency: "JPY",
    calculatedAt: new Date().toISOString(),
    metadata: {
      unitType: "count",
      unit: "粒",
      concentrationPerServing: 1000,
      bioavailability: 0.8,
      qualityScore: 0.85,
    },
  },
  {
    productId: "test-product",
    source: "yahoo",
    sourceProductId: "yahoo-456",
    servingSize: 2,
    servingsPerContainer: 60,
    recommendedDailyIntake: 2,
    daysPerContainer: 30,
    costPerDay: 123.33,
    costPerServing: 61.67,
    costPerUnit: 30.83,
    totalPrice: 3700,
    currency: "JPY",
    calculatedAt: new Date().toISOString(),
    metadata: {
      unitType: "count",
      unit: "粒",
      concentrationPerServing: 1000,
      bioavailability: 0.8,
      qualityScore: 0.8,
    },
  },
];

export default function TestProductPage() {
  const mockIngredients = ["ビタミンC", "ビタミンD", "亜鉛"];
  const mockPersonas: ("general" | "medical_professional" | "underage")[] = [
    "general",
  ];
  const mockDescription =
    "これはテスト用の商品説明です。薬機法準拠のテストを行うため、医療効果を謳わない安全な表現を使用しています。";

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        テスト商品 - A11yテスト用
      </h1>

      {/* Persona-based Warning Banner */}
      <PersonaWarnings
        text={mockDescription}
        ingredients={mockIngredients}
        personas={mockPersonas}
        enableCompliance={true}
        showDetails={true}
        className="mb-6"
      />

      {/* Product Score Display */}
      <div className="mb-8" aria-label="製品スコア表示">
        <ScoreDisplay
          scoreResult={mockScoreResult}
          showBreakdown={true}
          isLoading={false}
        />
        <ScoreBreakdown
          breakdown={mockScoreResult.breakdown}
          weights={mockScoreResult.weights}
          className="mt-6"
        />
      </div>

      {/* Price Comparison Table */}
      <PriceTable
        prices={mockPrices}
        costs={mockCosts}
        productName="テスト商品"
        showConfidence={true}
        sortBy="costPerDay"
        sortOrder="asc"
        maxRows={10}
        showSourceDetails={true}
        className="mb-8"
      />

      {/* Additional test elements for keyboard navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          キーボードナビゲーションテスト
        </h2>
        <div className="space-y-4">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="テストボタン1"
          >
            テストボタン1
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label="テストボタン2"
          >
            テストボタン2
          </button>
          <a
            href="#test-link"
            className="inline-block bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="テストリンク"
          >
            テストリンク
          </a>
        </div>
      </div>

      {/* Test live region for screen reader announcements */}
      <div
        id="test-live-region"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        テスト用ライブリージョン
      </div>

      {/* Test status region */}
      <div
        role="status"
        aria-live="polite"
        className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg mb-4"
      >
        <span className="sr-only">ステータス: </span>
        テスト用ステータスメッセージ
      </div>

      {/* Back to home */}
      <div className="text-center">
        <a
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="ホームページに戻る"
        >
          ホームに戻る
        </a>
      </div>
    </div>
  );
}

export const metadata = {
  title: "テスト商品 - A11yテスト用",
  description: "アクセシビリティテスト用のテスト商品ページです。",
  robots: "noindex, nofollow", // テストページなので検索エンジンにインデックスされないようにする
};
