'use client';

import { generateSEO } from '@/lib/seo-config';
import dynamic from 'next/dynamic';
import HeroSearch from '@/components/HeroSearch';
import OnVisible from '@/components/OnVisible';
import SkipLinks from '@/components/SkipLinks';
import { useOptimizedPerformance } from '@/hooks/usePerformance';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
const HomePrimaryActions = dynamic(
  () => import('@/components/HomePrimaryActions'),
  {
    ssr: false,
    loading: () => (
      <div className='container mx-auto container-padding py-section-md'>
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
    loading: () => <div className='container mx-auto container-padding py-section-md' />,
  }
);
const IngredientGuideSection = dynamic(
  () => import('@/components/IngredientGuideSection'),
  {
    ssr: false,
    loading: () => <div className='container mx-auto container-padding py-section-md' />,
  }
);
const AIRecommendationSection = dynamic(
  () => import('@/components/AIRecommendationSection'),
  {
    ssr: false,
    loading: () => <div className='container mx-auto container-padding py-section-md' />,
  }
);
const TrustIndicatorsSection = dynamic(
  () => import('@/components/TrustIndicatorsSection'),
  {
    ssr: false,
    loading: () => <div className='container mx-auto container-padding py-section-md' />,
  }
);
const CTABanner = dynamic(() => import('@/components/CTABanner'), {
  ssr: false,
  loading: () => <div className='container mx-auto container-padding py-section-md' />,
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
  const { navigateToComparisons } = useKeyboardNavigation();

  const handleSearch = (query: string) => {
    // 検索処理の実装（例：検索ページへのリダイレクト）
    console.log('検索クエリ:', query);
    // 検索実行後、比較セクションにナビゲート
    setTimeout(() => {
      navigateToComparisons();
    }, 100);
  };

  return (
    <>
      {/* スキップリンク */}
      <SkipLinks />

      {/* Heroセクション */}
      <HeroSearch onSearch={handleSearch} />

      {/* 他のセクション */}
      <main
        id="main-content"
        ref={containerRef}
        className='relative min-h-screen scroll-smooth'
        tabIndex={-1}
        role="main"
        aria-label="メインコンテンツ"
      >
        <HomePrimaryActions />

        {/* 比較セクションは常に表示（OnVisibleを使わない） */}
        <PopularComparisonsSection />

        <OnVisible
          placeholder={<div className='container mx-auto container-padding py-section-md' />}
        >
          <IngredientGuideSection />
        </OnVisible>
        <OnVisible
          placeholder={<div className='container mx-auto container-padding py-section-md' />}
        >
          <AIRecommendationSection />
        </OnVisible>
        <OnVisible
          placeholder={<div className='container mx-auto container-padding py-section-md' />}
        >
          <TrustIndicatorsSection />
        </OnVisible>
        <OnVisible
          placeholder={<div className='container mx-auto container-padding py-section-md' />}
        >
          <CTABanner />
        </OnVisible>
      </main>
    </>
  );
}
