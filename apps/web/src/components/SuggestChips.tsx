'use client';

import { useState } from 'react';

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
  title = '人気のカテゴリ',
  maxVisible = 6,
}: SuggestChipsProps) {
  const [showAll, setShowAll] = useState(false);

  const visibleChips = showAll ? chips : chips.slice(0, maxVisible);
  const hasMore = chips.length > maxVisible;

  const getCategoryColor = (category: SuggestChip['category']) => {
    switch (category) {
      case 'ingredient':
        return 'bg-blue-100/80 text-blue-700 hover:bg-blue-200';
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
      className={`text-center ${className}`}
      role='region'
      aria-label='検索候補'
    >
      {title && (
        <p
          className='text-gray-500 mb-6 text-sm font-medium'
          id='suggest-chips-title'
        >
          {title}
        </p>
      )}

      <ul
        className='flex flex-wrap justify-center gap-2 sm:gap-3 mb-4 list-none px-2'
        id='suggest-chips-list'
        role='list'
        aria-labelledby='suggest-chips-title'
      >
        {visibleChips.map(chip => (
          <li key={chip.id} role='listitem'>
            <button
              onClick={() => handleChipClick(chip)}
              className={`
              px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium
              transition-all duration-200 
              hover:scale-105 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${getCategoryColor(chip.category)}
              ${chip.popular ? 'ring-1 ring-blue-300' : ''}
            `}
              aria-label={`${chip.label}で検索${chip.popular ? '（人気）' : ''}`}
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
          className='text-sm text-blue-600 hover:text-blue-700 font-medium 
                   transition-colors duration-200 focus:outline-none 
                   focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg px-2 py-1'
          aria-expanded={showAll}
          aria-controls='suggest-chips-list'
        >
          {showAll ? '表示を減らす' : `他${chips.length - maxVisible}件を表示`}
        </button>
      )}
    </div>
  );
}

// デフォルトのチップデータ
export const defaultSuggestChips: SuggestChip[] = [
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
