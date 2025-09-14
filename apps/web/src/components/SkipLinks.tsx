'use client';

import { useEffect, useRef } from 'react';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

function SkipLink({ href, children, className = '' }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={`
        absolute left-4 top-4 z-[9999] px-4 py-2 bg-blue-600 text-white rounded-lg
        font-medium text-sm shadow-lg transform -translate-y-full opacity-0
        focus:translate-y-0 focus:opacity-100 transition-all duration-200
        focus:outline-none focus:ring-4 focus:ring-blue-100
        ${className}
      `}
      onFocus={e => {
        // スキップリンクがフォーカスされた時の処理
        if (e.currentTarget.scrollIntoView) {
          e.currentTarget.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }}
    >
      {children}
    </a>
  );
}

export function SkipLinks() {
  const skipLinksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // ページ読み込み時にスキップリンクにフォーカスを設定する機能
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + S でスキップリンクにフォーカス
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        const firstSkipLink = skipLinksRef.current?.querySelector(
          'a'
        ) as HTMLAnchorElement;
        firstSkipLink?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={skipLinksRef} className='sr-only focus-within:not-sr-only'>
      <SkipLink href='#main-content'>メインコンテンツへスキップ</SkipLink>
      <SkipLink href='#navigation' className='left-48'>
        ナビゲーションへスキップ
      </SkipLink>
      <SkipLink href='#search' className='left-96'>
        検索へスキップ
      </SkipLink>
    </div>
  );
}

// フォーカス管理のユーティリティフック
export function useFocusManagement() {
  const focusableElementsSelector = `
    a[href]:not([disabled]),
    button:not([disabled]),
    textarea:not([disabled]),
    input[type="text"]:not([disabled]),
    input[type="radio"]:not([disabled]),
    input[type="checkbox"]:not([disabled]),
    select:not([disabled]),
    [tabindex]:not([tabindex="-1"]):not([disabled])
  `;

  const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    return Array.from(container.querySelectorAll(focusableElementsSelector));
  };

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
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

    container.addEventListener('keydown', handleKeyDown);

    // 最初の要素にフォーカス
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  };

  const restoreFocus = (previousActiveElement: Element | null) => {
    if (previousActiveElement && 'focus' in previousActiveElement) {
      (previousActiveElement as HTMLElement).focus();
    }
  };

  return {
    getFocusableElements,
    trapFocus,
    restoreFocus,
  };
}
