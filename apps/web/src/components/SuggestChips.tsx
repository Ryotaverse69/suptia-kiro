'use client';

import { useState } from 'react';
import { useTranslation } from '@/contexts/LocaleContext';

export interface SuggestChip {
  id: string;
  label: string;
  category: 'ingredient' | 'purpose' | 'condition' | 'brand';
  popular?: boolean;
}

export interface SuggestChipsProps {
  chips: SuggestChip[];
  onChipClick: (chip: SuggestChip) => void;
  className?: string;
  title?: string;
  maxVisible?: number;
}

export function SuggestChips({
  chips,
  onChipClick,
  className = '',
  title,
  maxVisible = 6,
}: SuggestChipsProps) {
  const [showAll, setShowAll] = useState(false);
  const { t } = useTranslation();

  const displayTitle = title || t('ingredients.categories');

  const visibleChips = showAll ? chips : chips.slice(0, maxVisible);
  const hasMore = chips.length > maxVisible;

  const getCategoryColor = (category: SuggestChip['category']) => {
    switch (category) {
      case 'ingredient':
        return 'bg-primary-100/80 text-primary-700 hover:bg-primary-200';
      case 'purpose':
        return 'bg-green-100/80 text-green-700 hover:bg-green-200';
      case 'condition':
        return 'bg-purple-100/80 text-purple-700 hover:bg-purple-200';
      case 'brand':
        return 'bg-orange-100/80 text-orange-700 hover:bg-orange-200';
      default:
        return 'bg-gray-100/80 text-gray-700 hover:bg-gray-200';
    }
  };

  const handleChipClick = (chip: SuggestChip) => {
    onChipClick(chip);
  };

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  return (
    <div
      className={`text-center relative z-40 ${className}`}
      role='region'
      aria-label='検索候補'
    >
      {displayTitle && (
        <p
          className='text-gray-500 mb-3 sm:mb-4 lg:mb-6 text-xs sm:text-sm font-medium'
          id='suggest-chips-title'
        >
          {displayTitle}
        </p>
      )}

      <ul
        className='flex flex-wrap justify-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 mb-4 sm:mb-6 list-none px-2 sm:px-4'
        id='suggest-chips-list'
        role='list'
        aria-labelledby='suggest-chips-title'
      >
        {visibleChips.map(chip => (
          <li key={chip.id} role='listitem'>
            <button
              onClick={() => handleChipClick(chip)}
              className={`
              px-2 sm:px-2.5 md:px-3 lg:px-4 py-0.5 sm:py-1 md:py-1.5 lg:py-2 rounded-full text-xs sm:text-sm lg:text-base font-medium
              transition-all duration-200 
              hover:scale-105 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              relative z-50
              ${getCategoryColor(chip.category)}
              ${chip.popular ? 'ring-1 ring-primary-300' : ''}
            `}
              aria-label={`${chip.label}${t('common.search')}${chip.popular ? '（人気）' : ''}`}
              aria-describedby={
                chip.popular ? `chip-popular-${chip.id}` : undefined
              }
            >
              {chip.label}
              {chip.popular && (
                <>
                  <span className='ml-1 text-xs' aria-hidden='true'>
                    🔥
                  </span>
                  <span id={`chip-popular-${chip.id}`} className='sr-only'>
                    人気のカテゴリ
                  </span>
                </>
              )}
            </button>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          onClick={toggleShowAll}
          className='text-sm text-primary-600 hover:text-primary-700 font-medium 
                   transition-colors duration-200 focus:outline-none 
                   focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg px-2 py-1
                   relative z-50'
          aria-expanded={showAll}
          aria-controls='suggest-chips-list'
        >
          {showAll ? '表示を減らす' : `他${chips.length - maxVisible}件を表示`}
        </button>
      )}
    </div>
  );
}

// デフォルトのチップデータ（日本語）
export const defaultSuggestChipsJa: SuggestChip[] = [
  { id: '1', label: 'ビタミンD', category: 'ingredient', popular: true },
  { id: '2', label: '疲労回復', category: 'purpose', popular: true },
  { id: '3', label: '美容', category: 'purpose', popular: true },
  { id: '4', label: '免疫力', category: 'purpose', popular: true },
  { id: '5', label: 'プロテイン', category: 'ingredient', popular: true },
  { id: '6', label: 'オメガ3', category: 'ingredient', popular: true },
  { id: '7', label: 'ビタミンC', category: 'ingredient' },
  { id: '8', label: 'ビタミンB群', category: 'ingredient' },
  { id: '9', label: '睡眠改善', category: 'purpose' },
  { id: '10', label: '関節サポート', category: 'purpose' },
  { id: '11', label: 'コラーゲン', category: 'ingredient' },
  { id: '12', label: '鉄分', category: 'ingredient' },
];

// デフォルトのチップデータ（英語）
export const defaultSuggestChipsEn: SuggestChip[] = [
  { id: '1', label: 'Vitamin D', category: 'ingredient', popular: true },
  { id: '2', label: 'Fatigue Recovery', category: 'purpose', popular: true },
  { id: '3', label: 'Beauty', category: 'purpose', popular: true },
  { id: '4', label: 'Immunity', category: 'purpose', popular: true },
  { id: '5', label: 'Protein', category: 'ingredient', popular: true },
  { id: '6', label: 'Omega-3', category: 'ingredient', popular: true },
  { id: '7', label: 'Vitamin C', category: 'ingredient' },
  { id: '8', label: 'B Vitamins', category: 'ingredient' },
  { id: '9', label: 'Sleep Support', category: 'purpose' },
  { id: '10', label: 'Joint Support', category: 'purpose' },
  { id: '11', label: 'Collagen', category: 'ingredient' },
  { id: '12', label: 'Iron', category: 'ingredient' },
];

// 言語に応じたデフォルトチップを取得する関数
export const getDefaultSuggestChips = (locale: string): SuggestChip[] => {
  return locale === 'ja' ? defaultSuggestChipsJa : defaultSuggestChipsEn;
};

// 後方互換性のため
export const defaultSuggestChips = defaultSuggestChipsJa;
