'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { FocusManager, AriaManager, KeyboardNavigation } from '@/lib/accessibility';

/**
 * フォーカス管理のためのフック
 */
export function useFocusManagement() {
  const containerRef = useRef<HTMLElement>(null);

  const focusFirst = useCallback(() => {
    if (containerRef.current) {
      const firstElement = FocusManager.getFirstFocusableElement(containerRef.current);
      if (firstElement) {
        FocusManager.focusElement(firstElement);
      }
    }
  }, []);

  const focusLast = useCallback(() => {
    if (containerRef.current) {
      const lastElement = FocusManager.getLastFocusableElement(containerRef.current);
      if (lastElement) {
        FocusManager.focusElement(lastElement);
      }
    }
  }, []);

  const trapFocus = useCallback((event: KeyboardEvent) => {
    if (containerRef.current) {
      FocusManager.trapFocus(containerRef.current, event);
    }
  }, []);

  return {
    containerRef,
    focusFirst,
    focusLast,
    trapFocus,
  };
}

/**
 * キーボードナビゲーションのためのフック
 */
export function useKeyboardNavigation<T extends HTMLElement>(
  items: T[],
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    loop?: boolean;
    initialIndex?: number;
  } = {}
) {
  const { orientation = 'both', loop = true, initialIndex = 0 } = options;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const newIndex = KeyboardNavigation.handleArrowNavigation(
      event,
      items,
      currentIndex,
      {
        orientation,
        loop,
        onIndexChange: setCurrentIndex,
      }
    );
    setCurrentIndex(newIndex);
  }, [items, currentIndex, orientation, loop]);

  const setIndex = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      setCurrentIndex(index);
      items[index]?.focus();
    }
  }, [items]);

  return {
    currentIndex,
    setIndex,
    handleKeyDown,
  };
}

/**
 * モーダル/ダイアログのアクセシビリティ管理
 */
export function useModal(isOpen: boolean) {
  const modalRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const { trapFocus, focusFirst } = useFocusManagement();

  useEffect(() => {
    if (isOpen) {
      // 現在のフォーカス要素を保存
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // body のスクロールを無効化
      document.body.style.overflow = 'hidden';
      
      // モーダル内の最初の要素にフォーカス
      setTimeout(() => {
        focusFirst();
      }, 100);
    } else {
      // body のスクロールを復元
      document.body.style.overflow = '';
      
      // 前のフォーカス要素に戻す
      if (previousFocusRef.current) {
        FocusManager.focusElement(previousFocusRef.current);
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, focusFirst]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      // Escapeキーでモーダルを閉じる処理は親コンポーネントで実装
    } else {
      trapFocus(event);
    }
  }, [isOpen, trapFocus]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  return {
    modalRef,
    handleKeyDown,
  };
}

/**
 * ライブリージョンでのアナウンス管理
 */
export function useAnnouncer() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    AriaManager.announce(message, priority);
  }, []);

  const announceError = useCallback((message: string) => {
    announce(message, 'assertive');
  }, [announce]);

  const announceSuccess = useCallback((message: string) => {
    announce(message, 'polite');
  }, [announce]);

  return {
    announce,
    announceError,
    announceSuccess,
  };
}

/**
 * 展開可能な要素の管理（アコーディオン、ドロップダウンなど）
 */
export function useDisclosure(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const triggerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLElement>(null);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  useEffect(() => {
    if (triggerRef.current && contentRef.current) {
      AriaManager.setExpandedState(triggerRef.current, contentRef.current, isOpen);
    }
  }, [isOpen]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    KeyboardNavigation.handleEscapeKey(event, close);
    KeyboardNavigation.handleActivationKeys(event, toggle);
  }, [close, toggle]);

  return {
    isOpen,
    open,
    close,
    toggle,
    triggerRef,
    contentRef,
    handleKeyDown,
    triggerProps: {
      'aria-expanded': isOpen,
      'aria-controls': contentRef.current?.id,
      onClick: toggle,
      onKeyDown: handleKeyDown,
    },
    contentProps: {
      'aria-hidden': !isOpen,
      hidden: !isOpen,
    },
  };
}

/**
 * フォームのアクセシビリティ管理
 */
export function useFormAccessibility() {
  const { announceError } = useAnnouncer();

  const announceValidationError = useCallback((fieldName: string, errorMessage: string) => {
    announceError(`${fieldName}: ${errorMessage}`);
  }, [announceError]);

  const getFieldProps = useCallback((
    fieldId: string,
    options: {
      required?: boolean;
      invalid?: boolean;
      describedBy?: string;
      errorMessage?: string;
    } = {}
  ) => {
    const { required = false, invalid = false, describedBy, errorMessage } = options;
    
    const ariaDescribedBy = [
      describedBy,
      invalid && errorMessage ? `${fieldId}-error` : null,
    ].filter(Boolean).join(' ') || undefined;

    return {
      id: fieldId,
      'aria-required': required,
      'aria-invalid': invalid,
      'aria-describedby': ariaDescribedBy,
    };
  }, []);

  const getErrorProps = useCallback((fieldId: string) => ({
    id: `${fieldId}-error`,
    role: 'alert',
    'aria-live': 'polite' as const,
  }), []);

  return {
    announceValidationError,
    getFieldProps,
    getErrorProps,
  };
}

/**
 * 読み込み状態のアクセシビリティ管理
 */
export function useLoadingState(isLoading: boolean, loadingMessage = '読み込み中...') {
  const { announce } = useAnnouncer();

  useEffect(() => {
    if (isLoading) {
      announce(loadingMessage);
    }
  }, [isLoading, loadingMessage, announce]);

  const loadingProps = {
    'aria-busy': isLoading,
    'aria-live': 'polite' as const,
  };

  return { loadingProps };
}

/**
 * スキップリンクの管理
 */
export function useSkipLinks() {
  const skipToContent = useCallback(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      FocusManager.focusElement(mainContent, { preventScroll: false });
    }
  }, []);

  const skipToNavigation = useCallback(() => {
    const navigation = document.querySelector('nav[role="navigation"]') as HTMLElement;
    if (navigation) {
      FocusManager.focusElement(navigation, { preventScroll: false });
    }
  }, []);

  return {
    skipToContent,
    skipToNavigation,
  };
}