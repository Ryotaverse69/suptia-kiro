import type { Recommendation } from '@/components/SearchBar';

// AIレコメンドのカテゴリ
export type RecommendationCategory = 
  | 'popular'      // 人気商品
  | 'cost-effective' // コスパ重視
  | 'high-quality'   // 高品質
  | 'beginner'       // 初心者向け
  | 'specific-need'; // 特定の目的

// レコメンド生成のためのユーザーコンテキスト
export interface UserContext {
  searchHistory?: string[];
  preferences?: {
    priceRange?: [number, number];
    categories?: string[];
    purposes?: string[];
  };
  demographics?: {
    age?: number;
    gender?: 'male' | 'female' | 'other';
  };
}

// レコメンドアイテムの詳細情報
export interface RecommendationItem extends Recommendation {
  category: RecommendationCategory;
  tags: string[];
  priceRange?: [number, number];
  popularityScore: number;
  evidenceLevel: 'high' | 'medium' | 'low';
}

// モックデータ：実際の商品データベースから取得する想定
const MOCK_PRODUCTS: RecommendationItem[] = [
  {
    id: 'vitamin-c-1000',
    title: 'ビタミンC 1000mg',
    reason: '免疫力向上に効果的で、コストパフォーマンスが優秀です。多くの研究でその効果が実証されています。',
    confidence: 0.95,
    category: 'cost-effective',
    tags: ['ビタミン', '免疫', 'コスパ', '初心者'],
    priceRange: [800, 1500],
    popularityScore: 0.92,
    evidenceLevel: 'high',
  },
  {
    id: 'omega-3-fish-oil',
    title: 'オメガ3フィッシュオイル',
    reason: '心血管の健康をサポートし、高品質な成分を含有しています。DHA・EPAの含有量が豊富です。',
    confidence: 0.88,
    category: 'high-quality',
    tags: ['オメガ3', '心血管', '脳機能', '高品質'],
    priceRange: [1200, 3000],
    popularityScore: 0.85,
    evidenceLevel: 'high',
  },
  {
    id: 'multivitamin-basic',
    title: 'マルチビタミン ベーシック',
    reason: '初心者におすすめの基本的な栄養素を網羅したマルチビタミンです。バランスの良い配合が特徴です。',
    confidence: 0.82,
    category: 'beginner',
    tags: ['マルチビタミン', '初心者', 'バランス', '基本'],
    priceRange: [1000, 2000],
    popularityScore: 0.78,
    evidenceLevel: 'medium',
  },
  {
    id: 'protein-powder-whey',
    title: 'ホエイプロテイン',
    reason: '筋肉量増加や運動パフォーマンス向上に効果的です。吸収率が高く、アミノ酸スコアも優秀です。',
    confidence: 0.90,
    category: 'specific-need',
    tags: ['プロテイン', '筋肉', '運動', 'アミノ酸'],
    priceRange: [2000, 5000],
    popularityScore: 0.87,
    evidenceLevel: 'high',
  },
  {
    id: 'magnesium-glycinate',
    title: 'マグネシウム グリシネート',
    reason: '睡眠の質改善とストレス軽減に効果的です。吸収率の高いグリシネート形態を使用しています。',
    confidence: 0.79,
    category: 'specific-need',
    tags: ['マグネシウム', '睡眠', 'ストレス', '吸収率'],
    priceRange: [1500, 2500],
    popularityScore: 0.71,
    evidenceLevel: 'medium',
  },
  {
    id: 'vitamin-d3-2000',
    title: 'ビタミンD3 2000IU',
    reason: '骨の健康と免疫機能をサポートします。日本人に不足しがちな栄養素として注目されています。',
    confidence: 0.86,
    category: 'popular',
    tags: ['ビタミンD', '骨', '免疫', '不足しがち'],
    priceRange: [800, 1800],
    popularityScore: 0.89,
    evidenceLevel: 'high',
  },
];

// 検索クエリに基づくレコメンド生成
export function generateRecommendations(
  query: string,
  userContext?: UserContext,
  maxResults: number = 5
): RecommendationItem[] {
  if (!query.trim()) {
    return getPopularRecommendations(maxResults);
  }

  const normalizedQuery = query.toLowerCase().trim();
  const recommendations: RecommendationItem[] = [];

  // 1. 完全一致または部分一致による検索
  const exactMatches = MOCK_PRODUCTS.filter(product =>
    product.title.toLowerCase().includes(normalizedQuery) ||
    product.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))
  );

  // 2. 関連キーワードによる検索
  const relatedMatches = MOCK_PRODUCTS.filter(product =>
    !exactMatches.includes(product) &&
    (product.reason.toLowerCase().includes(normalizedQuery) ||
     isRelatedKeyword(normalizedQuery, product.tags))
  );

  // 3. ユーザーコンテキストに基づく調整
  const contextAdjustedMatches = adjustForUserContext(
    [...exactMatches, ...relatedMatches],
    userContext
  );

  // 4. 信頼度とポピュラリティでソート
  const sortedMatches = contextAdjustedMatches.sort((a, b) => {
    const scoreA = a.confidence * 0.7 + a.popularityScore * 0.3;
    const scoreB = b.confidence * 0.7 + b.popularityScore * 0.3;
    return scoreB - scoreA;
  });

  return sortedMatches.slice(0, maxResults);
}

