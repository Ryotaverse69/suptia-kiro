'use client';

import { useRouter } from 'next/navigation';
import { AIRecommendationSearchBar } from '@/components/AIRecommendationSearchBar';
import { sanitizeSearchQuery } from '@/lib/validate';

export default function HomeSearchSection() {
  const router = useRouter();

  // 検索処理
  const handleSearch = (query: string) => {
    const safe = sanitizeSearchQuery(query || '');
    if (safe) {
      router.push(`/search?search=${encodeURIComponent(safe)}`);
    }
  };

  return (
    <>
      {/* 大型検索窓（AIレコメンド機能付き） */}
      <div className='mb-12 max-w-3xl mx-auto'>
        <div className='relative'>
          <div className='absolute -inset-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl blur opacity-20 animate-pulse-gentle'></div>
          <div className='relative'>
            <AIRecommendationSearchBar
              onSearch={handleSearch}
              placeholder='サプリメント名や成分名で検索...'
              size='large'
              className='animate-fade-in-up shadow-strong'
              enablePopularOnFocus={true}
              maxRecommendations={5}
            />
          </div>
        </div>
      </div>
    </>
  );
}
