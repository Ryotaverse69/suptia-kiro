/**
 * Suptia デザイントークン - 色彩設計
 *
 * 一貫した色彩設計: #2563EB アクセント、#FFFFFF背景、#0F172A本文
 * Apple/xAI風のミニマル＆上質感を実現するための色彩定義
 */

export const colors = {
  // 基本色彩パレット
  background: {
    primary: '#ffffff', // 背景色: 純白
    subtle: '#f8fafc', // 微細な背景色
    surface: '#f1f5f9', // サーフェス色
  },

  text: {
    primary: '#0f172a', // 本文色: ダークネイビー
    subtle: '#334155', // サブテキスト色
    muted: '#64748b', // ミュートテキスト色
  },

  accent: {
    primary: '#2563eb', // アクセント色: ブルー
    strong: '#1d4ed8', // 強いアクセント色
    soft: 'rgba(37, 99, 235, 0.1)', // 薄いアクセント色
  },

  border: {
    default: '#e5e7eb', // 基本ボーダー色
    strong: '#cbd5f5', // 強いボーダー色
    muted: 'rgba(148, 163, 184, 0.24)', // ミュートボーダー色
  },

  // 状態色
  state: {
    success: '#10b981', // 成功色
    warning: '#f59e0b', // 警告色
    danger: '#ef4444', // 危険色
  },
} as const;

/**
 * CSS変数名とのマッピング
 */
export const cssVariables = {
  '--color-bg': colors.background.primary,
  '--color-bg-subtle': colors.background.subtle,
  '--color-surface': colors.background.surface,
  '--color-text': colors.text.primary,
  '--color-text-subtle': colors.text.subtle,
  '--color-text-muted': colors.text.muted,
  '--color-accent': colors.accent.primary,
  '--color-accent-strong': colors.accent.strong,
  '--color-accent-soft': colors.accent.soft,
  '--color-border': colors.border.default,
  '--color-border-strong': colors.border.strong,
  '--color-border-muted': colors.border.muted,
} as const;

/**
 * 色彩の一貫性チェック関数
 */
export function validateColorConsistency(): boolean {
  const requiredColors = {
    accent: '#2563eb',
    background: '#ffffff',
    text: '#0f172a',
  };

  return (
    colors.accent.primary === requiredColors.accent &&
    colors.background.primary === requiredColors.background &&
    colors.text.primary === requiredColors.text
  );
}

/**
 * アクセシビリティ対応の色彩組み合わせ
 */
export const accessibleCombinations = {
  // 本文テキスト
  primaryText: {
    foreground: colors.text.primary,
    background: colors.background.primary,
    description: 'メインテキスト: ダークネイビー on 純白',
  },

  // アクセント色
  accentText: {
    foreground: colors.accent.primary,
    background: colors.background.primary,
    description: 'アクセントテキスト: ブルー on 純白',
  },

  // ボタン
  primaryButton: {
    foreground: colors.background.primary,
    background: colors.accent.primary,
    description: 'プライマリボタン: 純白 on ブルー',
  },
} as const;

export type ColorToken = keyof typeof colors;
export type BackgroundColor = keyof typeof colors.background;
export type TextColor = keyof typeof colors.text;
export type AccentColor = keyof typeof colors.accent;
export type BorderColor = keyof typeof colors.border;
