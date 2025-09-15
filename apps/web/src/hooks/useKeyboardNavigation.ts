'use client';

import { useEffect, useCallback } from 'react';

/**
 * キーボードナビゲーション用カスタムフック
 * 検索→比較→詳細カードCTAまでのキーボードフローを管理
 * Requirements: 8.1 - キーボードのみで検索→比較→詳細カードCTAまで到達できる
 */

interface UseKeyboardNavigationOptions {
  enableGlobalShortcuts?: boolean;
  enableSectionNavigation?: boolean;
}

export function useKeyboardNavigation(options: UseKeyboardNavigationOptions = {}) {
  const { enableGlobalShortcuts = true, enableSectionNavigation = true } = options;

  // セクション間のナビゲーション
  const navigateToSection = useCallback((sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      
      // セクション内の最初のフォーカス可能な要素にフォーカス
      setTimeout(() => {
        const focusableElement = section.querySelector(
          'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        
        if (focusableElement) {
          focusableElement.focus();
        } else {
          // フォーカス可能な要素がない場合は、セクション自体にフォーカス
          section.setAttribute('tabindex', '-1');
          section.focus();
        }
      }, 300);
    }
  }, []);

  // 検索バーにフォーカス
  const focusSearchBar = useCallback(() => {
    const searchInput = document.querySelector('input[type="text"][role="combobox"]') as HTMLElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // 比較セクションにナビゲート
  const navigateToComparisons = useCallback(() => {
    navigateToSection('popular-comparisons-section');
  }, [navigateToSection]);

  // メインコンテンツにナビゲート
  const navigateToMainContent = useCallback(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // グローバルキーボードショートカット
  useEffect(() => {
    if (!enableGlobalShortcuts) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Alt + S: 検索バーにフォーカス
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        focusSearchBar();
      }
      
      // Alt + C: 比較セクションにナビゲート
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        navigateToComparisons();
      }
      
      // Alt + M: メインコンテンツにナビゲート
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        navigateToMainContent();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [enableGlobalShortcuts, focusSearchBar, navigateToComparisons, navigateToMainContent]);

  // セクション内でのArrowキーナビゲーション
  useEffect(() => {
    if (!enableSectionNavigation) return;

    const handleSectionNavigation = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      
      // 比較カード内でのナビゲーション
      if (target.closest('[role="article"]')) {
        const currentCard = target.closest('[role="article"]') as HTMLElement;
        const allCards = Array.from(document.querySelectorAll('[role="article"]'));
        const currentIndex = allCards.indexOf(currentCard);
        
        let nextIndex = -1;
        
        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            nextIndex = currentIndex + 1;
            if (nextIndex >= allCards.length) nextIndex = 0;
            break;
            
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) nextIndex = allCards.length - 1;
            break;
        }
        
        if (nextIndex >= 0) {
          const nextCard = allCards[nextIndex] as HTMLElement;
          const nextButton = nextCard.querySelector('button') as HTMLElement;
          if (nextButton) {
            nextButton.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleSectionNavigation);
    return () => document.removeEventListener('keydown', handleSectionNavigation);
  }, [enableSectionNavigation]);

  return {
    navigateToSection,
    focusSearchBar,
    navigateToComparisons,
    navigateToMainContent,
  };
}

/**
 * フォーカストラップ用フック
 * モーダルやドロップダウン内でのフォーカス管理
 */
export function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        // フォーカスを元の位置に戻す
        const trigger = document.querySelector('[aria-expanded="true"]') as HTMLElement;
        if (trigger) {
          trigger.focus();
        }
      }
    };

    // 最初の要素にフォーカス
    firstElement?.focus();

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isActive, containerRef]);
}