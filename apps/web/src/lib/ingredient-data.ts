// 成分データの型定義とモックデータ

export interface Ingredient {
  id: string;
  name: string;
  nameEn: string;
  category: IngredientCategory;
  description: string;
  benefits: string[];
  recommendedDosage: string;
  sideEffects: string[];
  interactions: string[];
  evidenceLevel: 'high' | 'medium' | 'low';
  sources: string[];
  purposes: PurposeCategory[];
  commonForms: ProductForm[];
  averagePrice: number; // 月あたりの平均価格（円）
  popularity: number; // 人気度スコア (1-100)
  imageUrl?: string; // 成分画像URL（オプショナル）
}

export type IngredientCategory =
  | 'vitamins'
  | 'minerals'
  | 'herbs'
  | 'amino-acids'
  | 'probiotics'
  | 'others';

export interface IngredientCategoryInfo {
  id: IngredientCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  count: number;
}

// 目的別カテゴリ
export type PurposeCategory =
  | 'fatigue-recovery'
  | 'beauty'
  | 'immunity'
  | 'brain-health'
  | 'heart-health'
  | 'bone-health'
  | 'muscle-building'
  | 'weight-management'
  | 'stress-relief'
  | 'sleep-improvement';

export interface PurposeCategoryInfo {
  id: PurposeCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
}

// 形状別カテゴリ
export type ProductForm =
  | 'tablet'
  | 'capsule'
  | 'powder'
  | 'liquid'
  | 'gummy'
  | 'softgel';

export interface ProductFormInfo {
  id: ProductForm;
  name: string;
  description: string;
}

// 価格帯
export interface PriceRange {
  id: string;
  name: string;
  min: number;
  max: number;
}

// フィルタ状態
export interface FilterState {
  categories: IngredientCategory[];
  purposes: PurposeCategory[];
  forms: ProductForm[];
  priceRange: PriceRange | null;
  evidenceLevel: ('high' | 'medium' | 'low')[];
  searchQuery: string;
  sortBy: 'name' | 'evidence' | 'popularity';
  sortOrder: 'asc' | 'desc';
}

// 目的別カテゴリ情報
export const PURPOSE_CATEGORIES: PurposeCategoryInfo[] = [
  {
    id: 'fatigue-recovery',
    name: '疲労回復',
    description: '疲れやすさの改善、エネルギー向上',
    icon: '⚡',
    color: 'bg-yellow-100 text-yellow-800',
  },
  {
    id: 'beauty',
    name: '美容・アンチエイジング',
    description: '肌の健康、老化防止',
    icon: '✨',
    color: 'bg-pink-100 text-pink-800',
  },
  {
    id: 'immunity',
    name: '免疫力向上',
    description: '風邪予防、免疫機能強化',
    icon: '🛡️',
    color: 'bg-green-100 text-green-800',
  },
  {
    id: 'brain-health',
    name: '脳機能・認知力',
    description: '記憶力、集中力の向上',
    icon: '🧠',
    color: 'bg-purple-100 text-purple-800',
  },
  {
    id: 'heart-health',
    name: '心血管系の健康',
    description: '心臓、血管の健康維持',
    icon: '❤️',
    color: 'bg-red-100 text-red-800',
  },
  {
    id: 'bone-health',
    name: '骨・関節の健康',
    description: '骨密度、関節機能の維持',
    icon: '🦴',
    color: 'bg-gray-100 text-gray-800',
  },
  {
    id: 'muscle-building',
    name: '筋肉増強・運動',
    description: '筋肉合成、運動パフォーマンス',
    icon: '💪',
    color: 'bg-orange-100 text-orange-800',
  },
  {
    id: 'weight-management',
    name: '体重管理',
    description: 'ダイエット、代謝向上',
    icon: '⚖️',
    color: 'bg-blue-100 text-blue-800',
  },
  {
    id: 'stress-relief',
    name: 'ストレス軽減',
    description: 'リラックス、不安軽減',
    icon: '🧘',
    color: 'bg-indigo-100 text-indigo-800',
  },
  {
    id: 'sleep-improvement',
    name: '睡眠の質改善',
    description: '入眠、睡眠の深さ改善',
    icon: '😴',
    color: 'bg-violet-100 text-violet-800',
  },
];

