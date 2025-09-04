/**
 * アクセシビリティ関連のユーティリティ関数
 */

/**
 * フォーカス管理のためのユーティリティ
 */
export class FocusManager {
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
    return Array.from(
      container.querySelectorAll(this.focusableSelectors)
    ) as HTMLElement[];
  }

  /**
   * 要素内の最初のフォーカス可能な要素を取得
   */
  static getFirstFocusableElement(container: HTMLElement): HTMLElement | null {
    const focusableElements = this.getFocusableElements(container);
    return focusableElements[0] || null;
  }

  /**
   * 要素内の最後のフォーカス可能な要素を取得
   */
  static getLastFocusableElement(container: HTMLElement): HTMLElement | null {
    const focusableElements = this.getFocusableElements(container);
    return focusableElements[focusableElements.length - 1] || null;
  }

  /**
   * フォーカストラップを実装
   */
  static trapFocus(container: HTMLElement, event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;

    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * 要素にフォーカスを設定（スムーズスクロール付き）
   */
  static focusElement(element: HTMLElement, options?: FocusOptions): void {
    element.focus(options);
    
    // スクリーンリーダー用の遅延
    setTimeout(() => {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }, 100);
  }
}

/**
 * ARIA属性管理のためのユーティリティ
 */
export class AriaManager {
  /**
   * 要素にARIA属性を設定
   */
  static setAttributes(element: HTMLElement, attributes: Record<string, string | boolean | null>): void {
    Object.entries(attributes).forEach(([key, value]) => {
      if (value === null) {
        element.removeAttribute(key);
      } else {
        element.setAttribute(key, String(value));
      }
    });
  }

  /**
   * ライブリージョンでアナウンス
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;

    document.body.appendChild(announcer);

    // 短時間後に削除
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }

  /**
   * 要素の表示/非表示を適切に管理
   */
  static toggleVisibility(element: HTMLElement, visible: boolean): void {
    if (visible) {
      element.removeAttribute('aria-hidden');
      element.style.display = '';
    } else {
      element.setAttribute('aria-hidden', 'true');
      element.style.display = 'none';
    }
  }

  /**
   * 展開可能な要素の状態を管理
   */
  static setExpandedState(trigger: HTMLElement, target: HTMLElement, expanded: boolean): void {
    trigger.setAttribute('aria-expanded', String(expanded));
    target.setAttribute('aria-hidden', String(!expanded));
    
    if (expanded) {
      target.removeAttribute('hidden');
    } else {
      target.setAttribute('hidden', '');
    }
  }
}

/**
 * キーボードナビゲーション用のユーティリティ
 */
export class KeyboardNavigation {
  /**
   * 矢印キーナビゲーションを実装
   */
  static handleArrowNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    options: {
      orientation?: 'horizontal' | 'vertical' | 'both';
      loop?: boolean;
      onIndexChange?: (newIndex: number) => void;
    } = {}
  ): number {
    const { orientation = 'both', loop = true, onIndexChange } = options;
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = loop 
            ? (currentIndex - 1 + items.length) % items.length
            : Math.max(0, currentIndex - 1);
        }
        break;
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = loop 
            ? (currentIndex + 1) % items.length
            : Math.min(items.length - 1, currentIndex + 1);
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = loop 
            ? (currentIndex - 1 + items.length) % items.length
            : Math.max(0, currentIndex - 1);
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = loop 
            ? (currentIndex + 1) % items.length
            : Math.min(items.length - 1, currentIndex + 1);
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

    if (newIndex !== currentIndex) {
      items[newIndex]?.focus();
      onIndexChange?.(newIndex);
    }

    return newIndex;
  }

  /**
   * Escapeキーでの閉じる処理
   */
  static handleEscapeKey(event: KeyboardEvent, onEscape: () => void): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      onEscape();
    }
  }

  /**
   * Enter/Spaceキーでの実行処理
   */
  static handleActivationKeys(event: KeyboardEvent, onActivate: () => void): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onActivate();
    }
  }
}

/**
 * カラーコントラスト計算のユーティリティ
 */
export class ColorContrast {
  /**
   * 相対輝度を計算
   */
  private static getRelativeLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * 16進数カラーをRGBに変換
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * コントラスト比を計算
   */
  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) return 0;

    const l1 = this.getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = this.getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * WCAG AA準拠かチェック
   */
  static isWCAGAACompliant(foreground: string, background: string, isLargeText = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  }

  /**
   * WCAG AAA準拠かチェック
   */
  static isWCAGAAACompliant(foreground: string, background: string, isLargeText = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
}

/**
 * スクリーンリーダー用のテキスト生成
 */
export class ScreenReaderText {
  /**
   * 数値を読み上げ用テキストに変換
   */
  static formatNumber(value: number, locale: string = 'ja'): string {
    if (locale === 'ja') {
      return value.toLocaleString('ja-JP');
    }
    return value.toLocaleString('en-US');
  }

  /**
   * 日付を読み上げ用テキストに変換
   */
  static formatDate(date: Date, locale: string = 'ja'): string {
    if (locale === 'ja') {
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * パーセンテージを読み上げ用テキストに変換
   */
  static formatPercentage(value: number, locale: string = 'ja'): string {
    if (locale === 'ja') {
      return `${value}パーセント`;
    }
    return `${value} percent`;
  }

  /**
   * スコアを読み上げ用テキストに変換
   */
  static formatScore(score: number, maxScore: number = 100, locale: string = 'ja'): string {
    if (locale === 'ja') {
      return `${maxScore}点満点中${score}点`;
    }
    return `${score} out of ${maxScore} points`;
  }
}