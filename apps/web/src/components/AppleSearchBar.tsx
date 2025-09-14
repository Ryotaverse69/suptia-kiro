'use client';

import { useState, useRef, useEffect } from 'react';

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
  placeholder = 'サプリメントを検索（例：ビタミンD、疲労回復、美容）',
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
    if (aiSuggestions.length > 0) {
      setShowSuggestions(true);
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
      aria-label='サプリメント検索'
      className={`relative w-full max-w-4xl xl:max-w-5xl mx-auto ${className}`}
    >
      {/* 検索フォーム */}
      <form onSubmit={handleSearch} className='relative group'>
        <input
          ref={inputRef}
          type='text'
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          role='combobox'
          aria-expanded={showSuggestions}
          aria-haspopup='listbox'
          aria-controls={showSuggestions ? 'search-suggestions' : undefined}
          aria-activedescendant={
            selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined
          }
          aria-label='サプリメント検索'
          className='w-full px-4 sm:px-8 py-4 sm:py-6 text-base sm:text-lg bg-gray-50/80 border-2 border-transparent rounded-2xl 
                   focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 
                   transition-all duration-300 placeholder-gray-500 shadow-[0_8px_30px_rgba(0,0,0,0.06)]
                   hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] pr-20 sm:pr-24'
        />
        <button
          type='submit'
          disabled={!query.trim()}
          aria-label='検索'
          className='absolute right-2 top-2 px-3 sm:px-6 py-2 sm:py-4 bg-blue-600 text-white rounded-xl 
                   hover:bg-blue-700 transition-all duration-200 font-medium text-xs sm:text-sm
                   hover:scale-[1.02] active:scale-[0.98] shadow-lg
                   disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:scale-100'
        >
          検索
        </button>
      </form>

      {/* AIサジェスト（フォーカス時にドロップダウン表示） */}
      {showSuggestions && aiSuggestions.length > 0 && (
        <div
          id='search-suggestions'
          role='listbox'
          aria-label='AIサジェスト'
          className='mt-4 animate-fade-in'
        >
          <div className='bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-200/50 p-4'>
            <p className='text-sm text-gray-500 mb-3'>AIサジェスト</p>
            <div className='space-y-2'>
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
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                    selectedIndex === index
                      ? 'bg-blue-50 text-blue-900'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className='flex items-center justify-between'>
                    <span>{suggestion.text}</span>
                    <span className='text-xs text-gray-400 ml-2'>
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