// 形状別情報
export const PRODUCT_FORMS: ProductFormInfo[] = [
  {
    id: 'tablet',
    name: 'タブレット',
    description: '錠剤タイプ、携帯性に優れる',
  },
  {
    id: 'capsule',
    name: 'カプセル',
    description: 'カプセルタイプ、飲みやすい',
  },
  {
    id: 'powder',
    name: 'パウダー',
    description: '粉末タイプ、吸収が早い',
  },
  {
    id: 'liquid',
    name: '液体',
    description: 'ドリンクタイプ、即効性がある',
  },
  {
    id: 'gummy',
    name: 'グミ',
    description: 'グミタイプ、美味しく摂取',
  },
  {
    id: 'softgel',
    name: 'ソフトジェル',
    description: 'ソフトカプセル、油溶性成分に適している',
  },
];

// 価格帯情報
export const PRICE_RANGES: PriceRange[] = [
  {
    id: 'budget',
    name: '1,000円未満',
    min: 0,
    max: 999,
  },
  {
    id: 'affordable',
    name: '1,000円〜2,999円',
    min: 1000,
    max: 2999,
  },
  {
    id: 'mid-range',
    name: '3,000円〜4,999円',
    min: 3000,
    max: 4999,
  },
  {
    id: 'premium',
    name: '5,000円〜9,999円',
    min: 5000,
    max: 9999,
  },
  {
    id: 'luxury',
    name: '10,000円以上',
    min: 10000,
    max: Infinity,
  },
];

// カテゴリ情報
export const INGREDIENT_CATEGORIES: IngredientCategoryInfo[] = [
  {
    id: 'vitamins',
    name: 'ビタミン',
    description:
      '体の機能維持に必要な必須栄養素。エネルギー代謝や免疫機能をサポート',
    icon: '🍊',
    color: 'bg-orange-100 text-orange-800',
    count: 13,
  },
  {
    id: 'minerals',
    name: 'ミネラル',
    description: '骨や歯の形成、体液バランスの調整に重要な無機質栄養素',
    icon: '⚡',
    color: 'bg-blue-100 text-blue-800',
    count: 16,
  },
  {
    id: 'herbs',
    name: 'ハーブ',
    description: '自然由来の植物成分。伝統的に健康維持に使用されてきた天然素材',
    icon: '🌿',
    color: 'bg-green-100 text-green-800',
    count: 25,
  },
  {
    id: 'amino-acids',
    name: 'アミノ酸',
    description: 'タンパク質の構成要素。筋肉の合成や神経伝達物質の原料',
    icon: '💪',
    color: 'bg-purple-100 text-purple-800',
    count: 20,
  },
  {
    id: 'probiotics',
    name: 'プロバイオティクス',
    description: '腸内環境を整える有益な微生物。消化機能と免疫力をサポート',
    icon: '🦠',
    color: 'bg-pink-100 text-pink-800',
    count: 8,
  },
  {
    id: 'others',
    name: 'その他',
    description: 'オメガ3、コエンザイムQ10など特殊な機能性成分',
    icon: '✨',
    color: 'bg-gray-100 text-gray-800',
    count: 12,
  },
];

