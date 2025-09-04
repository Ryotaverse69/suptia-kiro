/**
 * 有料会員管理ライブラリ
 * ローカルストレージを使用して会員情報を管理（実際の実装ではサーバーサイドで管理）
 */

export type MembershipTier = 'free' | 'basic' | 'premium' | 'enterprise';

export interface MembershipInfo {
  userId: string;
  tier: MembershipTier;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  features: string[];
  limits: {
    priceAlerts: number;
    diagnosisHistory: number;
    favoriteProducts: number;
    comparisons: number;
  };
  billing: {
    amount: number;
    currency: string;
    interval: 'monthly' | 'yearly';
    nextBillingDate?: string;
  };
}

export interface MembershipFeature {
  id: string;
  name: string;
  description: string;
  tier: MembershipTier;
  category: 'analysis' | 'alerts' | 'data' | 'support';
}

const MEMBERSHIP_KEY = 'suptia-membership';

// 会員プランの定義
export const MEMBERSHIP_PLANS: Record<MembershipTier, {
  name: string;
  price: { monthly: number; yearly: number };
  features: string[];
  limits: MembershipInfo['limits'];
}> = {
  free: {
    name: '無料プラン',
    price: { monthly: 0, yearly: 0 },
    features: ['basic-search', 'basic-comparison'],
    limits: {
      priceAlerts: 3,
      diagnosisHistory: 5,
      favoriteProducts: 10,
      comparisons: 3,
    },
  },
  basic: {
    name: 'ベーシックプラン',
    price: { monthly: 980, yearly: 9800 },
    features: ['basic-search', 'basic-comparison', 'price-alerts', 'diagnosis-history'],
    limits: {
      priceAlerts: 20,
      diagnosisHistory: 50,
      favoriteProducts: 100,
      comparisons: 10,
    },
  },
  premium: {
    name: 'プレミアムプラン',
    price: { monthly: 1980, yearly: 19800 },
    features: [
      'basic-search', 'basic-comparison', 'price-alerts', 'diagnosis-history',
      'advanced-analysis', 'priority-support', 'export-data'
    ],
    limits: {
      priceAlerts: 100,
      diagnosisHistory: 200,
      favoriteProducts: 500,
      comparisons: 50,
    },
  },
  enterprise: {
    name: 'エンタープライズプラン',
    price: { monthly: 4980, yearly: 49800 },
    features: [
      'basic-search', 'basic-comparison', 'price-alerts', 'diagnosis-history',
      'advanced-analysis', 'priority-support', 'export-data',
      'api-access', 'custom-reports', 'dedicated-support'
    ],
    limits: {
      priceAlerts: -1, // 無制限
      diagnosisHistory: -1,
      favoriteProducts: -1,
      comparisons: -1,
    },
  },
};

// 機能の定義
export const MEMBERSHIP_FEATURES: MembershipFeature[] = [
  {
    id: 'basic-search',
    name: '基本検索',
    description: '商品の基本的な検索・閲覧機能',
    tier: 'free',
    category: 'analysis',
  },
  {
    id: 'basic-comparison',
    name: '基本比較',
    description: '最大3商品までの基本比較機能',
    tier: 'free',
    category: 'analysis',
  },
  {
    id: 'price-alerts',
    name: '価格アラート',
    description: '商品価格の変動通知機能',
    tier: 'basic',
    category: 'alerts',
  },
  {
    id: 'diagnosis-history',
    name: '診断履歴',
    description: '過去の診断結果の保存・比較機能',
    tier: 'basic',
    category: 'data',
  },
  {
    id: 'advanced-analysis',
    name: '高度な分析',
    description: '詳細な成分分析・相互作用チェック',
    tier: 'premium',
    category: 'analysis',
  },
  {
    id: 'priority-support',
    name: '優先サポート',
    description: '優先的なカスタマーサポート',
    tier: 'premium',
    category: 'support',
  },
  {
    id: 'export-data',
    name: 'データエクスポート',
    description: 'お気に入りや履歴のデータエクスポート',
    tier: 'premium',
    category: 'data',
  },
  {
    id: 'api-access',
    name: 'API アクセス',
    description: 'プログラムからのデータアクセス',
    tier: 'enterprise',
    category: 'data',
  },
  {
    id: 'custom-reports',
    name: 'カスタムレポート',
    description: '個別カスタマイズされた分析レポート',
    tier: 'enterprise',
    category: 'analysis',
  },
  {
    id: 'dedicated-support',
    name: '専任サポート',
    description: '専任担当者によるサポート',
    tier: 'enterprise',
    category: 'support',
  },
];

/**
 * 現在の会員情報を取得
 */
