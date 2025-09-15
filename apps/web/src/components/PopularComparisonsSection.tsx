'use client';

import { cn } from '@/lib/utils';
import SectionHeader from './SectionHeader';
import CompareCard from './CompareCard';
import { Button } from './ui/Button';
import { useTranslation, useLocale } from '@/contexts/LocaleContext';

interface ProductSummary {
  id: string;
  name: string;
  brand: string;
  price: number;
  pricePerDay: number;
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

// モックデータ（日本語）
const defaultProductsJa: ProductSummary[] = [
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

// モックデータ（英語）
const defaultProductsEn: ProductSummary[] = [
  {
    id: '1',
    name: 'Vitamin D3 2000IU',
    brand: 'Nature Made',
    price: 1980,
    pricePerDay: 66,
    rating: 4.8,
    reviewCount: 256,
    mainIngredients: ['Vitamin D3', 'High Absorption', 'Olive Oil'],
    totalScore: 85,
    badges: [
      { label: 'High Quality', variant: 'high' },
      { label: 'Popular', variant: 'info' },
    ],
  },
  {
    id: '2',
    name: 'Multivitamin & Mineral',
    brand: 'DHC',
    price: 1580,
    pricePerDay: 53,
    rating: 4.6,
    reviewCount: 189,
    mainIngredients: ['B Vitamins', 'Vitamin C', 'Iron'],
    totalScore: 82,
    badges: [{ label: 'Great Value', variant: 'medium' }],
  },
  {
    id: '3',
    name: 'Omega-3 Fish Oil',
    brand: 'Nordic Naturals',
    price: 2980,
    pricePerDay: 99,
    rating: 4.9,
    reviewCount: 342,
    mainIngredients: ['EPA', 'DHA', 'Natural Fish Oil'],
    totalScore: 88,
    badges: [
      { label: 'Premium Quality', variant: 'high' },
      { label: 'Doctor Recommended', variant: 'info' },
    ],
  },
];

/**
 * Popular Comparisons セクションコンポーネント
 * SectionHeaderとCompareCardを組み合わせて、カード3列レイアウトで配置
 * Requirements: 1.4 - Popular Comparisons セクションの実装
 */
export default function PopularComparisonsSection({
  products,
  title,
  subtitle,
  description,
  showMoreButton = true,
  onViewDetails,
  onAddToFavorites,
  onShowMore,
  className,
}: PopularComparisonsSectionProps) {
  const { t } = useTranslation();
  const { locale } = useLocale();

  // 言語に応じたデフォルト値を設定
  const defaultProducts = locale === 'ja' ? defaultProductsJa : defaultProductsEn;
  const displayProducts = products || defaultProducts;
  const displayTitle = title || t('home.popular.title');
  const displaySubtitle = subtitle || 'Popular Comparisons';
  const displayDescription = description || t('home.popular.subtitle');
  const handleShowMore = () => {
    if (onShowMore) {
      onShowMore();
    } else {
      // デフォルトの動作（例：比較ページへの遷移）
      console.log(t('comparison.title'));
    }
  };

  return (
    <section
      id="popular-comparisons-section"
      className={cn('py-section-md bg-white', className)}
      role="region"
      aria-labelledby="popular-comparisons-heading"
    >
      <div className='max-w-7xl mx-auto container-padding'>
        {/* Apple風セクションヘッダー - Apple風広めの余白 */}
        <div className='mb-component-2xl'>
          <SectionHeader
            id="popular-comparisons-heading"
            title={displayTitle}
            subtitle={displaySubtitle}
            description={displayDescription}
            align='center'
            size='lg'
          />
        </div>

        {/* カード3列グリッドレイアウト - Apple風広めの余白 */}
        <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-component-lg lg:gap-component-xl mb-component-2xl'>
          {displayProducts.map(product => (
            <CompareCard
              key={product.id}
              {...product}
              onViewDetails={onViewDetails}
              onAddToFavorites={onAddToFavorites}
            />
          ))}
        </div>

        {/* もっと見るボタン - Apple風広めの余白 */}
        {showMoreButton && (
          <div className='text-center'>
            <Button
              onClick={handleShowMore}
              variant='outline'
              size='lg'
              hover='lift'
              className='px-component-lg py-component-sm'
            >
              {t('comparison.compareProducts')}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
