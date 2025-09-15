'use client';

import { useEffect } from 'react';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import {
  sendToAnalytics,
  getMetricRating,
  initPerformanceMonitoring,
} from '@/lib/performance';
import type { WebVitalsMetric } from '@/lib/performance';

/**
 * Web Vitals監視コンポーネント
 * Core Web Vitalsメトリクスを収集・送信する
 */
export default function WebVitalsMonitor() {
  useEffect(() => {
    // パフォーマンス監視の初期化
    initPerformanceMonitoring();

    // Web Vitalsメトリクスの収集
    const handleMetric = (metric: any) => {
      const webVitalsMetric: WebVitalsMetric = {
        id: metric.id,
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        rating: getMetricRating(metric.name, metric.value),
      };

      sendToAnalytics(webVitalsMetric);
    };

    // 各メトリクスの監視開始
    onCLS(handleMetric);
    onFCP(handleMetric);
    onINP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);

    // 開発環境でのパフォーマンス情報表示
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Web Vitals monitoring started');

      // パフォーマンス情報をコンソールに表示
      setTimeout(() => {
        if (performance.getEntriesByType) {
          const navigation = performance.getEntriesByType(
            'navigation'
          )[0] as PerformanceNavigationTiming;
          const paint = performance.getEntriesByType('paint');

          console.group('📊 Performance Metrics');
          console.log(
            'DOM Content Loaded:',
            navigation.domContentLoadedEventEnd -
            navigation.domContentLoadedEventStart,
            'ms'
          );
          console.log(
            'Load Complete:',
            navigation.loadEventEnd - navigation.loadEventStart,
            'ms'
          );

          paint.forEach(entry => {
            console.log(`${entry.name}:`, Math.round(entry.startTime), 'ms');
          });

          console.groupEnd();
        }
      }, 1000);
    }
  }, []);

  return null; // このコンポーネントは何もレンダリングしない
}

/**
 * パフォーマンス最適化のためのプリロードコンポーネント
 */
export function PerformanceOptimizer() {
  useEffect(() => {
    // 重要なリソースのプリロード
    const preloadLinks = [
      // フォント
      { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2' },
      { href: '/fonts/noto-sans-jp-var.woff2', as: 'font', type: 'font/woff2' },
      // 重要な画像
      { href: '/placeholders/hero-background.svg', as: 'image' },
    ];

    preloadLinks.forEach(({ href, as, type }) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      if (type) link.type = type;
      if (as === 'font') link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // DNS プリフェッチ
    const dnsPrefetchDomains = [
      'https://cdn.sanity.io',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ];

    dnsPrefetchDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    });

    // Service Worker の登録（PWA対応）
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

  return null;
}

/**
 * レイアウトシフト防止のためのスタイル注入コンポーネント
 */
export function LayoutShiftPrevention() {
  useEffect(() => {
    // CLS最適化のためのCSS注入
    const style = document.createElement('style');
    style.textContent = `
      /* 画像のアスペクト比維持 */
      .aspect-ratio-16-9 {
        aspect-ratio: 16 / 9;
      }
      
      .aspect-ratio-4-3 {
        aspect-ratio: 4 / 3;
      }
      
      .aspect-ratio-1-1 {
        aspect-ratio: 1 / 1;
      }
      
      /* フォント読み込み中のレイアウトシフト防止 */
      .font-loading {
        font-display: swap;
        visibility: hidden;
      }
      
      .font-loaded .font-loading {
        visibility: visible;
      }
      
      /* 画像読み込み中のプレースホルダー */
      .image-placeholder {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }
      
      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      /* スムーズなトランジション */
      .smooth-transition {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      /* フォーカス時のアウトライン最適化 */
      .focus-visible:focus-visible {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      /* 高コントラストモード対応 */
      @media (prefers-contrast: high) {
        .text-gray-600 {
          color: #000000;
        }
        
        .bg-gray-100 {
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
        }
      }
      
      /* 動きを減らす設定への対応 */
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;

    document.head.appendChild(style);

    // フォント読み込み完了の検出
    if (document.fonts) {
      document.fonts.ready.then(() => {
        document.documentElement.classList.add('font-loaded');
      });
    }

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
}

/**
 * 統合パフォーマンス監視コンポーネント
 */
export function PerformanceMonitor() {
  return (
    <>
      <WebVitalsMonitor />
      <PerformanceOptimizer />
      <LayoutShiftPrevention />
    </>
  );
}