// 人気商品のレコメンド取得
export function getPopularRecommendations(maxResults: number = 5): RecommendationItem[] {
  return MOCK_PRODUCTS
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, maxResults);
}

// カテゴリ別レコメンド取得
export function getCategoryRecommendations(
  category: RecommendationCategory,
  maxResults: number = 5
): RecommendationItem[] {
  return MOCK_PRODUCTS
    .filter(product => product.category === category)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxResults);
}

// 関連キーワードの判定
function isRelatedKeyword(query: string, tags: string[]): boolean {
  const relatedKeywords: Record<string, string[]> = {
    '免疫': ['ビタミン', 'ビタミンC', 'ビタミンD', '亜鉛'],
    '筋肉': ['プロテイン', 'アミノ酸', 'BCAA', 'クレアチン'],
    '睡眠': ['マグネシウム', 'メラトニン', 'グリシン'],
    '美容': ['コラーゲン', 'ビタミンC', 'ビタミンE', 'ヒアルロン酸'],
    '疲労': ['ビタミンB', 'コエンザイムQ10', '鉄分'],
    '骨': ['カルシウム', 'ビタミンD', 'マグネシウム', 'ビタミンK'],
    '心血管': ['オメガ3', 'DHA', 'EPA', 'コエンザイムQ10'],
  };

  for (const [keyword, related] of Object.entries(relatedKeywords)) {
    if (query.includes(keyword)) {
      return tags.some(tag => 
        related.some(rel => tag.toLowerCase().includes(rel.toLowerCase()))
      );
    }
  }

  return false;
}

// ユーザーコンテキストに基づく調整
function adjustForUserContext(
  recommendations: RecommendationItem[],
  userContext?: UserContext
): RecommendationItem[] {
  if (!userContext) {
    return recommendations;
  }

  return recommendations.map(rec => {
    let adjustedConfidence = rec.confidence;

    // 価格帯の調整
    if (userContext.preferences?.priceRange && rec.priceRange) {
      const [userMin, userMax] = userContext.preferences.priceRange;
      const [recMin, recMax] = rec.priceRange;
      
      // 価格帯が一致する場合は信頼度を上げる
      if (recMin >= userMin && recMax <= userMax) {
        adjustedConfidence = Math.min(1.0, adjustedConfidence + 0.1);
      }
    }

    // カテゴリの調整
    if (userContext.preferences?.categories) {
      const hasMatchingCategory = userContext.preferences.categories.some(cat =>
        rec.tags.some(tag => tag.toLowerCase().includes(cat.toLowerCase()))
      );
      if (hasMatchingCategory) {
        adjustedConfidence = Math.min(1.0, adjustedConfidence + 0.05);
      }
    }

    // 検索履歴に基づく調整
    if (userContext.searchHistory) {
      const hasRelatedHistory = userContext.searchHistory.some(history =>
        rec.tags.some(tag => history.toLowerCase().includes(tag.toLowerCase()))
      );
      if (hasRelatedHistory) {
        adjustedConfidence = Math.min(1.0, adjustedConfidence + 0.03);
      }
    }

    return {
      ...rec,
      confidence: adjustedConfidence,
    };
  });
}

// レコメンド理由の生成
export function generateRecommendationReason(
  product: RecommendationItem,
  query: string,
  userContext?: UserContext
): string {
  let reason = product.reason;

  // クエリに基づく理由の追加
  if (query) {
    const normalizedQuery = query.toLowerCase();
    if (product.tags.some(tag => normalizedQuery.includes(tag.toLowerCase()))) {
      reason += ` 「${query}」に関連する成分を含有しています。`;
    }
  }

  // ユーザーコンテキストに基づく理由の追加
  if (userContext?.preferences?.priceRange && product.priceRange) {
    const [userMin, userMax] = userContext.preferences.priceRange;
    const [recMin, recMax] = product.priceRange;
    
    if (recMin >= userMin && recMax <= userMax) {
      reason += ' ご希望の価格帯に適合しています。';
    }
  }

  return reason;
}

// デバウンス機能付きレコメンド生成
export function createDebouncedRecommendationGenerator(delay: number = 300) {
  let timeoutId: NodeJS.Timeout;

  return function debouncedGenerate(
    query: string,
    userContext?: UserContext,
    maxResults?: number
  ): Promise<RecommendationItem[]> {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const recommendations = generateRecommendations(query, userContext, maxResults);
        resolve(recommendations);
      }, delay);
    });
  };
}