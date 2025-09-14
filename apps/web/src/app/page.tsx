'use client';

import { generateSEO } from '@/lib/seo-config';
import dynamic from 'next/dynamic';
import HeroSearch from '@/components/HeroSearch';
import OnVisible from '@/components/OnVisible';
import { useOptimizedPerformance } from '@/hooks/usePerformance';
const HomePrimaryActions = dynamic(
  () => import('@/components/HomePrimaryActions'),
  {
    ssr: false,
    loading: () => (
      <div className='container mx-auto px-4 py-16'>
        <a href='/compare' className='text-transparent'>
          compare
        </a>
      </div>
    ),
  }
);
const PopularComparisonsSection = dynamic(
  () => import('@/components/PopularComparisonsSection'),
  {
    ssr: false,
    loading: () => <div className='container mx-auto px-4 py-16' />,
  }
);
const IngredientGuideSection = dynamic(
  () => import('@/components/IngredientGuideSection'),
  {
    ssr: false,
    loading: () => <div className='container mx-auto px-4 py-16' />,
  }
);
const AIRecommendationSection = dynamic(
  () => import('@/components/AIRecommendationSection'),
  {
    ssr: false,
    loading: () => <div className='container mx-auto px-4 py-16' />,
  }
);
const TrustIndicatorsSection = dynamic(
  () => import('@/components/TrustIndicatorsSection'),
  {
    ssr: false,
    loading: () => <div className='container mx-auto px-4 py-16' />,
  }
);
const CTABanner = dynamic(() => import('@/components/CTABanner'), {
  ssr: false,
  loading: () => <div className='container mx-auto px-4 py-16' />,
});

// Client Componentなのでmetadataは使用できません
// SEOは別の方法で実装する必要があります

interface Product {
  name: string;
  priceJPY: number;
  servingsPerContainer: number;
  servingsPerDay: number;
  slug: {
    current: string;
  };
}

function getProducts(): Product[] {
  // デモ用のサンプルデータを返す（Sanity接続エラーを回避）
  return [
    {
      name: 'Test Product',
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

export default function Home() {
  const products = getProducts();
  const { containerRef } = useOptimizedPerformance();

  const handleSearch = (query: string) => {
    // 検索処理の実装（例：検索ページへのリダイレクト）
    console.log('検索クエリ:', query);
    // TODO: 検索ページへのナビゲーション実装
  };

  return (
    <>
      {/* Heroセクションは全画面表示のため、mainコンテナの外に配置 */}
      <div className='fixed inset-0 z-10'>
        <HeroSearch onSearch={handleSearch} />
      </div>

      {/* 他のセクションは通常のコンテナ内に配置、Heroの下に配置 */}
      <div
        ref={containerRef}
        className='relative z-20 min-h-screen scroll-smooth'
        style={{ marginTop: '100vh' }}
      >
        <HomePrimaryActions />

        <OnVisible
          placeholder={<div className='container mx-auto px-4 py-16' />}
        >
          <PopularComparisonsSection />
        </OnVisible>
        <OnVisible
          placeholder={<div className='container mx-auto px-4 py-16' />}
        >
          <IngredientGuideSection />
        </OnVisible>
        <OnVisible
          placeholder={<div className='container mx-auto px-4 py-16' />}
        >
          <AIRecommendationSection />
        </OnVisible>
        <OnVisible
          placeholder={<div className='container mx-auto px-4 py-16' />}
        >
          <TrustIndicatorsSection />
        </OnVisible>
        <OnVisible
          placeholder={<div className='container mx-auto px-4 py-16' />}
        >
          <CTABanner />
        </OnVisible>
      </div>
    </>
  );
}
