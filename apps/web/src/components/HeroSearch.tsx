'use client';

import { useState } from 'react';
import { useTranslation } from '@/contexts/LocaleContext';
import { AppleSearchBar } from './AppleSearchBar';
import type { AISuggestion } from './AppleSearchBar';
import { SuggestChips, SuggestChip, getDefaultSuggestChips } from './SuggestChips';
import { HeroBackgroundImage } from './ui/OptimizedImage';
import { useLocale } from '@/contexts/LocaleContext';

interface HeroSearchProps {
  onSearch?: (query: string) => void;
}

export default function HeroSearch({ onSearch }: HeroSearchProps) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 強化されたAIサジェストのモックデータ（言語に応じて切り替え）
  const aiSuggestions: AISuggestion[] = locale === 'ja' ? [
    {
      id: '1',
      text: '疲労回復に効果的なビタミンB群を探す',
      intent: 'purpose',
      confidence: 0.94,
    },
    {
      id: '2',
      text: '美容効果の高いコラーゲンサプリを比較',
      intent: 'purpose',
      confidence: 0.91,
    },
    {
      id: '3',
      text: '免疫力向上に効果的なビタミンCを探す',
      intent: 'purpose',
      confidence: 0.88,
    },
    {
      id: '4',
      text: 'マグネシウム不足による睡眠の質改善',
      intent: 'ingredient',
      confidence: 0.85,
    },
    {
      id: '5',
      text: 'オメガ3脂肪酸で心血管健康をサポート',
      intent: 'condition',
      confidence: 0.82,
    },
  ] : [
    {
      id: '1',
      text: 'Find effective B vitamins for fatigue recovery',
      intent: 'purpose',
      confidence: 0.94,
    },
    {
      id: '2',
      text: 'Compare high-quality collagen supplements for beauty',
      intent: 'purpose',
      confidence: 0.91,
    },
    {
      id: '3',
      text: 'Find effective Vitamin C for immune support',
      intent: 'purpose',
      confidence: 0.88,
    },
    {
      id: '4',
      text: 'Improve sleep quality with magnesium supplements',
      intent: 'ingredient',
      confidence: 0.85,
    },
    {
      id: '5',
      text: 'Support cardiovascular health with Omega-3',
      intent: 'condition',
      confidence: 0.82,
    },
  ];

  const handleSearch = (query: string) => {
    if (onSearch) {
      onSearch(query);
    }
    // 検索実行後、比較セクションにフォーカスを移動
    const comparisonsSection = document.getElementById('popular-comparisons-section');
    if (comparisonsSection) {
      comparisonsSection.scrollIntoView({ behavior: 'smooth' });
      // 最初の比較カードにフォーカスを移動
      setTimeout(() => {
        const firstCompareCard = comparisonsSection.querySelector('[role="article"] button');
        if (firstCompareCard instanceof HTMLElement) {
          firstCompareCard.focus();
        }
      }, 500);
    }
    console.log('検索クエリ:', query);
  };

  const handleChipClick = (chip: SuggestChip) => {
    console.log('Chip clicked:', chip.label);
    setSearchQuery(chip.label);
    handleSearch(chip.label);
  };

  return (
    <section
      id='hero-section'
      role='banner'
      aria-label='ヒーローセクション'
      className='bg-white flex flex-col justify-center items-center relative overflow-hidden min-h-screen py-4 sm:py-6 md:py-8'
      style={{ minHeight: '100vh' }}
    >
      {/* 背景画像 */}
      <div className='absolute inset-0 z-0 pointer-events-none'>
        <HeroBackgroundImage className='w-full h-full object-cover opacity-30 pointer-events-none' />
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

      {/* Apple/xAI風ヒーローテキスト - モバイル縦積み最適化 */}
      <div className='text-center max-w-4xl mx-auto mb-6 sm:mb-8 md:mb-12 lg:mb-16 animate-fade-in relative z-20'>
        <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light-apple text-gray-900 mb-3 sm:mb-4 md:mb-6 lg:mb-8 font-apple px-4 sm:px-6 leading-tight'>
          {t('home.cta.titleLine1')}
          <br className='hidden sm:block' />
          <span className='sm:hidden'> </span>
          <span className='font-medium-apple text-primary-600'>{t('home.cta.titleEmphasis')}</span>
        </h1>
        <p className='text-sm sm:text-base md:text-lg lg:text-xl font-light-apple text-gray-600 max-w-2xl mx-auto px-4 sm:px-6 font-apple'>
          {t('header.tagline')}
        </p>
      </div>

      {/* Apple風大型検索バー（AIレコメンドON） - モバイル縦積み最適化 */}
      <div
        className='w-full animate-fade-in relative z-20 mb-8 sm:mb-10 md:mb-12 lg:mb-16 px-4 sm:px-6 md:px-8'
        style={{ animationDelay: '0.3s' }}
      >
        <div className='relative'>
          {/* 検索バー周りのグロー効果 */}
          <div className='absolute inset-0 bg-gradient-to-r from-primary-200/20 via-primary-300/20 to-primary-200/20 rounded-3xl blur-xl opacity-50'></div>
          <div
            id='search'
            role='search'
            aria-label='サプリメント検索'
            className='relative w-full max-w-4xl xl:max-w-5xl mx-auto'
          >
            <form className='relative group'>
              <input
                type='text'
                placeholder={t('search.placeholder')}
                role='combobox'
                aria-expanded={showSuggestions && aiSuggestions.length > 0}
                aria-haspopup='listbox'
                aria-controls={showSuggestions && aiSuggestions.length > 0 ? 'search-suggestions' : undefined}
                aria-label={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  console.log('検索バーにフォーカス、AIサジェスト表示');
                  if (aiSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={(e) => {
                  // フォーカスがサジェスト内に移動した場合は閉じない
                  setTimeout(() => {
                    setShowSuggestions(false);
                  }, 200);
                }}
                className='w-full px-4 sm:px-8 py-4 sm:py-6 text-base sm:text-lg bg-gray-50/80 border-2 border-transparent rounded-2xl 
                         focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 
                         transition-all duration-300 placeholder-gray-500 shadow-[0_8px_30px_rgba(0,0,0,0.06)] 
                         hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] pr-20 sm:pr-24'
              />
              <button
                type='submit'
                disabled={!searchQuery.trim()}
                aria-label={t('common.search')}
                onClick={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    handleSearch(searchQuery.trim());
                  }
                }}
                className='absolute right-2 top-2 px-3 sm:px-6 py-2 sm:py-4 bg-blue-600 text-white rounded-xl 
                         hover:bg-blue-700 transition-all duration-200 font-medium text-xs sm:text-sm 
                         hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:bg-gray-300 
                         disabled:cursor-not-allowed disabled:hover:scale-100'
              >
                {t('common.search')}
              </button>
            </form>

            {/* AIサジェスト（フォーカス時にドロップダウン表示） */}
            {showSuggestions && aiSuggestions.length > 0 && (
              <div
                id='search-suggestions'
                role='listbox'
                aria-label='AIサジェスト'
                className='mt-6 animate-fade-in'
              >
                <div className='bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-200/30 p-6'>
                  <div className='flex items-center mb-4'>
                    <div className='w-2 h-2 bg-primary-500 rounded-full mr-3 animate-pulse'></div>
                    <p className='text-sm font-medium text-gray-700'>AIサジェスト</p>
                  </div>
                  <div className='space-y-3'>
                    {aiSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.id}
                        id={`suggestion-${index}`}
                        role='option'
                        aria-selected={false}
                        onClick={() => {
                          setSearchQuery(suggestion.text);
                          handleSearch(suggestion.text);
                          setShowSuggestions(false);
                        }}
                        className='w-full text-left px-4 py-3 rounded-xl transition-all duration-200 text-sm sm:text-base group hover:bg-gray-50 hover:shadow-sm'
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center'>
                            <div className={`w-1.5 h-1.5 rounded-full mr-3 ${suggestion.intent === 'purpose' ? 'bg-blue-400' :
                              suggestion.intent === 'ingredient' ? 'bg-green-400' : 'bg-purple-400'
                              }`}></div>
                            <span className='font-light'>{suggestion.text}</span>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <span className='text-xs text-gray-400'>
                              {Math.round(suggestion.confidence * 100)}%
                            </span>
                            <div className={`w-2 h-2 rounded-full ${suggestion.confidence > 0.9 ? 'bg-green-400' :
                              suggestion.confidence > 0.8 ? 'bg-yellow-400' : 'bg-gray-400'
                              }`}></div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className='mt-4 pt-4 border-t border-gray-100'>
                    <p className='text-xs text-gray-500 text-center'>
                      AIが分析したあなたの検索意図に基づく推奨です
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* デバッグ情報 */}
          <div className="mt-2 text-xs text-gray-500" data-testid="ai-suggestions-debug">
            AIサジェスト数: {aiSuggestions.length} | 直接実装版使用中
          </div>
        </div>
      </div>

      {/* 人気のカテゴリチップ - モバイル縦積み最適化 */}
      <div
        className='animate-fade-in relative z-30 px-4 sm:px-6'
        style={{ animationDelay: '0.6s' }}
      >
        <SuggestChips
          chips={getDefaultSuggestChips(locale)}
          onChipClick={handleChipClick}
          title={t('ingredients.categories')}
          maxVisible={3} // モバイルでは3個まで表示（縦積み最適化）
        />
      </div>
    </section>
  );
}
