import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * clsx + tailwind-mergeでユーティリティクラスを統制するヘルパー関数
 * Apple/xAI風デザインシステムの一貫性を保つために使用
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Apple風のトランジション設定
 */
export const transitions = {
  default: 'transition-all duration-200 ease-out',
  apple: 'transition-all duration-300 cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  spring: 'transition-all duration-400 cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  smooth: 'transition-all duration-200 cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

/**
 * Apple風のシャドウ設定
 */
export const shadows = {
  soft: 'shadow-[0_8px_30px_rgba(0,0,0,0.06)]',
  medium: 'shadow-[0_12px_40px_rgba(0,0,0,0.08)]',
  strong: 'shadow-[0_16px_60px_rgba(0,0,0,0.10)]',
  focus: 'shadow-[0_0_0_2px_#2563eb,_0_0_0_4px_rgba(37,99,235,0.1)]',
} as const;

/**
 * Apple風のホバー効果
 */
export const hoverEffects = {
  lift: 'hover:-translate-y-1 hover:shadow-medium',
  scale: 'hover:scale-[1.02] active:scale-[0.98]',
  glow: 'hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]',
} as const;

/**
 * レスポンシブブレークポイント
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;
