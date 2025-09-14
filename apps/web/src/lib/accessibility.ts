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
 * キーボードナビゲーション用のヘルパー
 */
export const keyboardNavigation = {
  /**
   * Enterキーまたはスペースキーでアクションを実行
   */
  handleActivation: (event: React.KeyboardEvent, callback: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  },

  /**
   * Escapeキーでモーダルやドロップダウンを閉じる
   */
  handleEscape: (event: React.KeyboardEvent, callback: () => void) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      callback();
    }
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
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        newIndex = currentIndex < maxIndex ? currentIndex + 1 : 0;
        break;
      case 'ArrowUp':
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : maxIndex;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = maxIndex;
        break;
    }

    if (newIndex !== currentIndex) {
      onIndexChange(newIndex);
    }
  },
};
