/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      transitionTimingFunction: {
        // Apple-like easing curve
        apple: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      colors: {
        // CSS変数を参照するブランドカラー
        brand: 'var(--brand)',

        // 近未来的なブルー系プライマリカラー
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // 統一されたアクセントカラー #2563EB
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // アクセント用セカンダリカラー
        secondary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        // ステータスカラー
        success: {
          50: '#ecfdf5',
          500: '#10b981',
          600: '#059669',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
        info: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-inter)',
          'var(--font-noto-sans-jp)',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Hiragino Sans',
          'Hiragino Kaku Gothic ProN',
          'sans-serif',
        ],
        // Apple風フォントスタック
        apple: [
          'var(--font-inter)',
          'var(--font-noto-sans-jp)',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          lg: '2rem',
        },
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1280px',
        },
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0' }],
        sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0' }],
        base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.005em' }],
        lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.015em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        '6xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        // Apple風カスタムサイズ
        'hero': ['clamp(3rem, 8vw, 6rem)', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '300' }],
        'display': ['clamp(2rem, 5vw, 3.5rem)', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '400' }],
        'headline': ['clamp(1.5rem, 4vw, 2.25rem)', { lineHeight: '1.25', letterSpacing: '-0.015em', fontWeight: '500' }],
      },
      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300', // Apple風ライト
        normal: '400', // Apple風ノーマル
        medium: '500', // Apple風ミディアム
        semibold: '600', // Apple風セミボールド
        bold: '700',
        extrabold: '800',
        black: '900',
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        'apple-tight': '-0.02em', // Apple風
        'apple-normal': '-0.01em', // Apple風
        normal: '0em',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
        // Apple風セクションスペーシング - 広めの余白
        'section-xs': '2rem',    // 32px
        'section-sm': '3rem',    // 48px
        'section-md': '5rem',    // 80px - Apple風標準
        'section-lg': '6rem',    // 96px
        'section-xl': '8rem',    // 128px - Apple風特大
        'section-2xl': '10rem',  // 160px - Apple風ヒーロー用
        // Apple風コンポーネントスペーシング
        'component-xs': '0.5rem',  // 8px
        'component-sm': '1rem',    // 16px
        'component-md': '1.5rem',  // 24px - Apple風
        'component-lg': '2rem',    // 32px - Apple風
        'component-xl': '3rem',    // 48px - Apple風
        'component-2xl': '4rem',   // 64px - Apple風特大
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.35s ease-apple',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-gentle': 'pulseGentle 2s infinite',
        'gradient-shift': 'gradientShift 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.98)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      borderRadius: {
        brand: 'var(--radius)', // CSS変数を参照
      },
      boxShadow: {
        soft: 'var(--shadow-soft)', // CSS変数を参照
        medium: 'var(--shadow-medium)', // Apple風極薄シャドウ
        strong: 'var(--shadow-strong)', // Apple風極薄シャドウ
      },
    },
  },
  plugins: [],
};
