const plugin = require('tailwindcss/plugin');

// アクセント色パレット: #2563EB を基調とした一貫したブルー系統
const accent = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6',
  600: '#2563eb', // メインアクセント色
  700: '#1d4ed8', // 強いアクセント色
  800: '#1e40af',
  900: '#1e3a8a',
  DEFAULT: '#2563eb', // デフォルトアクセント色
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.5rem', // 24px gutters
        sm: '1.5rem',
        md: '1.5rem',
        lg: '1.5rem',
        xl: '1.5rem',
        '2xl': '1.5rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
      },
    },
    extend: {
      colors: {
        accent,
        primary: accent,
        secondary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          DEFAULT: '#4f46e5',
        },
        // 一貫した色彩設計: #2563EB アクセント、#FFFFFF背景、#0F172A本文
        background: {
          DEFAULT: '#ffffff', // 背景色: 純白
          subtle: '#f8fafc', // 微細な背景色
          surface: '#f1f5f9', // サーフェス色
        },
        surface: {
          DEFAULT: '#ffffff', // サーフェス: 純白
          subtle: '#f8fafc', // 微細なサーフェス
          elevated: '#f8fafc', // 浮上サーフェス
        },
        border: {
          DEFAULT: '#e5e7eb', // 基本ボーダー色
          strong: '#cbd5f5', // 強いボーダー色
          muted: 'rgba(148, 163, 184, 0.24)', // ミュートボーダー色
        },
        text: {
          DEFAULT: '#0f172a', // 本文色: ダークネイビー
          subtle: '#334155', // サブテキスト色
          muted: '#64748b', // ミュートテキスト色
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'Noto Sans JP',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        heading: [
          'Inter',
          'Noto Sans JP',
          'SF Pro Text',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        xl: '16px',
        '2xl': '24px',
        pill: '9999px',
      },
      boxShadow: {
        // Apple風微細シャドウ (opacity<8%)
        soft: '0 8px 24px rgba(15, 23, 42, 0.06)',
        medium: '0 12px 32px rgba(15, 23, 42, 0.07)',
        strong: '0 24px 60px rgba(15, 23, 42, 0.08)',
      },
      transitionTimingFunction: {
        apple: 'cubic-bezier(0.32, 0.72, 0, 1)',
        emphasis: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      maxWidth: {
        '8xl': '1440px',
      },
      backdropBlur: {
        softer: '18px',
      },
      letterSpacing: {
        tight: '-0.02em', // Hero tracking-tight
        normal: '0em', // Body normal
      },
    },
  },
  plugins: [
    plugin(({ addComponents, theme }) => {
      addComponents({
        // フォーカスリング: アクセント色 #2563EB を使用した一貫したフォーカス表示
        '.focus-ring': {
          outline: 'none',
          boxShadow: `0 0 0 2px rgba(255, 255, 255, 0.95), 0 0 0 6px rgba(37, 99, 235, 0.32)`,
          transition: 'box-shadow 180ms cubic-bezier(0.32, 0.72, 0, 1)',
        },
        '.focus-ring-offset': {
          outline: 'none',
          boxShadow: `0 0 0 2px rgba(255, 255, 255, 1), 0 0 0 8px rgba(37, 99, 235, 0.24)`,
          transition: 'box-shadow 200ms cubic-bezier(0.32, 0.72, 0, 1)',
        },
        '.card-base': {
          borderRadius: theme('borderRadius.xl'),
          backgroundColor: theme('colors.background.DEFAULT'),
          border: `1px solid ${theme('colors.border.DEFAULT')}`,
          boxShadow: theme('boxShadow.soft'),
          transition:
            'transform 260ms cubic-bezier(0.32, 0.72, 0, 1), box-shadow 260ms cubic-bezier(0.32, 0.72, 0, 1)',
        },
        '.card-base:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme('boxShadow.medium'),
          // ホバー時のボーダー: アクセント色 #2563EB を使用
          borderColor: 'rgba(37, 99, 235, 0.18)',
        },
      });
    }),
  ],
};