// モック成分データ
export const MOCK_INGREDIENTS: Ingredient[] = [
  // ビタミン
  {
    id: 'vitamin-c',
    name: 'ビタミンC',
    nameEn: 'Vitamin C (Ascorbic Acid)',
    category: 'vitamins',
    description:
      '強力な抗酸化作用を持つ水溶性ビタミン。コラーゲンの合成に必要で、免疫機能をサポートします。',
    benefits: [
      '抗酸化作用による細胞保護',
      'コラーゲン合成の促進',
      '免疫機能の強化',
      '鉄の吸収促進',
      '疲労回復のサポート',
    ],
    recommendedDosage: '成人: 100-1000mg/日',
    sideEffects: ['高用量摂取時の胃腸障害', '腎結石のリスク（2g/日以上）'],
    interactions: ['ワルファリンとの相互作用の可能性'],
    evidenceLevel: 'high',
    sources: ['柑橘類', 'ブロッコリー', 'イチゴ', 'キウイフルーツ'],
    purposes: ['immunity', 'beauty', 'fatigue-recovery'],
    commonForms: ['tablet', 'capsule', 'powder'],
    averagePrice: 1500,
    popularity: 95,
  },
  {
    id: 'vitamin-d3',
    name: 'ビタミンD3',
    nameEn: 'Vitamin D3 (Cholecalciferol)',
    category: 'vitamins',
    description:
      '骨の健康維持と免疫機能調節に重要な脂溶性ビタミン。日光浴により体内で合成されます。',
    benefits: [
      'カルシウムの吸収促進',
      '骨密度の維持',
      '免疫機能の調節',
      '筋力の維持',
      '気分の安定化',
    ],
    recommendedDosage: '成人: 1000-4000IU/日',
    sideEffects: ['過剰摂取による高カルシウム血症', '腎機能障害'],
    interactions: ['チアジド系利尿薬との併用注意'],
    evidenceLevel: 'high',
    sources: ['魚類', '卵黄', 'きのこ類', '日光浴'],
    purposes: ['bone-health', 'immunity', 'muscle-building'],
    commonForms: ['softgel', 'tablet', 'liquid'],
    averagePrice: 2000,
    popularity: 88,
  },
  {
    id: 'vitamin-b12',
    name: 'ビタミンB12',
    nameEn: 'Vitamin B12 (Cobalamin)',
    category: 'vitamins',
    description:
      '神経機能と赤血球の形成に必要な水溶性ビタミン。主に動物性食品に含まれます。',
    benefits: [
      '神経機能の維持',
      '赤血球の形成',
      'DNA合成のサポート',
      'エネルギー代謝の促進',
      '認知機能の維持',
    ],
    recommendedDosage: '成人: 2.4μg/日',
    sideEffects: ['過剰摂取による皮膚症状', 'アレルギー反応'],
    interactions: ['メトホルミンとの相互作用'],
    evidenceLevel: 'high',
    sources: ['肉類', '魚類', '卵', '乳製品'],
    purposes: ['fatigue-recovery', 'brain-health'],
    commonForms: ['tablet', 'capsule', 'liquid'],
    averagePrice: 1800,
    popularity: 82,
  },
  // ミネラル
  {
    id: 'magnesium',
    name: 'マグネシウム',
    nameEn: 'Magnesium',
    category: 'minerals',
    description:
      '300以上の酵素反応に関与する必須ミネラル。筋肉や神経の機能維持に重要です。',
    benefits: [
      '筋肉の収縮・弛緩の調節',
      '神経伝達の正常化',
      'エネルギー代謝のサポート',
      '骨の健康維持',
      'ストレス軽減効果',
    ],
    recommendedDosage: '成人男性: 320-420mg/日、女性: 270-320mg/日',
    sideEffects: ['高用量摂取時の下痢', '腎機能低下者での蓄積'],
    interactions: ['抗生物質の吸収阻害', 'ビスホスホネート系薬剤との相互作用'],
    evidenceLevel: 'high',
    sources: ['ナッツ類', '緑黄色野菜', '全粒穀物', '海藻類'],
    purposes: ['stress-relief', 'sleep-improvement', 'muscle-building'],
    commonForms: ['tablet', 'capsule', 'powder'],
    averagePrice: 1200,
    popularity: 78,
  },
  {
    id: 'zinc',
    name: '亜鉛',
    nameEn: 'Zinc',
    category: 'minerals',
    description:
      '免疫機能、創傷治癒、味覚・嗅覚の維持に重要な必須ミネラルです。',
    benefits: [
      '免疫機能の強化',
      '創傷治癒の促進',
      '味覚・嗅覚の維持',
      'タンパク質合成のサポート',
      '抗酸化作用',
    ],
    recommendedDosage: '成人男性: 11mg/日、女性: 8mg/日',
    sideEffects: ['過剰摂取による銅欠乏', '胃腸障害'],
    interactions: ['抗生物質の吸収阻害', '鉄との競合'],
    evidenceLevel: 'high',
    sources: ['牡蠣', '肉類', 'ナッツ類', '豆類'],
    purposes: ['immunity', 'beauty', 'muscle-building'],
    commonForms: ['tablet', 'capsule', 'liquid'],
    averagePrice: 1600,
    popularity: 85,
  },
  // ハーブ
  {
    id: 'turmeric',
    name: 'ターメリック（ウコン）',
    nameEn: 'Turmeric (Curcuma longa)',
    category: 'herbs',
    description:
      'クルクミンを主成分とする抗炎症作用の高いハーブ。肝機能サポートと関節の健康維持に使用されます。',
    benefits: [
      '抗炎症作用',
      '抗酸化作用',
      '肝機能のサポート',
      '関節の健康維持',
      '消化機能の改善',
    ],
    recommendedDosage: 'クルクミンとして: 500-1000mg/日',
    sideEffects: ['胃腸障害', '胆石症患者での症状悪化'],
    interactions: ['抗凝固薬との相互作用', '糖尿病薬との併用注意'],
    evidenceLevel: 'medium',
    sources: ['ウコンの根茎', 'カレー粉', 'ターメリックパウダー'],
    purposes: ['bone-health', 'beauty', 'fatigue-recovery'],
    commonForms: ['capsule', 'tablet', 'powder'],
    averagePrice: 2500,
    popularity: 72,
  },
  {
    id: 'ginkgo',
    name: 'イチョウ葉エキス',
    nameEn: 'Ginkgo Biloba',
    category: 'herbs',
    description:
      '血流改善と認知機能のサポートに使用される伝統的なハーブエキスです。',
    benefits: [
      '血流の改善',
      '認知機能のサポート',
      '記憶力の向上',
      '抗酸化作用',
      '末梢循環の改善',
    ],
    recommendedDosage: '120-240mg/日（標準化エキス）',
    sideEffects: ['出血リスクの増加', '胃腸障害'],
    interactions: ['抗凝固薬との相互作用', '抗血小板薬との併用注意'],
    evidenceLevel: 'medium',
    sources: ['イチョウの葉'],
    purposes: ['brain-health', 'heart-health'],
    commonForms: ['capsule', 'tablet', 'liquid'],
    averagePrice: 3200,
    popularity: 68,
  },
  // アミノ酸
  {
    id: 'bcaa',
    name: 'BCAA（分岐鎖アミノ酸）',
    nameEn: 'Branched-Chain Amino Acids',
    category: 'amino-acids',
    description:
      'バリン、ロイシン、イソロイシンの3つの必須アミノ酸。筋肉の合成と疲労回復をサポートします。',
    benefits: [
      '筋肉合成の促進',
      '筋肉分解の抑制',
      '運動疲労の軽減',
      '持久力の向上',
      '回復時間の短縮',
    ],
    recommendedDosage: '運動前後: 5-10g',
    sideEffects: ['過剰摂取による疲労感', 'インスリン抵抗性のリスク'],
    interactions: ['糖尿病薬との相互作用の可能性'],
    evidenceLevel: 'medium',
    sources: ['肉類', '魚類', '卵', '乳製品'],
    purposes: ['muscle-building', 'fatigue-recovery'],
    commonForms: ['powder', 'capsule', 'tablet'],
    averagePrice: 3500,
    popularity: 90,
  },
  {
    id: 'l-theanine',
    name: 'L-テアニン',
    nameEn: 'L-Theanine',
    category: 'amino-acids',
    description:
      '緑茶に含まれるアミノ酸。リラックス効果と集中力向上をサポートします。',
    benefits: [
      'リラックス効果',
      '集中力の向上',
      'ストレス軽減',
      '睡眠の質改善',
      '不安感の軽減',
    ],
    recommendedDosage: '100-200mg/日',
    sideEffects: ['稀に頭痛', '血圧低下'],
    interactions: ['降圧薬との相互作用の可能性'],
    evidenceLevel: 'medium',
    sources: ['緑茶', '紅茶', 'ウーロン茶'],
    purposes: ['stress-relief', 'sleep-improvement', 'brain-health'],
    commonForms: ['capsule', 'tablet', 'powder'],
    averagePrice: 2800,
    popularity: 75,
  },
  // プロバイオティクス
  {
    id: 'lactobacillus',
    name: 'ラクトバチルス',
    nameEn: 'Lactobacillus',
    category: 'probiotics',
    description:
      '腸内環境を整える代表的な乳酸菌。消化機能と免疫機能をサポートします。',
    benefits: [
      '腸内環境の改善',
      '消化機能のサポート',
      '免疫機能の強化',
      'アレルギー症状の軽減',
      '便秘の改善',
    ],
    recommendedDosage: '10億-100億CFU/日',
    sideEffects: ['初期の腹部膨満感', 'ガスの増加'],
    interactions: ['抗生物質との併用時の効果減少'],
    evidenceLevel: 'high',
    sources: ['ヨーグルト', '発酵食品', 'キムチ', '味噌'],
    purposes: ['immunity', 'weight-management'],
    commonForms: ['capsule', 'powder', 'gummy'],
    averagePrice: 2200,
    popularity: 80,
  },
  // その他
  {
    id: 'omega-3',
    name: 'オメガ3脂肪酸',
    nameEn: 'Omega-3 Fatty Acids',
    category: 'others',
    description:
      'EPA・DHAを含む必須脂肪酸。心血管系の健康と脳機能をサポートします。',
    benefits: [
      '心血管系の健康維持',
      '脳機能のサポート',
      '抗炎症作用',
      '血中脂質の改善',
      '認知機能の維持',
    ],
    recommendedDosage: 'EPA+DHA: 1000-2000mg/日',
    sideEffects: ['魚臭い口臭', '胃腸障害'],
    interactions: ['抗凝固薬との相互作用'],
    evidenceLevel: 'high',
    sources: ['魚類', 'クルミ', 'チアシード', '亜麻仁油'],
    purposes: ['heart-health', 'brain-health', 'beauty'],
    commonForms: ['softgel', 'capsule', 'liquid'],
    averagePrice: 4200,
    popularity: 92,
  },
  {
    id: 'coq10',
    name: 'コエンザイムQ10',
    nameEn: 'Coenzyme Q10',
    category: 'others',
    description:
      '細胞のエネルギー産生に重要な補酵素。心臓機能と抗酸化作用をサポートします。',
    benefits: [
      '心臓機能のサポート',
      'エネルギー産生の促進',
      '抗酸化作用',
      '疲労軽減',
      '運動パフォーマンスの向上',
    ],
    recommendedDosage: '100-200mg/日',
    sideEffects: ['胃腸障害', '不眠'],
    interactions: ['ワルファリンとの相互作用'],
    evidenceLevel: 'medium',
    sources: ['内臓肉', '魚類', 'ナッツ類', '植物油'],
    purposes: ['heart-health', 'fatigue-recovery', 'beauty'],
    commonForms: ['softgel', 'capsule', 'tablet'],
    averagePrice: 5800,
    popularity: 65,
  },
];

