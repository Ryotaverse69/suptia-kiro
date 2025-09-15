/**
 * アクセシビリティ関連のユーティリティ関数
 */

/**
 * 16進数カラーコードをRGB値に変換
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * RGB値から相対輝度を計算
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * 2つの色のコントラスト比を計算
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format');
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * WCAG AA準拠のコントラスト比をチェック
 */
export function isWCAGAACompliant(
  foregroundColor: string,
  backgroundColor: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foregroundColor, backgroundColor);
  const requiredRatio = isLargeText ? 3 : 4.5;
  return ratio >= requiredRatio;
}

/**
 * WCAG AAA準拠のコントラスト比をチェック
 */
export function isWCAGAAACompliant(
  foregroundColor: string,
  backgroundColor: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foregroundColor, backgroundColor);
  const requiredRatio = isLargeText ? 4.5 : 7;
  return ratio >= requiredRatio;
}

/**
 * プロジェクトで使用する主要カラーのコントラストチェック
 */
export const colorContrastChecks = {
  // 白背景での文字色
  primaryOnWhite: {
    foreground: '#2563eb', // primary-600
    background: '#ffffff',
    isCompliant: isWCAGAACompliant('#2563eb', '#ffffff'),
    ratio: getContrastRatio('#2563eb', '#ffffff'),
  },
  grayTextOnWhite: {
    foreground: '#374151', // gray-700
    background: '#ffffff',
    isCompliant: isWCAGAACompliant('#374151', '#ffffff'),
    ratio: getContrastRatio('#374151', '#ffffff'),
  },
  lightGrayTextOnWhite: {
    foreground: '#6b7280', // gray-500
    background: '#ffffff',
    isCompliant: isWCAGAACompliant('#6b7280', '#ffffff'),
    ratio: getContrastRatio('#6b7280', '#ffffff'),
  },
  // プライマリボタン
  whiteOnPrimary: {
    foreground: '#ffffff',
    background: '#2563eb', // primary-600
    isCompliant: isWCAGAACompliant('#ffffff', '#2563eb'),
    ratio: getContrastRatio('#ffffff', '#2563eb'),
  },
  // エラー・警告色
  errorOnWhite: {
    foreground: '#dc2626', // red-600
    background: '#ffffff',
    isCompliant: isWCAGAACompliant('#dc2626', '#ffffff'),
    ratio: getContrastRatio('#dc2626', '#ffffff'),
  },
  successOnWhite: {
    foreground: '#047857', // green-700 (より濃い緑)
    background: '#ffffff',
    isCompliant: isWCAGAACompliant('#047857', '#ffffff'),
    ratio: getContrastRatio('#047857', '#ffffff'),
  },
};

/**
 * フォーカスリングの可視性をチェック
 */
export function checkFocusVisibility(
  focusColor: string = '#2563eb',
  backgroundColor: string = '#ffffff'
): boolean {
  return isWCAGAACompliant(focusColor, backgroundColor);
}

/**
 * 画像のalt属性を生成するヘルパー
 */
export function generateImageAlt(context: {
  type: 'product' | 'ingredient' | 'logo' | 'icon' | 'decorative';
  name?: string;
  purpose?: string;
  isDecorative?: boolean;
}): string {
  if (context.isDecorative) {
    return '';
  }

  switch (context.type) {
    case 'product':
      return `${context.name}の商品画像`;
    case 'ingredient':
      return `${context.name}の成分画像`;
    case 'logo':
      return context.name ? `${context.name}のロゴ` : 'ロゴ';
    case 'icon':
      return context.purpose || 'アイコン';
    case 'decorative':
      return '';
    default:
      return context.name || '画像';
  }
}

/**
 * スクリーンリーダー用のテキストを生成
 */
export function generateScreenReaderText(context: {
  action?: string;
  target?: string;
  state?: string;
  additional?: string;
}): string {
  const parts = [];

  if (context.action) parts.push(context.action);
  if (context.target) parts.push(context.target);
  if (context.state) parts.push(`（${context.state}）`);
  if (context.additional) parts.push(context.additional);

  return parts.join(' ');
}

/**
 * フォーカス管理クラス
 */
export class FocusManager {
  /**
   * フォーカス可能な要素のセレクター
   */
  private static focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  /**
   * 要素内のフォーカス可能な要素を取得
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableSelectors)) as HTMLElement[];
  }

  /**
   * 最初のフォーカス可能な要素を取得
   */
  static getFirstFocusableElement(container: HTMLElement): HTMLElement | null {
    const elements = this.getFocusableElements(container);
    return elements[0] || null;
  }

  /**
   * 最後のフォーカス可能な要素を取得
   */
  static getLastFocusableElement(container: HTMLElement): HTMLElement | null {
    const elements = this.getFocusableElements(container);
    return elements[elements.length - 1] || null;
  }

