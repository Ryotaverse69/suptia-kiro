import { generateSEO } from '@/lib/seo-config';
import dynamic from 'next/dynamic';
import HeroSection from '@/components/HeroSection';
const HomePrimaryActions = dynamic(() => import('@/components/HomePrimaryActions'), { ssr: false, loading: () => <div className='container mx-auto px-4 py-16' /> });
const PopularProductsSection = dynamic(() => import('@/components/PopularProductsSection'), { ssr: false, loading: () => <div className='container mx-auto px-4 py-16' /> });
const IngredientCategoriesSection = dynamic(() => import('@/components/IngredientCategoriesSection'), { ssr: false, loading: () => <div className='container mx-auto px-4 py-16' /> });
const TrustIndicatorsSection = dynamic(() => import('@/components/TrustIndicatorsSection'), { ssr: false, loading: () => <div className='container mx-auto px-4 py-16' /> });
const CTABanner = dynamic(() => import('@/components/CTABanner'), { ssr: false, loading: () => <div className='container mx-auto px-4 py-16' /> });

export const metadata = generateSEO({
  title: 'サプティア - あなたに最も合うサプリを最も安い価格で',
  description:
    'AIが分析する科学的根拠に基づいたサプリメント比較サイト。成分・価格・安全性を総合評価し、あなたに最適なサプリメントを見つけます。',
  url: 'https://suptia.com',
  keywords: [
    'サプリメント', '比較', '価格比較', 'AI', '成分分析', '安全性', 'エビデンス',
    'supplements', 'compare', 'price comparison', 'ingredient analysis'
  ],
  type: 'website',
});

interface Product {
  name: string;
  priceJPY: number;
  servingsPerContainer: number;
  servingsPerDay: number;
  slug: {
    current: string;
  };
}

async function getProducts(): Promise<Product[]> {
  // デモ用のサンプルデータを返す（Sanity接続エラーを回避）
  return [
    {
      name: 'マルチビタミン プレミアム',
      priceJPY: 2980,
      servingsPerContainer: 60,
      servingsPerDay: 2,
      slug: { current: 'multivitamin-premium' },
    },
    {
      name: 'オメガ3 フィッシュオイル',
      priceJPY: 3480,
      servingsPerContainer: 90,
      servingsPerDay: 3,
      slug: { current: 'omega3-fish-oil' },
    },
    {
      name: 'ビタミンD3 + K2',
      priceJPY: 1980,
      servingsPerContainer: 120,
      servingsPerDay: 1,
      slug: { current: 'vitamin-d3-k2' },
    },
    {
      name: 'プロバイオティクス',
      priceJPY: 4280,
      servingsPerContainer: 30,
      servingsPerDay: 1,
      slug: { current: 'probiotics' },
    },
  ];
}

export default async function Home() {
  const products = await getProducts();

  return (
    <div className='min-h-screen scroll-smooth'>
      <HeroSection />
      <HomePrimaryActions />

      <PopularProductsSection products={products as any} />
      <IngredientCategoriesSection />
      <TrustIndicatorsSection />
      <CTABanner />
    </div>
  );
}