// カテゴリ別成分取得
export function getIngredientsByCategory(
  category: IngredientCategory
): Ingredient[] {
  return MOCK_INGREDIENTS.filter(
    ingredient => ingredient.category === category
  );
}

// 成分検索
export function searchIngredients(query: string): Ingredient[] {
  const lowercaseQuery = query.toLowerCase();
  return MOCK_INGREDIENTS.filter(
    ingredient =>
      ingredient.name.toLowerCase().includes(lowercaseQuery) ||
      ingredient.nameEn.toLowerCase().includes(lowercaseQuery) ||
      ingredient.description.toLowerCase().includes(lowercaseQuery)
  );
}

// 成分詳細取得
export function getIngredientById(id: string): Ingredient | undefined {
  return MOCK_INGREDIENTS.find(ingredient => ingredient.id === id);
}

// フィルタ機能
export function filterIngredients(filters: Partial<FilterState>): Ingredient[] {
  let filtered = [...MOCK_INGREDIENTS];

  // カテゴリフィルタ
  if (filters.categories && filters.categories.length > 0) {
    filtered = filtered.filter(ingredient =>
      filters.categories!.includes(ingredient.category)
    );
  }

  // 目的フィルタ
  if (filters.purposes && filters.purposes.length > 0) {
    filtered = filtered.filter(ingredient =>
      filters.purposes!.some(purpose => ingredient.purposes.includes(purpose))
    );
  }

  // 形状フィルタ
  if (filters.forms && filters.forms.length > 0) {
    filtered = filtered.filter(ingredient =>
      filters.forms!.some(form => ingredient.commonForms.includes(form))
    );
  }

  // 価格帯フィルタ
  if (filters.priceRange) {
    const { min, max } = filters.priceRange;
    filtered = filtered.filter(
      ingredient =>
        ingredient.averagePrice >= min && ingredient.averagePrice <= max
    );
  }

  // エビデンスレベルフィルタ
  if (filters.evidenceLevel && filters.evidenceLevel.length > 0) {
    filtered = filtered.filter(ingredient =>
      filters.evidenceLevel!.includes(ingredient.evidenceLevel)
    );
  }

  // 検索クエリフィルタ
  if (filters.searchQuery && filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      ingredient =>
        ingredient.name.toLowerCase().includes(query) ||
        ingredient.nameEn.toLowerCase().includes(query) ||
        ingredient.description.toLowerCase().includes(query) ||
        ingredient.benefits.some(benefit =>
          benefit.toLowerCase().includes(query)
        )
    );
  }

  // ソート
  if (filters.sortBy) {
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'evidence':
          aValue =
            a.evidenceLevel === 'high'
              ? 3
              : a.evidenceLevel === 'medium'
                ? 2
                : 1;
          bValue =
            b.evidenceLevel === 'high'
              ? 3
              : b.evidenceLevel === 'medium'
                ? 2
                : 1;
          break;
        case 'popularity':
          aValue = a.popularity;
          bValue = b.popularity;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return filters.sortOrder === 'desc'
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      } else {
        return filters.sortOrder === 'desc'
          ? (bValue as number) - (aValue as number)
          : (aValue as number) - (bValue as number);
      }
    });
  }

  return filtered;
}

// 目的別成分取得
export function getIngredientsByPurpose(
  purpose: PurposeCategory
): Ingredient[] {
  return MOCK_INGREDIENTS.filter(ingredient =>
    ingredient.purposes.includes(purpose)
  );
}

// 人気成分取得
export function getPopularIngredients(limit: number = 10): Ingredient[] {
  return [...MOCK_INGREDIENTS]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}
