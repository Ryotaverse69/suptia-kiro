'use client';

import { cn } from '@/lib/utils';
import SectionHeader from './SectionHeader';
import CompareCard from './CompareCard';
import { Button } from './ui/Button';

interface ProductSummary {
  id: string;
  name: string;
  brand: string;
  price: number;
  pricePerDay: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  mainIngredients: string[];
  imageUrl?: string;
  badges?: Array<{
    label: string;
    variant: 'high' | 'medium' | 'low' | 'info';
  }>;
  totalScore?: number;
}

interface PopularComparisonsSectionProps {
  products?: ProductSummary[];
  title?: string;
  subtitle?: string;
  description?: string;
  showMoreButton?: boolean;
  onViewDetails?: (productId: string) => void;
  onAddToFavorites?: (productId: string) => void;
  onShowMore?: () => void;
  className?: string;
}

// モックデータ（実際の実装では外部から受け取る）
const defaultProducts: ProductSummary[] = [
  {
    id: '1',
    name: 'ビタミンD3 2000IU',
    brand: 'Nature Made',
    price: 1980,
    pricePerDay: 66,
    rating: 4.8,
    reviewCount: 256,
    mainIngredients: ['ビタミンD3', '高吸収', 'オリーブオイル'],
    totalScore: 85,
    badges: [
      { label: '高品質', variant: 'high' },
      { label: '人気', variant: 'info' },
    ],
  },
  {
    id: '2',
    name: 'マルチビタミン&ミネラル',
    brand: 'DHC',
    price: 1580,
    pricePerDay: 53,
    rating: 4.6,
    reviewCount: 189,
    mainIngredients: ['ビタミンB群', 'ビタミンC', '鉄分'],
    totalScore: 82,
    badges: [{ label: 'コスパ良', variant: 'medium' }],
  },
  {
    id: '3',
    name: 'オメガ3 フィッシュオイル',
    brand: 'Nordic Naturals',
    price: 2980,
    pricePerDay: 99,
    rating: 4.9,
    reviewCount: 342,
    mainIngredients: ['EPA', 'DHA', '天然魚油'],
    totalScore: 88,
    badges: [
      { label: '最高品質', variant: 'high' },
      { label: '医師推奨', variant: 'info' },
    ],
  },
];

/**
 * Popular Comparisons セクションコンポーネント
 * SectionHeaderとCompareCardを組み合わせて、カード3列レイアウトで配置
 * Requirements: 1.4 - Popular Comparisons セクションの実装
 */
export default function PopularComparisonsSection({
  products = defaultProducts,
  title = '人気サプリ比較',
  subtitle = 'Popular Comparisons',
  description = 'AIが厳選した、最も人気の高いサプリメントを比較',
  showMoreButton = true,
  onViewDetails,
  onAddToFavorites,
  onShowMore,
  className,
}: PopularComparisonsSectionProps) {
  const handleShowMore = () => {
    if (onShowMore) {
      onShowMore();
    } else {
      // デフォルトの動作（例：比較ページへの遷移）
      console.log('すべての比較を見る');
    }
  };

  return (
    <section className={cn('py-16 sm:py-20 lg:py-24 bg-gray-50', className)}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12'>
        {/* Apple風セクションヘッダー */}
        <SectionHeader
          title={title}
          subtitle={subtitle}
          description={description}
          align='center'
          size='lg'
        />

        {/* カード3列グリッドレイアウト（sm:1→md:2→lg:3） */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 xl:gap-10'>
          {products.map(product => (
            <CompareCard
              key={product.id}
              {...product}
              onViewDetails={onViewDetails}
              onAddToFavorites={onAddToFavorites}
            />
          ))}
        </div>

        {/* もっと見るボタン */}
        {showMoreButton && (
          <div className='text-center mt-12'>
            <Button
              onClick={handleShowMore}
              variant='outline'
              size='lg'
              hover='lift'
              className='px-8 py-4'
            >
              すべての比較を見る
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
