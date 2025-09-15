'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/contexts/LocaleContext';

// 検索アイコンSVGコンポーネント
const SearchIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
    />
  </svg>
);

export interface AISuggestion {
  id: string;
  text: string;
  intent: 'purpose' | 'ingredient' | 'condition';
  confidence: number;
}

export interface AppleSearchBarProps {
  onSearch: (query: string) => void;
  aiSuggestions?: AISuggestion[];
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function AppleSearchBar({
  onSearch,
  aiSuggestions = [],
  placeholder,
  className = '',
  value,
  onChange,
}: AppleSearchBarProps) {
  const [internalQuery, setInternalQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { t } = useTranslation();

  const displayPlaceholder = placeholder || t('search.placeholder');

  // 制御されたコンポーネントか非制御コンポーネントかを判定
  const isControlled = value !== undefined;
  const query = isControlled ? value : internalQuery;

  // 検索実行
  const handleSearch = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  // 入力値変更
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (isControlled) {
      onChange?.(newValue);
    } else {
      setInternalQuery(newValue);
    }
  };

  // キーボードナビゲーション
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || aiSuggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex =
          selectedIndex < aiSuggestions.length - 1 ? selectedIndex + 1 : 0;
        setSelectedIndex(nextIndex);
        suggestionRefs.current[nextIndex]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex =
          selectedIndex > 0 ? selectedIndex - 1 : aiSuggestions.length - 1;
        setSelectedIndex(prevIndex);
        suggestionRefs.current[prevIndex]?.focus();
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < aiSuggestions.length) {
          handleSuggestionClick(aiSuggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.focus();
        break;
      default:
        if (e.key === 'Enter') {
          handleSearch();
        }
    }
  };

  // フォーカス管理
  const handleFocus = () => {
    setIsFocused(true);
    // AIサジェストが存在する場合は常に表示
    if (aiSuggestions.length > 0) {
      setShowSuggestions(true);
      console.log('AIサジェスト表示:', { aiSuggestionsLength: aiSuggestions.length, showSuggestions: true });
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // フォーカスがサジェスト内に移動した場合は閉じない
    if (containerRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsFocused(false);
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  // サジェスト選択
  const handleSuggestionClick = (suggestion: AISuggestion) => {
    const newValue = suggestion.text;
    if (isControlled) {
      onChange?.(newValue);
    } else {
      setInternalQuery(newValue);
    }
    onSearch(newValue);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // 外部クリックでサジェストを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      id='search'
      role='search'
      aria-label={t('search.searchResults')}
      className={`relative w-full max-w-4xl xl:max-w-6xl mx-auto ${className}`}
    >
      {/* 検索フォーム - 大型化とApple風デザイン強化 */}
      <form onSubmit={handleSearch} className='relative group'>
        <div className='relative'>
          <input
            ref={inputRef}
            type='text'
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={displayPlaceholder}
            role='combobox'
            aria-expanded={(showSuggestions || isFocused) && aiSuggestions.length > 0}
            aria-haspopup='listbox'
            aria-controls={(showSuggestions || isFocused) && aiSuggestions.length > 0 ? 'search-suggestions' : undefined}
            aria-activedescendant={
              selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined
            }
            aria-label={t('common.search')}
            className='w-full pl-12 sm:pl-14 md:pl-16 lg:pl-18 pr-16 sm:pr-20 md:pr-24 lg:pr-28 xl:pr-32 
                     py-4 sm:py-5 md:py-6 lg:py-7 xl:py-8 
                     text-base sm:text-lg md:text-xl lg:text-2xl font-light
                     bg-white/95 backdrop-blur-sm border-2 border-gray-200/50 rounded-2xl sm:rounded-3xl 
                     focus:bg-white focus:border-primary-500 focus:ring-6 focus:ring-primary-100/50 
                     transition-all duration-400 placeholder-gray-500/80 
                     shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.08)]
                     focus:shadow-[0_16px_64px_rgba(59,130,246,0.15)]'
          />
          {/* 検索アイコン（左側） */}
          <SearchIcon className='absolute left-4 sm:left-6 md:left-8 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-gray-400' />
        </div>
        <button
          type='submit'
          disabled={!query.trim()}
          aria-label={t('common.search')}
          className='absolute right-2 sm:right-3 md:right-4 top-1/2 transform -translate-y-1/2 
                   px-4 sm:px-6 md:px-8 lg:px-10 py-2.5 sm:py-3 md:py-4 lg:py-5 
                   bg-primary-600 text-white rounded-xl sm:rounded-2xl 
                   hover:bg-primary-700 focus:bg-primary-700 focus:ring-4 focus:ring-primary-200
                   transition-all duration-300 font-medium text-sm sm:text-base md:text-lg
                   hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl
                   disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:scale-100
                   disabled:shadow-none'
        >
          <span className='hidden sm:inline'>{t('common.search')}</span>
          <SearchIcon className='w-4 h-4 sm:hidden' />
        </button>
      </form>

      {/* AIサジェスト（フォーカス時にドロップダウン表示） - 強化版 */}
      {(showSuggestions || isFocused) && aiSuggestions.length > 0 && (
        <div
          id='search-suggestions'
          role='listbox'
          aria-label={t('search.aiRecommendation')}
          className='mt-6 animate-fade-in'
        >
          <div className='bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-200/30 p-6'>
            <div className='flex items-center mb-4'>
              <div className='w-2 h-2 bg-primary-500 rounded-full mr-3 animate-pulse'></div>
              <p className='text-sm font-medium text-gray-700'>{t('search.aiRecommendation')}</p>
            </div>
            <div className='space-y-3'>
              {aiSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  ref={el => {
                    suggestionRefs.current[index] = el;
                  }}
                  id={`suggestion-${index}`}
                  role='option'
                  aria-selected={selectedIndex === index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onFocus={() => setSelectedIndex(index)}
                  onBlur={handleBlur}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 text-sm sm:text-base group ${selectedIndex === index
                    ? 'bg-primary-50 text-primary-900 shadow-sm'
                    : 'hover:bg-gray-50 hover:shadow-sm'
                    }`}
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
  );
}