export function getMembershipInfo(): MembershipInfo {
  try {
    const membership = localStorage.getItem(MEMBERSHIP_KEY);
    if (membership) {
      return JSON.parse(membership);
    }
  } catch (error) {
    console.error('会員情報の取得に失敗しました:', error);
  }

  // デフォルトは無料プラン
  return {
    userId: 'demo-user',
    tier: 'free',
    startDate: new Date().toISOString(),
    isActive: true,
    features: MEMBERSHIP_PLANS.free.features,
    limits: MEMBERSHIP_PLANS.free.limits,
    billing: {
      amount: 0,
      currency: 'JPY',
      interval: 'monthly',
    },
  };
}

/**
 * 会員情報を更新
 */
export function updateMembershipInfo(updates: Partial<MembershipInfo>): void {
  try {
    const current = getMembershipInfo();
    const updated = { ...current, ...updates };
    localStorage.setItem(MEMBERSHIP_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('会員情報の更新に失敗しました:', error);
    throw error;
  }
}

/**
 * 特定の機能が利用可能かチェック
 */
export function hasFeature(featureId: string): boolean {
  const membership = getMembershipInfo();
  return membership.features.includes(featureId);
}

/**
 * 制限値をチェック
 */
export function checkLimit(limitType: keyof MembershipInfo['limits'], currentCount: number): {
  allowed: boolean;
  limit: number;
  remaining: number;
} {
  const membership = getMembershipInfo();
  const limit = membership.limits[limitType];
  
  if (limit === -1) {
    // 無制限
    return { allowed: true, limit: -1, remaining: -1 };
  }
  
  return {
    allowed: currentCount < limit,
    limit,
    remaining: Math.max(0, limit - currentCount),
  };
}

/**
 * プランをアップグレード（デモ用）
 */
export function upgradePlan(newTier: MembershipTier, interval: 'monthly' | 'yearly' = 'monthly'): void {
  const plan = MEMBERSHIP_PLANS[newTier];
  if (!plan) {
    throw new Error('無効なプランです');
  }

  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + (interval === 'yearly' ? 12 : 1));

  updateMembershipInfo({
    tier: newTier,
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    isActive: true,
    features: plan.features,
    limits: plan.limits,
    billing: {
      amount: plan.price[interval],
      currency: 'JPY',
      interval,
      nextBillingDate: endDate.toISOString(),
    },
  });
}

/**
 * プランをダウングレード
 */
export function downgradePlan(newTier: MembershipTier): void {
  const plan = MEMBERSHIP_PLANS[newTier];
  if (!plan) {
    throw new Error('無効なプランです');
  }

  updateMembershipInfo({
    tier: newTier,
    features: plan.features,
    limits: plan.limits,
    billing: {
      amount: plan.price.monthly,
      currency: 'JPY',
      interval: 'monthly',
    },
  });
}

/**
 * 会員プランの比較データを取得
 */
export function getPlanComparison(): Array<{
  tier: MembershipTier;
  plan: typeof MEMBERSHIP_PLANS[MembershipTier];
  features: MembershipFeature[];
  isCurrentPlan: boolean;
}> {
  const currentMembership = getMembershipInfo();
  
  return Object.entries(MEMBERSHIP_PLANS).map(([tier, plan]) => ({
    tier: tier as MembershipTier,
    plan,
    features: MEMBERSHIP_FEATURES.filter(feature => 
      plan.features.includes(feature.id)
    ),
    isCurrentPlan: tier === currentMembership.tier,
  }));
}

/**
 * 会員ステータスの表示用データを取得
 */
export function getMembershipStatus(): {
  tier: MembershipTier;
  tierName: string;
  isActive: boolean;
  daysRemaining?: number;
  nextBillingDate?: string;
  features: MembershipFeature[];
  usage: {
    priceAlerts: { current: number; limit: number };
    diagnosisHistory: { current: number; limit: number };
    favoriteProducts: { current: number; limit: number };
  };
} {
  const membership = getMembershipInfo();
  const plan = MEMBERSHIP_PLANS[membership.tier];
  
  let daysRemaining: number | undefined;
  if (membership.endDate) {
    const endDate = new Date(membership.endDate);
    const now = new Date();
    daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  // 実際の使用量（デモ用のダミーデータ）
  const usage = {
    priceAlerts: { current: 2, limit: membership.limits.priceAlerts },
    diagnosisHistory: { current: 3, limit: membership.limits.diagnosisHistory },
    favoriteProducts: { current: 5, limit: membership.limits.favoriteProducts },
  };

  return {
    tier: membership.tier,
    tierName: plan.name,
    isActive: membership.isActive,
    daysRemaining,
    nextBillingDate: membership.billing.nextBillingDate,
    features: MEMBERSHIP_FEATURES.filter(feature => 
      membership.features.includes(feature.id)
    ),
    usage,
  };
}

/**
 * 会員データをクリア（開発・テスト用）
 */
export function clearMembershipData(): void {
  try {
    localStorage.removeItem(MEMBERSHIP_KEY);
  } catch (error) {
    console.error('会員データのクリアに失敗しました:', error);
    throw error;
  }
}