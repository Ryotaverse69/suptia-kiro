'use client';

/**
 * スキップリンクコンポーネント
 * キーボードユーザーがメインコンテンツに直接ジャンプできるようにする
 * Requirements: 8.1, 8.2 - アクセシビリティ対応
 */

interface SkipLinksProps {
  className?: string;
}

export default function SkipLinks({ className = '' }: SkipLinksProps) {
  const handleSkipToMain = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSkipToSearch = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const searchInput = document.querySelector('input[type="text"][role="combobox"]') as HTMLElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSkipToComparisons = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const comparisonsSection = document.getElementById('popular-comparisons-section');
    if (comparisonsSection) {
      comparisonsSection.scrollIntoView({ behavior: 'smooth' });
      // 最初の比較カードにフォーカス
      setTimeout(() => {
        const firstCard = comparisonsSection.querySelector('[role="article"] button') as HTMLElement;
        if (firstCard) {
          firstCard.focus();
        }
      }, 300);
    }
  };

  return (
    <div className={`skip-links ${className}`}>
      <a
        href="#main-content"
        onClick={handleSkipToMain}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                   bg-primary-600 text-white px-4 py-2 rounded-md z-[9999] 
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                   transition-all duration-200 pointer-events-auto"
      >
        メインコンテンツにスキップ
      </a>
      <a
        href="#search"
        onClick={handleSkipToSearch}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-40
                   bg-primary-600 text-white px-4 py-2 rounded-md z-[9999]
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                   transition-all duration-200 pointer-events-auto"
      >
        検索にスキップ
      </a>
      <a
        href="#popular-comparisons-section"
        onClick={handleSkipToComparisons}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-64
                   bg-primary-600 text-white px-4 py-2 rounded-md z-[9999]
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                   transition-all duration-200 pointer-events-auto"
      >
        比較セクションにスキップ
      </a>
    </div>
  );
}

// フォーカス管理フック
export function useFocusManagement() {
  const getFocusableElements = (element: HTMLElement) => {
    return element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
  };

  const trapFocus = (element: HTMLElement) => {
    const focusableElements = getFocusableElements(element);
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  };

  const restoreFocus = (element: Element | null) => {
    if (element && element instanceof HTMLElement) {
      element.focus();
    }
  };

  return { getFocusableElements, trapFocus, restoreFocus };
}