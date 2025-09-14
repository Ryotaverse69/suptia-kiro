'use client';

import { useState } from 'react';
import { useTranslation } from '@/contexts/LocaleContext';
import { AppleSearchBar, AISuggestion } from './AppleSearchBar';
import { SuggestChips, SuggestChip, defaultSuggestChips } from './SuggestChips';
import { HeroBackgroundImage } from './ui/OptimizedImage';

interface HeroSearchProps {
  onSearch?: (query: string) => void;
}

export default function HeroSearch({ onSearch }: HeroSearchProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  // AIサジェストのモックデータ
  const aiSuggestions: AISuggestion[] = [
    {
      id: '1',
      text: '疲労回復に効果的なビタミンB群を探す',
      intent: 'purpose',
      confidence: 0.92,
    },
    {
      id: '2',
      text: '美容効果の高いコラーゲンサプリを比較',
      intent: 'purpose',
      confidence: 0.88,
    },
    {
      id: '3',
      text: '免疫力向上に効果的なビタミンCを探す',
      intent: 'purpose',
      confidence: 0.85,
    },
  ];

  const handleSearch = (query: string) => {
    if (onSearch) {
      onSearch(query);
    }
    // デフォルトの検索処理（例：検索ページへの遷移）
    console.log('検索クエリ:', query);
  };

  const handleChipClick = (chip: SuggestChip) => {
    setSearchQuery(chip.label);
    handleSearch(chip.label);
  };

  return (
    <section
      id='hero-section'
      role='banner'
      aria-label='ヒーローセクション'
      className='bg-white flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 xl:px-12 relative overflow-hidden'
      style={{ height: '100vh', minHeight: '100vh' }}
    >
      {/* 背景画像 */}
      <div className='absolute inset-0 z-0'>
        <HeroBackgroundImage className='w-full h-full object-cover opacity-50' />
      </div>

      {/* 微粒子エフェクト（CSSのみ） */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none z-10'>
        <div className='absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/20 rounded-full animate-pulse'></div>
        <div
          className='absolute top-3/4 right-1/3 w-1 h-1 bg-blue-500/30 rounded-full animate-pulse'
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className='absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-blue-300/25 rounded-full animate-pulse'
          style={{ animationDelay: '2s' }}
        ></div>
      </div>

      {/* Apple/xAI風ヒーローテキスト - モバイル対応改善 */}
      <div className='text-center max-w-4xl mx-auto mb-12 sm:mb-16 animate-fade-in relative z-20'>
        <h1 className='text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-light text-gray-900 mb-4 sm:mb-6 leading-[1.1] tracking-tight px-2'>
          あなたに最も合う
          <br className='hidden sm:block' />
          <span className='sm:hidden'> </span>
          <span className='font-medium text-blue-600'>サプリメント</span>を
          <br className='hidden sm:block' />
          <span className='sm:hidden'> </span>
          <span className='font-medium'>最も安い価格で。</span>
        </h1>
        <p className='text-base sm:text-lg md:text-xl text-gray-600 font-light max-w-2xl mx-auto px-4'>
          AIが分析する、あなただけの最適解
        </p>
      </div>

      {/* Apple風検索バー（AIサジェスト機能付き） */}
      <div
        className='w-full animate-fade-in relative z-20'
        style={{ animationDelay: '0.3s' }}
      >
        <AppleSearchBar
          onSearch={handleSearch}
          aiSuggestions={aiSuggestions}
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>

      {/* 人気のカテゴリチップ - モバイル対応 */}
      <div
        className='mt-8 sm:mt-12 animate-fade-in relative z-20'
        style={{ animationDelay: '0.6s' }}
      >
        <SuggestChips
          chips={defaultSuggestChips}
          onChipClick={handleChipClick}
          title='人気のカテゴリ'
          maxVisible={4} // モバイルでは4個まで表示
        />
      </div>
    </section>
  );
}