  /**
   * 要素にフォーカスを設定
   */
  static focusElement(element: HTMLElement, options: { preventScroll?: boolean } = {}) {
    element.focus({ preventScroll: options.preventScroll });
  }

  /**
   * フォーカストラップを実装
   */
  static trapFocus(container: HTMLElement, event: KeyboardEvent) {
    if (event.key !== 'Tab') return;

    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      // Shift + Tab
      if (activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
}

/**
 * ARIA属性管理クラス
 */
export class AriaManager {
  /**
   * ライブリージョンでメッセージをアナウンス
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;

    document.body.appendChild(announcer);

    // 少し遅延してから削除
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }

  /**
   * 展開状態を設定
   */
  static setExpandedState(trigger: HTMLElement, content: HTMLElement, isExpanded: boolean) {
    trigger.setAttribute('aria-expanded', isExpanded.toString());
    if (content.id) {
      trigger.setAttribute('aria-controls', content.id);
    }
    content.setAttribute('aria-hidden', (!isExpanded).toString());
  }

  /**
   * 選択状態を設定
   */
  static setSelectedState(element: HTMLElement, isSelected: boolean) {
    element.setAttribute('aria-selected', isSelected.toString());
  }

  /**
   * 無効状態を設定
   */
  static setDisabledState(element: HTMLElement, isDisabled: boolean) {
    element.setAttribute('aria-disabled', isDisabled.toString());
    if (isDisabled) {
      element.setAttribute('tabindex', '-1');
    } else {
      element.removeAttribute('tabindex');
    }
  }
}

/**
 * キーボードナビゲーション管理クラス
 */
export class KeyboardNavigation {
  /**
   * アクティベーションキー（Enter、Space）の処理
   */
  static handleActivationKeys(event: KeyboardEvent, callback: () => void) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  }

  /**
   * Escapeキーの処理
   */
  static handleEscapeKey(event: KeyboardEvent, callback: () => void) {
    if (event.key === 'Escape') {
      event.preventDefault();
      callback();
    }
  }

  /**
   * 矢印キーナビゲーションの処理
   */
  static handleArrowNavigation<T extends HTMLElement>(
    event: KeyboardEvent,
    items: T[],
    currentIndex: number,
    options: {
      orientation?: 'horizontal' | 'vertical' | 'both';
      loop?: boolean;
      onIndexChange?: (index: number) => void;
    } = {}
  ): number {
    const { orientation = 'both', loop = true, onIndexChange } = options;
    let newIndex = currentIndex;

    const isVertical = orientation === 'vertical' || orientation === 'both';
    const isHorizontal = orientation === 'horizontal' || orientation === 'both';

    switch (event.key) {
      case 'ArrowDown':
        if (isVertical) {
          event.preventDefault();
          newIndex = loop && currentIndex === items.length - 1 ? 0 : Math.min(currentIndex + 1, items.length - 1);
        }
        break;
      case 'ArrowUp':
        if (isVertical) {
          event.preventDefault();
          newIndex = loop && currentIndex === 0 ? items.length - 1 : Math.max(currentIndex - 1, 0);
        }
        break;
      case 'ArrowRight':
        if (isHorizontal) {
          event.preventDefault();
          newIndex = loop && currentIndex === items.length - 1 ? 0 : Math.min(currentIndex + 1, items.length - 1);
        }
        break;
      case 'ArrowLeft':
        if (isHorizontal) {
          event.preventDefault();
          newIndex = loop && currentIndex === 0 ? items.length - 1 : Math.max(currentIndex - 1, 0);
        }
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
    }

    if (newIndex !== currentIndex && onIndexChange) {
      onIndexChange(newIndex);
    }

    return newIndex;
  }
}

/**
 * キーボードナビゲーション用のヘルパー（後方互換性のため）
 */
export const keyboardNavigation = {
  /**
   * Enterキーまたはスペースキーでアクションを実行
   */
  handleActivation: (event: React.KeyboardEvent, callback: () => void) => {
    KeyboardNavigation.handleActivationKeys(event.nativeEvent, callback);
  },

  /**
   * Escapeキーでモーダルやドロップダウンを閉じる
   */
  handleEscape: (event: React.KeyboardEvent, callback: () => void) => {
    KeyboardNavigation.handleEscapeKey(event.nativeEvent, callback);
  },

  /**
   * 矢印キーでリスト内を移動
   */
  handleArrowNavigation: (
    event: React.KeyboardEvent,
    currentIndex: number,
    maxIndex: number,
    onIndexChange: (index: number) => void
  ) => {
    const items = Array.from({ length: maxIndex + 1 }, (_, i) => ({ index: i })) as any[];
    KeyboardNavigation.handleArrowNavigation(event.nativeEvent, items, currentIndex, {
      onIndexChange,
    });
  },
};
