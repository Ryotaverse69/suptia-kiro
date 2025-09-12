import SearchPageClient from './SearchPageClient';
import { generateRecommendations, type UserContext } from '@/lib/ai-recommendations';

// 仮データ（後工程でSanity接続）
const mockProducts = [
  {
    id: 'vitamin-d3-2000',
    name: 'ビタミンD3 2000IU',
    brand: 'Nature Made',
    priceJPY: 1980,
    servingsPerContainer: 60,
    servingsPerDay: 1,
    mainIngredients: ['ビタミンD3', '疲労回復', '免疫'],
  },
  {
    id: 'collagen-beauty',
    name: 'コラーゲン ビューティー',
    brand: 'DHC',
    priceJPY: 2480,
    servingsPerContainer: 30,
    servingsPerDay: 1,
    mainIngredients: ['コラーゲン', '美容'],
  },
  {
    id: 'zinc-immune',
    name: '亜鉛 高吸収',
    brand: 'Now Foods',
    priceJPY: 1280,
    servingsPerContainer: 100,
    servingsPerDay: 1,
    mainIngredients: ['亜鉛', '免疫'],
  },
  {
    id: 'vitamin-b-complex',
    name: 'ビタミンB群 コンプレックス',
    brand: 'iHerb Basics',
    priceJPY: 980,
    servingsPerContainer: 60,
    servingsPerDay: 2,
    mainIngredients: ['ビタミンB群', '疲労回復'],
  },
];

export default function SearchPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const query = typeof searchParams?.search === 'string' ? searchParams?.search.trim() : '';
  // 簡易AI条件生成：最上位レコメンドのタグと価格帯から条件チップを作成
  let aiConditions: string[] | undefined = undefined;
  try {
    const user: UserContext | undefined = undefined;
    const recs = generateRecommendations(query || '', user, 3);
    if (recs && recs.length > 0) {
      const top = recs[0];
      const conds: string[] = [];
      // 目的タグ候補
      const purposeTags = ['疲労回復', '美容', '免疫', '睡眠', '筋肉', '心血管'];
      const matched = top.tags.find(t => purposeTags.includes(t));
      if (matched) conds.push(matched);
      // 価格上限
      if (top.priceRange && top.priceRange[1] <= 2000) {
        conds.push('¥2000以下');
      }
      aiConditions = conds.length ? conds : undefined;
    }
  } catch {}

  return <SearchPageClient initialProducts={mockProducts} aiConditions={aiConditions} />;
}
